import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/blog-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{post.readTime} phút đọc</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
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
          <div className="text-sm text-muted-foreground">
            Đăng bởi {post.author} • {formatDate(post.publishedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
