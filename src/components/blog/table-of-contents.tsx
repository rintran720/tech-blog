"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

// Remove Vietnamese accents for SEO-friendly URLs
function removeVietnameseAccents(str: string): string {
  const vietnameseMap: { [key: string]: string } = {
    à: "a",
    á: "a",
    ạ: "a",
    ả: "a",
    ã: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ậ: "a",
    ẩ: "a",
    ẫ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ặ: "a",
    ẳ: "a",
    ẵ: "a",
    è: "e",
    é: "e",
    ẹ: "e",
    ẻ: "e",
    ẽ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ệ: "e",
    ể: "e",
    ễ: "e",
    ì: "i",
    í: "i",
    ị: "i",
    ỉ: "i",
    ĩ: "i",
    ò: "o",
    ó: "o",
    ọ: "o",
    ỏ: "o",
    õ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ộ: "o",
    ổ: "o",
    ỗ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ợ: "o",
    ở: "o",
    ỡ: "o",
    ù: "u",
    ú: "u",
    ụ: "u",
    ủ: "u",
    ũ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ự: "u",
    ử: "u",
    ữ: "u",
    ỳ: "y",
    ý: "y",
    ỵ: "y",
    ỷ: "y",
    ỹ: "y",
    đ: "d",
    À: "A",
    Á: "A",
    Ạ: "A",
    Ả: "A",
    Ã: "A",
    Â: "A",
    Ầ: "A",
    Ấ: "A",
    Ậ: "A",
    Ẩ: "A",
    Ẫ: "A",
    Ă: "A",
    Ằ: "A",
    Ắ: "A",
    Ặ: "A",
    Ẳ: "A",
    Ẵ: "A",
    È: "E",
    É: "E",
    Ẹ: "E",
    Ẻ: "E",
    Ẽ: "E",
    Ê: "E",
    Ề: "E",
    Ế: "E",
    Ệ: "E",
    Ể: "E",
    Ễ: "E",
    Ì: "I",
    Í: "I",
    Ị: "I",
    Ỉ: "I",
    Ĩ: "I",
    Ò: "O",
    Ó: "O",
    Ọ: "O",
    Ỏ: "O",
    Õ: "O",
    Ô: "O",
    Ồ: "O",
    Ố: "O",
    Ộ: "O",
    Ổ: "O",
    Ỗ: "O",
    Ơ: "O",
    Ờ: "O",
    Ớ: "O",
    Ợ: "O",
    Ở: "O",
    Ỡ: "O",
    Ù: "U",
    Ú: "U",
    Ụ: "U",
    Ủ: "U",
    Ũ: "U",
    Ư: "U",
    Ừ: "U",
    Ứ: "U",
    Ự: "U",
    Ử: "U",
    Ữ: "U",
    Ỳ: "Y",
    Ý: "Y",
    Ỵ: "Y",
    Ỷ: "Y",
    Ỹ: "Y",
    Đ: "D",
  };

  return str
    .split("")
    .map((char) => vietnameseMap[char] || char)
    .join("");
}

