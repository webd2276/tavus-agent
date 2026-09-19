"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export type PalValues = {
  name: string; short_description?: string | null; identity_role?: string | null; greeting?: string | null;
  guardrails?: string[]; objectives?: string | null; face_id?: string | null; voice_id?: string | null;
  conferencing_username?: string | null; allowed_websites?: string[]; calls_per_day?: number | null;
  calls_per_visitor?: number | null; longest_call_minutes?: number | null;
};

const optionalFields: Array<[keyof PalValues, string, string]> = [
  ["short_description", "Short description", "What this PAL helps with"], ["identity_role", "Identity / role", "Sales assistant"],
  ["greeting", "Greeting", "Hello, how can I help?"], ["objectives", "Objectives", "Qualify prospective customers"],
  ["face_id", "Default Face ID", "Required Tavus face ID"], ["voice_id", "Voice ID", "Optional Tavus voice ID"],
  ["conferencing_username", "Conferencing username", "Optional meeting handle"],
];
const numberFields: Array<[keyof PalValues, string]> = [["calls_per_day", "Calls per day"], ["calls_per_visitor", "Calls per visitor"], ["longest_call_minutes", "Longest call (minutes)"]];
const emptyToNull = (value: FormDataEntryValue | null) => { const trimmed = String(value ?? "").trim(); return trimmed || null; };

export function PalForm({ initialValues, palId }: { initialValues?: PalValues; palId?: string }) {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null); const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      guardrails: String(form.get("guardrails") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
      allowed_websites: String(form.get("allowed_websites") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      ...Object.fromEntries(optionalFields.map(([key]) => [key, emptyToNull(form.get(key))])),
      ...Object.fromEntries(numberFields.map(([key]) => { const value = emptyToNull(form.get(key)); return [key, value === null ? null : Number(value)]; })),
    };
    const response = await fetch(palId ? `/api/pals/${palId}` : "/api/pals", { method: palId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) return setError(typeof data.error === "string" ? data.error : "Please check the supplied values.");
    router.push(`/dashboard/pals/${data.pal.id}`); router.refresh();
  }
  return <form onSubmit={submit} className="mt-8 grid max-w-3xl gap-5"><section className="glass-panel rounded-2xl p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><p className="eyebrow">01 / core identity</p><span className="font-mono text-[10px] text-zain-sageLight">PERSONA</span></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-zain-muted sm:col-span-2">Name<input required name="name" defaultValue={initialValues?.name} className="field mt-2" /></label>{optionalFields.slice(0, 3).map(([key, label, placeholder]) => <label key={key} className={key === "greeting" ? "sm:col-span-2 text-sm font-medium text-zain-muted" : "text-sm font-medium text-zain-muted"}>{label}<input name={key} required={key === "face_id"} defaultValue={initialValues?.[key] ?? ""} placeholder={placeholder} className="field mt-2" /></label>)}</div></section>
    <section className="glass-panel rounded-2xl p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><p className="eyebrow">02 / operational profile</p><span className="font-mono text-[10px] text-zain-sageLight">GUARDRAILS</span></div><div className="grid gap-4 sm:grid-cols-2">{optionalFields.slice(3).map(([key, label, placeholder]) => <label key={key} className="text-sm font-medium text-zain-muted">{label}<input name={key} required={key === "face_id"} defaultValue={initialValues?.[key] ?? ""} placeholder={placeholder} className="field mt-2" /></label>)}<label className="text-sm font-medium text-zain-muted sm:col-span-2">Guardrails <span className="font-normal">(one per line)</span><textarea name="guardrails" defaultValue={initialValues?.guardrails?.join("\n") ?? ""} className="field mt-2 min-h-28 resize-y" /></label><label className="text-sm font-medium text-zain-muted sm:col-span-2">Allowed websites <span className="font-normal">(comma-separated URLs)</span><input name="allowed_websites" defaultValue={initialValues?.allowed_websites?.join(", ") ?? ""} placeholder="https://example.com, https://app.example.com" className="field mt-2" /></label></div></section>
    <section className="glass-panel rounded-2xl p-5 md:p-6"><p className="eyebrow mb-4">03 / capacity limits</p><div className="grid gap-4 sm:grid-cols-3">{numberFields.map(([key, label]) => <label key={key} className="text-sm font-medium text-zain-muted">{label}<input name={key} type="number" min="1" defaultValue={initialValues?.[key] ?? ""} className="field mt-2" /></label>)}</div></section>
    {error && <p className="rounded-lg border border-[#93000a]/60 bg-[#93000a]/20 px-3 py-2 text-sm text-zain-danger" role="alert">{error}</p>}<button disabled={saving} className="button-primary w-fit disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : palId ? "Save changes" : "Create PAL"}</button>
  </form>;
}
