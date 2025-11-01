"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Author {
  id: string;
  name: string | null;
  email: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function BlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get filters from URL parameters
  const filters = useMemo(
    () => ({
      tagSlugs: searchParams.get("tagSlugs")?.split(",").filter(Boolean) || [],
      authorId: searchParams.get("authorId") || "",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    }),
    [searchParams]
  );

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (isFetching) {
        console.log("fetchPosts: Already fetching, skipping");
        return; // Prevent multiple simultaneous requests
      }

      console.log(
        `fetchPosts: Starting ${reset ? "reset" : "load more"} request`
      );
      try {
        setIsFetching(true);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const offset = reset ? 0 : posts?.length || 0;
        const params = new URLSearchParams({
          published: "true",
          limit: filters.limit.toString(),
          offset: offset.toString(),
          ...(filters.tagSlugs.length > 0 && {
            tagSlugs: filters.tagSlugs.join(","),
          }),
          ...(filters.authorId && { authorId: filters.authorId }),
        });

        const url = `/api/posts-supabase?${params}`;
        console.log("Fetching posts from:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newPosts = data.posts || [];

        if (reset) {
          setPosts(newPosts);
          setCurrentPage(1);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((post) => post.id));
            const uniqueNewPosts = newPosts.filter(
              (post: Post) => !existingIds.has(post.id)
            );
            return [...prev, ...uniqueNewPosts];
          });
          setCurrentPage((prev) => prev + 1);
        }

        // Check if there are more posts
        setHasMore(newPosts.length === filters.limit);
        console.log(
          `fetchPosts: Completed ${reset ? "reset" : "load more"}, got ${
            newPosts.length
          } posts`
        );
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch posts"
        );
        setLoading(false);
        setLoadingMore(false);
        setIsFetching(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsFetching(false);
      }
    },
    [isFetching, filters.limit, filters.tagSlugs, filters.authorId]
  );

  // Load initial data once
  useEffect(() => {
    console.log("Initial load - fetching tags and authors");
    fetchTags();
    fetchAuthors();
  }, []);

  // Load posts when searchParams change
  useEffect(() => {
    console.log("useEffect triggered, searchParams:", searchParams.toString());
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    fetchPosts(true);
  }, [searchParams]);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/admin/tags");
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setAuthors(data.users || []);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const handleTagClick = (tagSlug: string) => {
    const params = new URLSearchParams(searchParams);
    const currentTagSlugs =
      params.get("tagSlugs")?.split(",").filter(Boolean) || [];

    // Toggle tag: add if not present, remove if present
    const newTagSlugs = currentTagSlugs.includes(tagSlug)
      ? currentTagSlugs.filter((slug) => slug !== tagSlug)
      : [...currentTagSlugs, tagSlug];

    if (newTagSlugs.length > 0) {
      params.set("tagSlugs", newTagSlugs.join(","));
    } else {
      params.delete("tagSlugs");
    }

    params.set("page", "1");
    router.push(`/blog?${params.toString()}`);
  };

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore && !isFetching) {
      fetchPosts(false);
    }
  }, [loadingMore, hasMore, isFetching, fetchPosts]);

  // Infinite scroll effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (
          window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000
        ) {
          loadMorePosts();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMorePosts]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trang chủ
              </Link>
            </Button>
            <div className="text-sm text-muted-foreground font-bold">
              Blog công nghệ
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-highlight to-highlight-dark bg-clip-text mb-4 text-transparent">
            Blog Công Nghệ
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Khám phá những bài viết mới nhất về{" "}
            <span className="text-highlight font-semibold">công nghệ</span>,{" "}
            <span className="text-highlight font-semibold">lập trình</span> và{" "}
            <span className="text-highlight font-semibold">
              phát triển phần mềm
            </span>
          </p>
        </div>

        {/* Filter Indicator */}
        {filters.tagSlugs.length > 0 && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-highlight/10 border border-highlight/20 rounded-full px-4 py-2">
              <Tag className="h-4 w-4 text-highlight" />
              <span className="text-sm text-highlight font-medium">
                Đang hiển thị bài viết với thẻ:{" "}
                {(() => {
                  if (filters.tagSlugs.length === 1) {
                    const tagName = tags.find(
                      (t) => t.slug === filters.tagSlugs[0]
                    )?.name;
                    return tagName || filters.tagSlugs[0];
                  }
                  return `${filters.tagSlugs.length} thẻ`;
                })()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/blog")}
                className="h-6 w-6 p-0 text-highlight hover:text-highlight-dark"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Posts grid */}
        <div className="space-y-6">
          {(() => {
            if (loading) {
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Đang tải...</p>
                  </CardContent>
                </Card>
              );
            }
            if (error) {
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-red-500">Lỗi: {error}</p>
                    <Button
                      onClick={() => {
                        setError(null);
                        fetchPosts(true);
                      }}
                      className="mt-4"
                    >
                      Thử lại
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            if (posts?.length === 0) {
              const emptyMessage =
                filters.tagSlugs.length > 0 || filters.authorId
                  ? "Không tìm thấy bài viết nào với bộ lọc hiện tại."
                  : "Chưa có bài viết nào được xuất bản.";
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                  </CardContent>
                </Card>
              );
            }
            return posts.map((post) => (
              <Card
                key={post.id}
                className="group relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-[1.01] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10"
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-5" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-none group-hover:transition-transform group-hover:duration-1000 group-hover:translate-x-full" />

                {/* Left accent border */}
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3 font-bold leading-tight group-hover:text-primary transition-all duration-300">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-4 text-base leading-relaxed transition-colors duration-300 group-hover:text-foreground/80">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta information */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 group/meta">
                      <div className="w-8 h-8 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                        <User className="h-4 w-4 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                      </div>
                      <span className="font-medium transition-colors duration-300 group-hover:text-foreground">
                        {post.author.name || post.author.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 group/meta">
                      <div className="w-8 h-8 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                        <Calendar className="h-4 w-4 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                      </div>
                      <span className="transition-colors duration-300 group-hover:text-foreground">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag, index) => (
                        <Badge
                          key={tag.id}
                          variant={
                            filters.tagSlugs.includes(tag.slug)
                              ? "default"
                              : "secondary"
                          }
                          style={{
                            backgroundColor: filters.tagSlugs.includes(tag.slug)
                              ? tag.color
                              : `${tag.color}20`,
                            color: filters.tagSlugs.includes(tag.slug)
                              ? "white"
                              : tag.color,
                            borderColor: tag.color,
                          }}
                          className="font-medium transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
                          onClick={() => handleTagClick(tag.slug)}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <Button
                    asChild
                    className="group/button bg-gradient-to-r from-highlight to-highlight/90 hover:from-highlight-dark hover:to-highlight text-primary-foreground font-semibold shadow-lg shadow-highlight/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-highlight/40"
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2"
                    >
                      Đọc thêm
                      <ArrowLeft className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover/button:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>

                {/* Bottom gradient border on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Card>
            ));
          })()}
        </div>

        {/* Load More Section */}
        {posts.length > 0 && (
          <div className="mt-8 text-center">
            {(() => {
              if (loadingMore) {
                return (
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải thêm bài viết...</span>
                  </div>
                );
              }
              if (hasMore) {
                return (
                  <Button
                    onClick={loadMorePosts}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Tải thêm bài viết
                  </Button>
                );
              }
              return (
                <p className="text-muted-foreground">
                  Đã hiển thị tất cả bài viết ({posts.length} bài)
                </p>
              );
            })()}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground">
          <p>© 2025 Blog công nghệ. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogPageContent />
    </Suspense>
  );
}
