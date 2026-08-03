import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, anthropic } from "./client";

/**
 * Runs a streaming Claude request and returns its text as a chunked
 * `text/plain` response the client can read incrementally.
 *
 * Uses the beta surface so `fallbacks: "default"` can re-run a
 * safety-classifier decline on Anthropic's recommended fallback model
 * server-side instead of surfacing an error to the user.
 */
export function aiTextStream(params: {
  system: Anthropic.Beta.BetaTextBlockParam[];
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens?: number;
}): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const close = () => {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // Reader already gone.
          }
        }
      };

      const stream = anthropic().beta.messages.stream({
        model: AI_MODEL,
        max_tokens: params.maxTokens ?? 8192,
        system: params.system,
        messages: params.messages,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });

      stream.on("text", (text) => {
        if (!closed) controller.enqueue(encoder.encode(text));
      });
      stream.on("finalMessage", (message) => {
        if (message.stop_reason === "refusal" && !closed) {
          controller.enqueue(
            encoder.encode("\n\nI can't help with that request."),
          );
        }
      });
      stream.on("error", () => {
        if (!closed) {
          controller.enqueue(
            encoder.encode("\n\nSomething went wrong generating this — please try again."),
          );
        }
        close();
      });
      stream.on("end", close);
      stream.on("abort", close);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
