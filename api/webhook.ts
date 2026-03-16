import type { VercelRequest, VercelResponse } from "@vercel/node";
import { normalizeWebhookPayload } from "../src/lib/commission/webhook";
import type { GhlWebhookPayload } from "../src/types/webhook";
import { supabaseAdmin } from "../src/lib/supabase-admin";

/**
 * Webhook endpoint for GoHighLevel.
 * Configure in GHL: when a rep tags a contact, send a POST to this URL.
 *
 * Your webhook URL (after deploying to Vercel):
 *   https://YOUR_DOMAIN.vercel.app/api/webhook
 *
 * Local testing (with Vercel CLI): https://localhost:3000/api/webhook
 *
 * Required env vars (Vercel): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const payload = body as GhlWebhookPayload;

    if (!payload.contact_id || !payload.company_name || !payload.assigned_rep_email) {
      return res.status(400).json({
        error: "Missing required fields: contact_id, company_name, assigned_rep_email",
      });
    }

    const normalized = normalizeWebhookPayload(payload);

    // Look up rep by email (case-insensitive)
    const { data: rep, error: repError } = await supabaseAdmin
      .from("reps")
      .select("id, tenant_id")
      .ilike("email", normalized.assignedRepEmail)
      .maybeSingle();

    if (repError || !rep) {
      console.error("[webhook] Rep not found for email:", normalized.assignedRepEmail, repError);
      return res.status(400).json({
        error: "Rep not found",
        message: `No rep found with email: ${normalized.assignedRepEmail}. Add them to the reps table first.`,
      });
    }

    // Skip if deal with this ghl_contact_id already exists for this tenant
    const { data: existing } = await supabaseAdmin
      .from("deals")
      .select("id")
      .eq("tenant_id", rep.tenant_id)
      .eq("ghl_contact_id", normalized.ghlContactId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Deal already exists",
        clientName: normalized.clientName,
        ghlContactId: normalized.ghlContactId,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { error: insertError } = await supabaseAdmin.from("deals").insert({
      tenant_id: rep.tenant_id,
      rep_id: rep.id,
      client_name: normalized.clientName,
      client_email: normalized.contactEmail,
      client_phone: normalized.contactPhone,
      ghl_contact_id: normalized.ghlContactId,
      products: [],
      setup_fees: [],
      close_date: today,
      first_payment_date: null,
      status: "active",
    });

    if (insertError) {
      console.error("[webhook] Insert error:", insertError);
      return res.status(500).json({ error: "Failed to save deal", details: insertError.message });
    }

    return res.status(200).json({
      ok: true,
      message: "Webhook received",
      clientName: normalized.clientName,
      ghlContactId: normalized.ghlContactId,
    });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
