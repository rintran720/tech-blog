import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  approveCommentSupabase,
  deleteCommentSupabase,
} from "@/lib/supabase-operations";

// PUT /api/comments/[id] - Approve comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // TODO: Thêm logic kiểm tra quyền admin/moderator
    const success = await approveCommentSupabase(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to approve comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Comment approved successfully" });
  } catch (error) {
    console.error("Error approving comment:", error);
    return NextResponse.json(
      { error: "Failed to approve comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Xóa comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // TODO: Thêm logic kiểm tra quyền sở hữu hoặc admin
    const success = await deleteCommentSupabase(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
