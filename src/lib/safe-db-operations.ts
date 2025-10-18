import { prisma } from "./prisma";

// Safe database operations with fallback
export async function getHotPostsSafe(limit: number = 2) {
  try {
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
      orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    // Flatten tags structure for frontend
    return posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch hot posts:", error);
    // Return empty array as fallback
    return [];
  }
}

export async function getRecentPostsSafe(limit: number = 6) {
  try {
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
      take: limit,
    });

    // Flatten tags structure for frontend
    return posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch recent posts:", error);
    // Return empty array as fallback
    return [];
  }
}

export async function getRecommendedPostsSafe(limit: number = 6) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        featured: true,
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
      take: limit,
    });

    // Flatten tags structure for frontend
    return posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch recommended posts:", error);
    // Return empty array as fallback
    return [];
  }
}
