import type { Deal, Rep } from "@/types/commission";

interface SupabaseRepRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  auth_user_id: string | null;
  created_at: string;
  monthly_goal?: number | null;
}

interface SupabaseDealRow {
  id: string;
  tenant_id: string;
  rep_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  ghl_contact_id: string | null;
  products: unknown;
  setup_fees: unknown;
  close_date: string;
  first_payment_date: string | null;
  status: string;
  paid_out: boolean;
  paid_out_at: string | null;
  handoff: unknown;
  notes: string | null;
  created_at: string;
}

export function mapRepRow(row: SupabaseRepRow): Rep {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? "",
    role: row.role === "manager" ? "manager" : "rep",
    monthlyGoal: row.monthly_goal ?? null,
  };
}

export function mapDealRow(row: SupabaseDealRow): Deal {
  const products = Array.isArray(row.products)
    ? row.products
    : (row.products as Deal["products"]) ?? [];
  const setupFees = Array.isArray(row.setup_fees)
    ? row.setup_fees
    : (row.setup_fees as Deal["setupFees"]) ?? [];
  const handoff = row.handoff as Deal["handoff"] | null;

  return {
    id: row.id,
    repId: row.rep_id,
    clientName: row.client_name,
    clientEmail: row.client_email ?? null,
    clientPhone: row.client_phone ?? null,
    ghlContactId: row.ghl_contact_id ?? null,
    products: products.map((p: { productId?: string; quantity?: number; overrideMrr?: number | null }) => ({
      productId: p.productId ?? "",
      quantity: p.quantity ?? 1,
      overrideMrr: p.overrideMrr ?? null,
    })),
    setupFees: setupFees.map((s: { type?: string; actualAmount?: number }) => ({
      type: s.type ?? "",
      actualAmount: s.actualAmount ?? 0,
    })),
    closeDate: row.close_date,
    firstPaymentDate: row.first_payment_date ?? null,
    status: row.status === "cancelled" ? "cancelled" : "active",
    paidOut: row.paid_out ?? false,
    paidOutAt: row.paid_out_at ?? null,
    handoff: handoff ?? undefined,
    notes: row.notes ?? null,
  };
}

/** Convert Deal to Supabase insert/update shape (snake_case) */
export function dealToSupabase(deal: Partial<Deal>, tenantId: string) {
  return {
    tenant_id: tenantId,
    rep_id: deal.repId,
    client_name: deal.clientName,
    client_email: deal.clientEmail ?? null,
    client_phone: deal.clientPhone ?? null,
    ghl_contact_id: deal.ghlContactId ?? null,
    products: deal.products ?? [],
    setup_fees: deal.setupFees ?? [],
    close_date: deal.closeDate,
    first_payment_date: deal.firstPaymentDate ?? null,
    status: deal.status ?? "active",
    paid_out: deal.paidOut ?? false,
    paid_out_at: deal.paidOutAt ?? null,
    handoff: deal.handoff ?? {},
    notes: deal.notes ?? null,
  };
}
