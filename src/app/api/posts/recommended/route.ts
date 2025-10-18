import { NextRequest, NextResponse } from "next/server";
import { getRecommendedPostsSupabase } from "@/lib/supabase-operations";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "3");

    const posts = await getRecommendedPostsSupabase(limit);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching recommended posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended posts" },
      { status: 500 }
    );
  }
};
