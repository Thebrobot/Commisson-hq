/**
 * Payload shape from GoHighLevel webhook. Use these merge tags when configuring the webhook:
 *
 * {
 *   "contact_id": "{{contact.id}}",
 *   "company_name": "{{contact.company_name}}",
 *   "contact_email": "{{contact.email}}",
 *   "contact_phone": "{{contact.phone}}",
 *   "assigned_rep_email": "{{contact.rep_email}}"
 * }
 *
 * You may send `rep_email` instead of `assigned_rep_email` if your automation uses that key.
 */
export interface GhlWebhookPayload {
  contact_id: string;
  company_name: string;
  contact_email?: string;
  contact_phone?: string;
  assigned_rep_email?: string;
  rep_email?: string;
}

export interface NormalizedWebhookDealDraft {
  clientName: string;
  ghlContactId: string;
  contactEmail: string | null;
  contactPhone: string | null;
  assignedRepEmail: string;
}
