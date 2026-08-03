"use client";

/** Small fetch wrapper for client components: JSON in/out, readable errors. */
export async function api<T = unknown>(
  path: string,
  options?: { method?: string; json?: unknown; form?: FormData },
): Promise<T> {
  const res = await fetch(path, {
    method: options?.method ?? (options?.json || options?.form ? "POST" : "GET"),
    headers: options?.json ? { "Content-Type": "application/json" } : undefined,
    body: options?.json
      ? JSON.stringify(options.json)
      : options?.form ?? undefined,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}
