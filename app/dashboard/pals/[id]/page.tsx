import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PalForm, type PalValues } from "../pal-form";
import { InstantMeetingButton } from "./instant-meeting-button";
import { DeleteButton } from "./delete-button";
import { getCurrentOrganization } from "@/lib/organizations";

export default async function PalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const organization = await getCurrentOrganization(); if (!organization) notFound();
  const { data: pal } = await supabase.from("pals").select("*").eq("id", params.id).eq("organization_id", organization.id).maybeSingle(); if (!pal) notFound();
  const initialValues: PalValues = pal;
  return <main className="zain-shell min-h-screen px-5 py-8 text-zain-ink md:px-8"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="text-sm text-zain-muted underline underline-offset-4">← PAL management</Link><div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Active persona configuration</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Edit {pal.name}</h1></div><InstantMeetingButton palId={pal.id} /></div><PalForm initialValues={initialValues} palId={pal.id} /><DeleteButton palId={pal.id} /></div></main>;
}
