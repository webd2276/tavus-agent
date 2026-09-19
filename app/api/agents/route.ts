import { NextRequest, NextResponse } from "next/server";
import { agentSchema } from "@/lib/agents";
import { canManageAgents, getCurrentOrganization } from "@/lib/organizations";
import { parseJsonBody } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const agentColumns = "id, name, slug, description, type, provider, status, greeting, language, created_at, updated_at";

export async function GET() {
  const organization = await getCurrentOrganization();
  if (!organization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").select(agentColumns).eq("organization_id", organization.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load agents" }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(request: NextRequest) {
  const organization = await getCurrentOrganization();
  if (!organization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAgents(organization.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const input = agentSchema.safeParse(await parseJsonBody(request));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("agents").insert({ ...input.data, organization_id: organization.id, created_by: user.id }).select(agentColumns).single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "An agent with that URL slug already exists." : "Unable to save agent" }, { status: 500 });
  await supabase.from("agent_versions").insert({ agent_id: data.id, organization_id: organization.id, version: 1, state: input.data.status === "published" ? "published" : "draft", configuration: input.data, created_by: user.id });
  return NextResponse.json({ agent: data }, { status: 201 });
}
