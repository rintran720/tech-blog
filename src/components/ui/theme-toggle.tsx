"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-16" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      title={isDark ? "Chuyển sang sáng" : "Chuyển sang tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`h-9 w-16 relative rounded-full border transition-colors cursor-pointer ${
        isDark ? "bg-highlight/20 border-highlight" : "bg-muted border-border"
      }`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background shadow-sm transition-all flex items-center justify-center ${
          isDark ? "right-1" : "left-1"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-highlight" />
        ) : (
          <Sun className="h-4 w-4 text-highlight" />
        )}
      </span>
    </Button>
  );
}
