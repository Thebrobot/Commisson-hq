import type {
  PayoutConfig,
  ProductCatalogItem,
  SetupFeeCatalogItem,
  TierConfig,
} from "@/types/commission";

export const productCatalog: ProductCatalogItem[] = [
  {
    id: "brobot-one-core",
    name: "Brobot One Core",
    defaultMrr: 335,
    commissionableMrr: 335,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "brobot-one-basic",
    name: "Brobot One Basic",
    defaultMrr: 152,
    commissionableMrr: 152,
    allowOverride: true,
    perUnit: false,
  },
  {
    id: "ai-receptionist",
    name: "Agent Broski (Ai Receptionist)",
    defaultMrr: 852,
    commissionableMrr: 852,
    allowOverride: true,
    perUnit: false,
  },
  {
    id: "agent-broski-voice-sms",
    name: "Agent Broski (Ai Voice + SMS)",
    defaultMrr: 1042,
    commissionableMrr: 1042,
    allowOverride: true,
    perUnit: false,
  },
  {
    id: "revubro-starter",
    name: "RevuBro Starter",
    defaultMrr: 97,
    commissionableMrr: 97,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "revubro-growth",
    name: "RevuBro Growth",
    defaultMrr: 197,
    commissionableMrr: 197,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "revubro-pro",
    name: "RevuBro Pro",
    defaultMrr: 297,
    commissionableMrr: 297,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "imapspro",
    name: "iMapsPro",
    defaultMrr: 25,
    commissionableMrr: 25,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "marketing-package",
    name: "Marketing Package",
    defaultMrr: 0,
    commissionableMrr: 0,
    allowOverride: true,
    perUnit: false,
    upfrontRate: 0.1,
  },
  {
    id: "custom-package",
    name: "Custom Package",
    defaultMrr: 0,
    commissionableMrr: 0,
    allowOverride: true,
    perUnit: false,
    upfrontRate: 0.1,
  },
];

export const setupFeeCatalog: SetupFeeCatalogItem[] = [
  {
    id: "agent_broski_receptionist_setup",
    name: "Agent Broski (Ai Receptionist) — Setup",
    price: 1560,
    commissionRate: 0.1,
  },
  {
    id: "agent_broski_voice_sms_setup",
    name: "Agent Broski (Ai Voice + SMS) — Setup",
    price: 2600,
    commissionRate: 0.1,
  },
  {
    id: "website_build",
    name: "Website Build",
    price: 0,
    commissionRate: 0.1,
    isVariable: true,
  },
  {
    id: "imapspro_setup",
    name: "iMapsPro Setup",
    price: 199,
    commissionRate: 0.1,
  },
];

export const tierConfig: TierConfig[] = [
  { mrr: 0, rate: 0, label: "Launch" },
  { mrr: 10000, rate: 0.1, label: "Foundation" },
];

export const payoutConfig: PayoutConfig = {
  lagDays: 5,
  payoutDates: [1, 15],
  monthlyGoal: 5000,
};

export const nonCommissionableItems = [
  {
    name: "Usage charges",
    reason: "Carrier and usage pass-throughs do not pay commission.",
  },
  {
    name: "Phone hardware",
    reason: "Hardware is treated as equipment cost, not book-building revenue.",
  },
  {
    name: "Carrier utilization",
    reason: "Protected for margin and excluded from the comp plan.",
  },
  {
    name: "Engineering deposits",
    reason: "Operational cost coverage, not seller-earned commission.",
  },
  {
    name: "Special promo services",
    reason: "Only commissionable when leadership approves a campaign exception.",
  },
];
