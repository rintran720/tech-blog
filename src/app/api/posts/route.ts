import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPostsSupabase,
  createPostSupabase,
} from "@/lib/supabase-operations";

// GET /api/posts - Lấy danh sách bài viết
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

    const posts = await getPostsSupabase({
      published,
      featured: featured ? featured === "true" : undefined,
      category: category || undefined,
      authorId: authorId || undefined,
      tagSlugs: tagSlugs ? tagSlugs.split(",") : undefined,
      limit,
      offset,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Tạo bài viết mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      tagNames,
      published,
      featured,
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
      authorId: session.user.id,
      published: published || false,
      featured: featured || false,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
