import { formatDate } from "@/lib/dates";
import type { WeekBucket } from "@/lib/domain/weeks";

/**
 * Interactions per week: single-hue column chart, rounded data ends, one
 * selective label on the peak week, recessive baseline.
 */
export function WeeklyBars({ buckets }: { buckets: WeekBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const peakIndex = buckets.reduce(
    (best, b, i) => (b.count > (buckets[best]?.count ?? 0) ? i : best),
    0,
  );
  const first = buckets[0];

  return (
    <div className="bg-surface-dark px-4 py-5 text-on-dark">
      <div className="flex h-[116px] items-end gap-[6px]">
        {buckets.map((bucket, i) => (
          <div
            key={bucket.startsOn}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            title={`Week of ${formatDate(bucket.startsOn)}: ${bucket.count} interaction${bucket.count === 1 ? "" : "s"}`}
          >
            {i === peakIndex && bucket.count > 0 ? (
              <span className="tnum text-[11px] font-bold leading-none text-accent">
                {bucket.count}
              </span>
            ) : null}
            <div
              className="w-full rounded-t-[5px] transition-all"
              style={{
                height: bucket.count > 0 ? `${(bucket.count / max) * 86}px` : "3px",
                background: bucket.count > 0 ? "var(--accent)" : "rgba(246, 243, 234, 0.13)",
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="mt-0 flex justify-between pt-1.5 text-[11px] font-medium text-on-dark-2"
        style={{ borderTop: "1px solid rgba(246, 243, 234, 0.18)" }}
      >
        <span>{first ? formatDate(first.startsOn, { year: false }) : ""}</span>
        <span>This week</span>
      </div>
    </div>
  );
}
