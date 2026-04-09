import { describe, expect, it } from "vitest";
import { calcDealCommission, getPayoutDate, getTierForMrr } from "@/lib/commission";
import { normalizeWebhookPayload } from "@/lib/commission/webhook";
import type { Deal } from "@/types/commission";

describe("commission domain logic", () => {
  it("calculates upfront and setup commission from a deal", () => {
    const deal: Deal = {
      id: "test-1",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [{ productId: "imapspro", quantity: 1, overrideMrr: null }],
      setupFees: [{ type: "agent_broski_receptionist_setup", actualAmount: 1500 }],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));

    expect(summary.mrr).toBe(25);
    expect(summary.upfrontCommission).toBe(25);
    expect(summary.setupCommission).toBe(150);
    expect(summary.totalCommission).toBe(175);
    expect(summary.availableNow).toBe(true);
  });

  it("uses override MRR for book MRR while fixed package sale pay stays on catalog", () => {
    const deal: Deal = {
      id: "test-2",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [{ productId: "brobot-one-basic", quantity: 1, overrideMrr: 179.99 }],
      setupFees: [],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));

    expect(summary.mrr).toBe(179.99);
    expect(summary.upfrontCommission).toBe(130);
    expect(summary.totalCommission).toBe(130);
  });

  it("finds the correct payout window after the five-day lag", () => {
    const payoutDate = getPayoutDate("2026-03-10");
    expect(payoutDate.toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("returns the correct residual tier for an MRR book", () => {
    expect(getTierForMrr(9000).rate).toBe(0);
    expect(getTierForMrr(12500).rate).toBe(0.1);
    expect(getTierForMrr(25000).rate).toBe(0.15);
    expect(getTierForMrr(40000).rate).toBe(0.2);
  });

  it("normalizes webhook payload fields", () => {
    expect(
      normalizeWebhookPayload({
        contact_id: " ghl_123 ",
        company_name: " Acme Corp ",
        contact_email: " sales@acme.com ",
        assigned_rep_email: " KYLE@BROBOT.IO ",
      }),
    ).toEqual({
      clientName: "Acme Corp",
      ghlContactId: "ghl_123",
      contactEmail: "sales@acme.com",
      contactPhone: null,
      assignedRepEmail: "kyle@brobot.io",
    });
  });

  it("normalizes webhook payload with contact_phone", () => {
    expect(
      normalizeWebhookPayload({
        contact_id: "ghl_456",
        company_name: "Test Client",
        contact_phone: " (555) 999-8888 ",
        assigned_rep_email: "kyle@brobot.io",
      }),
    ).toEqual({
      clientName: "Test Client",
      ghlContactId: "ghl_456",
      contactEmail: null,
      contactPhone: "(555) 999-8888",
      assignedRepEmail: "kyle@brobot.io",
    });
  });

  it("accepts rep_email as an alias for assigned_rep_email", () => {
    expect(
      normalizeWebhookPayload({
        contact_id: "ghl_789",
        company_name: "Partner Co",
        rep_email: "PARTNER@EXAMPLE.COM",
      }),
    ).toEqual({
      clientName: "Partner Co",
      ghlContactId: "ghl_789",
      contactEmail: null,
      contactPhone: null,
      assignedRepEmail: "partner@example.com",
    });
  });
});
