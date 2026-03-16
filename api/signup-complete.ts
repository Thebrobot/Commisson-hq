import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a rep row for a newly signed-up user. Call after signUp or on first signIn.
 * Requires Authorization: Bearer <session_token>.
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: existing } = await supabase
      .from("reps")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ ok: true, message: "Rep already exists" });
    }

    const { data: tenants } = await supabase.from("tenants").select("id").limit(1);
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) {
      return res.status(500).json({ error: "No tenant found. Create a tenant first." });
    }

    const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Rep";
    const avatar = name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

    const { error: insertError } = await supabase.from("reps").insert({
      tenant_id: tenantId,
      auth_user_id: user.id,
      name: name.trim(),
      email: user.email!,
      avatar,
      role: "rep",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(200).json({ ok: true, message: "Rep already exists" });
      }
      return res.status(500).json({ error: "Failed to create rep", details: insertError.message });
    }

    return res.status(200).json({ ok: true, message: "Rep created" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
