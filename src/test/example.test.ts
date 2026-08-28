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

  it("uses the Stripe device ladder for Brobot One and Agent Broski MRC", () => {
    const basic7: Deal = {
      id: "test-ladder-basic",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [{ productId: "brobot-one-basic", quantity: 7, overrideMrr: null }],
      setupFees: [],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };
    const core1: Deal = {
      ...basic7,
      id: "test-ladder-core",
      products: [{ productId: "brobot-one-core", quantity: 1, overrideMrr: null }],
    };
    const aire2: Deal = {
      ...basic7,
      id: "test-ladder-aire",
      products: [{ productId: "ai-receptionist", quantity: 2, overrideMrr: null }],
    };

    const now = new Date("2026-03-20T12:00:00Z");
    expect(calcDealCommission(basic7, now).mrr).toBe(246);
    expect(calcDealCommission(basic7, now).upfrontCommission).toBe(246);
    expect(calcDealCommission(core1, now).mrr).toBe(335);
    expect(calcDealCommission(aire2, now).mrr).toBe(878);
  });

  it("sums Handoff Hub line totals across products plus 10% setup", () => {
    const deal: Deal = {
      id: "test-handoff-sum",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [
        { productId: "brobot-one-core", quantity: 1, overrideMrr: null },
        { productId: "brobot-one-basic", quantity: 7, overrideMrr: null },
      ],
      setupFees: [{ type: "agent_broski_receptionist_setup", actualAmount: 1560 }],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));
    expect(summary.mrr).toBe(581);
    expect(summary.upfrontCommission).toBe(581);
    expect(summary.setupCommission).toBe(156);
    expect(summary.totalCommission).toBe(737);
  });

  it("pays 10% of Agent Broski receptionist setup", () => {
    const deal: Deal = {
      id: "test-setup-1560",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [],
      setupFees: [{ type: "agent_broski_receptionist_setup", actualAmount: 1560 }],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));
    expect(summary.setupCommission).toBe(156);
  });

  it("pays 1× MRC including override pricing", () => {
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
    expect(summary.upfrontCommission).toBe(179.99);
    expect(summary.totalCommission).toBe(179.99);
  });

  it("pays 10% on marketing package MRC", () => {
    const deal: Deal = {
      id: "test-marketing",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [{ productId: "marketing-package", quantity: 1, overrideMrr: 500 }],
      setupFees: [],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));

    expect(summary.mrr).toBe(500);
    expect(summary.upfrontCommission).toBe(50);
    expect(summary.totalCommission).toBe(50);
  });

  it("pays 10% on custom package MRC", () => {
    const deal: Deal = {
      id: "test-custom",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [{ productId: "custom-package", quantity: 1, overrideMrr: 1200 }],
      setupFees: [],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));

    expect(summary.mrr).toBe(1200);
    expect(summary.upfrontCommission).toBe(120);
    expect(summary.totalCommission).toBe(120);
  });

  it("pays 10% on website sales", () => {
    const deal: Deal = {
      id: "test-website",
      repId: "rep-1",
      clientName: "Acme Corp",
      ghlContactId: null,
      products: [],
      setupFees: [{ type: "website_build", actualAmount: 4200 }],
      closeDate: "2026-03-10",
      status: "active",
      paidOut: false,
      paidOutAt: null,
    };

    const summary = calcDealCommission(deal, new Date("2026-03-20T12:00:00Z"));

    expect(summary.setupCommission).toBe(420);
    expect(summary.totalCommission).toBe(420);
  });

  it("finds the correct payout window after the five-day lag", () => {
    const payoutDate = getPayoutDate("2026-03-10");
    expect(payoutDate.toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("returns the correct residual tier for an MRR book", () => {
    expect(getTierForMrr(9000).rate).toBe(0);
    expect(getTierForMrr(10000).rate).toBe(0.1);
    expect(getTierForMrr(12500).rate).toBe(0.1);
    expect(getTierForMrr(40000).rate).toBe(0.1);
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
