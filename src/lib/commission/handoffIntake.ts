import type { DealProductLineItem, DealSetupFeeLineItem } from "../../types/commission";

/** Handoff form productId → CommissionHQ catalog id */
export const HANDOFF_PRODUCT_ID_MAP: Record<string, string> = {
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

export interface HandoffIntakeDeal {
  clientName: string;
  ghlContactId: string;
  contactEmail: string | null;
  contactPhone: string | null;
  assignedRepEmail: string;
  closeDate: string;
  firstPaymentDate: string | null;
  notes: string | null;
  products: DealProductLineItem[];
  setupFees: DealSetupFeeLineItem[];
  source: "ghl" | "deal-submission-form";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
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

export function mapHandoffProductId(productId: string): string | null {
  const id = str(productId);
  if (!id) return null;
  return HANDOFF_PRODUCT_ID_MAP[id] ?? (HANDOFF_PRODUCT_ID_MAP[id.toLowerCase()] ?? null);
}

export function mapHandoffFormLines(productsRaw: unknown): {
  products: DealProductLineItem[];
  setupFees: DealSetupFeeLineItem[];
} {
  const rows = Array.isArray(productsRaw) ? productsRaw : [];
  const products: DealProductLineItem[] = [];
  const setupFees: DealSetupFeeLineItem[] = [];

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
      /** Store per-line MRC so HQ `override × qty` equals the form total. */
      overrideMrr: monthlyTotal != null ? monthlyTotal / quantity : null,
    });

    const setupAmount = parseMoney(rec.setupFee ?? rec.setup);
    if (setupAmount != null && setupAmount > 0) {
      const type = HANDOFF_SETUP_TYPE_MAP[formProductId] ?? HANDOFF_SETUP_TYPE_MAP[catalogId];
      if (type) {
        setupFees.push({ type, actualAmount: setupAmount });
      } else {
        setupFees.push({ type: "website_build", actualAmount: setupAmount });
      }
    }
  }

  return { products, setupFees };
}

/** Accepts GHL flat payloads and the nested Handoff Hub form payload. */
export function parseHandoffIntake(body: Record<string, unknown>): HandoffIntakeDeal {
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
    : { products: [] as DealProductLineItem[], setupFees: [] as DealSetupFeeLineItem[] };

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
