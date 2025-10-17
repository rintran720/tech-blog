import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

// GET /api/admin/permissions/[id] - Lấy permission theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple session check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/permissions/[id] - Cập nhật permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { hasPermission, error } = await checkAdminPermission();

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, resource, action, isActive } = body;

    if (!name || !resource || !action) {
      return NextResponse.json(
        { error: "Name, resource, and action are required" },
        { status: 400 }
      );
    }

    const slug = `${resource}.${action}`;

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        resource,
        action,
        isActive,
      },
    });

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error("Error updating permission:", error);
    return NextResponse.json(
      { error: "Failed to update permission" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/permissions/[id] - Xóa permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { hasPermission, error } = await checkAdminPermission();

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = await params;
    await prisma.permission.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Permission deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 }
    );
  }
}
