import { z } from "zod";

const nullableText = z.string().trim().max(20_000).nullable().optional();
const nullablePositiveInt = z.number().int().positive().nullable().optional();

export const palSchema = z.object({
  name: z.string().trim().min(1).max(200),
  short_description: nullableText,
  identity_role: nullableText,
  greeting: nullableText,
  guardrails: z.array(z.string().trim().min(1).max(5_000)).max(50).default([]),
  objectives: nullableText,
  face_id: z.string().trim().min(1, "A Tavus default Face ID is required.").max(20_000),
  voice_id: nullableText,
  conferencing_username: nullableText,
  allowed_websites: z.array(z.string().trim().url().max(2_000)).max(100).default([]),
  calls_per_day: nullablePositiveInt,
  calls_per_visitor: nullablePositiveInt,
  longest_call_minutes: nullablePositiveInt,
});

export type PalInput = z.infer<typeof palSchema>;

export const palColumns = "id, owner_id, tavus_pal_id, name, short_description, identity_role, greeting, guardrails, objectives, face_id, voice_id, conferencing_username, allowed_websites, calls_per_day, calls_per_visitor, longest_call_minutes, created_at, updated_at";
