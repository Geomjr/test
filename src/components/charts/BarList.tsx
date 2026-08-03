export function BarList({
  data,
}: {
  data: { label: string; count: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5">
      {data.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-[108px] shrink-0 truncate text-[13px] font-medium">
            {row.label}
          </span>
          <div className="h-[18px] flex-1 overflow-hidden rounded-[5px] bg-fill-2">
            <div
              className="animate-bar-grow h-full rounded-[5px]"
              style={{
                width: `${Math.max((row.count / max) * 100, 2)}%`,
                background: row.color ?? "var(--tint)",
              }}
            />
          </div>
          <span className="tnum w-7 shrink-0 text-right text-[13px] text-label-2">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
