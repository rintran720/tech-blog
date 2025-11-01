import { supabase } from "./supabase";
import { generateId } from "./uuid";

// Types
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  hotScore: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
  tags?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
}

export interface Comment {
  id: string;
  content: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  postId: string;
  authorId: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  roleId: string | null;
  role?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: any;
    isActive: boolean;
    isSystem: boolean;
  };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: any;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to transform Supabase data
function transformPost(data: any): Post {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt,
    published: data.published,
    hotScore: data.hotScore,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    authorId: data.authorId,
    author: data.jt_users
      ? {
          id: data.jt_users.id,
          name: data.jt_users.name,
          email: data.jt_users.email,
        }
      : undefined,
    tags:
      data.jt_post_tags?.map((pt: any) => ({
        id: pt.jt_tags.id,
        name: pt.jt_tags.name,
        slug: pt.jt_tags.slug,
        color: pt.jt_tags.color,
      })) || [],
  };
}

function transformComment(data: any): Comment {
  return {
    id: data.id,
    content: data.content,
    approved: data.approved,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    postId: data.postId,
    authorId: data.authorId,
    author: data.jt_users
      ? {
          id: data.jt_users.id,
          name: data.jt_users.name,
          email: data.jt_users.email,
        }
      : undefined,
  };
}

function transformUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    roleId: data.roleId,
    role: data.jt_roles
      ? {
          id: data.jt_roles.id,
          name: data.jt_roles.name,
          slug: data.jt_roles.slug,
          description: data.jt_roles.description,
          permissions: data.jt_roles.permissions,
          isActive: data.jt_roles.isActive,
          isSystem: data.jt_roles.isSystem,
        }
      : undefined,
  };
}

// USER AUTH OPERATIONS
export async function getUserByEmailSupabase(
  email: string
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("jt_users")
      .select(
        `
        id,
        email,
        name,
        image,
        createdAt,
        updatedAt,
        roleId,
        jt_roles!jt_users_roleId_fkey (
          id,
          name,
          slug,
          description,
          permissions,
          isActive,
          isSystem
        )
      `
      )
      .eq("email", email)
      .single();

    if (error) {
      console.error("❌ Failed to fetch user by email:", error);
      return null;
    }

    return transformUser(data);
  } catch (error) {
    console.error("❌ Failed to fetch user by email:", error);
    return null;
  }
}

export async function createUserWithAccountSupabase(
  userData: {
    email: string;
    name?: string;
    image?: string;
  },
  accountData: {
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
  }
): Promise<{ user: User; account: any } | null> {
  try {
    // Create user first
    const { data: user, error: userError } = await supabase
      .from("jt_users")
      .insert([userData])
      .select()
      .single();

    if (userError) {
      console.error("❌ Failed to create user:", userError);
      return null;
    }

    // Create account
    const { data: account, error: accountError } = await supabase
      .from("jt_accounts")
      .insert([
        {
          userId: user.id,
          ...accountData,
        },
      ])
      .select()
      .single();

    if (accountError) {
      console.error("❌ Failed to create account:", accountError);
      return null;
    }

    return {
      user: transformUser(user),
      account,
    };
  } catch (error) {
    console.error("❌ Failed to create user with account:", error);
    return null;
  }
}

