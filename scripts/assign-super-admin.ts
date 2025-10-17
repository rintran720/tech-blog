import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignSuperAdminRole() {
  try {
    console.log("🔍 Tìm user rintran720@gmail.com...");

    const user = await prisma.user.findUnique({
      where: { email: "rintran720@gmail.com" },
    });

    if (!user) {
      console.log("❌ Không tìm thấy user");
      return;
    }

    console.log("✅ Tìm thấy user:", user.email);

    // Tìm Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: "Super Admin" },
    });

    if (!superAdminRole) {
      console.log("❌ Không tìm thấy Super Admin role");
      return;
    }

    console.log("✅ Tìm thấy Super Admin role:", superAdminRole.name);

    // Assign role cho user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { roleId: superAdminRole.id },
      include: {
        role: true,
      },
    });

    console.log("🎉 Đã assign Super Admin role cho user:", {
      email: updatedUser.email,
      role: updatedUser.role?.name,
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignSuperAdminRole();
