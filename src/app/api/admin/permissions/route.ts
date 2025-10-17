import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAdminPermission } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/uuid";

// GET /api/admin/permissions - Lấy danh sách permissions
export const GET = async (request: NextRequest) => {
  try {
    // Simple session check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
};

// POST /api/admin/permissions - Tạo permission mới
export const POST = async (request: NextRequest) => {
  try {
    // Simple session check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, resource, action } = body;

    if (!name || !resource || !action) {
      return NextResponse.json(
        { error: "Name, resource, and action are required" },
        { status: 400 }
      );
    }

    const slug = `${resource}.${action}`;

    const permission = await prisma.permission.create({
      data: {
        id: generateId(),
        name,
        slug,
        description,
        resource,
        action,
      },
    });

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
};
