import Link from "next/link";

export function ZainMark({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return <Link href={href} className="inline-flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight text-zain-ink">
    <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-gradient-to-br from-zain-bright to-zain-raised font-mono text-sm text-zain-sageLight shadow-[inset_0_1px_rgba(255,255,255,.15)]">Z</span>
    {!compact && <span>Zain</span>}
  </Link>;
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zain-raised/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.08em] text-zain-muted"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zain-sage opacity-70" /><span className="relative h-1.5 w-1.5 rounded-full bg-zain-sage shadow-[0_0_9px_#7FA890]" /></span>{children}</span>;
}
