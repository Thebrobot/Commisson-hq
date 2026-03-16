import { payoutConfig, productCatalog, setupFeeCatalog, tierConfig } from "@/data/catalog/commission";
import type {
  Deal,
  DealCommissionSummary,
  DealFeedItem,
  DealProductLineItem,
  LeaderboardEntry,
  Rep,
  RepAggregate,
  TeamAggregate,
  TierConfig,
} from "@/types/commission";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const preciseCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const longDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function getProductById(productId: string) {
  return productCatalog.find((product) => product.id === productId);
}

export function getSetupFeeById(setupFeeId: string) {
  return setupFeeCatalog.find((fee) => fee.id === setupFeeId);
}

export function resolveCommissionableMrr(lineItem: DealProductLineItem): number {
  const product = getProductById(lineItem.productId);

  if (!product) {
    return 0;
  }

  /** Use override when set (discounts/custom pricing); otherwise use catalog commissionableMrr. */
  const mrrPerUnit = lineItem.overrideMrr != null
    ? lineItem.overrideMrr
    : product.commissionableMrr;

  return mrrPerUnit * Math.max(lineItem.quantity, 1);
}

export function getTierForMrr(totalMrr: number): TierConfig {
  return [...tierConfig].reverse().find((tier) => totalMrr >= tier.mrr) ?? tierConfig[0];
}

export function getNextTier(totalMrr: number): TierConfig | null {
  return tierConfig.find((tier) => tier.mrr > totalMrr) ?? null;
}

export function getProjectedResidual(totalMrr: number): number {
  return totalMrr * getTierForMrr(totalMrr).rate;
}

export interface MonthlyProductDataPoint {
  day: number;
  dateLabel: string;
  isToday: boolean;
  [productId: string]: number | string | boolean;
}

export interface MonthlyProductMeta {
  productId: string;
  productName: string;
  color: string;
}

/** Build daily cumulative product revenue for the current month. One line per product. */
export function buildMonthlyProductData(
  deals: Deal[],
  now = new Date(),
): { data: MonthlyProductDataPoint[]; products: MonthlyProductMeta[] } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const dealsThisMonth = deals.filter((d) => {
    if (d.status !== "active") return false;
    const [y, m] = d.closeDate.split("-").map(Number);
    return y === year && m === month + 1;
  });

  const productColors = [
    "hsl(var(--primary))",
    "#6366f1", // indigo
    "#0891b2", // cyan
    "#059669", // emerald
    "#d97706", // amber
    "#dc2626", // red
    "#7c3aed", // violet
    "#ea580c", // orange
  ];

  const byProduct: Record<string, { rev: number; qty: number }[]> = {};

  for (const deal of dealsThisMonth) {
    const closeDay = new Date(`${deal.closeDate}T12:00:00`).getDate();
    for (const line of deal.products) {
      const id = line.productId;
      if (!byProduct[id]) {
        byProduct[id] = Array.from({ length: lastDay + 1 }, () => ({ rev: 0, qty: 0 }));
      }
      const rev = resolveCommissionableMrr(line);
      const qty = Math.max(line.quantity, 1);
      byProduct[id]![closeDay].rev += rev;
      byProduct[id]![closeDay].qty += qty;
    }
  }

  for (const id of Object.keys(byProduct)) {
    let cumRev = 0;
    let cumQty = 0;
    for (let day = 1; day <= lastDay; day++) {
      cumRev += byProduct[id]![day].rev;
      cumQty += byProduct[id]![day].qty;
      byProduct[id]![day] = { rev: cumRev, qty: cumQty };
    }
  }

  const products: MonthlyProductMeta[] = Object.keys(byProduct).map((id, i) => ({
    productId: id,
    productName: getProductById(id)?.name ?? id,
    color: productColors[i % productColors.length] ?? "hsl(var(--primary))",
  }));

  const today = now.getDate();
  const monthShort = now.toLocaleDateString("en-US", { month: "short" });
  const data: MonthlyProductDataPoint[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const dateLabel = `${monthShort} ${day}`;
    const point: MonthlyProductDataPoint = {
      day,
      dateLabel,
      isToday: day === today,
    };
    for (const p of products) {
      point[p.productId] = Math.round(byProduct[p.productId]![day].rev);
      point[`${p.productId}_qty`] = byProduct[p.productId]![day].qty;
    }
    data.push(point);
  }

  return { data, products };
}

