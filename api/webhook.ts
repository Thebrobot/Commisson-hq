import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * Webhook endpoint for GoHighLevel.
 * Configure in GHL: when a rep tags a contact, send a POST to this URL.
 *
 * Required env vars (Vercel): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return res.status(500).json({
      error: "Server misconfigured",
      details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them in Vercel → Settings → Environment Variables for Production AND Preview.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const payload = body as {
      contact_id?: string;
      company_name?: string;
      contact_email?: string;
      contact_phone?: string;
      assigned_rep_email?: string;
    };

    if (!payload.contact_id || !payload.company_name || !payload.assigned_rep_email) {
      return res.status(400).json({
        error: "Missing required fields: contact_id, company_name, assigned_rep_email",
      });
    }

    const clientName = payload.company_name.trim();
    const ghlContactId = payload.contact_id.trim();
    const contactEmail = payload.contact_email?.trim() || null;
    const contactPhone = payload.contact_phone?.trim() || null;
    const assignedRepEmail = payload.assigned_rep_email.trim().toLowerCase();

    const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    const { data: rep, error: repError } = await supabase
      .from("reps")
      .select("id, tenant_id")
      .ilike("email", assignedRepEmail)
      .maybeSingle();

    if (repError || !rep) {
      return res.status(400).json({
        error: "Rep not found",
        message: `No rep found with email: ${assignedRepEmail}. Add them to the reps table first.`,
      });
    }

    const { data: existing } = await supabase
      .from("deals")
      .select("id")
      .eq("tenant_id", rep.tenant_id)
      .eq("ghl_contact_id", ghlContactId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Deal already exists",
        clientName,
        ghlContactId,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error: insertError } = await supabase.from("deals").insert({
      tenant_id: rep.tenant_id,
      rep_id: rep.id,
      client_name: clientName,
      client_email: contactEmail,
      client_phone: contactPhone,
      ghl_contact_id: ghlContactId,
      products: [],
      setup_fees: [],
      close_date: today,
      first_payment_date: null,
      status: "active",
    });

    if (insertError) {
      return res.status(500).json({
        error: "Failed to save deal",
        details: insertError.message,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Webhook received",
      clientName,
      ghlContactId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Webhook failed", details: msg });
  }
}
