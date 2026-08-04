"use client";

import { useAIStream } from "@/lib/useAIStream";
import { Button } from "@/components/ui/Button";
import { StreamedText } from "@/components/ui/StreamedText";
import { SparklesIcon } from "@/components/ui/icons";

export function WeeklySummary({ aiOn }: { aiOn: boolean }) {
  const stream = useAIStream();

  if (!aiOn) return null;

  return (
    <section className="mt-7">
      <h2 className="px-1.5 pb-2.5 text-[19px] font-semibold tracking-[-0.015em]">
        AI summary
      </h2>
      <div className="card px-4 py-4">
        {stream.text ? (
          <>
            <StreamedText text={stream.text} />
            {!stream.streaming ? (
              <div className="pt-3">
                <Button
                  small
                  variant="tinted"
                  onClick={() => void stream.start("/api/ai/weekly-review", {})}
                >
                  Regenerate
                </Button>
              </div>
            ) : null}
          </>
        ) : stream.error ? (
          <p className="text-[15px] text-label-2">{stream.error}</p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="text-[15px] text-label-2">
              Let Claude read this week's picture and suggest your next three moves.
            </p>
            <Button
              small
              variant="tinted"
              loading={stream.streaming}
              onClick={() => void stream.start("/api/ai/weekly-review", {})}
            >
              <SparklesIcon size={16} /> Generate summary
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
