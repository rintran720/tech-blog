"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  readonly content: string;
  readonly className?: string;
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

// Generate SEO-friendly ID from heading text
function generateHeadingId(text: string): string {
  return removeVietnameseAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  // Pre-generate heading IDs in order (same as parseHeadings in table-of-contents)
  // This ensures IDs match exactly between markdown-viewer and table-of-contents
  const headingIdsByOrder = React.useMemo(() => {
    const ids: Array<{ text: string; id: string }> = [];
    const idCounts = new Map<string, number>();
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const text = match[2].trim();
        const baseId = generateHeadingId(text);

        // Generate unique ID with same logic as table-of-contents
        let uniqueId = baseId;
        if (idCounts.has(baseId)) {
          const count = idCounts.get(baseId)! + 1;
          idCounts.set(baseId, count);
          uniqueId = `${baseId}-${count}`;
        } else {
          idCounts.set(baseId, 0);
        }

        ids.push({ text: text.toLowerCase().trim(), id: uniqueId });
      }
    }

    return ids;
  }, [content]);

  // Track heading index during render
  const headingIndexRef = React.useRef<number>(0);

  // Reset when content changes
  React.useEffect(() => {
    headingIndexRef.current = 0;
  }, [content]);

  const getUniqueId = React.useCallback(
    (text: string, fallback: string): string => {
      const normalizedText = text.toLowerCase().trim();
      const currentIndex = headingIndexRef.current;

      // Try to match by index and text for accuracy
      if (currentIndex < headingIdsByOrder.length) {
        const expectedHeading = headingIdsByOrder[currentIndex];

        // If text matches, use the pre-generated ID
        if (expectedHeading.text === normalizedText) {
          headingIndexRef.current = currentIndex + 1;
          return expectedHeading.id;
        }

        // If text doesn't match, try to find it in the remaining headings
        // (in case ReactMarkdown renders in different order)
        for (let i = currentIndex + 1; i < headingIdsByOrder.length; i++) {
          if (headingIdsByOrder[i].text === normalizedText) {
            // Found match later, use it but this is not ideal
            headingIndexRef.current = i + 1;
            return headingIdsByOrder[i].id;
          }
        }
      }

      // Fallback: generate ID on the fly if not found
      const baseId = generateHeadingId(text) || fallback;
      headingIndexRef.current = currentIndex + 1;
      return baseId;
    },
    [headingIdsByOrder]
  );

  return (
    <div
      className={cn(
        "markdown-content prose prose-lg max-w-none",
        // Typography
        "prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight",
        "prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b prose-h1:border-border prose-h1:pb-4",
        "prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-highlight",
        "prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6",
        "prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4",
        "prose-h5:text-lg prose-h5:mb-2 prose-h5:mt-3",
        "prose-h6:text-base prose-h6:mb-2 prose-h6:mt-2",

        // Paragraphs and text
        "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground prose-em:italic",

        // Links
        "prose-a:text-highlight prose-a:no-underline hover:prose-a:underline hover:prose-a:text-highlight-dark",
        "prose-a:transition-colors prose-a:duration-200",

        // Lists
        "prose-ul:text-foreground prose-ol:text-foreground",
        "prose-li:text-foreground prose-li:mb-1",
        "prose-li:marker:text-muted-foreground",

        // Code
        "prose-code:text-foreground prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto",
        "prose-pre:shadow-sm",

        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-highlight prose-blockquote:bg-highlight-muted/30 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:text-muted-foreground prose-blockquote:italic",
        "prose-blockquote:shadow-sm",

        // Tables
        "prose-table:border-collapse prose-table:w-full prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden",
        "prose-th:bg-muted prose-th:text-foreground prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border-b prose-th:border-border",
        "prose-td:text-foreground prose-td:p-3 prose-td:border-b prose-td:border-border prose-td:text-sm",
        "prose-tr:hover:bg-muted/50 prose-tr:transition-colors",

        // Images
        "prose-img:rounded-lg prose-img:shadow-md prose-img:border prose-img:border-border",

        // Horizontal rules
        "prose-hr:border-border prose-hr:my-8",

        // Custom spacing
        "prose>*:first-child:mt-0 prose>*:last-child:mb-0",

        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for better styling
          h1: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-1");
            return (
              <h1
                id={id}
                {...props}
                className="text-4xl font-bold mb-6 mt-8 text-foreground border-b border-border pb-4 tracking-tight scroll-mt-20"
              >
                {children}
              </h1>
            );
          },
          h2: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-2");
            return (
              <h2
                id={id}
                {...props}
                className="text-3xl font-bold mb-4 mt-8 text-highlight tracking-tight scroll-mt-20"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-3");
            return (
              <h3
                id={id}
                {...props}
                className="text-2xl font-bold mb-3 mt-6 text-foreground tracking-tight scroll-mt-20"
              >
                {children}
              </h3>
            );
          },
          h4: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-4");
            return (
              <h4
                id={id}
                {...props}
                className="text-xl font-semibold mb-2 mt-4 text-foreground tracking-tight scroll-mt-20"
              >
                {children}
              </h4>
            );
          },
          h5: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-5");
            return (
              <h5
                id={id}
                {...props}
                className="text-lg font-semibold mb-2 mt-3 text-foreground tracking-tight scroll-mt-20"
              >
                {children}
              </h5>
            );
          },
          h6: ({ children, ...props }) => {
            const getText = (node: React.ReactNode): string => {
              if (typeof node === "string") return node;
              if (typeof node === "number") return String(node);
              if (Array.isArray(node)) {
                return node.map(getText).join("");
              }
              if (React.isValidElement(node)) {
                const props = node.props as { children?: React.ReactNode };
                if (props.children) {
                  return getText(props.children);
                }
              }
              return "";
            };
            const text = getText(children);
            const id = getUniqueId(text, "heading-6");
            return (
              <h6
                id={id}
                {...props}
                className="text-base font-semibold mb-2 mt-2 text-foreground tracking-tight scroll-mt-20"
              >
                {children}
              </h6>
            );
          },
          p: ({ children }) => (
            <p className="mb-4 text-foreground leading-relaxed text-base">
              {children}
            </p>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <code
                className={cn(
                  "relative rounded-md bg-muted px-2 py-1 font-mono text-sm text-foreground",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={cn(
                  "relative rounded-md bg-muted px-2 py-1 font-mono text-sm text-foreground",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-6 overflow-x-auto rounded-lg bg-muted p-4 border border-border shadow-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-6 border-l-4 border-highlight bg-highlight-muted/30 p-4 rounded-r-lg italic text-muted-foreground shadow-sm">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc text-foreground space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal text-foreground space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground leading-relaxed">{children}</li>
          ),
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full border-collapse shadow-sm rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-3 text-left font-semibold text-foreground bg-muted">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-3 text-foreground text-sm">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-highlight hover:text-highlight-dark underline-offset-4 hover:underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <Image
              src={src as string}
              alt={alt || ""}
              width={800}
              height={400}
              className="rounded-lg shadow-md border border-border max-w-full h-auto"
            />
          ),
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
