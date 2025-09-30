import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, getTagColor } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContentRecommendations } from "@/components/ai/content-recommendations";
import { AIChat } from "@/components/ai/ai-chat";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Blog
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Badge variant="outline">{post.category}</Badge>
          {post.featured && (
            <Badge variant="default" className="bg-primary">
              Featured
            </Badge>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <p className="text-xl text-muted-foreground mb-6">{post.description}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <Badge key={tag} className={getTagColor(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <article className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </article>

      <div className="mt-12 pt-8 border-t">
        <div className="flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Xem thêm bài viết
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mt-16">
        <ContentRecommendations
          currentPostSlug={params.slug}
          userInterests={post.tags}
        />
      </div>

      {/* AI Chat Assistant */}
      <AIChat />
    </div>
  );
}
