"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AIStreamState = {
  text: string;
  streaming: boolean;
  error: string | null;
};

/** Reads a chunked text/plain AI response incrementally. */
export function useAIStream() {
  const [state, setState] = useState<AIStreamState>({
    text: "",
    streaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  // Don't leave a stream (and its server-side generation) running after the
  // component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, streaming: false }));
  }, []);

  const start = useCallback(async (path: string, body: unknown) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ text: "", streaming: true, error: null });

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; code?: string }
          | null;
        setState({
          text: "",
          streaming: false,
          error:
            data?.code === "AI_DISABLED"
              ? "AI isn't set up yet. Add an Anthropic API key on the server to enable this."
              : data?.error ?? "Something went wrong.",
        });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setState({ text: "", streaming: false, error: "Streaming isn't supported here." });
        return;
      }
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setState({ text, streaming: true, error: null });
      }
      setState({ text, streaming: false, error: null });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setState({ text: "", streaming: false, error: "Network error — try again." });
      }
    }
  }, []);

  return { ...state, start, stop };
}
