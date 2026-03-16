import type { NormalizedWebhookDealDraft, GhlWebhookPayload } from "@/types/webhook";

export function normalizeWebhookPayload(payload: GhlWebhookPayload): NormalizedWebhookDealDraft {
  return {
    clientName: payload.company_name.trim(),
    ghlContactId: payload.contact_id.trim(),
    contactEmail: payload.contact_email?.trim() || null,
    contactPhone: payload.contact_phone?.trim() || null,
    assignedRepEmail: payload.assigned_rep_email.trim().toLowerCase(),
  };
}
