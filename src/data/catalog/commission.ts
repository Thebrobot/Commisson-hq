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
    defaultMrr: 297,
    commissionableMrr: 297,
    allowOverride: false,
    perUnit: false,
    fixedUpfrontCommissionUsd: 297,
  },
  {
    id: "brobot-one-basic",
    name: "Brobot One Basic",
    defaultMrr: 129.99,
    commissionableMrr: 129.99,
    allowOverride: true,
    perUnit: false,
    fixedUpfrontCommissionUsd: 130,
  },
  {
    id: "ai-receptionist",
    name: "Agent Broski (Ai Receptionist)",
    defaultMrr: 852,
    commissionableMrr: 852,
    allowOverride: true,
    perUnit: false,
    fixedUpfrontCommissionUsd: 794,
  },
  {
    id: "agent-broski-voice-sms",
    name: "Agent Broski (Ai Voice + SMS)",
    defaultMrr: 1042,
    commissionableMrr: 1042,
    allowOverride: true,
    perUnit: false,
    fixedUpfrontCommissionUsd: 994,
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
    commissionableMrr: 167,
    allowOverride: false,
    perUnit: false,
  },
  {
    id: "revubro-pro",
    name: "RevuBro Pro",
    defaultMrr: 297,
    commissionableMrr: 267,
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
    id: "bot-only-ai",
    name: "Bot-Only AI",
    defaultMrr: 499,
    commissionableMrr: 499,
    allowOverride: false,
    perUnit: true,
  },
];

export const setupFeeCatalog: SetupFeeCatalogItem[] = [
  {
    id: "agent_broski_receptionist_setup",
    name: "Agent Broski (Ai Receptionist) — Setup",
    price: 1500,
    commissionRate: 0.1,
  },
  {
    id: "agent_broski_voice_sms_setup",
    name: "Agent Broski (Ai Voice + SMS) — Setup",
    price: 2500,
    commissionRate: 0.1,
  },
  {
    id: "website_build",
    name: "Website Build",
    price: 0,
    commissionRate: 0.2,
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
  { mrr: 20000, rate: 0.15, label: "Scale" },
  { mrr: 35000, rate: 0.2, label: "Peak" },
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
