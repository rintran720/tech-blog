import { NextResponse } from "next/server";
import { getHotPostsSupabase } from "@/lib/supabase-operations";

// GET /api/posts/hot - Lấy 2 bài viết có hotScore cao nhất
export const GET = async () => {
  try {
    const posts = await getHotPostsSupabase(2);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching hot posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch hot posts" },
      { status: 500 }
    );
  }
};
