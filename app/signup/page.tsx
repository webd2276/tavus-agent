"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "../auth-shell";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(null); const form = new FormData(event.currentTarget); const { error } = await createClient().auth.signUp({ email: String(form.get("email")), password: String(form.get("password")) }); setLoading(false); if (error) setError(error.message); else setMessage("Account created. You can now sign in."); }
  return <><AuthShell title="Create account" onSubmit={submit} error={error} loading={loading} submit="Create account" alternate={<><span>Already have an account? </span><Link href="/login" className="underline">Sign in</Link></>} />{message && <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded bg-[#7FA890] px-4 py-2 text-[#0F1417]">{message}</p>}</>;
}
