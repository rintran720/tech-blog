import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withResourcePermission } from "@/lib/auth-middleware";
import {
  getPostsSupabase,
  createPostSupabase,
} from "@/lib/supabase-operations";
import { generateId } from "@/lib/uuid";

// GET /api/admin/posts - Lấy danh sách tất cả posts
export const GET = async (request: NextRequest) => {
  try {
    // Simple session check - temporarily bypassed for testing
    // const token = await getToken({ req: request });
    // if (!token?.email) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    console.log("Filter params:", { page, limit, search, status });

    // Build options for Supabase query
    const options: any = {
      limit,
      offset,
    };

    // Apply status filter
    if (status && status !== "all") {
      options.published = status === "published";
    }

    const posts = await getPostsSupabase(options);

    // Apply search filter (client-side for now, can be optimized later)
    let filteredPosts = posts;
    if (search) {
      filteredPosts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      posts: filteredPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
};

// POST /api/admin/posts - Tạo bài viết mới
export const POST = async (request: NextRequest) => {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      published,
      featured,
      authorId,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 }
      );
    }

    const post = await createPostSupabase({
      title,
      slug,
      content,
      excerpt,
      category,
      authorId: authorId || token.sub,
      published: published || false,
      featured: featured || false,
    });

    if (!post) {
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
};
