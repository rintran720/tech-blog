import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPost } from "@/lib/db-operations";
import { supabase } from "@/lib/supabase";

// GET /api/posts - Lấy danh sách bài viết sử dụng Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published") === "true";
    const featured = searchParams.get("featured");
    const category = searchParams.get("category");
    const authorId = searchParams.get("authorId");
    const tagSlugs = searchParams.get("tagSlugs");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("🔍 Fetching posts with params:", {
      published,
      featured,
      category,
      authorId,
      tagSlugs,
      limit,
      offset,
    });

    // Build the query
    let query = supabase.from("jt_posts").select(`
        id,
        title,
        slug,
        content,
        excerpt,
        published,
        featured,
        category,
        hotScore,
        createdAt,
        updatedAt,
        jt_users!jt_posts_authorId_fkey (
          id,
          name,
          email
        ),
        jt_post_tags (
          jt_tags (
            id,
            name,
            slug,
            color
          )
        ),
        jt_comments (count)
      `);

    // Apply filters
    if (published !== null) {
      query = query.eq("published", published);
    }

    if (featured !== null) {
      query = query.eq("featured", featured === "true");
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (authorId) {
      query = query.eq("authorId", authorId);
    }

    // Apply ordering and pagination
    query = query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase query failed:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedPosts =
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        featured: post.featured,
        category: post.category,
        hotScore: post.hotScore,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: (post.jt_users as any).id,
          name: (post.jt_users as any).name,
          email: (post.jt_users as any).email,
        },
        tags:
          post.jt_post_tags?.map((pt: any) => ({
            id: pt.jt_tags.id,
            name: pt.jt_tags.name,
            slug: pt.jt_tags.slug,
            color: pt.jt_tags.color,
          })) || [],
        _count: {
          comments: post.jt_comments?.length || 0,
        },
      })) || [];

    console.log(`✅ Successfully fetched ${transformedPosts.length} posts`);

    return NextResponse.json({
      posts: transformedPosts,
      hasMore: transformedPosts.length === limit,
      total: transformedPosts.length,
    });
  } catch (error) {
    console.error("❌ Error in /api/posts:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/posts - Tạo bài viết mới (fallback to Prisma for admin operations)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const post = await createPost({
      ...body,
      authorId: session.user.id,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
