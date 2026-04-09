import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/** Hosts we never put in invite emails (managers on local dev shouldn’t send localhost links). */
function isPublicDeployHost(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") return false;
    if (h.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeRedirectBase(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const base = withProto.replace(/\/$/, "");
  if (!isPublicDeployHost(`${base}/`)) return undefined;
  return `${base}/`;
}

/**
 * Prefer env / Vercel host over Origin so managers testing from localhost don’t put local URLs in emails.
 */
function resolveInviteRedirectTo(req: VercelRequest): string | undefined {
  const fromEnv =
    normalizeRedirectBase(process.env.APP_URL) ??
    normalizeRedirectBase(process.env.SITE_URL) ??
    normalizeRedirectBase(process.env.VITE_APP_URL);

  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_URL) {
    const v = normalizeRedirectBase(`https://${process.env.VERCEL_URL.replace(/^https?:\/\//i, "")}`);
    if (v) return v;
  }

  const origin = req.headers.origin?.trim();
  if (origin && /^https?:\/\//i.test(origin) && isPublicDeployHost(origin)) {
    return `${origin.replace(/\/$/, "")}/`;
  }

  return undefined;
}

/**
 * Sends a Supabase Auth invite email so the new rep/partner can set a password and sign in.
 * Only callers whose rep row is role=manager for the same tenant as the target rep may invite.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Set APP_URL (or SITE_URL) on Vercel to your live site, e.g. https://commisson-hq.vercel.app
 * so invite links are never localhost even if you add reps from a local dev session.
 *
 * Supabase Dashboard → Authentication → URL Configuration: Site URL = production; add Redirect URLs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const body = req.body as { email?: string };
  const raw = body?.email;
  if (typeof raw !== "string" || !raw.trim().includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const normalized = raw.trim().toLowerCase();

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const {
      data: { user: inviter },
      error: inviterErr,
    } = await admin.auth.getUser(token);
    if (inviterErr || !inviter) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data: inviterRep, error: inviterRepErr } = await admin
      .from("reps")
      .select("tenant_id, role")
      .eq("auth_user_id", inviter.id)
      .maybeSingle();

    if (inviterRepErr || !inviterRep || inviterRep.role !== "manager") {
      return res.status(403).json({ error: "Only managers can send invites" });
    }

    const { data: targetRep, error: targetErr } = await admin
      .from("reps")
      .select("id, name, email, tenant_id")
      .eq("email", normalized)
      .eq("tenant_id", inviterRep.tenant_id)
      .maybeSingle();

    if (targetErr || !targetRep) {
      return res.status(404).json({ error: "Rep not found in your organization" });
    }

    const redirectTo = resolveInviteRedirectTo(req);

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalized, {
      data: { full_name: (targetRep.name as string)?.trim() || normalized.split("@")[0] },
      ...(redirectTo ? { redirectTo } : {}),
    });

    if (inviteError) {
      const msg = inviteError.message || "Invite failed";
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return res.status(409).json({
          error:
            "This email already has an account. They can use Sign in on the login page with the same email.",
          code: "already_exists",
        });
      }
      console.error("[invite-rep]", inviteError);
      return res.status(500).json({ error: msg });
    }

    return res.status(200).json({ ok: true, message: "Invite email sent" });
  } catch (err) {
    console.error("[invite-rep] Unexpected", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
