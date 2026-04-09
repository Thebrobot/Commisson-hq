import type { Rep } from "@/types/commission";

export function isPortalManager(rep: Rep | null | undefined): boolean {
  return rep?.role === "manager";
}

export function isSalesPartner(rep: Rep | null | undefined): boolean {
  return rep?.role === "partner";
}

/** Sales partners track MRR/clients here; commission is handled outside the app. */
export function hideCommissionUI(rep: Rep | null | undefined): boolean {
  return isSalesPartner(rep);
}
