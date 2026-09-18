import Link from "next/link";
import { PalForm } from "../pal-form";
export default function NewPalPage() { return <main className="min-h-screen bg-[#0F1417] px-6 py-12 text-[#EDEFF1]"><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="text-sm underline">← Dashboard</Link><h1 className="mt-6 text-3xl font-semibold">Create a PAL</h1><PalForm /></div></main>; }
