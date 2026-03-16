export type NotificationType =
  | "new_customer"      // Signed up — paid today or trial
  | "commission_ready"  // Lag cleared, ready to pay
  | "commission_paid"   // Payout sent
  | "client_cancelled"  // Client cancelled
  | "handoff_needed";   // Handoff checklist incomplete

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO date string
  read: boolean;
  /** Rep this notification belongs to (for view-scoped filtering) */
  repId: string;
  /** Client name for display (e.g. "Acme Dental") */
  clientName?: string;
  /** Deal ID for deep link to specific client in Active Clients */
  dealId?: string;
  /** Link target for click-through (e.g. "/clients", "/commissions") */
  href?: string;
}
