import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Tavus posts conversation lifecycle events here (e.g. conversation.ended,
// transcription.ready). We do minimal validation, log the event for our
// own audit trail, then hand the payload to n8n — which owns lead
// extraction, qualification, CRM sync, and sales notifications.

// Simple in-memory idempotency guard so a retried webhook doesn't fire
// the automation twice. Swap for a DB/Redis SETNX in production.
const seenEventIds = new Set<string>();
const MAX_SEEN_EVENT_IDS = 10_000;

const tavusEventSchema = z
  .object({
    event_type: z.string().min(1).max(200),
    event_id: z.string().min(1).max(200).optional(),
    message_id: z.string().min(1).max(200).optional(),
    conversation_id: z.string().min(1).max(200).optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);

  const parsed = tavusEventSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("Invalid Tavus webhook payload", parsed.error.flatten());
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventId = parsed.data.event_id ?? parsed.data.message_id;
  if (eventId) {
    if (seenEventIds.has(eventId)) {
      return NextResponse.json({ status: "duplicate_ignored" });
    }
    seenEventIds.add(eventId);
    if (seenEventIds.size > MAX_SEEN_EVENT_IDS) {
      const oldestEventId = seenEventIds.values().next().value;
      if (oldestEventId) seenEventIds.delete(oldestEventId);
    }
  }

  console.log("Tavus webhook event:", parsed.data.event_type, eventId);

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;

  if (!n8nUrl) {
    console.error("N8N_WEBHOOK_URL is not configured");
    return NextResponse.json({ status: "received_not_forwarded" });
  }

  try {
    const res = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": sharedSecret ?? "",
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      console.error("n8n forwarding failed", res.status, await res.text());
      // Still 200 to Tavus so it doesn't endlessly retry; the failure is
      // logged here for alerting. Consider a dead-letter queue instead.
    }
  } catch (err) {
    console.error("Error forwarding webhook to n8n", err);
  }

  return NextResponse.json({ status: "received" });
}
