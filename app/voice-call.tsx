"use client";

import Vapi from "@vapi-ai/web";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusPill } from "./zain-mark";

type VoiceState = "idle" | "connecting" | "active" | "error";
type TranscriptLine = { id: number; role: string; text: string };

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "We couldn’t start the voice call. Check your microphone permission and try again.";
}

export function VoiceCall() {
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);

  const stopCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    vapi.removeAllListeners();
    vapiRef.current = null;
    try { await vapi.stop(); } catch (stopError) { console.error("Error stopping Vapi call", stopError); }
    setMuted(false); setState("idle");
  }, []);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  useEffect(() => () => {
    const vapi = vapiRef.current;
    if (vapi) { vapi.removeAllListeners(); vapiRef.current = null; void vapi.stop(); }
  }, []);

  const startCall = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!publicKey || !assistantId) {
      setError("Voice calling is not configured yet. Please try video instead."); setState("error"); return;
    }
    setState("connecting"); setError(null); setMuted(false); setTranscript([]);
    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;
    const onMessage = (message: { type?: string; transcript?: string; role?: string }) => {
      if (message.type !== "transcript" || !message.transcript) return;
      setTranscript((current) => [...current, { id: Date.now() + current.length, role: message.role ?? "assistant", text: message.transcript! }]);
    };
    const onStart = () => setState("active");
    const onEnd = () => { vapi.removeAllListeners(); if (vapiRef.current === vapi) vapiRef.current = null; setMuted(false); setState("idle"); };
    const onError = (event: unknown) => {
      console.error("Vapi call error", event);
      vapi.removeAllListeners();
      if (vapiRef.current === vapi) vapiRef.current = null;
      void vapi.stop();
      setError(errorMessage(event)); setState("error");
    };
    vapi.on("message", onMessage); vapi.on("call-start", onStart); vapi.on("call-end", onEnd); vapi.on("error", onError);
    try { await vapi.start(assistantId); } catch (startError) { onError(startError); }
  }, []);

  const toggleMute = () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const nextMuted = !vapi.isMuted();
    vapi.setMuted(nextMuted); setMuted(nextMuted);
  };

  if (state === "idle" || state === "error") return <div className="mt-5"><button onClick={startCall} className="button-primary gap-2 px-6 py-3 text-base"><span aria-hidden="true">◉</span> Start voice call</button>{error && <p className="mt-4 rounded-lg border border-zain-dangerSurface/70 bg-zain-dangerSurface/20 px-3 py-2 text-sm text-zain-danger" role="alert">{error} <button onClick={startCall} className="underline">Try again</button></p>}<p className="mt-3 text-xs leading-relaxed text-zain-muted">Voice-only call. Your browser will ask for microphone access after you start.</p></div>;

  return <section className="glass-panel mt-6 max-w-xl rounded-2xl p-4 md:p-5" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><StatusPill>{state === "connecting" ? "Connecting…" : "Connected to Zain"}</StatusPill><span className="font-mono text-[10px] uppercase tracking-[.12em] text-zain-sageLight">Voice channel</span></div><div ref={transcriptRef} className="mt-4 max-h-48 min-h-24 space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-3 text-sm leading-6"><p className="font-mono text-[10px] uppercase tracking-[.12em] text-zain-muted">Live transcript</p>{transcript.length ? transcript.map((line) => <p key={line.id} className={line.role === "assistant" ? "text-zain-ink" : "text-zain-muted"}><span className="mr-2 font-mono text-[10px] uppercase text-zain-sageLight">{line.role}</span>{line.text}</p>) : <p className="text-zain-muted">{state === "connecting" ? "Requesting a secure voice channel…" : "Listening for the conversation…"}</p>}</div><div className="mt-4 flex flex-wrap gap-3"><button onClick={toggleMute} className="button-secondary px-4 text-sm">{muted ? "Unmute microphone" : "Mute microphone"}</button><button onClick={() => void stopCall()} className="button-secondary border-zain-dangerSurface/60 px-4 text-sm text-zain-danger">End call</button></div></section>;
}
