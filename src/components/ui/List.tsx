"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

export function ListSection({
  title,
  count,
  footer,
  children,
  action,
}: {
  title?: string;
  count?: number;
  footer?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-2">
      {title || action ? (
        <div className="flex items-baseline justify-between px-1.5 pb-2.5">
          {title ? (
            <h2 className="text-[19px] font-semibold tracking-[-0.015em]">
              {title}
              {count !== undefined ? (
                <span className="tnum pl-2 text-[15px] font-medium text-label-3">{count}</span>
              ) : null}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="card overflow-hidden">{children}</div>
      {footer ? <p className="px-1.5 pt-2 text-[13px] leading-snug text-label-2">{footer}</p> : null}
    </section>
  );
}

type RowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Directory rows truncate (1); status rows may wrap (2). */
  subtitleLines?: 1 | 2;
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
  subtitleLines = 1,
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
          className={`block truncate text-[17px] leading-snug ${
            destructive ? "text-red" : interactive && centerTitle ? "text-tint" : ""
          }`}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            className={`mt-[1px] block text-[13.5px] leading-snug text-label-2 ${
              subtitleLines === 2 ? "line-clamp-2" : "truncate"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
      {value ? (
        <span className="shrink-0 text-[15px] text-label-2 text-right">{value}</span>
      ) : null}
      {chevron ? (
        <ChevronRightIcon size={17} className="shrink-0 text-label-3" strokeWidth={2.6} />
      ) : null}
    </>
  );

  const className = `hairline-b last:after:hidden flex w-full items-center gap-3.5 px-4 min-h-[52px] py-2 text-left ${
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
