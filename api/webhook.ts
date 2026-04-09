import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * Webhook endpoint for GoHighLevel.
 * Configure in GHL: when a rep tags a contact, send a POST to this URL.
 *
 * Attribution: the payload must include the selling rep’s (or sales partner’s) email.
 * We look up `reps.email` (case-insensitive), then insert the deal with `rep_id` = that row’s UUID.
 * The email is only used for lookup; the deal is always stored with the database `rep_id`.
 *
 * Dry run (no DB writes): add `?dry_run=1` or `?dry_run=true` to the URL, or send `"dry_run": true`
 * in the JSON body. Response includes the matched rep and whether a deal would be inserted.
 *
 * Required env vars (Vercel): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

function readDryRunFlag(req: VercelRequest, body: Record<string, unknown>): boolean {
  const q = req.query?.dry_run;
  const qVal = Array.isArray(q) ? q[0] : q;
  if (qVal === "1" || qVal === "true" || qVal === "yes") return true;
  if (body.dry_run === true) return true;
  return false;
}

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

    const bodyObj = body as Record<string, unknown>;
    const dryRun = readDryRunFlag(req, bodyObj);

    const payload = body as {
      contact_id?: string;
      company_name?: string;
      contact_email?: string;
      contact_phone?: string;
      /** Primary: rep / partner email for attribution (must match a row in `reps`). */
      assigned_rep_email?: string;
      /** Alias if your GHL JSON uses a different key for the same value. */
      rep_email?: string;
      dry_run?: boolean;
    };

    const repEmailRaw = payload.assigned_rep_email ?? payload.rep_email;
    if (!payload.contact_id || !payload.company_name || !repEmailRaw?.trim()) {
      return res.status(400).json({
        error: "Missing required fields: contact_id, company_name, and rep email",
        hint: "Send `assigned_rep_email` or `rep_email` (must match `reps.email` for that person).",
        dry_run: dryRun,
      });
    }

    const clientName = payload.company_name.trim();
    const ghlContactId = payload.contact_id.trim();
    const contactEmail = payload.contact_email?.trim() || null;
    const contactPhone = payload.contact_phone?.trim() || null;
    const assignedRepEmail = repEmailRaw.trim().toLowerCase();

    const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    const { data: repRows, error: repError } = await supabase
      .from("reps")
      .select("id, tenant_id, name, email, role")
      .ilike("email", assignedRepEmail);

    if (repError) {
      console.error("[webhook] rep lookup failed", repError.message);
      return res.status(500).json({
        error: "Rep lookup failed",
        details: repError.message,
        dry_run: dryRun,
      });
    }

    const repList = repRows ?? [];
    if (repList.length === 0) {
      if (dryRun) {
        console.warn(
          `[webhook] dry_run rep not found normalized_email=${assignedRepEmail} ghl_contact_id=${ghlContactId}`,
        );
      }
      return res.status(400).json({
        error: "Rep not found",
        message: `No rep found with email: ${assignedRepEmail}. Add them to the reps table first.`,
        dry_run: dryRun,
        normalized_rep_email: assignedRepEmail,
      });
    }

    if (repList.length > 1) {
      const message = `Multiple reps share this email (${repList.length} rows). Fix duplicates in the reps table.`;
      console.error("[webhook] ambiguous rep email", assignedRepEmail, repList.map((r) => r.id));
      return res.status(409).json({
        error: "Ambiguous rep email",
        message,
        dry_run: dryRun,
        normalized_rep_email: assignedRepEmail,
        matching_rep_ids: repList.map((r) => r.id),
      });
    }

    const rep = repList[0]!;

    const { data: existing } = await supabase
      .from("deals")
      .select("id")
      .eq("tenant_id", rep.tenant_id)
      .eq("ghl_contact_id", ghlContactId)
      .maybeSingle();

    if (dryRun) {
      console.log(
        `[webhook] dry_run ok rep_id=${rep.id} rep_name=${JSON.stringify(rep.name)} normalized_email=${assignedRepEmail} would_insert=${!existing} ghl_contact_id=${ghlContactId}`,
      );
      return res.status(200).json({
        ok: true,
        dry_run: true,
        message: "Dry run — no deal was created.",
        resolved: {
          rep: {
            id: rep.id,
            name: rep.name,
            email: rep.email,
            role: rep.role,
          },
          normalized_rep_email: assignedRepEmail,
        },
        deal_preview: {
          would_insert: !existing,
          reason: existing ? "deal_already_exists_for_contact" : "would_create_new_deal",
          existing_deal_id: existing?.id ?? null,
        },
        payload_echo: {
          client_name: clientName,
          ghl_contact_id: ghlContactId,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        },
      });
    }

    if (existing) {
      console.log(
        `[webhook] duplicate contact rep_id=${rep.id} ghl_contact_id=${ghlContactId} existing_deal_id=${existing.id}`,
      );
      return res.status(200).json({
        ok: true,
        message: "Deal already exists",
        clientName,
        ghlContactId,
        rep_id: rep.id,
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
      console.error("[webhook] insert failed", insertError.message, "rep_id=", rep.id);
      return res.status(500).json({
        error: "Failed to save deal",
        details: insertError.message,
      });
    }

    console.log(`[webhook] deal created rep_id=${rep.id} ghl_contact_id=${ghlContactId} client=${JSON.stringify(clientName)}`);

    return res.status(200).json({
      ok: true,
      message: "Webhook received",
      clientName,
      ghlContactId,
      rep_id: rep.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] exception", msg);
    return res.status(500).json({ error: "Webhook failed", details: msg });
  }
}
