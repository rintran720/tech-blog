import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateId } from "@/lib/uuid";

// GET /api/admin/posts/[id] - Lấy bài viết theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

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

    return NextResponse.json({ post: postWithFlattenedTags });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/posts/[id] - Cập nhật bài viết
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      published,
      excerpt,
      featured,
      category,
      tags,
      tagIds,
      slug,
      hotScore,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Use provided slug or generate from title
    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

    // Update post and handle tags
    const post = await prisma.$transaction(async (tx) => {
      // Delete existing post tags
      await tx.postTag.deleteMany({
        where: { postId: id },
      });

      // Update post
      const updatedPost = await tx.post.update({
        where: { id },
        data: {
          title,
          slug: finalSlug,
          content,
          excerpt: excerpt || content.substring(0, 200) + "...",
          published: published || false,
          featured: featured || false,
          category: category || "",
          hotScore: hotScore || 0,
          tags:
            (tagIds || tags) && (tagIds || tags).length > 0
              ? {
                  create: (tagIds || tags).map((tagId: string) => ({
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

      return updatedPost;
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

    return NextResponse.json({ post: postWithFlattenedTags });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts/[id] - Xóa bài viết
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
