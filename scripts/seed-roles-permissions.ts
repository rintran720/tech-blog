import { supabase } from "../src/lib/supabase";
import { generateId } from "../src/lib/uuid";

// Permission constants
const PERMISSIONS = {
  // Admin permissions
  ADMIN_ACCESS: "admin.access",
  ADMIN_SETTINGS: "admin.settings.manage",

  // User management
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  // Role management
  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  // Permission management
  PERMISSION_VIEW: "permission.view",
  PERMISSION_CREATE: "permission.create",
  PERMISSION_UPDATE: "permission.update",
  PERMISSION_DELETE: "permission.delete",

  // Post management
  POST_VIEW: "post.view",
  POST_CREATE: "post.create",
  POST_UPDATE: "post.update",
  POST_DELETE: "post.delete",
  POST_PUBLISH: "post.publish",

  // Comment management
  COMMENT_VIEW: "comment.view",
  COMMENT_CREATE: "comment.create",
  COMMENT_UPDATE: "comment.update",
  COMMENT_DELETE: "comment.delete",
  COMMENT_APPROVE: "comment.approve",

  // Tag management
  TAG_VIEW: "tag.view",
  TAG_CREATE: "tag.create",
  TAG_UPDATE: "tag.update",
  TAG_DELETE: "tag.delete",
} as const;

