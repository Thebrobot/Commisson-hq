/**
 * Stripe Payment Links — package × line count. URLs must match Stripe exactly (case-sensitive paths).
 */

export type StripeMatrixPackageId =
  | "brobot-one-basic"
  | "brobot-one-core"
  | "ai-receptionist"
  | "agent-broski-voice-sms";

export interface StripeMatrixLineOption {
  lines: number;
  /** Customer monthly total on Stripe for this tier */
  monthlyTotal: number;
  url: string;
}

export interface StripeMatrixPackage {
  id: StripeMatrixPackageId;
  /** Maps to productCatalog.id */
  catalogProductId: string;
  label: string;
  lineOptions: StripeMatrixLineOption[];
}

export const stripeCheckoutPackages: StripeMatrixPackage[] = [
  {
    id: "brobot-one-basic",
    catalogProductId: "brobot-one-basic",
    label: "Brobot One Basic",
    lineOptions: [
      { lines: 1, monthlyTotal: 152, url: "https://buy.stripe.com/4gM6oI8Z6g9587V5jx6sw2h" },
      { lines: 2, monthlyTotal: 168, url: "https://buy.stripe.com/8x25kE6QY0a71Jx5jx6sw2i" },
      { lines: 3, monthlyTotal: 183, url: "https://buy.stripe.com/7sY9AU2AI9KHgEr4ft6sw2j" },
      { lines: 4, monthlyTotal: 199, url: "https://buy.stripe.com/aFa9AUcbie0X2NB5jx6sw2k" },
      { lines: 5, monthlyTotal: 214, url: "https://buy.stripe.com/fZu3cw6QY2if4VJh2f6sw2l" },
      { lines: 6, monthlyTotal: 230, url: "https://buy.stripe.com/28E3cwdfm5ur9bZdQ36sw2m" },
      { lines: 7, monthlyTotal: 246, url: "https://buy.stripe.com/7sY28s4IQ9KHgEr7rF6sw2s" },
    ],
  },
  {
    id: "brobot-one-core",
    catalogProductId: "brobot-one-core",
    label: "Brobot One Core",
    lineOptions: [
      { lines: 1, monthlyTotal: 335, url: "https://buy.stripe.com/fZu4gAcbi5ur87VaDR6sw2n" },
      { lines: 2, monthlyTotal: 361, url: "https://buy.stripe.com/fZu8wQ8Z67CzfAn13h6sw2t" },
      { lines: 3, monthlyTotal: 387, url: "https://buy.stripe.com/eVq8wQ3EMg951JxaDR6sw2o" },
      { lines: 4, monthlyTotal: 413, url: "https://buy.stripe.com/9B614o1wEe0X5ZN6nB6sw2p" },
      { lines: 5, monthlyTotal: 439, url: "https://buy.stripe.com/4gM6oIa3a2ifdsf3bp6sw2q" },
      { lines: 6, monthlyTotal: 465, url: "https://buy.stripe.com/5kQaEYb7e5ur4VJ9zN6sw2r" },
    ],
  },
  {
    id: "ai-receptionist",
    catalogProductId: "ai-receptionist",
    label: "Agent Broski (Ai Receptionist)",
    lineOptions: [
      { lines: 1, monthlyTotal: 852, url: "https://buy.stripe.com/8x23cw1wEe0X3RF7rF6sw2b" },
      { lines: 2, monthlyTotal: 878, url: "https://buy.stripe.com/5kQfZi5MUg953RF3bp6sw2c" },
      { lines: 3, monthlyTotal: 904, url: "https://buy.stripe.com/28EcN68Z64qn5ZNfYb6sw2d" },
      { lines: 4, monthlyTotal: 930, url: "https://buy.stripe.com/bJefZi2AI8GD3RF13h6sw2e" },
      { lines: 5, monthlyTotal: 956, url: "https://buy.stripe.com/fZufZifnubSPag3eU76sw2f" },
      { lines: 6, monthlyTotal: 982, url: "https://buy.stripe.com/7sY9AUa3a9KH0FtaDR6sw2g" },
    ],
  },
  {
    id: "agent-broski-voice-sms",
    catalogProductId: "agent-broski-voice-sms",
    label: "Agent Broski (Ai Voice + SMS)",
    lineOptions: [
      { lines: 1, monthlyTotal: 1042, url: "https://buy.stripe.com/dRmbJ25MU4qn0Fth2f6sw25" },
      { lines: 2, monthlyTotal: 1068, url: "https://buy.stripe.com/7sYcN65MU0a71Jx27l6sw26" },
      { lines: 3, monthlyTotal: 1094, url: "https://buy.stripe.com/aFa00k8Z62iffAn27l6sw27" },
      { lines: 4, monthlyTotal: 1120, url: "https://buy.stripe.com/bJefZi1wE0a7cobh2f6sw28" },
      { lines: 5, monthlyTotal: 1146, url: "https://buy.stripe.com/28EdRadfmcWTgEr3bp6sw29" },
      { lines: 6, monthlyTotal: 1172, url: "https://buy.stripe.com/00w00k1wEe0XewjdQ36sw2a" },
    ],
  },
];

export function getStripePackageById(id: StripeMatrixPackageId): StripeMatrixPackage | undefined {
  return stripeCheckoutPackages.find((p) => p.id === id);
}

export function getStripeRow(
  packageId: StripeMatrixPackageId,
  lines: number,
): StripeMatrixLineOption | undefined {
  const pkg = getStripePackageById(packageId);
  return pkg?.lineOptions.find((o) => o.lines === lines);
}

/** catalog product ids that use the matrix checkout */
export const STRIPE_MATRIX_CATALOG_IDS = new Set(
  stripeCheckoutPackages.map((p) => p.catalogProductId),
);

export function catalogIdIsStripeMatrix(catalogProductId: string): boolean {
  return STRIPE_MATRIX_CATALOG_IDS.has(catalogProductId);
}
