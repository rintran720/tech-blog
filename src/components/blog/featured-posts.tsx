"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BlogPost, getTagColor } from "@/lib/blog-data";

interface FeaturedPostsProps {
  readonly posts: BlogPost[];
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-6 w-6 text-primary animate-pulse" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Bài viết nổi bật
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="group relative h-full overflow-hidden border-2 border-transparent bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10"
          >
            {/* Animated gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-5" />

            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-none group-hover:transition-transform group-hover:duration-1000 group-hover:translate-x-full" />

            {/* Left accent border */}
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <CardHeader className="relative z-10 space-y-3">
              <CardTitle className="line-clamp-2 text-xl font-bold leading-tight group-hover:text-primary transition-all duration-300">
                <Link
                  href={`/blog/${post.slug}`}
                  className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
                >
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-3 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                {post.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <Badge
                    key={tag}
                    className={`text-xs font-medium transition-all duration-300 hover:scale-110 hover:shadow-md ${getTagColor(
                      tag
                    )}`}
                  >
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium transition-all duration-300 hover:scale-110"
                  >
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>
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
        ))}
      </div>
    </section>
  );
}
