"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "../auth-shell";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(null); const form = new FormData(event.currentTarget); const { error } = await createClient().auth.signUp({ email: String(form.get("email")), password: String(form.get("password")) }); setLoading(false); if (error) setError(error.message); else setMessage("Account created. You can now sign in."); }
  return <div className="relative"><Link href="/" className="absolute left-5 top-5 z-10 rounded px-2 py-1 text-sm text-zain-muted transition-colors hover:text-zain-ink">← Back to site</Link><AuthShell title="Create account" onSubmit={submit} error={error} loading={loading} submit="Create account" alternate={<><span>Already have an account? </span><Link href="/login" className="text-zain-sageLight underline underline-offset-4">Sign in</Link></>} />{message && <p className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-zain-sage px-4 py-2 text-zain-sageDark shadow-glow" role="status">{message}</p>}</div>;
}
