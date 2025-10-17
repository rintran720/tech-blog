import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/posts/hot - Lấy 2 bài viết có hotScore cao nhất
export const GET = async () => {
  try {
    const hotPosts = await prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
          orderBy: {
            tag: {
              createdAt: "desc",
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
      take: 2,
    });

    // Flatten tags structure to match frontend expectation
    const postsWithFlattenedTags = hotPosts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    }));

    return NextResponse.json({ posts: postsWithFlattenedTags });
  } catch (error) {
    console.error("Error fetching hot posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch hot posts" },
      { status: 500 }
    );
  }
};
