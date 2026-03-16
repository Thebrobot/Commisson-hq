import type { LucideIcon } from "lucide-react";
import { ClipboardCheck } from "lucide-react";

export interface HandoffTool {
  title: string;
  description: string;
  icon: LucideIcon;
  cta: string;
}

export const handoffTools: HandoffTool[] = [
  {
    title: "Onboard Checklist",
    description: "Keep fulfillment aligned on kickoff, assets, and launch tasks.",
    icon: ClipboardCheck,
    cta: "View checklist",
  },
];
