/* Minimal service worker for PWA install/offline basics. */

const CACHE_NAME = "gots-pwa-v1"
const CORE_ASSETS = ["/", "/manifest.webmanifest", "/pwa-192.png", "/pwa-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
      .catch(() => {})
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  // Network-first for API, cache-first for static, SWR for pages.
  const url = new URL(req.url)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((res) => res || new Response("", { status: 503 })))
    )
    return
  }

  // Cache-first for Next/static and images
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/images/") || url.pathname.endsWith(".png")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req)
          .then((res) => {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
            return res
          })
          .catch(() => cached)
      })
    )
    return
  }

  // Stale-while-revalidate for documents
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => null)

      return cached || fetchPromise || new Response("", { status: 503 })
    })
  )
})

