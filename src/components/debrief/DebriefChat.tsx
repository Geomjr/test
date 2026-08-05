"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { ArrowUpIcon, CheckCircleIcon, CircleIcon } from "@/components/ui/icons";
import { composeNotes, type DebriefWrap } from "@/lib/debrief";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * The debrief interview: the coach asks, the user answers, "Wrap up"
 * digests the transcript into a note + follow-ups + ask-next-time hooks.
 */
export function DebriefChat({
  contactId,
  contactName,
  today,
}: {
  contactId: string;
  contactName: string;
  today: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrap, setWrap] = useState<DebriefWrap | null>(null);
  const [wrapping, setWrapping] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const kickedOff = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // The opening user turn is scaffolding — sent to the API, never rendered.
  const kickoff: ChatMessage = {
    role: "user",
    content: `I just had a conversation with ${contactName}. Debrief me — ask your first question.`,
  };

  async function send(history: ChatMessage[]) {
    setError(null);
    setStreaming(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages([...history.slice(1), { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/ai/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, messages: history.slice(-24) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessages(history.slice(1));
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
        setMessages([...history.slice(1), { role: "assistant", content: current }]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(history.slice(1));
        setError("Network error — try again.");
      }
    } finally {
      setStreaming(false);
    }
  }

  useEffect(() => {
    if (!kickedOff.current) {
      kickedOff.current = true;
      void send([kickoff]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function answer(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setDraft("");
    void send([kickoff, ...messages, { role: "user", content }]);
  }

  const answered = messages.some((m) => m.role === "user");

  async function wrapUp() {
    setWrapping(true);
    try {
      const res = await api<{ wrap: DebriefWrap }>("/api/ai/debrief/wrap", {
        json: { contactId, messages: [kickoff, ...messages].slice(-40) },
      });
      setWrap(res.wrap);
      setChecked(res.wrap.followUps.map(() => true));
    } catch {
      toast("Couldn't wrap up — try again");
    } finally {
      setWrapping(false);
    }
  }

  async function saveWrap() {
    if (!wrap) return;
    setSaving(true);
    try {
      await api("/api/interactions", {
        json: {
          contactId,
          type: wrap.type,
          date: wrap.date ?? today,
          notes: composeNotes(wrap),
        },
      });
      for (let i = 0; i < wrap.followUps.length; i++) {
        const followUp = wrap.followUps[i];
        if (!checked[i] || !followUp) continue;
        try {
          await api("/api/tasks", {
            json: { title: followUp.title, dueDate: followUp.due, contactId },
          });
        } catch {}
      }
      toast("Debrief saved — your next brief just got smarter");
      router.push(`/contacts/${contactId}`);
      router.refresh();
    } catch {
      toast("Couldn't save — try again");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1">
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
                <div className="max-w-[92%] rounded-[20px] rounded-bl-[7px] bg-fill px-4 py-2.5 text-[16px]">
                  {message.content || (
                    <span className="flex items-center gap-2 py-1 text-label-2">
                      <Spinner size={15} />
                      <span className="text-[14px]">Thinking about {contactName}…</span>
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
          {error ? <p className="px-2 text-center text-[13px] text-red">{error}</p> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="sticky bottom-0 -mx-4 px-4 pb-2 pt-2"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
      >
        {answered ? (
          <div className="pb-2 text-center">
            <button
              type="button"
              onClick={() => void wrapUp()}
              disabled={wrapping || streaming}
              className="pressable rounded-full bg-fill px-4 py-2 text-[14px] font-semibold disabled:opacity-40"
            >
              {wrapping ? "Wrapping up…" : "Wrap up & save"}
            </button>
          </div>
        ) : null}
        <form
          className="material-sheet shadow-float flex items-end gap-2 rounded-[24px] p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            answer(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Answer the coach…"
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

      {/* Wrap-up review */}
      <Sheet open={wrap !== null} onClose={() => setWrap(null)} title="Save debrief">
        {wrap ? (
          <div className="pb-2">
            <div className="card px-4 py-3.5 text-[15px] leading-relaxed">{wrap.summary}</div>

            {wrap.followUps.length > 0 ? (
              <div className="mt-4">
                <p className="px-1.5 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-label-2">
                  Follow-ups
                </p>
                <div className="card overflow-hidden">
                  {wrap.followUps.map((followUp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))
                      }
                      className="hairline-b last:after:hidden flex min-h-[50px] w-full items-center gap-3 px-4 py-2 text-left"
                    >
                      <span className={checked[i] ? "text-tint" : "text-label-3"}>
                        {checked[i] ? <CheckCircleIcon size={22} /> : <CircleIcon size={22} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] leading-snug">{followUp.title}</span>
                        {followUp.due ? (
                          <span className="text-[13px] text-label-2">Due {followUp.due}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {wrap.askNextTime.length > 0 ? (
              <div className="mt-4">
                <p className="px-1.5 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-label-2">
                  Ask next time
                </p>
                <div className="card px-4 py-3">
                  {wrap.askNextTime.map((q, i) => (
                    <p key={i} className="py-1 text-[15px] leading-snug">
                      {q}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <Button block loading={saving} onClick={() => void saveWrap()}>
                Save to {contactName}
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
