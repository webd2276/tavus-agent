"use client";

import type { FormEvent, ReactNode } from "react";

export function AuthShell({ title, onSubmit, error, loading, submit, alternate }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string | null; loading: boolean; submit: string; alternate: ReactNode }) {
  return <main className="min-h-screen bg-[#0F1417] px-6 py-20 text-[#EDEFF1]"><form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4 rounded-xl border border-[#2A3238] p-8"><h1 className="text-2xl font-semibold">{title}</h1><label>Email<input required name="email" type="email" className="mt-1 w-full rounded bg-[#182025] p-2" /></label><label>Password<input required name="password" type="password" minLength={6} className="mt-1 w-full rounded bg-[#182025] p-2" /></label>{error && <p className="text-sm text-[#E08585]">{error}</p>}<button disabled={loading} className="rounded bg-[#7FA890] px-4 py-2 font-medium text-[#0F1417] disabled:opacity-60">{loading ? "Please wait…" : submit}</button><p className="text-sm text-[#B7BEC4]">{alternate}</p></form></main>;
}
