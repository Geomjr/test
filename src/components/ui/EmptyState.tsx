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
    <div className="flex flex-col items-center justify-center gap-2 px-8 py-14 text-center">
      {icon ? <div className="text-label-3 mb-1">{icon}</div> : null}
      <p className="text-[17px] font-semibold">{title}</p>
      {subtitle ? <p className="text-[14px] text-label-2 max-w-[300px]">{subtitle}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
