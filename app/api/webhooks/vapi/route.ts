import { NextRequest, NextResponse } from "next/server";
import { markEventForwarded, recordProviderEvent } from "@/lib/events";
import { parseJsonBody } from "@/lib/http";

// Vapi may retry an end-of-call report. Keep a small in-memory set so a
// retried delivery does not start the same n8n automation twice. Replace this
// with a durable/atomic store (for example Redis SETNX) in production.
const seenCallIds = new Set<string>();
const MAX_SEEN_CALL_IDS = 10_000;

export async function POST(req: NextRequest) {
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
  if (req.headers.get("x-vapi-secret") !== sharedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<Record<string, any>>(req);
  if (!body) {
    console.error("Invalid Vapi webhook payload");
    return NextResponse.json({ status: "received" });
  }

  const callId = body.message?.call?.id;
  const eventType = typeof body.message?.type === "string" ? body.message.type : "unknown";
  const eventId = typeof body.message?.id === "string" ? body.message.id : typeof callId === "string" ? `${eventType}:${callId}` : null;
  const durable = eventId ? await recordProviderEvent({ source: "vapi", eventType, eventId, conversationId: callId, payload: body }) : null;
  if (durable?.duplicate) return NextResponse.json({ status: "received" });
  if (typeof callId === "string" && callId) {
    if (seenCallIds.has(callId)) {
      return NextResponse.json({ status: "received" });
    }
    seenCallIds.add(callId);
    if (seenCallIds.size > MAX_SEEN_CALL_IDS) {
      const oldestCallId = seenCallIds.values().next().value;
      if (oldestCallId) seenCallIds.delete(oldestCallId);
    }
  }

  console.log("Vapi webhook event:", eventType, callId);

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    console.error("N8N_WEBHOOK_URL is not configured");
    return NextResponse.json({ status: "received" });
  }

  const n8nPayload = { source: "vapi", ...body };
  // Do not await n8n: Vapi receives its acknowledgement immediately. Failures
  // are logged but intentionally do not trigger webhook retries.
  void fetch(n8nUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": sharedSecret ?? "",
    },
    body: JSON.stringify(n8nPayload),
  })
    .then(async (res) => {
      if (!res.ok) {
        console.error("n8n forwarding failed", res.status);
        if (eventId) await markEventForwarded("vapi", eventId, `n8n returned ${res.status}`);
      } else if (eventId) await markEventForwarded("vapi", eventId);
    })
    .catch(async (err) => {
      console.error("Error forwarding Vapi webhook", err instanceof Error ? err.message : "unknown error");
      if (eventId) await markEventForwarded("vapi", eventId, "n8n delivery failed");
    });

  return NextResponse.json({ status: "received" });
}
