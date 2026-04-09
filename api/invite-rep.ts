import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * Sends a Supabase Auth invite email so the new rep/partner can set a password and sign in.
 * Only callers whose rep row is role=manager for the same tenant as the target rep may invite.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Supabase Dashboard → Authentication → URL Configuration: add your production URL to Redirect URLs.
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

    const originHeader = req.headers.origin;
    let redirectTo: string | undefined;
    if (originHeader && /^https?:\/\//i.test(originHeader)) {
      redirectTo = `${originHeader.replace(/\/$/, "")}/`;
    } else if (process.env.VITE_APP_URL) {
      redirectTo = `${String(process.env.VITE_APP_URL).replace(/\/$/, "")}/`;
    } else if (process.env.VERCEL_URL) {
      redirectTo = `https://${process.env.VERCEL_URL.replace(/\/$/, "")}/`;
    }

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
