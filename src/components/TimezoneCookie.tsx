"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Reports the device timezone so the server can compute the user's "today". */
export function TimezoneCookie() {
  const router = useRouter();

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const encoded = encodeURIComponent(tz);
      if (!document.cookie.includes(`tz=${encoded}`)) {
        document.cookie = `tz=${encoded}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        // The current server render used the old/absent timezone — re-render
        // so date-sensitive screens (Today, Review) reflect the local date.
        router.refresh();
      }
    } catch {
      // Leave the server on UTC.
    }
  }, [router]);
  return null;
}
