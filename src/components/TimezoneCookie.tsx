"use client";

import { useEffect } from "react";

/** Reports the device timezone so the server can compute the user's "today". */
export function TimezoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.includes(`tz=${encodeURIComponent(tz)}`)) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
    } catch {
      // Leave the server on UTC.
    }
  }, []);
  return null;
}
