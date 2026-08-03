import { formatDate } from "@/lib/dates";
import type { WeekBucket } from "@/lib/domain/weeks";

export function WeeklyBars({ buckets }: { buckets: WeekBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const first = buckets[0];
  const last = buckets[buckets.length - 1];

  return (
    <div className="px-4 py-4">
      <div className="flex h-[110px] items-end gap-[5px]">
        {buckets.map((bucket) => (
          <div
            key={bucket.startsOn}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            title={`Week of ${formatDate(bucket.startsOn)}: ${bucket.count}`}
          >
            {bucket.count > 0 ? (
              <span className="tnum text-[10px] leading-none text-label-3">{bucket.count}</span>
            ) : null}
            <div
              className="w-full rounded-t-[4px]"
              style={{
                height: bucket.count > 0 ? `${(bucket.count / max) * 84}px` : "3px",
                background: bucket.count > 0 ? "var(--tint)" : "var(--bg-fill)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-1.5 text-[11px] text-label-3">
        <span>{first ? formatDate(first.startsOn, { year: false }) : ""}</span>
        <span>This week</span>
      </div>
    </div>
  );
}
