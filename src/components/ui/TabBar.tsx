"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChecklistIcon,
  HouseIcon,
  MicIcon,
  PeopleIcon,
  SparklesIcon,
} from "./icons";
import { isActive, MOBILE_TABS } from "./nav";

const ICONS = {
  house: HouseIcon,
  people: PeopleIcon,
  mic: MicIcon,
  sparkles: SparklesIcon,
  checklist: ChecklistIcon,
} as const;

/** Floating charcoal dock — inset from the edges, icon-only, yellow active. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-5 lg:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 14px)" }}
    >
      <div className="pointer-events-auto flex h-[64px] w-full max-w-[400px] items-center justify-between rounded-full bg-surface-dark px-3 shadow-float">
        {MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`pressable flex h-[48px] w-[52px] items-center justify-center rounded-full ${
                active ? "text-accent" : "text-on-dark-2"
              }`}
              style={active ? { background: "rgba(246, 243, 234, 0.1)" } : undefined}
            >
              <Icon size={24} strokeWidth={active ? 2.1 : 1.8} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
