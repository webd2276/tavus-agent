import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PalForm, type PalValues } from "../pal-form";
import { InstantMeetingButton } from "./instant-meeting-button";
import { DeleteButton } from "./delete-button";

export default async function PalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: pal } = await supabase.from("pals").select("*").eq("id", params.id).eq("owner_id", user.id).maybeSingle(); if (!pal) notFound();
  const initialValues: PalValues = pal;
  return <main className="min-h-screen bg-[#0F1417] px-6 py-12 text-[#EDEFF1]"><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="text-sm underline">← Dashboard</Link><div className="mt-6 flex items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Edit {pal.name}</h1><InstantMeetingButton palId={pal.id} /></div><PalForm initialValues={initialValues} palId={pal.id} /><DeleteButton palId={pal.id} /></div></main>;
}
