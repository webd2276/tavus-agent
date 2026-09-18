// Thin server-side client for the Tavus Conversations API.
// Never import this from client components — TAVUS_API_KEY must stay on the server.

const TAVUS_BASE_URL = "https://tavusapi.com/v2";

interface CreateConversationParams {
  visitorId: string;
  palId?: string;
  faceId?: string | null;
}

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export async function createTavusConversation(
  { visitorId, palId: requestedPalId, faceId: requestedFaceId }: CreateConversationParams
): Promise<TavusConversationResponse> {
  const apiKey = process.env.TAVUS_API_KEY;
  const palId = requestedPalId ?? process.env.TAVUS_PAL_ID;
  const faceId = requestedFaceId ?? process.env.TAVUS_FACE_ID;
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
      conversation_name: `visitor-${visitorId}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavus API error (${res.status}): ${text}`);
  }

  return res.json();
}

export type TavusPalInput = {
  name: string;
  short_description?: string | null;
  identity_role?: string | null;
  greeting?: string | null;
  guardrails?: string[];
  objectives?: string | null;
  face_id?: string | null;
  voice_id?: string | null;
  conferencing_username?: string | null;
  allowed_websites?: string[];
  calls_per_day?: number | null;
  calls_per_visitor?: number | null;
  longest_call_minutes?: number | null;
};

export type TavusPal = TavusPalInput & { pal_id: string };

async function tavusPalRequest(path: string, init?: RequestInit) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) throw new Error("Missing TAVUS_API_KEY");
  const res = await fetch(`${TAVUS_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, ...init?.headers },
  });
  if (!res.ok) throw new Error(`Tavus API error (${res.status}): ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export async function createTavusPal(input: TavusPalInput): Promise<TavusPal> {
  return tavusPalRequest("/pals", { method: "POST", body: JSON.stringify(input) });
}

export async function getTavusPal(palId: string): Promise<TavusPal> {
  return tavusPalRequest(`/pals/${encodeURIComponent(palId)}`);
}

export async function updateTavusPal(palId: string, input: TavusPalInput): Promise<TavusPal> {
  return tavusPalRequest(`/pals/${encodeURIComponent(palId)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteTavusPal(palId: string): Promise<void> {
  await tavusPalRequest(`/pals/${encodeURIComponent(palId)}`, { method: "DELETE" });
}

export async function checkConferencingUsername(username: string): Promise<unknown> {
  return tavusPalRequest(`/pals/check-conferencing-username/${encodeURIComponent(username)}`);
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