/** Date when commission timing starts. Uses firstPaymentDate (post-trial) when set, else closeDate. */
export function getCommissionEligibleDate(deal: Deal): string {
  return deal.firstPaymentDate ?? deal.closeDate;
}

/** True if client is paying (no trial, or trial ended). */
export function isDealPaying(deal: Deal, now = new Date()): boolean {
  if (deal.status === "cancelled") {
    return false;
  }
  const fp = deal.firstPaymentDate;
  if (!fp) {
    return true; // No trial, pays at close
  }
  return new Date(`${fp}T12:00:00`).getTime() <= now.getTime();
}

/** True if deal is on trial (firstPaymentDate in future). */
export function isDealOnTrial(deal: Deal, now = new Date()): boolean {
  if (deal.status === "cancelled") {
    return false;
  }
  const fp = deal.firstPaymentDate;
  if (!fp) {
    return false; // No trial
  }
  return new Date(`${fp}T12:00:00`).getTime() > now.getTime();
}

/** Commission status for Active Clients: trial → in_lag (5-day hold) → ready → paid. */
export type CommissionStatus = "trial" | "in_lag" | "ready" | "paid" | "cancelled";

export function getCommissionStatus(
  deal: Deal,
  summary: { availableNow: boolean },
  now = new Date(),
): CommissionStatus {
  if (deal.status === "cancelled") return "cancelled";
  if (deal.paidOut) return "paid";
  if (isDealOnTrial(deal, now)) return "trial";
  if (summary.availableNow) return "ready";
  return "in_lag";
}

export function isCommissionAvailable(eligibleDate: string, now = new Date()): boolean {
  return addLagDays(eligibleDate).getTime() <= now.getTime();
}

export function addLagDays(dateString: string): Date {
  const availableDate = new Date(`${dateString}T12:00:00`);
  availableDate.setDate(availableDate.getDate() + payoutConfig.lagDays);
  return availableDate;
}

/** Payout date for a deal (uses firstPaymentDate when set for trial deals). */
export function getPayoutDate(dealOrEligibleDate: Deal | string): Date {
  const eligibleDate = typeof dealOrEligibleDate === "string" ? dealOrEligibleDate : getCommissionEligibleDate(dealOrEligibleDate);
  const availableDate = addLagDays(eligibleDate);
  const candidate = new Date(availableDate);
  candidate.setHours(12, 0, 0, 0);

  while (true) {
    const dayOfMonth = candidate.getDate();
    if (
      payoutConfig.payoutDates.includes(dayOfMonth) &&
      candidate.getTime() >= availableDate.getTime()
    ) {
      return candidate;
    }

    candidate.setDate(candidate.getDate() + 1);
  }
}

export function calcDealCommission(deal: Deal, now = new Date()): DealCommissionSummary {
  const eligibleDate = getCommissionEligibleDate(deal);

  if (deal.status === "cancelled") {
    const payoutDate = getPayoutDate(eligibleDate);
    const availableAt = addLagDays(eligibleDate);
    const mrr = deal.products.reduce((sum, item) => sum + resolveCommissionableMrr(item), 0);
    return {
      mrr,
      upfrontCommission: 0,
      setupCommission: 0,
      totalCommission: 0,
      payoutDate,
      availableAt,
      availableNow: false,
    };
  }

  const mrr = deal.products.reduce((sum, item) => sum + resolveCommissionableMrr(item), 0);
  const upfrontCommission = mrr;
  const setupCommission = deal.setupFees.reduce((sum, feeLine) => {
    const fee = getSetupFeeById(feeLine.type);
    if (!fee) {
      return sum;
    }

    return sum + feeLine.actualAmount * fee.commissionRate;
  }, 0);
  const availableAt = addLagDays(eligibleDate);
  const payoutDate = getPayoutDate(deal);

  return {
    mrr,
    upfrontCommission,
    setupCommission,
    totalCommission: upfrontCommission + setupCommission,
    payoutDate,
    availableAt,
    availableNow: isCommissionAvailable(eligibleDate, now),
  };
}

