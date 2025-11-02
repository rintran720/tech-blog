"use client";

import * as React from "react";

export function ServiceWorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "✅ Service Worker registered successfully:",
            registration.scope
          );

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, prompt user to refresh
                  console.log("🔄 New service worker available");
                  // Optionally show a notification to user
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Handle service worker controller change (update)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Service Worker controller changed - reloading page");
        // Optionally reload the page to use new service worker
        // window.location.reload();
      });
    }
  }, []);

  return <>{children}</>;
}
