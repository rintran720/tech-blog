"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, BookOpen, Code, Lightbulb } from "lucide-react";
import {
  getAllPosts,
  getPostBySlug,
  getTagColor,
  BlogPost,
} from "@/lib/blog-data";
import Link from "next/link";

interface Recommendation {
  post: BlogPost;
  reason: string;
  score: number;
  type: "similar" | "trending" | "related" | "beginner" | "advanced";
}

interface ContentRecommendationsProps {
  currentPostSlug?: string;
  userInterests?: string[];
}

export function ContentRecommendations({
  currentPostSlug,
  userInterests = [],
}: ContentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);

    try {
      const allPosts = getAllPosts();
      const currentPost = currentPostSlug
        ? getPostBySlug(currentPostSlug)
        : null;

      const recs: Recommendation[] = [];

      // 1. Similar posts (same category/tags)
      if (currentPost) {
        const similarPosts = allPosts
          .filter((post) => post.id !== currentPost.id)
          .map((post) => {
            let score = 0;
            let reason = "";

            // Same category
            if (post.category === currentPost.category) {
              score += 3;
              reason = `Cùng chủ đề ${post.category}`;
            }

            // Common tags
            const commonTags = post.tags.filter((tag: string) =>
              currentPost.tags.includes(tag)
            );
            if (commonTags.length > 0) {
              score += commonTags.length * 2;
              reason = `Có {commonTags.length} tag chung: ${commonTags.join(
                ", "
              )}`;
            }

            return { post, reason, score, type: "similar" as const };
          })
          .filter((rec) => rec.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);

        recs.push(...similarPosts);
      }

      // 2. Trending posts (recent)
      // Use a fixed date to prevent hydration mismatch
      const thirtyDaysAgo = new Date("2024-01-01");
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingPosts = allPosts
        .filter((post) => new Date(post.publishedAt) > thirtyDaysAgo)
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 2)
        .map((post) => ({
          post,
          reason: post.featured ? "Bài viết nổi bật" : "Bài viết mới",
          score: post.featured ? 5 : 3,
          type: "trending" as const,
        }));

      recs.push(...trendingPosts);

      // 3. Related posts (based on user interests)
      if (userInterests.length > 0) {
        const relatedPosts = allPosts
          .filter((post) => !recs.some((rec) => rec.post.id === post.id))
          .map((post) => {
            let score = 0;
            const matchedInterests = userInterests.filter(
              (interest) =>
                post.tags.some(
                  (tag: string) =>
                    tag.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(tag.toLowerCase())
                ) ||
                post.category.toLowerCase().includes(interest.toLowerCase())
            );

            if (matchedInterests.length > 0) {
              score = matchedInterests.length * 2;
              return {
                post,
                reason: `Phù hợp với sở thích: ${matchedInterests.join(", ")}`,
                score,
                type: "related" as const,
              };
            }
            return null;
          })
          .filter((rec) => rec !== null)
          .sort((a, b) => b!.score - a!.score)
          .slice(0, 2) as Recommendation[];

        recs.push(...relatedPosts);
      }

      // 4. Beginner/Advanced posts
      const beginnerPosts = allPosts
        .filter(
          (post) =>
            post.tags.some((tag: string) =>
              ["beginner", "introduction", "getting started", "cơ bản"].some(
                (keyword) => tag.toLowerCase().includes(keyword)
              )
            ) && !recs.some((rec) => rec.post.id === post.id)
        )
        .slice(0, 1)
        .map((post) => ({
          post,
          reason: "Phù hợp cho người mới bắt đầu",
          score: 2,
          type: "beginner" as const,
        }));

      const advancedPosts = allPosts
        .filter(
          (post) =>
            post.tags.some((tag: string) =>
              [
                "advanced",
                "expert",
                "optimization",
                "best practices",
                "nâng cao",
              ].some((keyword) => tag.toLowerCase().includes(keyword))
            ) && !recs.some((rec) => rec.post.id === post.id)
        )
        .slice(0, 1)
        .map((post) => ({
          post,
          reason: "Nội dung nâng cao",
          score: 2,
          type: "advanced" as const,
        }));

      recs.push(...beginnerPosts, ...advancedPosts);

      // Remove duplicates and sort by score
      const uniqueRecs = recs
        .filter(
          (rec, index, self) =>
            index === self.findIndex((r) => r.post.id === rec.post.id)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRecommendations(uniqueRecs);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPostSlug, userInterests]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "similar":
        return <BookOpen className="h-4 w-4" />;
      case "trending":
        return <TrendingUp className="h-4 w-4" />;
      case "related":
        return <Lightbulb className="h-4 w-4" />;
      case "beginner":
        return <BookOpen className="h-4 w-4" />;
      case "advanced":
        return <Code className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "similar":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "trending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "related":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "beginner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Gợi ý cho bạn</h3>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Gợi ý cho bạn</h3>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.post.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{rec.post.category}</Badge>
                    {rec.post.featured && (
                      <Badge className="bg-primary">Featured</Badge>
                    )}
                    <Badge
                      className={`text-xs ${getRecommendationColor(rec.type)}`}
                    >
                      <div className="flex items-center gap-1">
                        {getRecommendationIcon(rec.type)}
                        <span className="capitalize">{rec.type}</span>
                      </div>
                    </Badge>
                  </div>

                  <CardTitle className="text-lg hover:text-primary transition-colors">
                    <Link href={`/blog/${rec.post.slug}`}>
                      {rec.post.title}
                    </Link>
                  </CardTitle>

                  <CardDescription className="mt-2">
                    {rec.post.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Lý do gợi ý:</strong> {rec.reason}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {rec.post.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                      {tag}
                    </Badge>
                  ))}
                  {rec.post.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{rec.post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button variant="outline" asChild>
          <Link href="/blog">Xem tất cả bài viết</Link>
        </Button>
      </div>
    </div>
  );
}
