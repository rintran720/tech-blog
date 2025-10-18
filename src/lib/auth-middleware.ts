import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getUserByEmailSupabase } from "./supabase-operations";
import {
  hasPermission,
  hasAnyPermission,
  hasResourcePermission,
} from "./permissions";

interface PermissionCheckResult {
  hasPermission: boolean;
  error?: string;
  user?: any;
}

// Middleware để kiểm tra permission cụ thể
export async function checkPermission(
  requiredPermission: string
): Promise<PermissionCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { hasPermission: false, error: "Unauthorized" };
  }

  const dbUser = await getUserByEmailSupabase(session.user.email);

  if (!dbUser || !(dbUser as any).role) {
    return {
      hasPermission: false,
      error: "Forbidden: User has no assigned role",
    };
  }

  const hasRequiredPermission = await hasPermission(
    dbUser.id,
    requiredPermission
  );

  if (!hasRequiredPermission) {
    return {
      hasPermission: false,
      error: `Forbidden: Missing permission "${requiredPermission}"`,
      user: dbUser,
    };
  }

  return { hasPermission: true, user: dbUser };
}

// Middleware để kiểm tra một trong nhiều permissions
export async function checkAnyPermission(
  permissions: string[]
): Promise<PermissionCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { hasPermission: false, error: "Unauthorized" };
  }

  const dbUser = await getUserByEmailSupabase(session.user.email);

  if (!dbUser || !(dbUser as any).role) {
    return {
      hasPermission: false,
      error: "Forbidden: User has no assigned role",
    };
  }

  const hasAnyRequiredPermission = await hasAnyPermission(
    dbUser.id,
    permissions
  );

  if (!hasAnyRequiredPermission) {
    return {
      hasPermission: false,
      error: `Forbidden: Missing any of permissions [${permissions.join(
        ", "
      )}]`,
      user: dbUser,
    };
  }

  return { hasPermission: true, user: dbUser };
}

// Middleware để kiểm tra permission theo resource và action
export async function checkResourcePermission(
  resource: string,
  action: string
): Promise<PermissionCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { hasPermission: false, error: "Unauthorized" };
  }

  const dbUser = await getUserByEmailSupabase(session.user.email);

  if (!dbUser || !(dbUser as any).role) {
    return {
      hasPermission: false,
      error: "Forbidden: User has no assigned role",
    };
  }

  const hasRequiredPermission = await hasResourcePermission(
    dbUser.id,
    resource,
    action
  );

  if (!hasRequiredPermission) {
    return {
      hasPermission: false,
      error: `Forbidden: Missing permission "${resource}.${action}"`,
      user: dbUser,
    };
  }

  return { hasPermission: true, user: dbUser };
}

// Middleware để kiểm tra admin permission (Super Admin hoặc Admin)
export async function checkAdminPermission(): Promise<PermissionCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { hasPermission: false, error: "Unauthorized" };
  }

  const dbUser = await getUserByEmailSupabase(session.user.email);

  if (!dbUser || !(dbUser as any).role) {
    return {
      hasPermission: false,
      error: "Forbidden: User has no assigned role",
    };
  }

  if (!["Super Admin", "Admin"].includes((dbUser as any).role.name)) {
    return {
      hasPermission: false,
      error: "Forbidden: Only Super Admin and Admin can access this resource",
      user: dbUser,
    };
  }

  return { hasPermission: true, user: dbUser };
}

// Higher-order function để wrap API routes với permission check
export function withPermission(permission: string) {
  return function (
    handler: (
      req: NextRequest,
      context: any,
      user: any
    ) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      const { hasPermission, error, user } = await checkPermission(permission);

      if (!hasPermission) {
        return NextResponse.json({ error }, { status: 401 });
      }

      return handler(req, context, user);
    };
  };
}

export function withAnyPermission(permissions: string[]) {
  return function (
    handler: (
      req: NextRequest,
      context: any,
      user: any
    ) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      const { hasPermission, error, user } = await checkAnyPermission(
        permissions
      );

      if (!hasPermission) {
        return NextResponse.json({ error }, { status: 401 });
      }

      return handler(req, context, user);
    };
  };
}

export function withResourcePermission(resource: string, action: string) {
  return function (
    handler: (
      req: NextRequest,
      context: any,
      user: any
    ) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context: any) => {
      const { hasPermission, error, user } = await checkResourcePermission(
        resource,
        action
      );

      if (!hasPermission) {
        return NextResponse.json({ error }, { status: 401 });
      }

      return handler(req, context, user);
    };
  };
}

export function withAdminPermission(
  handler: (req: NextRequest, context: any, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const { hasPermission, error, user } = await checkAdminPermission();

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: 401 });
    }

    return handler(req, context, user);
  };
}
