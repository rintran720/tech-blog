"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ServiceWorkerStatus() {
  const [status, setStatus] = React.useState<{
    registered: boolean;
    scope?: string;
    state?: string;
    error?: string;
  }>({
    registered: false,
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setStatus({
        registered: false,
        error: "Service Worker not supported",
      });
      return;
    }

    const checkServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          setStatus({
            registered: true,
            scope: registration.scope,
            state: registration.active?.state || "unknown",
          });

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            console.log("🔄 Service Worker update found");
          });
        } else {
          setStatus({
            registered: false,
            error: "Not registered",
          });
        }
      } catch (error) {
        setStatus({
          registered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkServiceWorker();

    // Check periodically
    const interval = setInterval(checkServiceWorker, 5000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50",
        "bg-popover border border-border rounded-lg",
        "p-3 shadow-lg",
        "text-xs font-mono"
      )}
    >
      <div className="font-semibold mb-2">Service Worker Status</div>
      <div className="space-y-1">
        <div>
          <span className="text-muted-foreground">Registered: </span>
          <span
            className={cn(
              status.registered ? "text-green-500" : "text-red-500"
            )}
          >
            {status.registered ? "✅ Yes" : "❌ No"}
          </span>
        </div>
        {status.scope && (
          <div>
            <span className="text-muted-foreground">Scope: </span>
            <span className="text-foreground">{status.scope}</span>
          </div>
        )}
        {status.state && (
          <div>
            <span className="text-muted-foreground">State: </span>
            <span className="text-foreground">{status.state}</span>
          </div>
        )}
        {status.error && (
          <div>
            <span className="text-muted-foreground">Error: </span>
            <span className="text-red-500">{status.error}</span>
          </div>
        )}
        <div className="text-muted-foreground mt-2 text-xs">
          Only works in production mode
        </div>
      </div>
    </div>
  );
}
