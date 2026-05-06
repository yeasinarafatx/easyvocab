const CACHE_VERSION = "vocab-speak-offline-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline.html";

const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//,
  /^\/manifest\.json$/,
  /^\/app-icons\//,
  /^\/favicon\//,
  /^\/icons\//,
  /^\/og\//,
  /^\/logos\//,
  /^\/resources\//,
  /^\/data\//,
  /^\/demo\//,
  /^\/learn\//,
  /^\/flashcard\//,
  /^\/speak\//,
];

const CAN_CACHE_GET = (request) => request.method === "GET";

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isStaticAsset(request) {
  if (!isSameOrigin(request)) return false;
  const pathname = new URL(request.url).pathname;
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/", "/manifest.json"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("vocab-speak-offline-") && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!CAN_CACHE_GET(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isSameOrigin(request) && new URL(request.url).pathname === "/") {
    event.respondWith(networkFirst(request));
  }
});
