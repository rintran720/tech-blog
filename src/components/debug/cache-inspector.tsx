"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CacheInfo {
  name: string;
  size: number;
  items: string[];
}

export function CacheInspector() {
  const [caches, setCaches] = React.useState<CacheInfo[]>([]);
  const [loading, setLoading] = React.useState(false);

  const inspectCaches = React.useCallback(async () => {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    setLoading(true);
    try {
      const cacheStorage = window.caches;
      const cacheNames = await cacheStorage.keys();
      const cacheInfo: CacheInfo[] = [];

      for (const name of cacheNames) {
        const cache = await cacheStorage.open(name);
        const keys = await cache.keys();
        cacheInfo.push({
          name,
          size: keys.length,
          items: keys.slice(0, 10).map((key) => key.url),
        });
      }

      setCaches(cacheInfo);
    } catch (error) {
      console.error("Error inspecting caches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAllCaches = React.useCallback(async () => {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    if (!confirm("Bạn có chắc muốn xóa tất cả caches?")) {
      return;
    }

    try {
      const cacheStorage = window.caches;
      const cacheNames = await cacheStorage.keys();
      await Promise.all(cacheNames.map((name) => cacheStorage.delete(name)));
      alert("✅ Đã xóa tất cả caches");
      inspectCaches();
    } catch (error) {
      console.error("Error clearing caches:", error);
      alert("❌ Lỗi khi xóa caches");
    }
  }, [inspectCaches]);

  React.useEffect(() => {
    inspectCaches();
  }, [inspectCaches]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Cache Inspector</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={inspectCaches}
              disabled={loading}
            >
              🔄 Refresh
            </Button>
            <Button size="sm" variant="destructive" onClick={clearAllCaches}>
              🗑️ Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : caches.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Không có cache nào
          </div>
        ) : (
          <div className="space-y-4">
            {caches.map((cache) => (
              <div key={cache.name} className="border-b pb-2">
                <div className="font-semibold text-sm mb-1">{cache.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {cache.size} items
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {cache.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-muted-foreground truncate"
                      title={item}
                    >
                      {item}
                    </div>
                  ))}
                  {cache.size > cache.items.length && (
                    <div className="text-xs text-muted-foreground">
                      ... và {cache.size - cache.items.length} items khác
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
