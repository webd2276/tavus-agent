import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTavusConversation } from "@/lib/tavus";
import { parseJsonBody, providerFailure } from "@/lib/http";

const bodySchema = z.object({
  visitor_id: z.string().min(1).max(200),
});

// Very small in-memory rate limiter (per visitor). Replace with a real
// store (Redis / Upstash) in production — this resets on every deploy
// and does not work across multiple server instances.
const lastRequestAt = new Map<string, number>();
const MIN_INTERVAL_MS = 15_000;

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await parseJsonBody(req));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { visitor_id } = parsed;

  const last = lastRequestAt.get(visitor_id);
  if (last && Date.now() - last < MIN_INTERVAL_MS) {
    return NextResponse.json(
      { error: "Too many requests, please wait a moment." },
      { status: 429 }
    );
  }
  try {
    const conversation = await createTavusConversation({ visitorId: visitor_id });
    lastRequestAt.set(visitor_id, Date.now());

    return NextResponse.json({
      conversation_id: conversation.conversation_id,
      tavus_conversation_id: conversation.conversation_id,
      conversation_url: conversation.conversation_url,
      status: conversation.status,
    });
    // Note: TAVUS_API_KEY never leaves this function — it is not in the response.
  } catch (err) { return providerFailure("Failed to create Tavus conversation: " + (err instanceof Error ? err.message : "unknown error")); }
}
