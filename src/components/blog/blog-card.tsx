"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BlogPost, getTagColor } from "@/lib/blog-data";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BlogCardProps {
  readonly post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const hiddenTags = React.useMemo(() => post.tags.slice(3), [post.tags]);
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="group relative h-full overflow-hidden border-2 border-transparent bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-5" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-none group-hover:transition-transform group-hover:duration-1000 group-hover:translate-x-full" />

      {/* Left accent border */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <CardHeader className="relative z-10 space-y-3">
        {/* Title with hover effect */}
        <CardTitle className="line-clamp-2 text-xl font-bold leading-tight group-hover:text-primary transition-all duration-300">
          <Link
            href={`/blog/${post.slug}`}
            className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
          >
            {post.title}
          </Link>
        </CardTitle>

        {/* Description */}
        <CardDescription className="line-clamp-3 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
          {post.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Tags section */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={tag}
              className={`text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md ${getTagColor(
                tag
              )}`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {tag}
            </Badge>
          ))}
          {post.tags.length > 3 && (
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
                  >
                    +{post.tags.length - 3}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={2}
                  className="w-56 p-3 z-20 bg-background"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {hiddenTags.map((tag) => (
                      <Badge
                        key={tag}
                        className={`text-[10px] ${getTagColor(tag)}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </span>
          )}
        </div>

        {/* Read more link */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary group/link transition-all duration-300 hover:gap-3"
        >
          <span>Đọc thêm</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </CardContent>

      {/* Bottom gradient border on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Card>
  );
}
