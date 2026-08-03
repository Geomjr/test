"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChartBarIcon,
  ChecklistIcon,
  ColumnsIcon,
  GearIcon,
  HouseIcon,
  ImportIcon,
  BookIcon,
  PeopleIcon,
  SearchIcon,
  SparklesIcon,
} from "./icons";
import { isActive } from "./nav";

const SECTIONS: { items: { href: string; label: string; icon: ReactNode }[] }[] = [
  {
    items: [
      { href: "/", label: "Today", icon: <HouseIcon size={20} /> },
      { href: "/contacts", label: "People", icon: <PeopleIcon size={20} /> },
      { href: "/pipeline", label: "Pipeline", icon: <ColumnsIcon size={20} /> },
      { href: "/search", label: "Search", icon: <SearchIcon size={20} /> },
    ],
  },
  {
    items: [
      { href: "/assistant", label: "Assistant", icon: <SparklesIcon size={20} /> },
      { href: "/tasks", label: "Tasks", icon: <ChecklistIcon size={20} /> },
      { href: "/analytics", label: "Analytics", icon: <ChartBarIcon size={20} /> },
      { href: "/review", label: "Weekly Review", icon: <BookIcon size={20} /> },
    ],
  },
  {
    items: [
      { href: "/import", label: "Import", icon: <ImportIcon size={20} /> },
      { href: "/settings", label: "Settings", icon: <GearIcon size={20} /> },
    ],
  },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col lg:flex material-bar">
      <div
        className="absolute inset-y-0 right-0 w-px"
        style={{ background: "var(--separator)", transform: "scaleX(0.5)" }}
      />
      <div className="px-5 pt-6 pb-3">
        <p className="text-[22px] font-bold tracking-tight">Orbit</p>
        <p className="text-[12px] text-label-2 truncate">{userName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Sidebar">
        {SECTIONS.map((section, i) => (
          <div key={i} className="mt-2 first:mt-0">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`pressable-bg mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2 text-[15px] font-medium ${
                    active ? "bg-tint-soft text-tint" : "text-label"
                  }`}
                >
                  <span className={active ? "text-tint" : "text-label-2"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            {i < SECTIONS.length - 1 ? (
              <div className="mx-2.5 my-2 h-px" style={{ background: "var(--separator)" }} />
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}
