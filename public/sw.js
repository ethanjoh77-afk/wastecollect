const CACHE_NAME = "wastecollect-shell-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first passthrough. Ikiwa mtandao unafeli NA hakuna cache,
// rudisha Response halisi ya error badala ya undefined (inayosababisha crash).
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached ?? new Response("Network error", { status: 503, statusText: "Offline" });
    })
  );
});