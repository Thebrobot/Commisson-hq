import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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
 *
 * Keep this file self-contained: Vercel Node ESM cannot resolve relative src/ imports.
 */

const ALLOWED_ORIGINS = new Set([
  "https://brobot-order-handoff.vercel.app",
  "https://commisson-hq.vercel.app",
]);

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (typeof origin === "string") {
    const allowed =
      ALLOWED_ORIGINS.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const defaultHandoff = {
  checklist: {
    contractSigned: false,
    paymentProcessed: false,
    activeClientCreated: false,
    productRecorded: false,
    loaSigned: false,
    portFormSubmitted: false,
    dealMovedToPaymentAccepted: false,
    saleCalledOutDiscord: false,
    saleLoggedOnboardingDiscord: false,
  },
  portingDocUrl: null,
  portingSubmissionUrl: null,
};

const HANDOFF_PRODUCT_ID_MAP: Record<string, string> = {
  "brobot-one-basic": "brobot-one-basic",
  "brobot-one-core": "brobot-one-core",
  "ai-receptionist": "ai-receptionist",
  "ai-receptionist-priority": "ai-receptionist",
  "agent-broski-voice-sms": "agent-broski-voice-sms",
  "ai-growth-priority": "agent-broski-voice-sms",
};

const HANDOFF_SETUP_TYPE_MAP: Record<string, string> = {
  "ai-receptionist": "agent_broski_receptionist_setup",
  "ai-receptionist-priority": "agent_broski_receptionist_setup",
  "agent-broski-voice-sms": "agent_broski_voice_sms_setup",
  "ai-growth-priority": "agent_broski_voice_sms_setup",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value !== "object") return null;
  if (!value || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseMoney(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = parseFloat(str(raw).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseQty(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(str(raw), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDate(raw: unknown): string | null {
  const s = str(raw);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function mapHandoffProductId(productId: string): string | null {
  const id = str(productId);
  if (!id) return null;
  return HANDOFF_PRODUCT_ID_MAP[id] ?? HANDOFF_PRODUCT_ID_MAP[id.toLowerCase()] ?? null;
}

function mapHandoffFormLines(productsRaw: unknown): {
  products: Array<{ productId: string; quantity: number; overrideMrr: number | null }>;
  setupFees: Array<{ type: string; actualAmount: number }>;
} {
  const rows = Array.isArray(productsRaw) ? productsRaw : [];
  const products: Array<{ productId: string; quantity: number; overrideMrr: number | null }> = [];
  const setupFees: Array<{ type: string; actualAmount: number }> = [];

  for (const row of rows) {
    const rec = asRecord(row);
    if (!rec) continue;
    const formProductId = str(rec.productId);
    const catalogId = mapHandoffProductId(formProductId);
    if (!catalogId) continue;

    const quantity = parseQty(rec.lineQty ?? rec.quantity);
    const monthlyTotal = parseMoney(rec.monthlyAmount ?? rec.mrc);
    products.push({
      productId: catalogId,
      quantity,
      overrideMrr: monthlyTotal != null ? monthlyTotal / quantity : null,
    });

    const setupAmount = parseMoney(rec.setupFee ?? rec.setup);
    if (setupAmount != null && setupAmount > 0) {
      const type = HANDOFF_SETUP_TYPE_MAP[formProductId] ?? HANDOFF_SETUP_TYPE_MAP[catalogId];
      setupFees.push({ type: type || "website_build", actualAmount: setupAmount });
    }
  }

  return { products, setupFees };
}

function parseHandoffIntake(body: Record<string, unknown>) {
  const nestedForm = body.source === "deal-submission-form" || asRecord(body.business) != null;
  const contact = asRecord(body.contact);
  const business = asRecord(body.business);
  const rep = asRecord(body.rep) ?? asRecord(body.partner);
  const billing = asRecord(body.billing);

  const companyName = nestedForm
    ? str(business?.legalName) || str(body.company_name)
    : str(body.company_name);
  const contactEmail = nestedForm
    ? str(contact?.email) || str(body.contact_email)
    : str(body.contact_email);
  const contactPhone = nestedForm
    ? str(contact?.phone) || str(body.contact_phone)
    : str(body.contact_phone);
  const repEmail = nestedForm
    ? str(rep?.email) || str(body.assigned_rep_email) || str(body.rep_email)
    : str(body.assigned_rep_email) || str(body.rep_email);
  const contactId =
    str(body.contact_id) ||
    (contactEmail ? `handoff:${contactEmail.toLowerCase()}` : "") ||
    (companyName ? `handoff:${companyName.toLowerCase()}` : "");

  if (!companyName || !repEmail || !contactId) {
    throw new Error("Missing required fields: company_name, rep email, and contact_id");
  }

  const lines = nestedForm
    ? mapHandoffFormLines(body.products)
    : { products: [], setupFees: [] };

  const closeDate =
    isoDate(billing?.saleDate) || isoDate(body.close_date) || isoDate(body.sale_date) || todayIso();
  const firstPaymentDate =
    isoDate(billing?.estimatedChargeDate) || isoDate(body.first_payment_date) || isoDate(body.charge_date);

  return {
    clientName: companyName,
    ghlContactId: contactId,
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
    assignedRepEmail: repEmail.toLowerCase(),
    closeDate,
    firstPaymentDate,
    notes: str(body.notes) || null,
    products: lines.products,
    setupFees: lines.setupFees,
    source: nestedForm ? "deal-submission-form" : "ghl",
  };
}

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

    const dealRow: Record<string, unknown> = {
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
    };

    let { error: insertError } = await supabase.from("deals").insert(dealRow);

    if (insertError && /notes/.test(insertError.message || "")) {
      delete dealRow.notes;
      const retry = await supabase.from("deals").insert(dealRow);
      insertError = retry.error;
    }

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
