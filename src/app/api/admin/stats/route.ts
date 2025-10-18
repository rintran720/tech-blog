import { NextRequest, NextResponse } from "next/server";
import { withAdminPermission } from "@/lib/auth-middleware";
import { getPostStatsSupabase } from "@/lib/supabase-operations";

// GET /api/admin/stats - Lấy thống kê tổng quan
export const GET = withAdminPermission(
  async (request: NextRequest, context: any, user: any) => {
    try {
      const stats = await getPostStatsSupabase();
      return NextResponse.json({ stats });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }
  }
);
