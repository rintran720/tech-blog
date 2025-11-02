import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlugSupabase } from "@/lib/supabase-operations";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Force dynamic rendering to prevent build-time database calls
export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugSupabase(slug);

  if (!post) {
    return {
      title: "Bài viết không tồn tại",
      description: "Bài viết bạn đang tìm kiếm không tồn tại.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${slug}`;
  const excerpt =
    post.excerpt || post.content.substring(0, 160).replace(/\n/g, " ").trim();
  const authorName = post.author?.name || post.author?.email || "Tác giả";
  const tags = post.tags?.map((tag) => tag.name).join(", ") || "";
  const publishedTime = new Date(post.createdAt).toISOString();
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedTime;

  return {
    title: `${post.title} | Blog Công Nghệ`,
    description: excerpt,
    keywords: tags
      ? `${tags}, công nghệ, lập trình, phát triển phần mềm, blog`
      : "công nghệ, lập trình, phát triển phần mềm, blog",
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: "Blog Công Nghệ",
    category: post.tags?.[0]?.name || "Công nghệ",
    openGraph: {
      title: post.title,
      description: excerpt,
      url: postUrl,
      siteName: "Blog Công Nghệ",
      locale: "vi_VN",
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [authorName],
      tags: post.tags?.map((tag) => tag.name) || [],
      images: [
        {
          url:
            post.author && "image" in post.author && post.author.image
              ? (post.author.image as string)
              : `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
      images: [
        post.author && "image" in post.author && post.author.image
          ? (post.author.image as string)
          : `${siteUrl}/og-image.jpg`,
      ],
      creator: `@${authorName.replace(/\s+/g, "")}`,
    },
    alternates: {
      canonical: postUrl,
    },
    robots: {
      index: post.published !== false,
      follow: true,
      googleBot: {
        index: post.published !== false,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "article:published_time": publishedTime,
      "article:modified_time": modifiedTime,
      "article:author": authorName,
      "article:section": post.tags?.[0]?.name || "Công nghệ",
      "article:tag": tags,
    },
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await getPostBySlugSupabase(slug); // Get published post by slug

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${slug}`;
  const publishedTime = new Date(post.createdAt).toISOString();
  const modifiedTime = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedTime;
  const authorName = post.author?.name || post.author?.email || "Tác giả";

  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image:
      post.author && "image" in post.author && post.author.image
        ? (post.author.image as string)
        : `${siteUrl}/og-image.jpg`,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    author: {
      "@type": "Person",
      name: authorName,
      email: post.author?.email,
      image:
        post.author && "image" in post.author && post.author.image
          ? (post.author.image as string)
          : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "Blog Công Nghệ",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    keywords: post.tags?.map((tag) => tag.name).join(", ") || "",
    articleSection: post.tags?.[0]?.name || "Công nghệ",
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
              <div className="text-sm text-muted-foreground">
                Blog công nghệ
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl relative">
          {/* Table of Contents */}
          <TableOfContents content={post.content} />

          {/* Back button */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách bài viết
              </Link>
            </Button>
          </nav>

          {/* Article */}
          <article
            itemScope
            itemType="https://schema.org/BlogPosting"
            className="space-y-6"
          >
            {/* Header */}
            <header className="space-y-4">
              <div className="space-y-2">
                <h1
                  itemProp="headline"
                  className="text-4xl font-bold tracking-tight text-foreground"
                >
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p
                    itemProp="description"
                    className="text-xl text-muted-foreground"
                  >
                    {post.excerpt}
                  </p>
                )}
              </div>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div
                  itemProp="author"
                  itemScope
                  itemType="https://schema.org/Person"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span itemProp="name">
                    {post.author?.name || post.author?.email}
                  </span>
                  {post.author?.email && (
                    <meta itemProp="email" content={post.author.email} />
                  )}
                </div>
                <time
                  itemProp="datePublished"
                  dateTime={publishedTime}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.createdAt)}</span>
                </time>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <time
                    itemProp="dateModified"
                    dateTime={modifiedTime}
                    className="text-xs text-muted-foreground"
                  >
                    (Cập nhật: {formatDate(post.updatedAt)})
                  </time>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2" itemProp="keywords">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                      className="hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </header>

            {/* Content */}
            <div itemProp="articleBody" className="prose prose-lg max-w-none">
              <MarkdownViewer content={post.content} />
            </div>
          </article>

          {/* Author info */}
          <aside className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Về tác giả</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  itemScope
                  itemType="https://schema.org/Person"
                  className="flex items-center space-x-4"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {post.author &&
                    "image" in post.author &&
                    post.author.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        itemProp="image"
                        src={post.author.image as string}
                        alt={post.author?.name || "Author"}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 itemProp="name" className="font-semibold">
                      {post.author?.name || "Tác giả"}
                    </h3>
                    {post.author?.email && (
                      <p
                        itemProp="email"
                        className="text-sm text-muted-foreground"
                      >
                        {post.author.email}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
