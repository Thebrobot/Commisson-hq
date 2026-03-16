import type { Handoff, HandoffChecklist } from "@/types/commission";

/** Default empty handoff for new deals. */
export const defaultHandoff: Handoff = {
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

/** Returns true if all checklist items are complete. */
export function isHandoffComplete(handoff: Handoff | null | undefined): boolean {
  if (!handoff?.checklist) return false;
  const c = handoff.checklist;
  return (
    c.contractSigned &&
    c.paymentProcessed &&
    c.activeClientCreated &&
    c.productRecorded &&
    c.loaSigned &&
    c.portFormSubmitted &&
    c.dealMovedToPaymentAccepted &&
    c.saleCalledOutDiscord &&
    c.saleLoggedOnboardingDiscord
  );
}

/** Count of completed items (0–9). */
export function handoffProgress(handoff: Handoff | null | undefined): number {
  if (!handoff?.checklist) return 0;
  const c = handoff.checklist;
  return [
    c.contractSigned,
    c.paymentProcessed,
    c.activeClientCreated,
    c.productRecorded,
    c.loaSigned,
    c.portFormSubmitted,
    c.dealMovedToPaymentAccepted,
    c.saleCalledOutDiscord,
    c.saleLoggedOnboardingDiscord,
  ].filter(Boolean).length;
}

/** Fixed checklist item labels. */
export const HANDOFF_ITEMS: { key: keyof HandoffChecklist; label: string }[] = [
  { key: "contractSigned", label: "Contract / Terms of Service signed" },
  { key: "paymentProcessed", label: "Payment successfully processed" },
  { key: "activeClientCreated", label: "Active Client record created" },
  { key: "productRecorded", label: "Product / plan recorded" },
  { key: "loaSigned", label: "LOA signed" },
  { key: "portFormSubmitted", label: "Port form submitted" },
  { key: "dealMovedToPaymentAccepted", label: "Deal moved to Payment Accepted stage in onboarding pipeline" },
  { key: "saleCalledOutDiscord", label: "Sale called out in Discord" },
  { key: "saleLoggedOnboardingDiscord", label: "Sale logged in onboarding channel in Discord" },
];
