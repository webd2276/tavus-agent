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
  return <AuthShell title="Sign in" onSubmit={submit} error={error} loading={loading} submit="Sign in" alternate={<><span>New here? </span><Link href="/signup" className="underline">Create an account</Link></>} />;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#0F1417]" />}><LoginForm /></Suspense>;
}
