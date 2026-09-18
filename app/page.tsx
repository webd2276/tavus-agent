"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

type CallState = "idle" | "starting" | "active" | "error" | "ended";

function getVisitorId(): string {
  const key = "tavus_visitor_id";
  let id = typeof window === "undefined" ? null : localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

export default function Home() {
  const [state, setState] = useState<CallState>("idle");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCall = useCallback(async () => {
    setState("starting");
    setError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: getVisitorId() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not start the call");
      }

      setConversationUrl(data.conversation_url);
      setState("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, []);

  const endCall = useCallback(() => {
    setConversationUrl(null);
    setState("ended");
  }, []);

  return (
    <main className="min-h-screen bg-[#0F1417] text-[#EDEFF1]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-16">
          <Image
            src="/logo.png"
            alt="Zain AI Video Sales Agent"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        {state !== "active" ? (
          <>
            <p className="mb-4 text-sm tracking-wide text-[#7FA890]">
              Live, two minutes, no forms first
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Talk to Zain about what you&apos;re trying to solve.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#B7BEC4]">
              Zain is an AI sales assistant — not a human — who asks a few
              questions on video to see whether our team can actually help.
              If it&apos;s a fit, she&apos;ll offer you time with someone on the team.
            </p>

            <div className="mt-10 flex max-w-md flex-col gap-3">
              {state === "starting" ? (
                <button
                  disabled
                  className="inline-flex items-center justify-center rounded-md bg-[#2A3238] px-6 py-3 font-medium text-[#B7BEC4]"
                >
                  Connecting…
                </button>
              ) : (
                <button
                  onClick={startCall}
                  className="inline-flex items-center justify-center rounded-md bg-[#7FA890] px-6 py-3 font-medium text-[#0F1417] transition-colors hover:bg-[#93BBA2]"
                >
                  Start video conversation
                </button>
              )}
              {state === "error" && (
                <p className="text-sm text-[#E08585]">
                  {error}.{" "}
                  <button onClick={startCall} className="underline">
                    Try again
                  </button>
                </p>
              )}
              <p className="text-xs text-[#7C848B] leading-relaxed">
                You&apos;re talking with an AI, on camera. We&apos;ll ask for your
                camera and microphone, and the conversation may be recorded
                for quality and follow-up. See our {" "}
                <a href="/privacy" className="underline">privacy policy</a>.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7FA890]">Connected to Zain</span>
              <button
                onClick={endCall}
                className="text-sm text-[#E08585] hover:underline"
              >
                End conversation
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#2A3238] bg-[#0B0F11]">
              <iframe
                src={conversationUrl ?? undefined}
                allow="camera; microphone; fullscreen; display-capture"
                className="h-full w-full"
                title="Conversation with Zain"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
