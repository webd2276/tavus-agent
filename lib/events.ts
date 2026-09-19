import { createAdminClient } from "@/lib/supabase/admin";

export type ProviderEvent = {
  source: "vapi" | "tavus";
  eventType: string;
  eventId: string;
  conversationId?: string;
  payload: Record<string, unknown>;
};

/**
 * Records an incoming provider event before forwarding it. The unique source +
 * event ID constraint provides idempotency across server instances.
 */
export async function recordProviderEvent(event: ProviderEvent) {
  const admin = createAdminClient();
  if (!admin) return { durable: false, duplicate: false };

  let organizationId: string | null = null;
  if (event.conversationId) {
    const { data: meeting } = await admin
      .from("meetings")
      .select("organization_id")
      .eq("tavus_conversation_id", event.conversationId)
      .maybeSingle();
    organizationId = meeting?.organization_id ?? null;
  }

  const { error } = await admin.from("automation_runs").insert({
    organization_id: organizationId,
    source: event.source,
    event_type: event.eventType,
    external_event_id: event.eventId,
    payload: event.payload,
  });
  if (!error) return { durable: true, duplicate: false };
  if (error.code === "23505") return { durable: true, duplicate: true };
  console.error("Could not persist provider event", error.code);
  return { durable: false, duplicate: false };
}

export async function markEventForwarded(source: ProviderEvent["source"], eventId: string, failure?: string) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("automation_runs").update({
    status: failure ? "failed" : "forwarded",
    attempt_count: 1,
    last_error: failure?.slice(0, 500) ?? null,
    updated_at: new Date().toISOString(),
  }).eq("source", source).eq("external_event_id", eventId);
}
