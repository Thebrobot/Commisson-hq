import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { parseHandoffIntake } from "../src/lib/commission/handoffIntake";
import { defaultHandoff } from "../src/lib/handoff";
import { applyCors } from "./_cors";

/**
 * Webhook for GoHighLevel and the Brobot Handoff Hub form.
 *
 * Attribution: payload must include the selling rep’s email (`assigned_rep_email`,
 * `rep_email`, or nested `rep.email`). We look up `reps.email` and insert the deal
 * with that `rep_id`.
 *
 * Dry run: `?dry_run=1` or `"dry_run": true`.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

function readDryRunFlag(req: VercelRequest, body: Record<string, unknown>): boolean {
  const q = req.query?.dry_run;
  const qVal = Array.isArray(q) ? q[0] : q;
  if (qVal === "1" || qVal === "true" || qVal === "yes") return true;
  if (body.dry_run === true) return true;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return res.status(500).json({
      error: "Server misconfigured",
      details:
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them in Vercel → Settings → Environment Variables for Production AND Preview.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const bodyObj = body as Record<string, unknown>;
    const dryRun = readDryRunFlag(req, bodyObj);

    let intake;
    try {
      intake = parseHandoffIntake(bodyObj);
    } catch {
      return res.status(400).json({
        error: "Missing required fields: contact_id, company_name, and rep email",
        hint: "Send `assigned_rep_email` or `rep_email`, or nested `rep.email` from the Handoff Hub form.",
        dry_run: dryRun,
      });
    }

    const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

    const { data: repRows, error: repError } = await supabase
      .from("reps")
      .select("id, tenant_id, name, email, role")
      .ilike("email", intake.assignedRepEmail);

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
          `[webhook] dry_run rep not found normalized_email=${intake.assignedRepEmail} ghl_contact_id=${intake.ghlContactId}`,
        );
      }
      return res.status(400).json({
        error: "Rep not found",
        message: `No rep found with email: ${intake.assignedRepEmail}. Add them to the reps table first.`,
        dry_run: dryRun,
        normalized_rep_email: intake.assignedRepEmail,
      });
    }

    if (repList.length > 1) {
      const message = `Multiple reps share this email (${repList.length} rows). Fix duplicates in the reps table.`;
      console.error("[webhook] ambiguous rep email", intake.assignedRepEmail, repList.map((r) => r.id));
      return res.status(409).json({
        error: "Ambiguous rep email",
        message,
        dry_run: dryRun,
        normalized_rep_email: intake.assignedRepEmail,
        matching_rep_ids: repList.map((r) => r.id),
      });
    }

    const rep = repList[0]!;

    const { data: existing } = await supabase
      .from("deals")
      .select("id")
      .eq("tenant_id", rep.tenant_id)
      .eq("ghl_contact_id", intake.ghlContactId)
      .maybeSingle();

    if (dryRun) {
      console.log(
        `[webhook] dry_run ok rep_id=${rep.id} rep_name=${JSON.stringify(rep.name)} normalized_email=${intake.assignedRepEmail} would_insert=${!existing} ghl_contact_id=${intake.ghlContactId}`,
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
          normalized_rep_email: intake.assignedRepEmail,
        },
        deal_preview: {
          would_insert: !existing,
          reason: existing ? "deal_already_exists_for_contact" : "would_create_new_deal",
          existing_deal_id: existing?.id ?? null,
          products: intake.products,
          setup_fees: intake.setupFees,
        },
        payload_echo: {
          client_name: intake.clientName,
          ghl_contact_id: intake.ghlContactId,
          contact_email: intake.contactEmail,
          contact_phone: intake.contactPhone,
        },
      });
    }

    if (existing) {
      console.log(
        `[webhook] duplicate contact rep_id=${rep.id} ghl_contact_id=${intake.ghlContactId} existing_deal_id=${existing.id}`,
      );
      return res.status(200).json({
        ok: true,
        message: "Deal already exists",
        clientName: intake.clientName,
        ghlContactId: intake.ghlContactId,
        rep_id: rep.id,
        deal_id: existing.id,
      });
    }

    const { error: insertError } = await supabase.from("deals").insert({
      tenant_id: rep.tenant_id,
      rep_id: rep.id,
      client_name: intake.clientName,
      client_email: intake.contactEmail,
      client_phone: intake.contactPhone,
      ghl_contact_id: intake.ghlContactId,
      products: intake.products,
      setup_fees: intake.setupFees,
      close_date: intake.closeDate,
      first_payment_date: intake.firstPaymentDate,
      status: "active",
      notes: intake.notes,
      handoff: defaultHandoff,
    });

    if (insertError) {
      console.error("[webhook] insert failed", insertError.message, "rep_id=", rep.id);
      return res.status(500).json({
        error: "Failed to save deal",
        details: insertError.message,
      });
    }

    console.log(
      `[webhook] deal created source=${intake.source} rep_id=${rep.id} ghl_contact_id=${intake.ghlContactId} client=${JSON.stringify(intake.clientName)}`,
    );

    return res.status(200).json({
      ok: true,
      message: "Webhook received",
      clientName: intake.clientName,
      ghlContactId: intake.ghlContactId,
      rep_id: rep.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook] exception", msg);
    return res.status(500).json({ error: "Webhook failed", details: msg });
  }
}