// POSTS OPERATIONS
export async function getPostsSupabase(
  options: {
    published?: boolean;
    authorId?: string;
    tagSlugs?: string[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<Post[]> {
  try {
    const { published, authorId, tagSlugs, limit = 10, offset = 0 } = options;

    let query = supabase.from("jt_posts").select(`
        id,
        title,
        slug,
        content,
        excerpt,
        published,
        hotScore,
        createdAt,
        updatedAt,
        authorId,
        jt_users!jt_posts_authorId_fkey (
          id,
          name,
          email
        ),
        jt_post_tags (
          jt_tags (
            id,
            name,
            slug,
            color
          )
        )
      `);

    // Apply filters
    if (published !== undefined) {
      query = query.eq("published", published);
    }

    if (authorId) {
      query = query.eq("authorId", authorId);
    }

    // Apply ordering and pagination
    query = query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("❌ Failed to fetch posts:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      return [];
    }

    let posts = data?.map(transformPost) || [];

    // Filter by tagSlugs if provided (client-side filtering for now)
    if (tagSlugs && tagSlugs.length > 0) {
      posts = posts.filter((post) => {
        const postTagSlugs = post.tags?.map((tag) => tag.slug) || [];
        return tagSlugs.some((slug) => postTagSlugs.includes(slug));
      });
    }

    return posts;
  } catch (error) {
    console.error("❌ Failed to fetch posts:", error);
    return [];
  }
}

export async function getPostBySlugSupabase(
  slug: string
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("jt_posts")
      .select(
        `
        id,
        title,
        slug,
        content,
        excerpt,
        published,
        hotScore,
        createdAt,
        updatedAt,
        authorId,
        jt_users!jt_posts_authorId_fkey (
          id,
          name,
          email
        ),
        jt_post_tags (
          jt_tags (
            id,
            name,
            slug,
            color
          )
        ),
        jt_comments (
          id
        )
      `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("❌ Failed to fetch post by slug:", error);
      return null;
    }

    return transformPost(data);
  } catch (error) {
    console.error("❌ Failed to fetch post by slug:", error);
    return null;
  }
}

export async function createPostSupabase(postData: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published?: boolean;
  authorId: string;
  tagIds?: string[];
}): Promise<Post | null> {
  try {
    const { tagIds, ...postFields } = postData;

    // Generate ID for the new post
    const postId = generateId();
    const now = new Date().toISOString();

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("jt_posts")
      .insert([
        {
          ...postFields,
          id: postId,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (postError) {
      console.error("❌ Failed to create post:", postError);
      return null;
    }

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      const postTags = tagIds.map((tagId) => ({
        postId: post.id,
        tagId,
      }));

      const { error: tagsError } = await supabase
        .from("jt_post_tags")
        .insert(postTags);

      if (tagsError) {
        console.error("❌ Failed to add tags to post:", tagsError);
      }
    }

    // Fetch the complete post with relations
    return await getPostBySlugSupabase(post.slug);
  } catch (error) {
    console.error("❌ Failed to create post:", error);
    return null;
  }
}

export async function updatePostSupabase(
  id: string,
  updateData: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    published: boolean;
    hotScore: number;
  }>
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("jt_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update post:", error);
      return null;
    }

    return await getPostBySlugSupabase(data.slug);
  } catch (error) {
    console.error("❌ Failed to update post:", error);
    return null;
  }
}

export async function deletePostSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("jt_posts").delete().eq("id", id);

    if (error) {
      console.error("❌ Failed to delete post:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to delete post:", error);
    return false;
  }
}

// COMMENTS OPERATIONS
export async function getCommentsByPostSupabase(
  postId: string
): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from("jt_comments")
      .select(
        `
        id,
        content,
        approved,
        createdAt,
        updatedAt,
        postId,
        authorId,
        jt_users!jt_comments_authorId_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("postId", postId)
      .eq("approved", true)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch comments:", error);
      return [];
    }

    return data?.map(transformComment) || [];
  } catch (error) {
    console.error("❌ Failed to fetch comments:", error);
    return [];
  }
}

export async function createCommentSupabase(commentData: {
  content: string;
  postId: string;
  authorId: string;
  approved?: boolean;
}): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from("jt_comments")
      .insert([commentData])
      .select(
        `
        id,
        content,
        approved,
        createdAt,
        updatedAt,
        postId,
        authorId,
        jt_users!jt_comments_authorId_fkey (
          id,
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("❌ Failed to create comment:", error);
      return null;
    }

    return transformComment(data);
  } catch (error) {
    console.error("❌ Failed to create comment:", error);
    return null;
  }
}

export async function approveCommentSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jt_comments")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      console.error("❌ Failed to approve comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to approve comment:", error);
    return false;
  }
}

