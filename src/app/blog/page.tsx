"use client";

import { useState, useMemo } from "react";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import { FeaturedPosts } from "@/components/blog/featured-posts";
import {
  getAllPosts,
  getFeaturedPosts,
  getPostsByCategory,
} from "@/lib/blog-data";
import { Separator } from "@/components/ui/separator";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") {
      return allPosts;
    }
    return getPostsByCategory(selectedCategory);
  }, [selectedCategory, allPosts]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog Công Nghệ</h1>
        <p className="text-lg text-muted-foreground">
          Khám phá những bài viết mới nhất về công nghệ, lập trình và phát triển
          phần mềm
        </p>
      </div>

      <FeaturedPosts posts={featuredPosts} />

      <Separator className="my-8" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Tất cả bài viết</h2>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Không có bài viết nào trong chủ đề &quot;{selectedCategory}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
