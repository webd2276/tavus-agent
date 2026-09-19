import { z } from "zod";

const optionalText = z.string().trim().max(20_000).nullable().optional();
const jsonObject = z.record(z.unknown()).default({});

export const agentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
  description: optionalText,
  type: z.enum(["voice", "video"]),
  provider: z.enum(["vapi", "tavus"]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  system_prompt: optionalText,
  greeting: optionalText,
  language: z.string().trim().min(2).max(20).default("en"),
  voice_configuration: jsonObject,
  video_configuration: jsonObject,
  knowledge_configuration: jsonObject,
  settings: jsonObject,
}).superRefine((value, context) => {
  if (value.type === "voice" && value.provider !== "vapi") context.addIssue({ code: z.ZodIssueCode.custom, message: "Voice agents require Vapi.", path: ["provider"] });
  if (value.type === "video" && value.provider !== "tavus") context.addIssue({ code: z.ZodIssueCode.custom, message: "Video agents require Tavus.", path: ["provider"] });
});

export type AgentInput = z.infer<typeof agentSchema>;
