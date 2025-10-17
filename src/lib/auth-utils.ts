import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db-operations";

export async function checkAdminPermission(): Promise<{
  hasPermission: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    const dbUser = await getUserByEmail(session.user.email);

    if (!dbUser) {
      return { hasPermission: false, error: "User not found" };
    }

    // Kiểm tra role - chỉ Super Admin và Admin mới có quyền
    if (
      !(dbUser as any).role ||
      !["Super Admin", "Admin"].includes((dbUser as any).role.name)
    ) {
      return {
        hasPermission: false,
        error: "Insufficient permissions",
        user: dbUser,
      };
    }

    return { hasPermission: true, user: dbUser };
  } catch (error) {
    console.error("Error checking admin permission:", error);
    return { hasPermission: false, error: "Internal server error" };
  }
}

export async function checkPermission(permission: string): Promise<{
  hasPermission: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    const dbUser = await getUserByEmail(session.user.email);

    if (!dbUser) {
      return { hasPermission: false, error: "User not found" };
    }

    // Kiểm tra role và permissions
    if (!(dbUser as any).role) {
      return { hasPermission: false, error: "No role assigned" };
    }

    const permissions = (dbUser as any).role.permissions as string[];

    if (!permissions.includes(permission)) {
      return {
        hasPermission: false,
        error: "Insufficient permissions",
        user: dbUser,
      };
    }

    return { hasPermission: true, user: dbUser };
  } catch (error) {
    console.error("Error checking permission:", error);
    return { hasPermission: false, error: "Internal server error" };
  }
}