export async function deleteCommentSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("jt_comments").delete().eq("id", id);

    if (error) {
      console.error("❌ Failed to delete comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to delete comment:", error);
    return false;
  }
}

// USERS OPERATIONS
export async function getUsersSupabase(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}
): Promise<User[]> {
  try {
    const { limit = 10, offset = 0, search } = options;

    let query = supabase.from("jt_users").select(`
        id,
        email,
        name,
        image,
        createdAt,
        updatedAt,
        roleId,
        jt_roles!jt_users_roleId_fkey (
          id,
          name,
          slug,
          description,
          permissions,
          isActive,
          isSystem
        )
      `);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("❌ Failed to fetch users:", error);
      return [];
    }

    return data?.map(transformUser) || [];
  } catch (error) {
    console.error("❌ Failed to fetch users:", error);
    return [];
  }
}

export async function getUserByIdSupabase(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("jt_users")
      .select(
        `
        id,
        email,
        name,
        image,
        createdAt,
        updatedAt,
        roleId,
        jt_roles!jt_users_roleId_fkey (
            id,
            name,
            slug,
          description,
          permissions,
          isActive,
          isSystem
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to fetch user:", error);
      return null;
    }

    return transformUser(data);
  } catch (error) {
    console.error("❌ Failed to fetch user:", error);
    return null;
  }
}

export async function updateUserRoleSupabase(
  userId: string,
  roleId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jt_users")
      .update({ roleId })
      .eq("id", userId);

    if (error) {
      console.error("❌ Failed to update user role:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to update user role:", error);
    return false;
  }
}

// TAGS OPERATIONS
export async function getTagsSupabase(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from("jt_tags")
      .select("*")
      .order("name");

    if (error) {
      console.error("❌ Failed to fetch tags:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Failed to fetch tags:", error);
    return [];
  }
}

export async function createTagSupabase(tagData: {
  name: string;
  slug: string;
  color?: string;
}): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from("jt_tags")
      .insert([tagData])
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to create tag:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to create tag:", error);
    return null;
  }
}

export async function getTagByIdSupabase(id: string): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from("jt_tags")
      .select(
        `
        *,
        posts_count:jt_post_tags (count)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to fetch tag:", error);
      return null;
    }

    return {
      ...data,
      _count: {
        posts: data.posts_count?.length || 0,
      },
    };
  } catch (error) {
    console.error("❌ Error in getTagByIdSupabase:", error);
    return null;
  }
}

export async function updateTagSupabase(
  id: string,
  tagData: {
    name: string;
    slug: string;
    color?: string;
  }
): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from("jt_tags")
      .update(tagData)
      .eq("id", id)
      .select(
        `
        *,
        posts_count:jt_post_tags (count)
      `
      )
      .single();

    if (error) {
      console.error("❌ Failed to update tag:", error);
      return null;
    }

    return {
      ...data,
      _count: {
        posts: data.posts_count?.length || 0,
      },
    };
  } catch (error) {
    console.error("❌ Error in updateTagSupabase:", error);
    return null;
  }
}

export async function deleteTagSupabase(id: string): Promise<boolean> {
  try {
    // Delete all relationships between this tag and posts first
    await supabase.from("jt_post_tags").delete().eq("tagId", id);

    // Then delete the tag
    const { error } = await supabase.from("jt_tags").delete().eq("id", id);

    if (error) {
      console.error("❌ Failed to delete tag:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in deleteTagSupabase:", error);
    return false;
  }
}

// ROLES OPERATIONS
export async function getRolesSupabase(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from("jt_roles")
      .select("*")
      .order("name");

    if (error) {
      console.error("❌ Failed to fetch roles:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Failed to fetch roles:", error);
    return [];
  }
}

export async function createRoleSupabase(roleData: {
  name: string;
  slug: string;
  description?: string;
  permissions: any;
  isActive?: boolean;
  isSystem?: boolean;
}): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from("jt_roles")
      .insert([roleData])
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to create role:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to create role:", error);
    return null;
  }
}

