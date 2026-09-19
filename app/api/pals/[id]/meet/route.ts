import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTavusConversation } from "@/lib/tavus";
import { canManageAgents, getCurrentOrganization } from "@/lib/organizations";
import { providerFailure } from "@/lib/http";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organization = await getCurrentOrganization();
  if (!organization || !canManageAgents(organization.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: pal, error: palError } = await supabase
    .from("pals")
    .select("id, tavus_pal_id, face_id")
    .eq("id", params.id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (palError) return NextResponse.json({ error: palError.message }, { status: 500 });
  if (!pal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const conversation = await createTavusConversation({
      visitorId: `instant-meeting:${user.id}`,
      palId: pal.tavus_pal_id,
      faceId: pal.face_id,
    });
    const { error } = await supabase.from("meetings").insert({
      owner_id: user.id,
      organization_id: organization.id,
      pal_id: pal.id,
      kind: "instant",
      tavus_conversation_id: conversation.conversation_id,
      join_url: conversation.conversation_url,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ join_url: conversation.conversation_url, conversation_id: conversation.conversation_id });
  } catch (error) { return providerFailure("Unable to create Tavus meeting: " + (error instanceof Error ? error.message : "unknown error")); }
}
