import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withResourcePermission } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/uuid";

// GET /api/admin/posts - Lấy danh sách tất cả posts
export const GET = async (request: NextRequest) => {
  try {
    // Simple session check - temporarily bypassed for testing
    // const token = await getToken({ req: request });
    // if (!token?.email) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        content?: { contains: string; mode: "insensitive" };
      }>;
      published?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.published = status === "published";
    }

    console.log("Filter params:", { page, limit, search, status });
    console.log("Where clause:", where);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // Flatten tags structure for frontend
    const postsWithFlattenedTags = posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    }));

    return NextResponse.json({
      posts: postsWithFlattenedTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
};

// POST /api/admin/posts - Tạo bài viết mới
export const POST = async (request: NextRequest) => {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, published, excerpt, tags, hotScore } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const post = await prisma.post.create({
      data: {
        id: generateId(),
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + "...",
        published: published || false,
        hotScore: hotScore || 0,
        authorId: user.id,
        tags:
          tags && tags.length > 0
            ? {
                create: tags.map((tagId: string) => ({
                  id: generateId(),
                  tagId,
                })),
              }
            : undefined,
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
    });

    // Flatten tags structure
    const postWithFlattenedTags = {
      ...post,
      tags: post.tags.map((postTag) => ({
        id: postTag.tag.id,
        name: postTag.tag.name,
        slug: postTag.tag.slug,
        color: postTag.tag.color,
      })),
    };

    return NextResponse.json({ post: postWithFlattenedTags }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
};
