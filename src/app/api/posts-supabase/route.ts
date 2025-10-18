import { NextRequest, NextResponse } from "next/server";
import { getPostsSupabase } from "@/lib/supabase-operations";

// GET /api/posts-supabase - Alias for /api/posts
// This endpoint provides backward compatibility for existing clients
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
