import { PrismaClient } from "@prisma/client";
import { generateId } from "../src/lib/uuid";
import { initializePermissions } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Initialize permissions first
  await initializePermissions();

  // Tạo user mẫu
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: generateId(),
      email: "admin@example.com",
      name: "Admin User",
      image: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  });

  console.log("✅ User created:", user);

  // Tạo roles mẫu với hệ thống phân quyền mới
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: {
      id: generateId(),
      name: "Super Admin",
      slug: "super-admin",
      description: "Có toàn quyền quản lý hệ thống",
      permissions: [], // Will be populated via rolePermissions
      isActive: true,
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      id: generateId(),
      name: "Admin",
      slug: "admin",
      description: "Quản lý nội dung và người dùng",
      permissions: [],
      isActive: true,
      isSystem: true,
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "Editor" },
    update: {},
    create: {
      id: generateId(),
      name: "Editor",
      slug: "editor",
      description: "Chỉnh sửa và quản lý bài viết",
      permissions: [],
      isActive: true,
      isSystem: false,
    },
  });

  const authorRole = await prisma.role.upsert({
    where: { name: "Author" },
    update: {},
    create: {
      id: generateId(),
      name: "Author",
      slug: "author",
      description: "Tạo và chỉnh sửa bài viết của mình",
      permissions: [],
      isActive: true,
      isSystem: false,
    },
  });

  console.log("✅ Roles created:", 4);

  // Assign permissions to roles
  const permissions = await prisma.permission.findMany();

  // Super Admin gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        id: generateId(),
        roleId: superAdminRole.id,
        permissionId: permission.id,
        granted: true,
      },
    });
  }

  // Admin gets most permissions except user management
  const adminPermissions = permissions.filter(
    (p) => !p.resource.includes("users") || p.action === "read"
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        id: generateId(),
        roleId: adminRole.id,
        permissionId: permission.id,
        granted: true,
      },
    });
  }

  // Editor gets post and comment permissions
  const editorPermissions = permissions.filter(
    (p) =>
      ["posts", "comments", "tags"].includes(p.resource) &&
      ["read", "create", "update"].includes(p.action)
  );
  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        id: generateId(),
        roleId: editorRole.id,
        permissionId: permission.id,
        granted: true,
      },
    });
  }

  // Author gets basic post permissions
  const authorPermissions = permissions.filter(
    (p) =>
      p.resource === "posts" && ["read", "create", "update"].includes(p.action)
  );
  for (const permission of authorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: authorRole.id,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        id: generateId(),
        roleId: authorRole.id,
        permissionId: permission.id,
        granted: true,
      },
    });
  }

  console.log("✅ Permissions assigned to roles");

  // Cập nhật user với role Super Admin
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { roleId: superAdminRole.id }, // Super Admin role
  });

  console.log("✅ User role updated:", updatedUser.email);

  // Tạo tags mẫu
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: "React" },
      update: {},
      create: {
        id: generateId(),
        name: "React",
        slug: "react",
      },
    }),
    prisma.tag.upsert({
      where: { name: "Next.js" },
      update: {},
      create: {
        id: generateId(),
        name: "Next.js",
        slug: "nextjs",
      },
    }),
    prisma.tag.upsert({
      where: { name: "TypeScript" },
      update: {},
      create: {
        id: generateId(),
        name: "TypeScript",
        slug: "typescript",
      },
    }),
    prisma.tag.upsert({
      where: { name: "MySQL" },
      update: {},
      create: {
        id: generateId(),
        name: "MySQL",
        slug: "mysql",
      },
    }),
  ]);

  console.log("✅ Tags created:", tags.length);

  // Tạo bài viết mẫu
  const post = await prisma.post.upsert({
    where: { slug: "chao-mung-den-voi-blog" },
    update: {},
    create: {
      id: generateId(),
      title: "Chào mừng đến với blog công nghệ",
      slug: "chao-mung-den-voi-blog",
      content: `
# Chào mừng đến với blog công nghệ!

Đây là bài viết đầu tiên trên blog của chúng tôi. Chúng tôi sẽ chia sẻ những kiến thức về:

- **React** - Thư viện JavaScript phổ biến cho việc xây dựng giao diện người dùng
- **Next.js** - Framework React mạnh mẽ cho việc phát triển ứng dụng web
- **TypeScript** - Ngôn ngữ lập trình giúp JavaScript trở nên type-safe
- **MySQL** - Hệ quản trị cơ sở dữ liệu quan hệ phổ biến

## Tại sao chọn những công nghệ này?

Những công nghệ này đã được chứng minh là hiệu quả và được sử dụng rộng rãi trong ngành công nghiệp phần mềm. Chúng tôi sẽ chia sẻ kinh nghiệm thực tế và các best practices khi sử dụng chúng.

Hãy theo dõi blog để không bỏ lỡ những bài viết mới nhất!
      `,
      excerpt:
        "Giới thiệu về blog công nghệ và những chủ đề chúng tôi sẽ chia sẻ",
      published: true,
      featured: true,
      category: "Giới thiệu",
      authorId: user.id,
      tags: {
        create: [
          { id: generateId(), tag: { connect: { id: tags[0].id } } }, // React
          { id: generateId(), tag: { connect: { id: tags[1].id } } }, // Next.js
          { id: generateId(), tag: { connect: { id: tags[2].id } } }, // TypeScript
          { id: generateId(), tag: { connect: { id: tags[3].id } } }, // MySQL
        ],
      },
    },
  });

  console.log("✅ Post created:", post.title);

  // Tạo comment mẫu
  const comment = await prisma.comment.create({
    data: {
      id: generateId(),
      content: "Bài viết rất hay! Cảm ơn bạn đã chia sẻ.",
      postId: post.id,
      authorId: user.id,
      approved: true,
    },
  });

  console.log("✅ Comment created:", comment.id);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