// Generate ID from heading text (similar to how GitHub generates anchor links)
// Converts Vietnamese with accents to without accents for SEO-friendly URLs
function generateHeadingId(text: string): string {
  return removeVietnameseAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

// Parse markdown content to extract headings
function parseHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split("\n");
  const idCounts = new Map<string, number>();

  for (const line of lines) {
    // Match markdown headings (# ## ### etc.)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const baseId = generateHeadingId(text);

      // Ensure unique IDs by appending index if duplicate
      let uniqueId = baseId;
      if (idCounts.has(baseId)) {
        const count = idCounts.get(baseId)! + 1;
        idCounts.set(baseId, count);
        uniqueId = `${baseId}-${count}`;
      } else {
        idCounts.set(baseId, 0);
      }

      headings.push({
        id: uniqueId,
        text,
        level,
      });
    }
  }

  return headings;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Read headings from DOM (markdown-viewer will set IDs)
  React.useEffect(() => {
    const readHeadingsFromDOM = () => {
      const headingElements = Array.from(
        document.querySelectorAll(
          "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
        )
      );

      if (headingElements.length === 0) {
        return false;
      }

      const domHeadings: Heading[] = [];
      headingElements.forEach((element) => {
        const id = element.id;
        const text = (element.textContent || "").trim();
        const level = parseInt(element.tagName.charAt(1)) || 1;

        if (id && text) {
          domHeadings.push({
            id,
            text,
            level,
          });
        }
      });

      if (domHeadings.length > 0) {
        setHeadings(domHeadings);
        return true;
      }

      return false;
    };

    // Wait for markdown-viewer to render headings with IDs
    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = 100;

    const tryReadHeadings = () => {
      attempts++;
      const success = readHeadingsFromDOM();

      if (!success && attempts < maxAttempts) {
        setTimeout(tryReadHeadings, checkInterval);
      }
    };

    const timeout = setTimeout(tryReadHeadings, checkInterval);
    return () => clearTimeout(timeout);
  }, [content]);

  // Track active heading on scroll
  React.useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for sticky header

      // Find the current active heading
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = document.getElementById(headings[i].id);
        if (heading) {
          const offsetTop = heading.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveId(headings[i].id);
            break;
          }
        }
      }

      // If scrolled to top, set first heading as active
      if (scrollPosition < 200) {
        setActiveId(headings[0]?.id || "");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();

    // Try to find element with retry logic
    const findAndScroll = (attempt = 0) => {
      // Try to find element by ID
      let element = document.getElementById(id);

      // If not found, try searching all headings by ID
      if (!element) {
        const allHeadings = document.querySelectorAll(
          "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
        );
        for (const heading of allHeadings) {
          if (heading.id === id) {
            element = heading as HTMLElement;
            break;
          }
        }
      }

      // Also try to find by matching text from headings state
      if (!element) {
        const clickedHeading = headings.find((h) => h.id === id);
        if (clickedHeading) {
          const allHeadings = document.querySelectorAll(
            "h1, h2, h3, h4, h5, h6"
          );
          for (const heading of allHeadings) {
            const headingText = (heading.textContent || "").trim();
            if (
              headingText === clickedHeading.text &&
              heading.id // Make sure it has an ID
            ) {
              element = heading as HTMLElement;
              // Update the heading ID in state to match actual DOM ID
              if (heading.id !== id && heading.id) {
                const updatedHeadings = headings.map((h) =>
                  h.id === id ? { ...h, id: heading.id } : h
                );
                setHeadings(updatedHeadings);
              }
              break;
            }
          }
        }
      }

      if (element) {
        // Calculate offset: sticky header + extra padding
        const headerOffset = 120;

        // Get current scroll position
        const currentScroll =
          window.pageYOffset || document.documentElement.scrollTop;

        // Get element's absolute position in document
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + currentScroll;

        // Calculate target scroll position with offset
        const targetScroll = Math.max(0, elementTop - headerOffset);

        // Scroll smoothly to the position
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });

        // Update active ID and URL hash
        setActiveId(element.id);

        if (window.history?.pushState) {
          window.history.pushState(null, "", `#${element.id}`);
        }
      } else if (attempt < 15) {
        // Retry if element not found yet (DOM might still be rendering)
        setTimeout(() => findAndScroll(attempt + 1), 100);
      } else {
        // Final fallback: log for debugging
        const availableIds = Array.from(
          document.querySelectorAll(
            "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
          )
        ).map((el) => ({ id: el.id, text: (el.textContent || "").trim() }));

        console.warn(
          `Could not find element with id: "${id}".`,
          "\nClicked heading:",
          headings.find((h) => h.id === id),
          "\nAvailable headings in DOM:",
          availableIds
        );
      }
    };

    findAndScroll();
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? "default" : "outline"}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-40 lg:hidden",
          "h-12 w-12 rounded-full",
          "shadow-lg hover:shadow-xl"
        )}
        aria-label="Toggle table of contents"
      >
        <List className="h-5 w-5" />
      </Button>

      {/* Table of Contents - Desktop */}
      <aside
        className={cn(
          "fixed right-8 top-1/2 -translate-y-1/2 z-30",
          "w-80 max-h-[80vh]",
          "bg-popover border border-border rounded-lg",
          "shadow-lg",
          "flex flex-col",
          "hidden xl:flex",
          "transition-transform duration-300",
          className
        )}
      >
        {/* Fixed title header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Mục lục</h2>
        </div>
        {/* Scrollable content */}
        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;
            return (
              <a
                key={`${heading.id}-${index}`}
                href={`#${heading.id}`}
                onClick={(e) => handleClick(heading.id, e)}
                className={cn(
                  "block py-1.5 px-3 rounded-md",
                  "text-sm transition-colors duration-200",
                  "hover:bg-muted hover:text-highlight",
                  "cursor-pointer",
                  heading.level === 1 && "font-semibold text-base pl-3",
                  heading.level === 2 && "font-medium pl-4",
                  heading.level === 3 && "pl-6 text-muted-foreground",
                  heading.level === 4 && "pl-8 text-muted-foreground text-xs",
                  isActive &&
                    "bg-highlight/20 text-highlight border-l-2 border-highlight"
                )}
              >
                {heading.text}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50 lg:hidden",
              "w-96 max-w-[90vw]",
              "bg-popover border-l border-border",
              "shadow-2xl",
              "flex flex-col",
              "transition-transform duration-300",
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Fixed title header */}
            <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Mục lục
                </h2>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Scrollable content */}
            <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {headings.map((heading, index) => {
                const isActive = activeId === heading.id;
                return (
                  <a
                    key={`${heading.id}-${index}`}
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      handleClick(heading.id, e);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "block py-2 px-3 rounded-md",
                      "text-sm transition-colors duration-200",
                      "hover:bg-muted hover:text-highlight",
                      "cursor-pointer",
                      heading.level === 1 && "font-semibold text-base pl-3",
                      heading.level === 2 && "font-medium pl-4",
                      heading.level === 3 && "pl-6 text-muted-foreground",
                      heading.level === 4 &&
                        "pl-8 text-muted-foreground text-xs",
                      isActive &&
                        "bg-highlight/20 text-highlight border-l-2 border-highlight"
                    )}
                  >
                    {heading.text}
                  </a>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
