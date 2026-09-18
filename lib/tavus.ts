// Thin server-side client for the Tavus Conversations API.
// Never import this from client components — TAVUS_API_KEY must stay on the server.

const TAVUS_BASE_URL = "https://tavusapi.com/v2";

interface CreateConversationParams {
  visitorId: string;
}

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export async function createTavusConversation(
  { visitorId }: CreateConversationParams
): Promise<TavusConversationResponse> {
  const apiKey = process.env.TAVUS_API_KEY;
  const palId = process.env.TAVUS_PAL_ID;
  const faceId = process.env.TAVUS_FACE_ID;
  const callbackUrl = process.env.TAVUS_CALLBACK_URL;

  if (!apiKey || !palId || !callbackUrl) {
    throw new Error("Missing Tavus environment variables");
  }

  const res = await fetch(`${TAVUS_BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      pal_id: palId,
      ...(faceId ? { face_id: faceId } : {}),
      callback_url: callbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavus API error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function endTavusConversation(conversationId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) throw new Error("Missing TAVUS_API_KEY");

  const res = await fetch(
    `${TAVUS_BASE_URL}/conversations/${conversationId}/end`,
    {
      method: "POST",
      headers: { "x-api-key": apiKey },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavus API error (${res.status}): ${text}`);
  }

  return res.json();
}