export async function updateRoleSupabase(
  id: string,
  updateData: Partial<{
    name: string;
    slug: string;
    description: string;
    permissions: any;
    isActive: boolean;
  }>
): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from("jt_roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update role:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to update role:", error);
    return null;
  }
}

export async function deleteRoleSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("jt_roles").delete().eq("id", id);

    if (error) {
      console.error("❌ Failed to delete role:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to delete role:", error);
    return false;
  }
}

// PERMISSIONS OPERATIONS
export async function getPermissionsSupabase(): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from("jt_permissions")
      .select("*")
      .order("resource, action");

    if (error) {
      console.error("❌ Failed to fetch permissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Failed to fetch permissions:", error);
    return [];
  }
}

export async function createPermissionSupabase(permissionData: {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
  isActive?: boolean;
}): Promise<Permission | null> {
  try {
    const { data, error } = await supabase
      .from("jt_permissions")
      .insert([permissionData])
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to create permission:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to create permission:", error);
    return null;
  }
}

export async function getUserWithRoleSupabase(
  userId: string
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("jt_users")
      .select(
        `
        id,
        email,
        name,
        image,
        createdAt,
        updatedAt,
        roleId,
        jt_roles!jt_users_roleId_fkey (
          id,
          name,
          slug,
          description,
          permissions,
          isActive,
          isSystem
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Failed to fetch user with role:", error);
      return null;
    }

    return transformUser(data);
  } catch (error) {
    console.error("❌ Error in getUserWithRoleSupabase:", error);
    return null;
  }
}

export async function getUserPermissionsSupabase(
  userId: string
): Promise<string[]> {
  try {
    const user = await getUserWithRoleSupabase(userId);
    if (!user?.role) return [];

    return user.role.permissions || [];
  } catch (error) {
    console.error("❌ Error in getUserPermissionsSupabase:", error);
    return [];
  }
}

export async function hasPermissionSupabase(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const user = await getUserWithRoleSupabase(userId);
    if (!user?.role) return false;

    return user.role.permissions?.includes(permission) || false;
  } catch (error) {
    console.error("❌ Error in hasPermissionSupabase:", error);
    return false;
  }
}

export async function hasAnyPermissionSupabase(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  try {
    const user = await getUserWithRoleSupabase(userId);
    if (!user?.role) return false;

    return permissions.some(
      (permission) => user.role?.permissions?.includes(permission) || false
    );
  } catch (error) {
    console.error("❌ Error in hasAnyPermissionSupabase:", error);
    return false;
  }
}

export async function hasResourcePermissionSupabase(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const user = await getUserWithRoleSupabase(userId);
    if (!user?.role) return false;

    const permission = `${resource}.${action}`;
    return user.role.permissions?.includes(permission) || false;
  } catch (error) {
    console.error("❌ Error in hasResourcePermissionSupabase:", error);
    return false;
  }
}

// STATS OPERATIONS
export async function getPostStatsSupabase(): Promise<{
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
}> {
  try {
    const [
      { count: totalPosts },
      { count: publishedPosts },
      { count: draftPosts },
    ] = await Promise.all([
      supabase.from("jt_posts").select("*", { count: "exact", head: true }),
      supabase
        .from("jt_posts")
        .select("*", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("jt_posts")
        .select("*", { count: "exact", head: true })
        .eq("published", false),
    ]);

    return {
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      draftPosts: draftPosts || 0,
    };
  } catch (error) {
    console.error("❌ Failed to fetch post stats:", error);
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
    };
  }
}

// Specialized post functions
export async function getHotPostsSupabase(limit: number = 2): Promise<Post[]> {
  return getPostsSupabase({
    published: true,
    limit,
    offset: 0,
  }).then((posts) => posts.sort((a, b) => b.hotScore - a.hotScore));
}

export async function getRecentPostsSupabase(
  limit: number = 6
): Promise<Post[]> {
  return getPostsSupabase({
    published: true,
    limit,
    offset: 0,
  });
}

export async function getRoleByIdSupabase(id: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from("jt_roles")
      .select(
        `
        *,
        users:jt_users (
          id,
          name,
          email,
          createdAt
        ),
        users_count:jt_users (count)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to fetch role:", error);
      return null;
    }

    return {
      ...data,
      _count: {
        users: data.users_count?.length || 0,
      },
    };
  } catch (error) {
    console.error("❌ Error in getRoleByIdSupabase:", error);
    return null;
  }
}

