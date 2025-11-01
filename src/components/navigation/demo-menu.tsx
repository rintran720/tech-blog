"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DemoMenu() {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // Delay 1000ms trước khi đóng popover
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 1000);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-sm font-medium hover:text-primary transition-colors"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Demo
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        align="start"
      >
        <div className="flex flex-col space-y-1">
          <Link
            href="/demo/excalidraw"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            Excalidraw
          </Link>
          <Link
            href="/demo/potree-3d"
            className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            Potree 3D
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
