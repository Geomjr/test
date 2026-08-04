export const MOBILE_TABS = [
  { href: "/", label: "Today", icon: "house" },
  { href: "/contacts", label: "People", icon: "people" },
  { href: "/capture", label: "Capture", icon: "mic" },
  { href: "/assistant", label: "Ask", icon: "sparkles" },
  { href: "/tasks", label: "Tasks", icon: "checklist" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
