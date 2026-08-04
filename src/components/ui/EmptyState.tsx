import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-8 py-14 text-center">
      {icon ? (
        <div className="mb-1 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-fill text-label-2">
          {icon}
        </div>
      ) : null}
      <p className="text-[18px] font-semibold tracking-[-0.01em]">{title}</p>
      {subtitle ? (
        <p className="max-w-[300px] text-[14px] leading-relaxed text-label-2">{subtitle}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
