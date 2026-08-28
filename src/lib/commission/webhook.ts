import type { NormalizedWebhookDealDraft, GhlWebhookPayload } from "@/types/webhook";
import { parseHandoffIntake } from "@/lib/commission/handoffIntake";

export function normalizeWebhookPayload(payload: GhlWebhookPayload): NormalizedWebhookDealDraft {
  const parsed = parseHandoffIntake(payload as unknown as Record<string, unknown>);
  return {
    clientName: parsed.clientName,
    ghlContactId: parsed.ghlContactId,
    contactEmail: parsed.contactEmail,
    contactPhone: parsed.contactPhone,
    assignedRepEmail: parsed.assignedRepEmail,
  };
}
