"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
  readonly placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
  placeholder = "Viết nội dung bằng markdown...",
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className={cn("w-full markdown-editor", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPreview(false)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              !isPreview
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            ✏️ Viết
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              isPreview
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            👁️ Xem trước
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          {isPreview ? "Chế độ xem trước" : "Chế độ chỉnh sửa"}
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-sm">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          preview={isPreview ? "preview" : "edit"}
          data-color-mode="light"
          height={500}
          textareaProps={{
            placeholder,
            style: {
              fontSize: 14,
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
              lineHeight: 1.6,
              padding: "1rem",
            },
          }}
          hideToolbar={false}
          style={{
            backgroundColor: "hsl(var(--color-background))",
            color: "hsl(var(--color-foreground))",
          }}
        />
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground">
        💡 <strong>Mẹo:</strong> Sử dụng Markdown để định dạng văn bản.{" "}
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Xem hướng dẫn Markdown
        </a>
      </div>
    </div>
  );
}
