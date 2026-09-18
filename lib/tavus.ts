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

export class TavusApiError extends Error {
  constructor(public readonly status: number) {
    super(`Tavus API request failed with status ${status}`);
    this.name = "TavusApiError";
  }
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
    // Do not include the provider response in errors: it may contain
    // account details that should only be visible in Tavus itself.
    throw new TavusApiError(res.status);
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
    throw new TavusApiError(res.status);
  }

  return res.json();
}
