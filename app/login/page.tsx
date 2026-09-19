"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "../auth-shell";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    const form = new FormData(event.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(params.get("next") || "/dashboard"); router.refresh();
  }
  return <div className="relative"><Link href="/" className="absolute left-5 top-5 z-10 rounded px-2 py-1 text-sm text-zain-muted transition-colors hover:text-zain-ink">← Back to site</Link><AuthShell title="Sign in" onSubmit={submit} error={error} loading={loading} submit="Sign in" alternate={<><span>New here? </span><Link href="/signup" className="text-zain-sageLight underline underline-offset-4">Create an account</Link></>} /></div>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#0F1417]" />}><LoginForm /></Suspense>;
}
