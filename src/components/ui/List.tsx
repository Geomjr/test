"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

export function ListSection({
  title,
  footer,
  children,
  action,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-7 first:mt-1">
      {title || action ? (
        <div className="flex items-end justify-between px-4 pb-1.5">
          {title ? (
            <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-label-2">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-[10px] bg-card">{children}</div>
      {footer ? <p className="px-4 pt-1.5 text-[13px] text-label-2">{footer}</p> : null}
    </section>
  );
}

type RowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  chevron?: boolean;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  centerTitle?: boolean;
  style?: CSSProperties;
};

export function ListRow({
  leading,
  title,
  subtitle,
  value,
  chevron,
  href,
  onClick,
  destructive,
  centerTitle,
  style,
}: RowProps) {
  const interactive = Boolean(href || onClick);

  const inner = (
    <>
      {leading ? <span className="shrink-0 text-label-2">{leading}</span> : null}
      <span className={`min-w-0 flex-1 py-[3px] ${centerTitle ? "text-center" : ""}`}>
        <span
          className={`block truncate text-[17px] ${
            destructive ? "text-red" : interactive && centerTitle ? "text-tint" : ""
          }`}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-[14px] text-label-2">{subtitle}</span>
        ) : null}
      </span>
      {value ? <span className="shrink-0 text-[16px] text-label-2">{value}</span> : null}
      {chevron ? (
        <ChevronRightIcon size={18} className="shrink-0 text-label-3" strokeWidth={2.4} />
      ) : null}
    </>
  );

  const className = `hairline-b last:after:hidden flex w-full items-center gap-3 px-4 min-h-[46px] py-1.5 text-left ${
    interactive ? "pressable-bg" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {inner}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}