function isThisMonth(dateString: string, now = new Date()) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getSoonestPayoutDate(dates: Date[]): Date | null {
  if (!dates.length) {
    return null;
  }

  return dates.reduce((soonest, current) => (current < soonest ? current : soonest));
}

function getLastMonthPayout(deals: Deal[], now = new Date()): number {
  const lastMonth = now.getMonth() - 1;
  const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const adjMonth = lastMonth < 0 ? lastMonth + 12 : lastMonth;

  return deals
    .filter(
      (deal) =>
        deal.paidOut &&
        deal.paidOutAt &&
        deal.status === "active",
    )
    .filter((deal) => {
      const paidAt = new Date(deal.paidOutAt!);
      return paidAt.getMonth() === adjMonth && paidAt.getFullYear() === year;
    })
    .reduce((sum, deal) => sum + calcDealCommission(deal, now).totalCommission, 0);
}

export function aggregateRepDeals(rep: Rep, deals: Deal[], now = new Date()): RepAggregate {
  const summaries = deals.map((deal) => ({
    deal,
    summary: calcDealCommission(deal, now),
  }));
  const activeDeals = deals.filter((deal) => deal.status === "active");
  const availableDeals = summaries
    .filter(({ deal, summary }) => deal.status === "active" && !deal.paidOut && summary.availableNow)
    .map(({ deal }) => deal);
  // Total MRR = all active deals (including trial) - your full book for tier and residual
  const totalMrr = summaries
    .filter(({ deal }) => deal.status === "active")
    .reduce((sum, entry) => sum + entry.summary.mrr, 0);
  const availableCommission = summaries.reduce((sum, entry) => {
    if (entry.deal.status !== "active" || entry.deal.paidOut || !entry.summary.availableNow) {
      return sum;
    }

    return sum + entry.summary.totalCommission;
  }, 0);
  const pendingCommission = summaries.reduce((sum, entry) => {
    if (entry.deal.status !== "active" || entry.deal.paidOut || entry.summary.availableNow) {
      return sum;
    }

    return sum + entry.summary.totalCommission;
  }, 0);
  const paidCommission = summaries.reduce((sum, entry) => {
    if (!entry.deal.paidOut) {
      return sum;
    }

    return sum + entry.summary.totalCommission;
  }, 0);
  const thisMonthCommission = summaries.reduce((sum, entry) => {
    if (entry.deal.status !== "active" || !isThisMonth(entry.deal.closeDate, now)) {
      return sum;
    }

    return sum + entry.summary.totalCommission;
  }, 0);
  const tier = getTierForMrr(totalMrr);
  const nextTier = getNextTier(totalMrr);
  const residualMonthly = getProjectedResidual(totalMrr);
  const nextPayoutDate = getSoonestPayoutDate(
    availableDeals.map((deal) => getPayoutDate(deal)),
  );

  const nowTime = now.getTime();
  const payingDeals = activeDeals.filter((deal) => {
    const eligible = getCommissionEligibleDate(deal);
    return new Date(`${eligible}T12:00:00`).getTime() <= nowTime;
  });
  const payingClientCount = payingDeals.length;
  const closedThisMonthCount = activeDeals.filter((d) => isThisMonth(d.closeDate, now)).length;
  const onTrialCount = activeDeals.filter((deal) => {
    const fp = deal.firstPaymentDate;
    return fp != null && new Date(`${fp}T12:00:00`).getTime() > nowTime;
  }).length;
  const totalMrrPaying = summaries
    .filter(({ deal }) => payingDeals.includes(deal))
    .reduce((sum, entry) => sum + entry.summary.mrr, 0);

  const lastMonthPayout = getLastMonthPayout(deals, now);

  return {
    rep,
    deals,
    activeDeals,
    availableDeals,
    totalMrr,
    availableCommission,
    pendingCommission,
    paidCommission,
    thisMonthCommission,
    dealCount: activeDeals.length,
    payingClientCount,
    closedThisMonthCount,
    onTrialCount,
    tier,
    nextTier,
    residualMonthly,
    projectedResidual: residualMonthly * 12,
    nextPayoutDate,
    lastMonthPayout: lastMonthPayout > 0 ? lastMonthPayout : Math.round(availableCommission * 0.82),
  };
}

