// Bump this if the caching STRATEGY below changes (not for every deploy —
// Next.js's own JS/CSS chunk filenames are content-hashed, so a new deploy
// automatically produces new filenames and old cached chunks just become
// unused, no manual bust needed for those).
const CACHE_VERSION = "v1";
const SHELL_CACHE = `nextclass-shell-${CACHE_VERSION}`;

// Small set of stable, non-personalized assets worth having ready
// immediately on install, before the user's first request even happens.
const PRECACHE_URLS = ["/", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Precaching is a nice-to-have, not required — never block install
        // on it (e.g. if the device is offline during first install).
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept cross-origin requests — Supabase API calls, fonts from
  // a CDN, etc. always go straight to the network untouched.
  if (url.origin !== self.location.origin) return;

  // Next.js's build output (JS/CSS chunks) is content-hashed: the filename
  // itself changes whenever the content does, so a cached copy can never
  // go stale by definition. Safe to cache aggressively (cache-first) — this
  // is what actually fixes the "app reopens slowly on mobile" problem,
  // since the framework shell no longer needs to be re-downloaded on every
  // cold start after the OS kills a backgrounded tab.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Icons/manifest don't have hashed filenames, so use stale-while-
  // revalidate: answer instantly from cache if we have it, but always
  // refresh the cached copy in the background for next time.
  if (
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/apple-icon")
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything else — the homepage document, every /dashboard/* page,
  // /login, /signup, and all data requests — is intentionally left
  // untouched and always goes straight to the network. These are
  // personalized, RLS-scoped, or auth-sensitive, and must always be fresh.
});
