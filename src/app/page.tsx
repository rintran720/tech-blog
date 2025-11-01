import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Calendar, User, Tag } from "lucide-react";
import { SmartSearch } from "@/components/ai/smart-search";
import { AuthButton } from "@/components/auth/auth-button";
import { AdminLink } from "@/components/navigation/admin-link";
import { DemoMenu } from "@/components/navigation/demo-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TagsOverflow } from "@/components/blog/tags-overflow";
import {
  getHotPostsSupabase,
  getRecentPostsSupabase,
  getRecommendedPostsSupabase,
} from "@/lib/supabase-operations";

// Force dynamic rendering to prevent build-time database calls
export const dynamic = "force-dynamic";

// Format date function
function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function Home() {
  const [hotPosts, recentPosts, recommendedPosts] = await Promise.all([
    getHotPostsSupabase(),
    getRecentPostsSupabase(),
    getRecommendedPostsSupabase(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Blog Công Nghệ</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link
                href="/blog"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <DemoMenu />
              <AdminLink />
              <ThemeToggle />
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-5xl font-bold">Blog Công Nghệ</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Khám phá những bài viết mới nhất về công nghệ, lập trình và phát
            triển phần mềm. Từ frontend đến backend, từ DevOps đến AI/ML.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/blog">
                Khám phá Blog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Tài liệu Next.js
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Hot Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">🔥 Bài viết nổi bật</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Những bài viết có hotScore cao nhất, được cộng đồng đánh giá tốt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {hotPosts.map((post) => (
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
                <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-all duration-300">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
                  >
                    {post.title}
                  </Link>
                </CardTitle>

                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 transition-colors duration-300 group-hover:text-foreground/80">
                  {post.excerpt || post.content.substring(0, 200) + "..."}
                </p>

                {/* Tags */}
                <TagsOverflow tags={post.tags || []} displayCount={3} />

                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center space-x-2 group/meta">
                    <div className="w-7 h-7 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                      <Calendar className="h-3.5 w-3.5 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                    </div>
                    <span className="transition-colors duration-300 group-hover:text-foreground">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 group/meta">
                    <div className="w-7 h-7 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                      <User className="h-3.5 w-3.5 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                    </div>
                    <span className="font-medium transition-colors duration-300 group-hover:text-foreground">
                      {post.author?.name || post.author?.email}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
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

      <Separator />

      {/* Smart Search Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tìm kiếm thông minh</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sử dụng AI để tìm kiếm nội dung phù hợp nhất với câu hỏi của bạn
          </p>
        </div>
        <SmartSearch />
      </section>

      <Separator />

      {/* Recommended Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">💡 Bài viết gợi ý</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá những bài viết thú vị được chọn ngẫu nhiên cho bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recommendedPosts.map((post) => (
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
                <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-all duration-300">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
                  >
                    {post.title}
                  </Link>
                </CardTitle>

                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 transition-colors duration-300 group-hover:text-foreground/80">
                  {post.excerpt || post.content.substring(0, 150) + "..."}
                </p>

                {/* Tags */}
                <TagsOverflow tags={post.tags || []} displayCount={2} />

                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center space-x-1.5 group/meta">
                    <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                      <Calendar className="h-3 w-3 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                    </div>
                    <span className="transition-colors duration-300 group-hover:text-foreground">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 group/meta">
                    <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                      <User className="h-3 w-3 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                    </div>
                    <span className="font-medium transition-colors duration-300 group-hover:text-foreground">
                      {post.author?.name || post.author?.email}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary group/link transition-all duration-300 hover:gap-3"
                >
                  <span>Đọc thêm</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
                </Link>
              </CardContent>

              {/* Bottom gradient border on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Recent Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Bài viết mới nhất</h2>
            <p className="text-muted-foreground">
              Cập nhật những kiến thức mới nhất trong lĩnh vực công nghệ
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link href="/blog">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recentPosts.map((post) => (
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
                <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-all duration-300">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 group-hover:after:w-full"
                  >
                    {post.title}
                  </Link>
                </CardTitle>

                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 transition-colors duration-300 group-hover:text-foreground/80">
                  {post.excerpt || post.content.substring(0, 150) + "..."}
                </p>

                {/* Tags */}
                <TagsOverflow tags={post.tags || []} displayCount={2} />

                {/* Meta information */}
                <div className="flex items-center space-x-1.5 group/meta text-xs text-muted-foreground pt-2">
                  <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110">
                    <Calendar className="h-3 w-3 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                  </div>
                  <span className="transition-colors duration-300 group-hover:text-foreground">
                    {formatDate(post.createdAt)}
                  </span>
                  <div className="w-6 h-6 bg-highlight/10 rounded-full flex items-center justify-center transition-all duration-300 group-hover/meta:bg-highlight/20 group-hover/meta:scale-110 ml-3">
                    <User className="h-3 w-3 text-highlight transition-transform duration-300 group-hover/meta:scale-110" />
                  </div>
                  <span className="font-medium transition-colors duration-300 group-hover:text-foreground">
                    {post.author?.name || post.author?.email}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary group/link transition-all duration-300 hover:gap-3"
                >
                  <span>Đọc thêm</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
                </Link>
              </CardContent>

              {/* Bottom gradient border on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng khám phá?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng developers và cập nhật những kiến thức mới nhất
            về công nghệ
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
            <Link href="/blog">
              Bắt đầu đọc ngay
              <BookOpen className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Separator />
    </div>
  );
}
