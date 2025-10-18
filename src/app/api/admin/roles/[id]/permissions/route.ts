import { NextRequest, NextResponse } from "next/server";
import { checkAdminPermission } from "@/lib/auth-middleware";
import {
  getRolePermissionsSupabase,
  updateRolePermissionsSupabase,
} from "@/lib/supabase-operations";

// GET /api/admin/roles/[id]/permissions - Lấy permissions của role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { hasPermission, error } = await checkAdminPermission();

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = await params;
    const rolePermissions = await getRolePermissionsSupabase(id);

    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch role permissions" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id]/permissions - Cập nhật permissions của role
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
    const { permissions } = body; // Array of permission IDs or { permissionId, granted }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 }
      );
    }

    // Handle both formats: array of IDs or array of objects
    const permissionUpdates = permissions.map((perm) => {
      if (typeof perm === "string") {
        // Format: ["permission-id-1", "permission-id-2"]
        return { permissionId: perm, granted: true };
      } else {
        // Format: [{ permissionId: "id", granted: true }]
        return perm;
      }
    });

    // Use transaction to ensure consistency
    const results = await updateRolePermissionsSupabase(id, permissionUpdates);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return NextResponse.json(
      { error: "Failed to update role permissions" },
      { status: 500 }
    );
  }
}
