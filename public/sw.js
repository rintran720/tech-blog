// Service Worker for Performance Optimization
// Version: 1.0.0
const CACHE_NAME = "blog-cache-v1";
const RUNTIME_CACHE = "blog-runtime-v1";
const API_CACHE = "blog-api-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/blog",
  "/favicon.ico",
  // Add other important static pages
];

// Install event - Cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn("[Service Worker] Failed to cache some assets:", err);
          // Continue even if some assets fail to cache
          return Promise.resolve();
        });
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Intercept network requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests (unless you want to cache them)
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith("/api/")) {
    // API requests - Network First with cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    // Static assets - Cache First
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
  } else if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    // Images and fonts - Cache First
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
  } else {
    // HTML pages - Network First
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
  }
});

// Cache First Strategy - Good for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Return cached version
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response for future use
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[Service Worker] Cache First error:", error);
    // Return a fallback if available
    const cache = await caches.open(cacheName);
    const fallback = await cache.match("/offline.html");
    return fallback || new Response("Offline", { status: 503 });
  }
}

// Network First Strategy - Good for dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[Service Worker] Network failed, trying cache:", error);
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request and we have no cache, return offline page
    if (request.mode === "navigate") {
      const offlinePage = await cache.match("/offline.html");
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response("Service Unavailable", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Message handler for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
