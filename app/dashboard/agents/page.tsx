import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/organizations";
import { StatusPill, ZainMark } from "@/app/zain-mark";

export default async function AgentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const organization = await getCurrentOrganization();
  if (!organization) redirect("/dashboard");
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, description, type, provider, status, updated_at")
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false });

  return <main className="zain-shell min-h-dvh px-5 py-5 text-zain-ink md:px-8"><div className="mx-auto max-w-6xl"><header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3"><div className="flex items-center gap-4"><ZainMark href="/dashboard" /><StatusPill>Unified control plane</StatusPill></div><Link href="/dashboard" className="button-secondary text-sm">Video PALs</Link></header><section className="mt-10"><p className="eyebrow">Agent inventory</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Voice and video agents</h1><p className="mt-2 max-w-2xl text-zain-muted">Provider-safe configurations are versioned when saved through the protected agent API. Existing Tavus PALs remain available in the Video PALs workspace.</p></section><section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{agents?.length ? agents.map((agent) => <article key={agent.id} className="glass-panel rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-zain-sage/40 bg-zain-sageDark/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-zain-sageLight">{agent.type} · {agent.provider}</span><span className="font-mono text-[10px] uppercase text-zain-muted">{agent.status}</span></div><h2 className="mt-5 font-display text-xl font-semibold">{agent.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-zain-muted">{agent.description || "No description yet."}</p><p className="mt-5 border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-wide text-zain-muted">Updated {new Date(agent.updated_at).toLocaleDateString()}</p></article>) : <div className="glass-panel rounded-2xl p-8 text-zain-muted md:col-span-2 xl:col-span-3"><p className="font-display text-xl text-zain-ink">No unified agents yet</p><p className="mt-2 max-w-xl text-sm leading-6">Use the protected <code className="text-zain-sageLight">POST /api/agents</code> endpoint to create a draft voice (Vapi) or video (Tavus) configuration. A visual builder is the next UI milestone; current PAL creation remains fully operational.</p></div>}</section></div></main>;
}
