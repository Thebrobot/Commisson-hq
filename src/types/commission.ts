export type ViewScope = "all" | string;

export type DealStatus = "active" | "cancelled";

export interface Rep {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: "rep" | "manager";
  /** Per-rep monthly goal override. Falls back to payoutConfig.monthlyGoal if null. */
  monthlyGoal?: number | null;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  defaultMrr: number;
  commissionableMrr: number;
  allowOverride: boolean;
  perUnit: boolean;
  /** Sale commission uses this fixed USD for the line instead of commissionable MRR (matrix packages). */
  fixedUpfrontCommissionUsd?: number;
}

export interface SetupFeeCatalogItem {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  isVariable?: boolean;
}

export interface TierConfig {
  mrr: number;
  rate: number;
  label: string;
}

export interface PayoutConfig {
  lagDays: number;
  payoutDates: number[];
  monthlyGoal: number;
}

export interface DealProductLineItem {
  productId: string;
  quantity: number;
  overrideMrr: number | null;
}

export interface DealSetupFeeLineItem {
  type: string;
  actualAmount: number;
}

/** Fixed checklist for order handoff. All items must be checked for handoff to be complete. */
export interface HandoffChecklist {
  contractSigned: boolean;
  paymentProcessed: boolean;
  activeClientCreated: boolean;
  productRecorded: boolean;
  loaSigned: boolean;
  portFormSubmitted: boolean;
  dealMovedToPaymentAccepted: boolean;
  saleCalledOutDiscord: boolean;
  saleLoggedOnboardingDiscord: boolean;
}

export interface Handoff {
  checklist: HandoffChecklist;
  /** Timestamps for when each checklist item was completed. Keys match HandoffChecklist keys. */
  checklistTimestamps?: Partial<Record<keyof HandoffChecklist, string>>;
  /** URL to porting document (e.g. Google Doc, Dropbox) */
  portingDocUrl: string | null;
  /** URL to porting submission form (carrier/carrier portal) */
  portingSubmissionUrl: string | null;
  /** When all items were completed. */
  completedAt?: string | null;
  /** Internal notes about this handoff. */
  handoffNotes?: string | null;
}

export interface Deal {
  id: string;
  repId: string;
  clientName: string;
  /** From webhook: contact email when client is added to active in GHL */
  clientEmail?: string | null;
  /** From webhook: contact phone when client is added to active in GHL */
  clientPhone?: string | null;
  ghlContactId: string | null;
  products: DealProductLineItem[];
  setupFees: DealSetupFeeLineItem[];
  closeDate: string;
  /** When client starts paying (e.g. after trial). If null, client pays at close (no trial). */
  firstPaymentDate?: string | null;
  status: DealStatus;
  paidOut: boolean;
  paidOutAt: string | null;
  /** Client handoff checklist for order fulfillment. */
  handoff?: Handoff | null;
  /** Internal rep notes for this client deal. */
  notes?: string | null;
}

export interface DealCommissionSummary {
  mrr: number;
  upfrontCommission: number;
  setupCommission: number;
  totalCommission: number;
  payoutDate: Date;
  availableAt: Date;
  availableNow: boolean;
}

export interface RepAggregate {
  rep: Rep;
  deals: Deal[];
  activeDeals: Deal[];
  availableDeals: Deal[];
  totalMrr: number;
  availableCommission: number;
  pendingCommission: number;
  paidCommission: number;
  thisMonthCommission: number;
  dealCount: number;
  /** Paying clients only (excludes trial). */
  payingClientCount: number;
  /** Deals closed this month. */
  closedThisMonthCount: number;
  /** Clients still on trial (firstPaymentDate in future). */
  onTrialCount: number;
  /** Deals cancelled (churned). */
  cancelledCount: number;
  tier: TierConfig;
  nextTier: TierConfig | null;
  residualMonthly: number;
  projectedResidual: number;
  nextPayoutDate: Date | null;
  /** Commission paid out to this rep last month. */
  lastMonthPayout: number;
}

export interface LeaderboardEntry {
  rep: Rep;
  rank: number;
  totalMrr: number;
  availableCommission: number;
  thisMonthCommission: number;
  tier: TierConfig;
  dealCount: number;
  gapToLeader: number;
}

export interface TeamAggregate {
  reps: RepAggregate[];
  totalAvailableCommission: number;
  totalPendingCommission: number;
  totalPaidCommission: number;
  lastMonthPayout: number;
  teamMrr: number;
  activeDealCount: number;
  repCount: number;
  /** Total paying clients (lifetime). */
  activeClientCount: number;
  /** Deals closed this month. */
  closedThisMonthCount: number;
  /** Clients on trial. */
  onTrialCount: number;
  topPerformer: RepAggregate | null;
  nextTeamPayoutDate: Date | null;
}

export interface DealFeedItem {
  deal: Deal;
  rep: Rep;
  summary: DealCommissionSummary;
}
