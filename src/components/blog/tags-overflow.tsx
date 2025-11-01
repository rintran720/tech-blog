"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TagItem = {
  id: string;
  name: string;
  color: string;
  slug?: string;
};

interface TagsOverflowProps {
  tags: TagItem[];
  displayCount?: number; // how many to show before +N
}

export function TagsOverflow({ tags, displayCount = 3 }: TagsOverflowProps) {
  const [open, setOpen] = React.useState(false);
  const visible = React.useMemo(
    () => tags.slice(0, displayCount),
    [tags, displayCount]
  );
  const hidden = React.useMemo(
    () => tags.slice(displayCount),
    [tags, displayCount]
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <Badge
          key={tag.id}
          className="text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md"
          style={{
            backgroundColor: tag.color + "20",
            color: tag.color,
            borderColor: tag.color + "40",
          }}
          title={tag.name}
        >
          {tag.name}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <span
          className="inline-block"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs font-medium transition-all duration-300 hover:scale-110 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Hiển thị thêm ${hidden.length} thẻ`}
              >
                +{hidden.length}
              </Badge>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={2}
              className="w-56 p-3 z-20 bg-background"
            >
              <div className="flex flex-wrap gap-1.5">
                {hidden.map((tag) => (
                  <Badge
                    key={tag.id}
                    className="text-[10px]"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                      borderColor: tag.color + "40",
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </span>
      )}
    </div>
  );
}
