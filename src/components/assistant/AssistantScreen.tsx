"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StreamedText } from "@/components/ui/StreamedText";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowUpIcon, SparklesIcon } from "@/components/ui/icons";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Who should I catch up with this week?",
  "Who do I know in consulting?",
  "What did I promise people recently?",
  "Whose birthday is coming up?",
];

export function AssistantScreen({
  aiOn,
  initialQuestion,
}: {
  aiOn: boolean;
  initialQuestion?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setError(null);
    setDraft("");

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Trim to a window that starts with a user turn — the Messages API
      // rejects conversations whose first message is from the assistant.
      const window = history.slice(-20);
      while (window[0]?.role === "assistant") window.shift();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: window }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessages(history);
        setError(data?.error ?? "Something went wrong — try again.");
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const current = answer;
        setMessages([...history, { role: "assistant", content: current }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(history);
        setError("Network error — try again.");
      }
    } finally {
      setStreaming(false);
    }
  }

  useEffect(() => {
    if (initialQuestion && !sentInitial.current && aiOn) {
      sentInitial.current = true;
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, aiOn]);

  if (!aiOn) {
    return (
      <EmptyState
        icon={<SparklesIcon size={44} />}
        title="AI is off"
        subtitle="Set ANTHROPIC_API_KEY on the server and the assistant can answer questions about your whole network."
      />
    );
  }

  return (
    <div className="flex min-h-[60dvh] flex-col">
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              icon={<SparklesIcon size={30} />}
              title="Ask about your network"
              subtitle="Answers come only from your own people, notes, and transcripts."
            />
            <div className="mx-auto flex max-w-[420px] flex-col gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void send(starter)}
                  className="card pressable px-4 py-3.5 text-left text-[15px] font-medium text-tint"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((message, i) =>
              message.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-tint max-w-[85%] rounded-[20px] rounded-br-[7px] px-4 py-2.5 text-[16px] text-on-tint">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] rounded-[20px] rounded-bl-[7px] bg-fill px-4 py-2.5">
                    {message.content ? (
                      <StreamedText text={message.content} />
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-label-2">
                        <Spinner size={15} />
                        <span className="text-[14px]">Reading your network…</span>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {error ? (
              <p className="px-2 text-center text-[13px] text-red">{error}</p>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div
        className="sticky bottom-0 -mx-4 px-4 pb-2 pt-2"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
      >
        <form
          className="material-sheet shadow-float flex items-end gap-2 rounded-[24px] p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about your people…"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[16px] outline-none placeholder:text-label-3"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || streaming}
            className="bg-tint pressable flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-on-tint disabled:opacity-40"
          >
            <ArrowUpIcon size={18} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}
