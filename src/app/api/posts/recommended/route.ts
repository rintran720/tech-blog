import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "3");

    const posts = await prisma.post.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Shuffle posts array to get random posts
    const shuffledPosts = posts.sort(() => Math.random() - 0.5);
    const randomPosts = shuffledPosts.slice(0, limit);

    // Flatten tags structure for frontend
    const postsWithFlattenedTags = randomPosts.map((post) => ({
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
    console.error("Error fetching recommended posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended posts" },
      { status: 500 }
    );
  }
};