export async function deletePermissionSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jt_permissions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Failed to delete permission:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in deletePermissionSupabase:", error);
    return false;
  }
}

export async function getAdminCommentsSupabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("jt_comments")
      .select(
        `
        id,
        content,
        approved,
        createdAt,
        updatedAt,
        authorId,
        postId,
        author:jt_users!jt_comments_authorId_fkey (
          id,
          name,
          email
        ),
        post:jt_posts!jt_comments_postId_fkey (
          id,
          title,
          slug
        )
      `
      )
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch admin comments:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in getAdminCommentsSupabase:", error);
    return [];
  }
}

export async function approveCommentAdminSupabase(
  id: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("jt_comments")
      .update({ approved: true })
      .eq("id", id)
      .select(
        `
        id,
        content,
        approved,
        createdAt,
        updatedAt,
        authorId,
        postId,
        author:jt_users!jt_comments_authorId_fkey (
          id,
          name,
          email
        ),
        post:jt_posts!jt_comments_postId_fkey (
          id,
          title,
          slug
        )
      `
      )
      .single();

    if (error) {
      console.error("❌ Failed to approve comment:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error in approveCommentAdminSupabase:", error);
    return null;
  }
}

export async function rejectCommentAdminSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("jt_comments").delete().eq("id", id);

    if (error) {
      console.error("❌ Failed to reject comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error in rejectCommentAdminSupabase:", error);
    return false;
  }
}

export async function getRecommendedPostsSupabase(
  limit: number = 6
): Promise<Post[]> {
  // Get random posts for recommendations
  const allPosts = await getPostsSupabase({
    published: true,
    limit: 100, // Get more posts to randomize
    offset: 0,
  });

  // Shuffle and return limited number
  const shuffled = allPosts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}

export async function getPermissionByIdSupabase(
  id: string
): Promise<Permission | null> {
  try {
    const { data, error } = await supabase
      .from("jt_permissions")
      .select(
        `
        *,
        role_permissions:jt_role_permissions (
          granted,
          jt_roles (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to fetch permission:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error in getPermissionByIdSupabase:", error);
    return null;
  }
}

export async function updatePermissionSupabase(
  id: string,
  permissionData: {
    name: string;
    slug: string;
    description?: string;
    resource: string;
    action: string;
    isActive?: boolean;
  }
): Promise<Permission | null> {
  try {
    const { data, error } = await supabase
      .from("jt_permissions")
      .update(permissionData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update permission:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error in updatePermissionSupabase:", error);
    return null;
  }
}

export async function getRolePermissionsSupabase(
  roleId: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("jt_role_permissions")
      .select(
        `
        *,
        permission:jt_permissions (
          id,
          name,
          slug,
          resource,
          action
        )
      `
      )
      .eq("roleId", roleId);

    if (error) {
      console.error("❌ Failed to fetch role permissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in getRolePermissionsSupabase:", error);
    return [];
  }
}

export async function updateRolePermissionsSupabase(
  roleId: string,
  permissions: Array<{ permissionId: string; granted: boolean }>
): Promise<any[]> {
  try {
    // First, delete all existing role permissions
    await supabase.from("jt_role_permissions").delete().eq("roleId", roleId);

    // Then create new ones
    const { data, error } = await supabase.from("jt_role_permissions").insert(
      permissions.map((perm) => ({
        roleId,
        permissionId: perm.permissionId,
        granted: perm.granted,
      }))
    ).select(`
        *,
        permission:jt_permissions (
          id,
          name,
          slug,
          resource,
          action
        )
      `);

    if (error) {
      console.error("❌ Failed to update role permissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error in updateRolePermissionsSupabase:", error);
    return [];
  }
}
