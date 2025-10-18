import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  approveCommentAdminSupabase,
  rejectCommentAdminSupabase,
} from "@/lib/supabase-operations";

// PUT /api/admin/comments/[id]/approve - Approve comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Thêm logic kiểm tra quyền admin

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "approve") {
      const comment = await approveCommentAdminSupabase(id);

      if (!comment) {
        return NextResponse.json(
          { error: "Failed to approve comment" },
          { status: 500 }
        );
      }

      return NextResponse.json({ comment });
    } else if (action === "reject") {
      const success = await rejectCommentAdminSupabase(id);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to reject comment" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Comment rejected and deleted" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}
