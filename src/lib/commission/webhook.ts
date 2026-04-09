import type { NormalizedWebhookDealDraft, GhlWebhookPayload } from "@/types/webhook";

export function normalizeWebhookPayload(payload: GhlWebhookPayload): NormalizedWebhookDealDraft {
  const repEmailRaw = payload.assigned_rep_email ?? payload.rep_email;
  if (!repEmailRaw?.trim()) {
    throw new Error("assigned_rep_email or rep_email is required");
  }
  return {
    clientName: payload.company_name.trim(),
    ghlContactId: payload.contact_id.trim(),
    contactEmail: payload.contact_email?.trim() || null,
    contactPhone: payload.contact_phone?.trim() || null,
    assignedRepEmail: repEmailRaw.trim().toLowerCase(),
  };
}
