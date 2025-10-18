import { NextRequest, NextResponse } from "next/server";
import { withAdminPermission } from "@/lib/auth-middleware";
import { getUsersSupabase } from "@/lib/supabase-operations";

// GET /api/admin/users - Lấy danh sách tất cả users
export const GET = withAdminPermission(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    const options: any = {};
    if (email) {
      options.search = email;
    }

    const users = await getUsersSupabase(options);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
});
