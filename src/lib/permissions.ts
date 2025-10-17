import { prisma } from "./prisma";
import { generateId } from "./uuid";

// Permission constants
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_ACCESS: "admin.access",
  ADMIN_SETTINGS: "admin.settings.manage",

  // User management
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_ROLES: "users.manage_roles",

  // Role management
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Post management
  POSTS_READ: "posts.read",
  POSTS_CREATE: "posts.create",
  POSTS_UPDATE: "posts.update",
  POSTS_DELETE: "posts.delete",
  POSTS_PUBLISH: "posts.publish",
  POSTS_FEATURE: "posts.feature",

  // Comment management
  COMMENTS_READ: "comments.read",
  COMMENTS_CREATE: "comments.create",
  COMMENTS_UPDATE: "comments.update",
  COMMENTS_DELETE: "comments.delete",
  COMMENTS_MODERATE: "comments.moderate",

  // Tag management
  TAGS_READ: "tags.read",
  TAGS_CREATE: "tags.create",
  TAGS_UPDATE: "tags.update",
  TAGS_DELETE: "tags.delete",

  // Analytics
  ANALYTICS_READ: "analytics.read",
  ANALYTICS_EXPORT: "analytics.export",
} as const;

export const RESOURCES = {
  ADMIN: "admin",
  USERS: "users",
  ROLES: "roles",
  POSTS: "posts",
  COMMENTS: "comments",
  TAGS: "tags",
  ANALYTICS: "analytics",
} as const;

export const ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  MODERATE: "moderate",
  PUBLISH: "publish",
  FEATURE: "feature",
  EXPORT: "export",
} as const;

// Permission checking functions
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  // Check if user has the specific permission
  const hasSpecificPermission = user.role.rolePermissions.some(
    (rp) => rp.granted && rp.permission.slug === permission
  );

  return hasSpecificPermission;
}

export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  return permissions.some((permission) =>
    user.role!.rolePermissions.some(
      (rp) => rp.granted && rp.permission.slug === permission
    )
  );
}

export async function hasResourcePermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  return user.role.rolePermissions.some(
    (rp) =>
      rp.granted &&
      rp.permission.resource === resource &&
      rp.permission.action === action
  );
}

// Permission management functions
export async function createPermission(data: {
  name: string;
  description?: string;
  resource: string;
  action: string;
}): Promise<any> {
  const slug = `${data.resource}.${data.action}`;

  return prisma.permission.create({
    data: {
      id: generateId(),
      name: data.name,
      slug,
      description: data.description,
      resource: data.resource,
      action: data.action,
    },
  });
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
  granted: boolean = true
): Promise<any> {
  return prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
    update: {
      granted,
    },
    create: {
      id: generateId(),
      roleId,
      permissionId,
      granted,
    },
  });
}

export async function revokePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<any> {
  return prisma.rolePermission.update({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
    data: {
      granted: false,
    },
  });
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: { granted: true },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) return [];

  return user.role.rolePermissions.map((rp) => rp.permission.slug);
}

export async function getRolePermissions(roleId: string): Promise<any[]> {
  return prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      permission: true,
    },
  });
}

// Initialize default permissions
export async function initializePermissions(): Promise<void> {
  console.log("🔧 Initializing permissions...");

  const permissions = [
    // Admin permissions
    { name: "Admin Access", resource: "admin", action: "access" },
    { name: "Admin Settings", resource: "admin", action: "settings" },

    // User permissions
    { name: "Read Users", resource: "users", action: "read" },
    { name: "Create Users", resource: "users", action: "create" },
    { name: "Update Users", resource: "users", action: "update" },
    { name: "Delete Users", resource: "users", action: "delete" },
    { name: "Manage User Roles", resource: "users", action: "manage_roles" },

    // Role permissions
    { name: "Read Roles", resource: "roles", action: "read" },
    { name: "Create Roles", resource: "roles", action: "create" },
    { name: "Update Roles", resource: "roles", action: "update" },
    { name: "Delete Roles", resource: "roles", action: "delete" },

    // Post permissions
    { name: "Read Posts", resource: "posts", action: "read" },
    { name: "Create Posts", resource: "posts", action: "create" },
    { name: "Update Posts", resource: "posts", action: "update" },
    { name: "Delete Posts", resource: "posts", action: "delete" },
    { name: "Publish Posts", resource: "posts", action: "publish" },
    { name: "Feature Posts", resource: "posts", action: "feature" },

    // Comment permissions
    { name: "Read Comments", resource: "comments", action: "read" },
    { name: "Create Comments", resource: "comments", action: "create" },
    { name: "Update Comments", resource: "comments", action: "update" },
    { name: "Delete Comments", resource: "comments", action: "delete" },
    { name: "Moderate Comments", resource: "comments", action: "moderate" },

    // Tag permissions
    { name: "Read Tags", resource: "tags", action: "read" },
    { name: "Create Tags", resource: "tags", action: "create" },
    { name: "Update Tags", resource: "tags", action: "update" },
    { name: "Delete Tags", resource: "tags", action: "delete" },

    // Analytics permissions
    { name: "Read Analytics", resource: "analytics", action: "read" },
    { name: "Export Analytics", resource: "analytics", action: "export" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { slug: `${perm.resource}.${perm.action}` },
      update: {},
      create: {
        id: generateId(),
        name: perm.name,
        slug: `${perm.resource}.${perm.action}`,
        description: `Permission to ${perm.action} ${perm.resource}`,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  console.log("✅ Permissions initialized");
}
