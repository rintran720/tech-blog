"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  MessageSquare,
  Tag,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  featured: boolean | null;
  category: string | null;
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
  _count: {
    comments: number;
  };
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

        const url = `/api/posts?${params}`;
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-highlight to-highlight-dark bg-clip-text mb-4 text-black">
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
                className="group hover:shadow-lg hover:shadow-highlight/10 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-highlight"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3 group-hover:text-primary transition-colors">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta information */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-highlight/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-highlight" />
                      </div>
                      <span className="font-medium">
                        {post.author.name || post.author.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-highlight/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-highlight" />
                      </div>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-highlight/10 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-highlight" />
                      </div>
                      <span>{post._count?.comments || 0} bình luận</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.tags.map((tag) => (
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
                          className="hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                          onClick={() => handleTagClick(tag.slug)}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    asChild
                    className="bg-highlight hover:bg-highlight-dark text-black"
                  >
                    <Link href={`/blog/${post.slug}`}>Đọc tiếp →</Link>
                  </Button>
                </CardContent>
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
