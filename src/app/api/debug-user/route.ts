import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-supabase";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug user and roles...");

    // Get current session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          message: "Please login first",
        },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    console.log("📧 Checking user:", userEmail);

    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
      .from("jt_users")
      .select(
        `
        id,
        email,
        name,
        roleId,
        createdAt,
        updatedAt
      `
      )
      .eq("email", userEmail)
      .single();

    if (userError) {
      if (userError.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "User not found",
            message: "Please login at least once to create user record",
            email: userEmail,
          },
          { status: 404 }
        );
      } else {
        console.error("❌ Error fetching user:", userError);
        return NextResponse.json(
          {
            error: "Database error",
            message: userError.message,
          },
          { status: 500 }
        );
      }
    }

    // 2. Check all available roles
    const { data: roles, error: rolesError } = await supabase
      .from("jt_roles")
      .select("*")
      .eq("isActive", true)
      .order("name");

    if (rolesError) {
      console.error("❌ Error fetching roles:", rolesError);
    }

    // 3. Check user's current role
    let userRole = null;
    if (user.roleId) {
      const { data: role, error: roleError } = await supabase
        .from("jt_roles")
        .select("*")
        .eq("id", user.roleId)
        .single();

      if (roleError) {
        console.error("❌ Error fetching user role:", roleError);
      } else {
        userRole = role;
      }
    }

    // 4. Check admin access
    const hasAdminAccess =
      userRole?.name === "admin" ||
      userRole?.name === "Admin" ||
      userRole?.name === "Super Admin" ||
      userRole?.name === "super-admin";

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
      },
      userRole: userRole
        ? {
            id: userRole.id,
            name: userRole.name,
            slug: userRole.slug,
          }
        : null,
      availableRoles:
        roles?.map((role) => ({
          id: role.id,
          name: role.name,
          slug: role.slug,
        })) || [],
      hasAdminAccess,
      adminAccessReason: hasAdminAccess
        ? `User has ${userRole?.name} role`
        : userRole
        ? `User has ${userRole.name} role (not admin)`
        : "User has no role assigned",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
