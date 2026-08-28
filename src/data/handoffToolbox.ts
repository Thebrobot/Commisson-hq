import type { LucideIcon } from "lucide-react";
import { FileText, Link2, MessageSquare } from "lucide-react";

export interface HandoffToolItem {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
}

/** Live New Client Deal Submission form (order handoff portal). */
export const DEAL_SUBMISSION_URL = "https://brobot-order-handoff.vercel.app";

/** Handoff tools for porting and order fulfillment. */
export const handoffToolItems: HandoffToolItem[] = [
  {
    title: "Porting Submission Form",
    description: "Submit the port request to the carrier.",
    icon: Link2,
    url: "https://link.gohighlevel.com/widget/form/qX47XEC8HsDtrGkmbjFQ",
  },
  {
    title: "Letter of Authorization",
    description: "Fill out the LOA to authorize the port from the carrier.",
    icon: FileText,
    url: "https://sendlink.co/documents/doc-form/69b2ed00e62ff76acf1d3d77?locale=en-US",
  },
  {
    title: "Brobot Sales Copilot",
    description: "ChatGPT GPT configured for sales support.",
    icon: MessageSquare,
    url: "https://chatgpt.com/g/g-68a882b8a6d48191a4b352d55dc3d493-brobot-sales-copilot",
  },
];