async function seedPermissions() {
  console.log("🌱 Seeding permissions...");

  const permissions = [
    // Admin permissions
    {
      name: "Admin Access",
      slug: PERMISSIONS.ADMIN_ACCESS,
      description: "Access to admin dashboard",
      resource: "admin",
      action: "access",
    },
    {
      name: "Admin Settings",
      slug: PERMISSIONS.ADMIN_SETTINGS,
      description: "Manage admin settings",
      resource: "admin",
      action: "settings",
    },

    // User management
    {
      name: "View Users",
      slug: PERMISSIONS.USER_VIEW,
      description: "View user list and details",
      resource: "user",
      action: "view",
    },
    {
      name: "Create Users",
      slug: PERMISSIONS.USER_CREATE,
      description: "Create new users",
      resource: "user",
      action: "create",
    },
    {
      name: "Update Users",
      slug: PERMISSIONS.USER_UPDATE,
      description: "Update user information",
      resource: "user",
      action: "update",
    },
    {
      name: "Delete Users",
      slug: PERMISSIONS.USER_DELETE,
      description: "Delete users",
      resource: "user",
      action: "delete",
    },

    // Role management
    {
      name: "View Roles",
      slug: PERMISSIONS.ROLE_VIEW,
      description: "View role list and details",
      resource: "role",
      action: "view",
    },
    {
      name: "Create Roles",
      slug: PERMISSIONS.ROLE_CREATE,
      description: "Create new roles",
      resource: "role",
      action: "create",
    },
    {
      name: "Update Roles",
      slug: PERMISSIONS.ROLE_UPDATE,
      description: "Update role information",
      resource: "role",
      action: "update",
    },
    {
      name: "Delete Roles",
      slug: PERMISSIONS.ROLE_DELETE,
      description: "Delete roles",
      resource: "role",
      action: "delete",
    },

    // Permission management
    {
      name: "View Permissions",
      slug: PERMISSIONS.PERMISSION_VIEW,
      description: "View permission list and details",
      resource: "permission",
      action: "view",
    },
    {
      name: "Create Permissions",
      slug: PERMISSIONS.PERMISSION_CREATE,
      description: "Create new permissions",
      resource: "permission",
      action: "create",
    },
    {
      name: "Update Permissions",
      slug: PERMISSIONS.PERMISSION_UPDATE,
      description: "Update permission information",
      resource: "permission",
      action: "update",
    },
    {
      name: "Delete Permissions",
      slug: PERMISSIONS.PERMISSION_DELETE,
      description: "Delete permissions",
      resource: "permission",
      action: "delete",
    },

    // Post management
    {
      name: "View Posts",
      slug: PERMISSIONS.POST_VIEW,
      description: "View post list and details",
      resource: "post",
      action: "view",
    },
    {
      name: "Create Posts",
      slug: PERMISSIONS.POST_CREATE,
      description: "Create new posts",
      resource: "post",
      action: "create",
    },
    {
      name: "Update Posts",
      slug: PERMISSIONS.POST_UPDATE,
      description: "Update post information",
      resource: "post",
      action: "update",
    },
    {
      name: "Delete Posts",
      slug: PERMISSIONS.POST_DELETE,
      description: "Delete posts",
      resource: "post",
      action: "delete",
    },
    {
      name: "Publish Posts",
      slug: PERMISSIONS.POST_PUBLISH,
      description: "Publish/unpublish posts",
      resource: "post",
      action: "publish",
    },

    // Comment management
    {
      name: "View Comments",
      slug: PERMISSIONS.COMMENT_VIEW,
      description: "View comment list and details",
      resource: "comment",
      action: "view",
    },
    {
      name: "Create Comments",
      slug: PERMISSIONS.COMMENT_CREATE,
      description: "Create new comments",
      resource: "comment",
      action: "create",
    },
    {
      name: "Update Comments",
      slug: PERMISSIONS.COMMENT_UPDATE,
      description: "Update comment information",
      resource: "comment",
      action: "update",
    },
    {
      name: "Delete Comments",
      slug: PERMISSIONS.COMMENT_DELETE,
      description: "Delete comments",
      resource: "comment",
      action: "delete",
    },
    {
      name: "Approve Comments",
      slug: PERMISSIONS.COMMENT_APPROVE,
      description: "Approve/reject comments",
      resource: "comment",
      action: "approve",
    },

    // Tag management
    {
      name: "View Tags",
      slug: PERMISSIONS.TAG_VIEW,
      description: "View tag list and details",
      resource: "tag",
      action: "view",
    },
    {
      name: "Create Tags",
      slug: PERMISSIONS.TAG_CREATE,
      description: "Create new tags",
      resource: "tag",
      action: "create",
    },
    {
      name: "Update Tags",
      slug: PERMISSIONS.TAG_UPDATE,
      description: "Update tag information",
      resource: "tag",
      action: "update",
    },
    {
      name: "Delete Tags",
      slug: PERMISSIONS.TAG_DELETE,
      description: "Delete tags",
      resource: "tag",
      action: "delete",
    },
  ];

  for (const permission of permissions) {
    const { data: existing } = await supabase
      .from("jt_permissions")
      .select("id")
      .eq("slug", permission.slug)
      .single();

    if (!existing) {
      const { error } = await supabase.from("jt_permissions").insert({
        id: generateId(),
        name: permission.name,
        slug: permission.slug,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (error) {
        console.error(
          `❌ Failed to create permission ${permission.slug}:`,
          error
        );
      } else {
        console.log(`✅ Created permission: ${permission.name}`);
      }
    } else {
      console.log(`ℹ️ Permission already exists: ${permission.name}`);
    }
  }
}

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  // Get all permissions
  const { data: permissions } = await supabase
    .from("jt_permissions")
    .select("slug")
    .eq("isActive", true);

  if (!permissions) {
    console.error("❌ No permissions found");
    return;
  }

  const permissionSlugs = permissions.map((p) => p.slug);

  const roles = [
    {
      name: "Super Admin",
      slug: "super-admin",
      description: "Full system access with all permissions",
      permissions: permissionSlugs, // All permissions
      isSystem: true,
    },
    {
      name: "Admin",
      slug: "admin",
      description: "Administrative access with most permissions",
      permissions: permissionSlugs.filter(
        (slug) =>
          !slug.includes("permission.") && // Can't manage permissions
          !slug.includes("role.") // Can't manage roles
      ),
      isSystem: true,
    },
    {
      name: "Editor",
      slug: "editor",
      description: "Content management permissions",
      permissions: permissionSlugs.filter(
        (slug) =>
          slug.includes("post.") ||
          slug.includes("comment.") ||
          slug.includes("tag.") ||
          slug === PERMISSIONS.ADMIN_ACCESS
      ),
      isSystem: false,
    },
    {
      name: "Author",
      slug: "author",
      description: "Can create and manage own posts",
      permissions: [
        PERMISSIONS.POST_VIEW,
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_UPDATE,
        PERMISSIONS.COMMENT_VIEW,
        PERMISSIONS.COMMENT_CREATE,
        PERMISSIONS.TAG_VIEW,
      ],
      isSystem: false,
    },
    {
      name: "User",
      slug: "user",
      description: "Basic user permissions",
      permissions: [
        PERMISSIONS.POST_VIEW,
        PERMISSIONS.COMMENT_VIEW,
        PERMISSIONS.COMMENT_CREATE,
        PERMISSIONS.TAG_VIEW,
      ],
      isSystem: false,
    },
  ];

  for (const role of roles) {
    const { data: existing } = await supabase
      .from("jt_roles")
      .select("id")
      .eq("slug", role.slug)
      .single();

    if (!existing) {
      const { error } = await supabase.from("jt_roles").insert({
        id: generateId(),
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions,
        isActive: true,
        isSystem: role.isSystem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (error) {
        console.error(`❌ Failed to create role ${role.slug}:`, error);
      } else {
        console.log(`✅ Created role: ${role.name}`);
      }
    } else {
      console.log(`ℹ️ Role already exists: ${role.name}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting roles and permissions seeding...");

    await seedPermissions();
    await seedRoles();

    console.log("✅ Roles and permissions seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedPermissions, seedRoles };
