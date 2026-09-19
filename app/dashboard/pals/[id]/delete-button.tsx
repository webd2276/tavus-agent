"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ palId }: { palId: string }) {
  const router = useRouter(); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function remove() { if (!confirm("Delete this PAL from Tavus and your dashboard?")) return; setLoading(true); setError(null); const response = await fetch(`/api/pals/${palId}`, { method: "DELETE" }); setLoading(false); if (!response.ok) { const data = await response.json(); return setError(data.error || "Unable to delete PAL"); } router.push("/dashboard"); router.refresh(); }
  return <div className="mt-8 border-t border-white/10 pt-6"><button onClick={remove} disabled={loading} className="text-sm text-zain-danger underline underline-offset-4 disabled:opacity-60">{loading ? "Deleting…" : "Delete PAL"}</button>{error && <p className="mt-2 text-sm text-zain-danger" role="alert">{error}</p>}</div>;
}
