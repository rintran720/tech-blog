import { prisma } from "./prisma";
import { User, Post, Comment, Account } from "@prisma/client";
import { generateId } from "./uuid";

// User operations
export async function createUser(userData: {
  email: string;
  name?: string;
  image?: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      id: generateId(),
      ...userData,
    },
  });
}

export async function createUserWithAccount(
  userData: {
    email: string;
    name?: string;
    image?: string;
  },
  accountData: {
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string;
    access_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
  }
): Promise<{ user: User; account: Account }> {
  const userId = generateId();
  const accountId = generateId();

  // Use transaction to ensure both user and account are created together
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: userId,
        ...userData,
      },
    });

    const account = await tx.account.create({
      data: {
        id: accountId,
        userId: user.id,
        ...accountData,
      },
    });

    return { user, account };
  });

  return result;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
    },
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: true,
      comments: true,
      accounts: true,
    },
  });
}

// Post operations
export async function createPost(postData: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tagNames?: string[];
  authorId: string;
  published?: boolean;
  featured?: boolean;
}): Promise<Post> {
  const { tagNames, ...postDataWithoutTags } = postData;

  return prisma.post.create({
    data: {
      id: generateId(),
      ...postDataWithoutTags,
      tags: tagNames
        ? {
            create: tagNames.map((tagName) => ({
              id: generateId(),
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: {
                    id: generateId(),
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, "-"),
                  },
                },
              },
            })),
          }
        : undefined,
    },
  });
}

export async function getPosts(options?: {
  published?: boolean;
  featured?: boolean;
  category?: string;
  authorId?: string;
  tagSlugs?: string[];
  limit?: number;
  offset?: number;
}): Promise<Post[]> {
  const {
    published = true,
    featured,
    category,
    authorId,
    tagSlugs,
    limit = 10,
    offset = 0,
  } = options || {};

  // Build where clause
  const where: any = {
    published,
    ...(featured !== undefined && { featured }),
    ...(category && { category }),
    ...(authorId && { authorId }),
  };

  // Add tag filter if tagSlugs provided
  if (tagSlugs && tagSlugs.length > 0) {
    where.tags = {
      some: {
        tag: {
          slug: {
            in: tagSlugs,
          },
        },
      },
    };
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
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
      comments: {
        where: { approved: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
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
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
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
      comments: {
        where: { approved: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) return null;

  // Flatten tags structure for frontend
  return {
    ...post,
    tags: post.tags.map((postTag) => ({
      id: postTag.tag.id,
      name: postTag.tag.name,
      slug: postTag.tag.slug,
      color: postTag.tag.color,
    })),
  };
}

export async function updatePost(
  id: string,
  data: Partial<Post>
): Promise<Post> {
  return prisma.post.update({
    where: { id },
    data,
  });
}

export async function deletePost(id: string): Promise<Post> {
  return prisma.post.delete({
    where: { id },
  });
}

// Comment operations
export async function createComment(commentData: {
  content: string;
  postId: string;
  authorId: string;
  approved?: boolean;
}): Promise<Comment> {
  return prisma.comment.create({
    data: {
      id: generateId(),
      ...commentData,
    },
  });
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  return prisma.comment.findMany({
    where: {
      postId,
      approved: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveComment(id: string): Promise<Comment> {
  return prisma.comment.update({
    where: { id },
    data: { approved: true },
  });
}

export async function deleteComment(id: string): Promise<Comment> {
  return prisma.comment.delete({
    where: { id },
  });
}

// Get recommended posts (random posts)
export async function getRecommendedPosts(limit: number = 3) {
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
  return randomPosts.map((post) => ({
    ...post,
    tags: post.tags.map((postTag) => ({
      id: postTag.tag.id,
      name: postTag.tag.name,
      slug: postTag.tag.slug,
      color: postTag.tag.color,
    })),
  }));
}

// Statistics
export async function getPostStats() {
  const [totalPosts, publishedPosts, totalComments, approvedComments] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { published: true } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { approved: true } }),
    ]);

  return {
    totalPosts,
    publishedPosts,
    draftPosts: totalPosts - publishedPosts,
    totalComments,
    approvedComments,
    pendingComments: totalComments - approvedComments,
  };
}

// Get hot posts (highest hotScore)
export async function getHotPosts(limit: number = 2) {
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
}

// Get recent posts
export async function getRecentPosts(limit: number = 3) {
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
    orderBy: { createdAt: "desc" },
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
}