export function getLeaderboard(reps: RepAggregate[]): LeaderboardEntry[] {
  const sorted = [...reps].sort((a, b) => b.thisMonthCommission - a.thisMonthCommission);
  const leaderAmount = sorted[0]?.thisMonthCommission ?? 0;

  return sorted.map((entry, index) => ({
    rep: entry.rep,
    rank: index + 1,
    totalMrr: entry.totalMrr,
    availableCommission: entry.availableCommission,
    thisMonthCommission: entry.thisMonthCommission,
    tier: entry.tier,
    dealCount: entry.dealCount,
    gapToLeader: Math.max(leaderAmount - entry.thisMonthCommission, 0),
  }));
}

export function aggregateTeam(reps: Rep[], deals: Deal[], now = new Date()): TeamAggregate {
  const repAggregates = reps.map((rep) =>
    aggregateRepDeals(
      rep,
      deals
        .filter((deal) => deal.repId === rep.id)
        .sort((a, b) => b.closeDate.localeCompare(a.closeDate)),
      now,
    ),
  );
  const topPerformer = [...repAggregates].sort(
    (a, b) => b.thisMonthCommission - a.thisMonthCommission,
  )[0] ?? null;

  return {
    reps: repAggregates,
    totalAvailableCommission: repAggregates.reduce(
      (sum, repAggregate) => sum + repAggregate.availableCommission,
      0,
    ),
    totalPendingCommission: repAggregates.reduce(
      (sum, repAggregate) => sum + repAggregate.pendingCommission,
      0,
    ),
    totalPaidCommission: repAggregates.reduce(
      (sum, repAggregate) => sum + repAggregate.paidCommission,
      0,
    ),
    teamMrr: repAggregates.reduce((sum, repAggregate) => sum + repAggregate.totalMrr, 0),
    activeDealCount: repAggregates.reduce((sum, repAggregate) => sum + repAggregate.dealCount, 0),
    repCount: repAggregates.length,
    activeClientCount: repAggregates.reduce((sum, r) => sum + r.payingClientCount, 0),
    closedThisMonthCount: repAggregates.reduce((sum, r) => sum + r.closedThisMonthCount, 0),
    onTrialCount: repAggregates.reduce((sum, r) => sum + r.onTrialCount, 0),
    topPerformer,
    nextTeamPayoutDate: getSoonestPayoutDate(
      repAggregates
        .map((repAggregate) => repAggregate.nextPayoutDate)
        .filter((date): date is Date => Boolean(date)),
    ),
    lastMonthPayout: (() => {
      const fromPaidDeals = getLastMonthPayout(deals, now);
      const current = repAggregates.reduce(
        (sum, r) => sum + r.availableCommission,
        0,
      );
      return fromPaidDeals > 0 ? fromPaidDeals : Math.round(current * 0.82);
    })(),
  };
}

export function getDealFeedItems(reps: Rep[], deals: Deal[], now = new Date()): DealFeedItem[] {
  return deals
    .map((deal) => {
      const rep = reps.find((candidate) => candidate.id === deal.repId);
      if (!rep) {
        return null;
      }

      return {
        deal,
        rep,
        summary: calcDealCommission(deal, now),
      };
    })
    .filter((item): item is DealFeedItem => Boolean(item))
    .sort((a, b) => b.deal.closeDate.localeCompare(a.deal.closeDate));
}

export function getDaysUntil(date: Date, now = new Date()) {
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / MS_PER_DAY);
}

export function formatRelativeDealDate(closeDate: string, now = new Date()) {
  const date = new Date(`${closeDate}T12:00:00`);
  const diff = Math.round((now.getTime() - date.getTime()) / MS_PER_DAY);

  if (diff <= 0) {
    return "Today";
  }

  if (diff === 1) {
    return "Yesterday";
  }

  return `${diff} days ago`;
}
