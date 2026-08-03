/**
 * Normalizes a user-supplied link to a safe http(s) URL, or null.
 * Blocks javascript:, data:, and other non-web schemes (stored-XSS vector
 * when rendered as an href), and prefixes https:// for bare domains.
 */
export function sanitizeHttpUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}
