"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

/**
 * iOS-style screen chrome: a 34px large title that collapses into a frosted
 * inline navigation bar as the user scrolls, over a soft ambient color wash.
 */
export function Screen({
  title,
  eyebrow,
  back,
  right,
  children,
  contentClassName,
  largeTitle = true,
}: {
  title: string;
  /** Small caps line above the large title (e.g. the date on Today). */
  eyebrow?: string;
  back?: { href: string; label?: string };
  right?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  /** false = inline-title-only chrome (detail screens with their own header) */
  largeTitle?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const collapsed = !largeTitle || scrolled;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // Measure the real header height (includes safe-area inset in an
    // installed PWA) instead of hardcoding it.
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 48;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!(entry?.isIntersecting ?? true)),
      { rootMargin: `${-Math.max(Math.round(headerHeight) - 4, 0)}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="screen-wash pointer-events-none absolute inset-x-0 top-0 h-[340px]"
      />

      <header
        ref={headerRef}
        className={`sticky top-0 z-30 material-bar ${
          collapsed ? "hairline-b hairline-full" : ""
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[48px] max-w-3xl items-center px-2">
          <div className="flex-1 flex justify-start min-w-0">
            {back ? (
              <Link
                href={back.href}
                className="pressable flex items-center gap-0.5 text-tint text-[17px] -ml-1 pr-2 min-h-[44px]"
              >
                <ChevronLeftIcon size={24} strokeWidth={2.4} />
                <span className="truncate max-w-[120px]">{back.label ?? "Back"}</span>
              </Link>
            ) : null}
          </div>
          <p
            aria-hidden={!collapsed}
            className={`text-[17px] font-semibold truncate max-w-[55%] transition-opacity duration-150 ${
              collapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </p>
          <div className="flex-1 flex items-center justify-end gap-1 pr-2">{right}</div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-3xl">
        {largeTitle ? (
          <>
            <div ref={sentinelRef} aria-hidden className="h-px" />
            <div className="px-4 pt-2 pb-3">
              {eyebrow ? (
                <p className="pb-0.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-label-2">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-[34px] font-bold leading-[1.12] tracking-[-0.022em]">
                {title}
              </h1>
            </div>
          </>
        ) : null}
        <div className={contentClassName ?? "px-4 pb-28 lg:pb-10"}>{children}</div>
      </div>
    </div>
  );
}
