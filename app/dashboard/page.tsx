import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: pals } = await supabase.from("pals").select("id, name, short_description, tavus_pal_id").eq("owner_id", user.id).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#0F1417] px-6 py-12 text-[#EDEFF1]"><div className="mx-auto max-w-4xl"><div className="mb-10 flex items-center justify-between"><div><h1 className="text-3xl font-semibold">PAL dashboard</h1><p className="mt-1 text-[#B7BEC4]">Manage your Tavus assistants.</p></div><LogoutButton /></div><Link href="/dashboard/pals/new" className="rounded bg-[#7FA890] px-4 py-2 font-medium text-[#0F1417]">Create PAL</Link><div className="mt-8 grid gap-3">{pals?.length ? pals.map((pal) => <Link key={pal.id} href={`/dashboard/pals/${pal.id}`} className="rounded border border-[#2A3238] p-5 hover:border-[#7FA890]"><h2 className="font-medium">{pal.name}</h2><p className="mt-1 text-sm text-[#B7BEC4]">{pal.short_description || pal.tavus_pal_id}</p></Link>) : <p className="text-[#B7BEC4]">No PALs yet.</p>}</div></div></main>;
}
