import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTavusPal } from "@/lib/tavus";
import { palColumns, palSchema } from "@/lib/pals";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("pals").select(palColumns).eq("owner_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pals: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = palSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const tavusPal = await createTavusPal(parsed.data);
    const { data, error } = await supabase.from("pals").insert({ ...parsed.data, owner_id: user.id, tavus_pal_id: tavusPal.pal_id }).select(palColumns).single();
    if (error) return NextResponse.json({ error: `Tavus PAL was created but could not be saved: ${error.message}` }, { status: 500 });
    return NextResponse.json({ pal: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create PAL" }, { status: 502 });
  }
}
