import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPostsCount() {
  try {
    const totalPosts = await prisma.post.count();
    const publishedPosts = await prisma.post.count({
      where: { published: true },
    });
    const unpublishedPosts = await prisma.post.count({
      where: { published: false },
    });

    console.log("📊 Thống kê bài viết:");
    console.log(`📝 Tổng số bài viết: ${totalPosts}`);
    console.log(`✅ Đã xuất bản: ${publishedPosts}`);
    console.log(`📋 Chưa xuất bản: ${unpublishedPosts}`);

    // Hiển thị một số bài viết mới nhất
    const recentPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        title: true,
        createdAt: true,
        hotScore: true,
      },
    });

    console.log("\n📰 Bài viết mới nhất:");
    recentPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (Hot: ${post.hotScore})`);
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostsCount();
