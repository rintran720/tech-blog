import { supabase } from "./supabase";

// Types for our data
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  featured: boolean | null;
  category: string | null;
  hotScore: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  tags: {
    id: string;
    name: string;
    slug: string;
    color: string;
  }[];
  _count: {
    comments: number;
  };
}

// Get hot posts using Supabase
export async function getHotPostsSupabase(limit: number = 2): Promise<Post[]> {
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
        featured,
        category,
        hotScore,
        createdAt,
        updatedAt,
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
        jt_comments (count)
      `
      )
      .eq("published", true)
      .order("hotScore", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Failed to fetch hot posts:", error);
      return [];
    }

    // Transform the data to match our expected format
    return (
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        featured: post.featured,
        category: post.category,
        hotScore: post.hotScore,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: (post.jt_users as any).id,
          name: (post.jt_users as any).name,
          email: (post.jt_users as any).email,
        },
        tags:
          post.jt_post_tags?.map((pt: any) => ({
            id: pt.jt_tags.id,
            name: pt.jt_tags.name,
            slug: pt.jt_tags.slug,
            color: pt.jt_tags.color,
          })) || [],
        _count: {
          comments: post.jt_comments?.length || 0,
        },
      })) || []
    );
  } catch (error) {
    console.error("❌ Failed to fetch hot posts:", error);
    return [];
  }
}

// Get recent posts using Supabase
export async function getRecentPostsSupabase(
  limit: number = 6
): Promise<Post[]> {
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
        featured,
        category,
        hotScore,
        createdAt,
        updatedAt,
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
        jt_comments (count)
      `
      )
      .eq("published", true)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Failed to fetch recent posts:", error);
      return [];
    }

    // Transform the data to match our expected format
    return (
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        featured: post.featured,
        category: post.category,
        hotScore: post.hotScore,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: (post.jt_users as any).id,
          name: (post.jt_users as any).name,
          email: (post.jt_users as any).email,
        },
        tags:
          post.jt_post_tags?.map((pt: any) => ({
            id: pt.jt_tags.id,
            name: pt.jt_tags.name,
            slug: pt.jt_tags.slug,
            color: pt.jt_tags.color,
          })) || [],
        _count: {
          comments: post.jt_comments?.length || 0,
        },
      })) || []
    );
  } catch (error) {
    console.error("❌ Failed to fetch recent posts:", error);
    return [];
  }
}

// Get recommended posts using Supabase
export async function getRecommendedPostsSupabase(
  limit: number = 6
): Promise<Post[]> {
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
        featured,
        category,
        hotScore,
        createdAt,
        updatedAt,
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
        jt_comments (count)
      `
      )
      .eq("published", true)
      .eq("featured", true)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Failed to fetch recommended posts:", error);
      return [];
    }

    // Transform the data to match our expected format
    return (
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: post.published,
        featured: post.featured,
        category: post.category,
        hotScore: post.hotScore,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: (post.jt_users as any).id,
          name: (post.jt_users as any).name,
          email: (post.jt_users as any).email,
        },
        tags:
          post.jt_post_tags?.map((pt: any) => ({
            id: pt.jt_tags.id,
            name: pt.jt_tags.name,
            slug: pt.jt_tags.slug,
            color: pt.jt_tags.color,
          })) || [],
        _count: {
          comments: post.jt_comments?.length || 0,
        },
      })) || []
    );
  } catch (error) {
    console.error("❌ Failed to fetch recommended posts:", error);
    return [];
  }
}
