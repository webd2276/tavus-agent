import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTavusPal, updateTavusPal } from "@/lib/tavus";
import { palColumns, palSchema } from "@/lib/pals";
import { canManageAgents, getCurrentOrganization } from "@/lib/organizations";
import { parseJsonBody, providerFailure } from "@/lib/http";

async function ownedPal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, pal: null, organization: null };
  const organization = await getCurrentOrganization();
  if (!organization) return { supabase, user, pal: null, organization: null };
  const { data: pal } = await supabase.from("pals").select(palColumns).eq("id", id).eq("organization_id", organization.id).maybeSingle();
  return { supabase, user, pal, organization };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { user, pal } = await ownedPal(params.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ pal });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, pal, organization } = await ownedPal(params.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!organization || !canManageAgents(organization.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = palSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    await updateTavusPal(pal.tavus_pal_id, parsed.data);
    const { data, error } = await supabase.from("pals").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", user.id).select(palColumns).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pal: data });
  } catch (error) {
    return providerFailure("Unable to update Tavus PAL: " + (error instanceof Error ? error.message : "unknown error"));
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, pal, organization } = await ownedPal(params.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!organization || !canManageAgents(organization.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await deleteTavusPal(pal.tavus_pal_id);
    const { error } = await supabase.from("pals").delete().eq("id", params.id).eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return providerFailure("Unable to delete Tavus PAL: " + (error instanceof Error ? error.message : "unknown error"));
  }
}
