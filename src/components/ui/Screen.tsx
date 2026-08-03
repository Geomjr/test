"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

/**
 * iOS-style screen chrome: a 34px large title that collapses into a frosted
 * inline navigation bar as the user scrolls.
 */
export function Screen({
  title,
  back,
  right,
  children,
  contentClassName,
  largeTitle = true,
}: {
  title: string;
  back?: { href: string; label?: string };
  right?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  /** false = inline-title-only chrome (detail screens with their own header) */
  largeTitle?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const collapsed = !largeTitle || scrolled;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!(entry?.isIntersecting ?? true)),
      { rootMargin: "-44px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 material-bar transition-shadow ${
          collapsed ? "hairline-b" : ""
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
                <ChevronLeftIcon size={24} strokeWidth={2.2} />
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

      <div className="mx-auto w-full max-w-3xl">
        {largeTitle ? (
          <>
            <div ref={sentinelRef} aria-hidden className="h-px" />
            <h1 className="px-4 pt-1 pb-2 text-[34px] font-bold tracking-tight">{title}</h1>
          </>
        ) : null}
        <div className={contentClassName ?? "px-4 pb-28 lg:pb-10"}>{children}</div>
      </div>
    </>
  );
}
