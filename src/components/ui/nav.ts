export const MOBILE_TABS = [
  { href: "/", label: "Today", icon: "house" },
  { href: "/contacts", label: "People", icon: "people" },
  { href: "/pipeline", label: "Pipeline", icon: "columns" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/more", label: "More", icon: "ellipsis" },
] as const;

/** Routes that should light up the "More" tab on mobile. */
export const MORE_ROUTES = [
  "/more",
  "/tasks",
  "/analytics",
  "/review",
  "/assistant",
  "/import",
  "/settings",
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
