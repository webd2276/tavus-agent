import { NextRequest, NextResponse } from "next/server";
import { agentSchema } from "@/lib/agents";
import { canManageAgents, getCurrentOrganization } from "@/lib/organizations";
import { parseJsonBody } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const agentColumns = "id, name, slug, description, type, provider, status, system_prompt, greeting, language, voice_configuration, video_configuration, knowledge_configuration, settings, created_at, updated_at";

async function currentAgent(id: string) {
  const organization = await getCurrentOrganization();
  if (!organization) return { organization: null, agent: null, supabase: null };
  const supabase = await createClient();
  const { data: agent } = await supabase.from("agents").select(agentColumns).eq("id", id).eq("organization_id", organization.id).maybeSingle();
  return { organization, agent, supabase };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { organization, agent } = await currentAgent(params.id);
  if (!organization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { organization, agent, supabase } = await currentAgent(params.id);
  if (!organization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageAgents(organization.role) || !supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const input = agentSchema.safeParse(await parseJsonBody(request));
  if (!input.success) return NextResponse.json({ error: input.error.flatten() }, { status: 400 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("agents").update({ ...input.data, updated_at: new Date().toISOString() }).eq("id", params.id).eq("organization_id", organization.id).select(agentColumns).single();
  if (error) return NextResponse.json({ error: "Unable to update agent" }, { status: 500 });
  const { data: latest } = await supabase.from("agent_versions").select("version").eq("agent_id", params.id).order("version", { ascending: false }).limit(1).maybeSingle();
  await supabase.from("agent_versions").insert({ agent_id: params.id, organization_id: organization.id, version: (latest?.version ?? 0) + 1, state: input.data.status === "published" ? "published" : "draft", configuration: input.data, created_by: user.id });
  return NextResponse.json({ agent: data });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { organization, agent, supabase } = await currentAgent(params.id);
  if (!organization) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageAgents(organization.role) || !supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabase.from("agents").delete().eq("id", params.id).eq("organization_id", organization.id);
  if (error) return NextResponse.json({ error: "Unable to delete agent" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
