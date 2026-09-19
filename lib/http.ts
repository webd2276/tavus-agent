import { NextRequest, NextResponse } from "next/server";

const MAX_JSON_BYTES = 64_000;

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) return null;
  try {
    const body = await request.text();
    if (body.length > MAX_JSON_BYTES) return null;
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function providerFailure(message: string, status = 502) {
  console.error(message);
  return NextResponse.json({ error: "The provider could not complete this request. Please try again." }, { status });
}
