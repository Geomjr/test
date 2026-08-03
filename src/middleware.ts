import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * Optimistic cookie-presence routing only. Real session validation happens in
 * the Node runtime (layouts and every API handler) — Edge cannot load SQLite.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE);
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (isAuthPage && hasCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!isAuthPage && !hasCookie) {
    const url = new URL("/sign-in", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|icons|manifest.webmanifest|sw.js|favicon.ico|offline).*)",
  ],
};
