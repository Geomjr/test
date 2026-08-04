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

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 material-bar lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "var(--separator)", transform: "scaleY(0.5)" }}
      />
      <div className="grid grid-cols-5 h-[49px]">
        {MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`pressable flex flex-col items-center justify-center gap-0.5 ${
                active ? "text-tint" : "text-label-2"
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.1 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
