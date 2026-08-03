/* Orbit service worker — app-shell caching only.
 *
 * Data must never be stale: navigations, RSC fetches, and /api/* always go to
 * the network. We cache only fingerprinted static assets and icons, and serve
 * a friendly offline page when a navigation fails with no connection.
 */
const CACHE = "orbit-shell-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/icons/apple-touch-icon.png",
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept data: API calls, auth, uploads.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, offline fallback. RSC prefetches carry
  // headers; letting them pass through untouched keeps App Router happy.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // Fingerprinted build assets + icons: cache-first with network fill.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
