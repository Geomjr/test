/**
 * Horizontal magnitude bars: baseline-anchored marks with a rounded data end,
 * direct labels in text tokens, no meter tracks, recessive baseline.
 */
export function BarList({
  data,
}: {
  data: { label: string; count: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {data.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-[110px] shrink-0 truncate text-[13.5px] font-medium">
            {row.label}
          </span>
          <div
            className="relative h-[20px] flex-1"
            style={{ borderLeft: "1px solid var(--separator)" }}
          >
            <div
              className="animate-bar-grow absolute inset-y-[2px] left-0 rounded-r-[5px]"
              style={{
                width: `${Math.max((row.count / max) * 100, 2.5)}%`,
                background: row.color ?? "var(--tint)",
              }}
            />
          </div>
          <span className="tnum w-7 shrink-0 text-right text-[13px] font-semibold text-label-2">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
