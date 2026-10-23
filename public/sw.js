const CACHE_NAME = "wastecollect-shell-v3";

self.addEventListener("install", () => {
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

// Network-first. Majibu mazuri ya GET ya asili ile ile (app shell, JS/CSS, picha)
// yanahifadhiwa ili app ifunguke hata mtandao ukikatika (muhimu kwa wakusanyaji
// walio mtaani). Maombi ya Supabase/API (origin nyingine) hayahifadhiwi.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (sameOrigin && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          if (req.mode === "navigate") {
            caches.open(CACHE_NAME).then((cache) => cache.put("/", res.clone()));
          }
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return new Response("Network error", { status: 503, statusText: "Offline" });
      })
  );
});
