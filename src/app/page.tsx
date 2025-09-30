import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, BookOpen } from "lucide-react";
import { getFeaturedPosts, getAllPosts, getTagColor } from "@/lib/blog-data";
import { AIChat } from "@/components/ai/ai-chat";
import { SmartSearch } from "@/components/ai/smart-search";
import { ContentRecommendations } from "@/components/ai/content-recommendations";

export default function Home() {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
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
            <Button asChild size="lg">
              <Link href="/blog">
                Khám phá Blog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
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

      {/* Featured Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Bài viết nổi bật</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Những bài viết được chọn lọc về các chủ đề công nghệ hot nhất hiện
            tại
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {featuredPosts.map((post) => (
            <div
              key={post.id}
              className="group border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                <Badge className="bg-primary">Featured</Badge>
              </div>

              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>

              <p className="text-muted-foreground mb-4 line-clamp-3">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                asChild
                className="p-0 h-auto font-medium"
              >
                <Link href={`/blog/${post.slug}`}>
                  Đọc thêm
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
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

      {/* Recent Posts Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Bài viết mới nhất</h2>
            <p className="text-muted-foreground">
              Cập nhật những kiến thức mới nhất trong lĩnh vực công nghệ
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/blog">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              className="group border rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                {post.featured && (
                  <Badge className="bg-primary">Featured</Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>

              <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.tags.length - 2}
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                asChild
                className="p-0 h-auto font-medium text-sm"
              >
                <Link href={`/blog/${post.slug}`}>
                  Đọc thêm
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
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
          <Button size="lg" asChild>
            <Link href="/blog">
              Bắt đầu đọc ngay
              <BookOpen className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* AI Recommendations Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Gợi ý thông minh</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI phân tích sở thích và đề xuất nội dung phù hợp nhất cho bạn
          </p>
        </div>
        <ContentRecommendations
          userInterests={["React", "TypeScript", "Next.js"]}
        />
      </section>

      {/* AI Chat Assistant */}
      <AIChat />
    </div>
  );
}
