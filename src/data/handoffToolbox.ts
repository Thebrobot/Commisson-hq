import type { LucideIcon } from "lucide-react";
import { FileText, Link2, MessageSquare, Package } from "lucide-react";

export interface HandoffToolItem {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
}

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

export interface ProductLinkItem {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
}

export interface ProductLinkColumn {
  title: string;
  products: ProductLinkItem[];
}

/** Product links grouped by product family (columns). */
export const handoffProductColumns: ProductLinkColumn[] = [
  {
    title: "Brobot One",
    products: [
      { id: "brobot-one-basic", name: "Brobot One Basic", url: "https://buy.stripe.com/4gM7sM5MU9KH2NBfYb6sw1P", icon: Package },
      { id: "brobot-one-core", name: "Brobot One Core", url: "https://buy.stripe.com/6oU3cwa3a8GD2NB3bp6sw1O", icon: Package },
    ],
  },
  {
    title: "RevuBro",
    products: [
      { id: "revubro-starter", name: "RevuBro Starter", url: "https://buy.stripe.com/aFafZi3EMe0X1Jx8vJ6sw1L", icon: Package },
      { id: "revubro-growth", name: "RevuBro Growth", url: "https://buy.stripe.com/9B68wQ1wE7CzgEr8vJ6sw1M", icon: Package },
      { id: "revubro-pro", name: "RevuBro Pro", url: "https://buy.stripe.com/28EcN6a3a4qncob4ft6sw1N", icon: Package },
    ],
  },
  {
    title: "iMapsPro",
    products: [
      { id: "imapspro", name: "iMapsPro", url: "https://example.com/products/imapspro", icon: Package },
    ],
  },
];
