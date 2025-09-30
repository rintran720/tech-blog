export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  readTime: number;
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Giới thiệu về Next.js 15 và những tính năng mới",
    slug: "nextjs-15-introduction",
    description:
      "Khám phá những tính năng mới trong Next.js 15, từ Turbopack đến Server Components và cách chúng cải thiện hiệu suất ứng dụng.",
    content: `
# Giới thiệu về Next.js 15

Next.js 15 đã được phát hành với nhiều tính năng mới thú vị. Trong bài viết này, chúng ta sẽ khám phá những cải tiến quan trọng nhất.

## Turbopack - Bundler mới

Turbopack là bundler mới được viết bằng Rust, mang lại hiệu suất build nhanh hơn đáng kể so với Webpack.

## Server Components

Server Components cho phép render components trên server, giảm bundle size và cải thiện hiệu suất.

## Kết luận

Next.js 15 là một bước tiến lớn trong việc phát triển ứng dụng web hiện đại.
    `,
    author: "John Tran",
    publishedAt: "2024-01-15",
    category: "Frontend",
    tags: ["Next.js", "React", "JavaScript", "Web Development"],
    readTime: 5,
    featured: true,
  },
  {
    id: "2",
    title: "TypeScript Best Practices cho dự án lớn",
    slug: "typescript-best-practices",
    description:
      "Những best practices quan trọng khi sử dụng TypeScript trong các dự án lớn, từ type safety đến code organization.",
    content: `
# TypeScript Best Practices

TypeScript là một công cụ mạnh mẽ để phát triển ứng dụng JavaScript type-safe. Dưới đây là những best practices quan trọng.

## Type Safety

Luôn sử dụng strict mode và enable các compiler options cần thiết.

## Code Organization

Tổ chức code theo modules và sử dụng barrel exports.

## Error Handling

Sử dụng Result types và proper error handling patterns.
    `,
    author: "John Tran",
    publishedAt: "2024-01-10",
    category: "Backend",
    tags: ["TypeScript", "Best Practices", "Code Quality"],
    readTime: 8,
    featured: true,
  },
  {
    id: "3",
    title: "Tối ưu hóa hiệu suất React với useMemo và useCallback",
    slug: "react-performance-optimization",
    description:
      "Hướng dẫn chi tiết về cách sử dụng useMemo và useCallback để tối ưu hóa hiệu suất React applications.",
    content: `
# Tối ưu hóa hiệu suất React

React cung cấp nhiều hooks để tối ưu hóa hiệu suất. Trong bài viết này, chúng ta sẽ tập trung vào useMemo và useCallback.

## useMemo

useMemo giúp memoize kết quả của một computation expensive.

## useCallback

useCallback giúp memoize function references, tránh re-render không cần thiết.

## Khi nào sử dụng

Không phải lúc nào cũng cần sử dụng. Hãy đo lường trước khi tối ưu.
    `,
    author: "John Tran",
    publishedAt: "2024-01-05",
    category: "Frontend",
    tags: ["React", "Performance", "Hooks", "Optimization"],
    readTime: 6,
    featured: false,
  },
  {
    id: "4",
    title: "Docker cho Developer: Từ cơ bản đến nâng cao",
    slug: "docker-for-developers",
    description:
      "Hướng dẫn toàn diện về Docker, từ những khái niệm cơ bản đến các kỹ thuật nâng cao cho developers.",
    content: `
# Docker cho Developer

Docker đã trở thành một công cụ không thể thiếu trong quy trình phát triển hiện đại.

## Containerization

Container giúp đảm bảo ứng dụng chạy nhất quán trên mọi môi trường.

## Dockerfile Best Practices

Viết Dockerfile hiệu quả với multi-stage builds và layer caching.

## Docker Compose

Sử dụng Docker Compose để quản lý multi-container applications.

## Production Deployment

Các best practices khi deploy Docker containers lên production.
    `,
    author: "John Tran",
    publishedAt: "2024-01-01",
    category: "DevOps",
    tags: ["Docker", "Containerization", "DevOps", "Deployment"],
    readTime: 10,
    featured: false,
  },
  {
    id: "5",
    title: "GraphQL vs REST API: So sánh và lựa chọn",
    slug: "graphql-vs-rest-api",
    description:
      "So sánh chi tiết giữa GraphQL và REST API, ưu nhược điểm của từng approach và khi nào nên sử dụng.",
    content: `
# GraphQL vs REST API

Cả GraphQL và REST đều là những cách tiếp cận phổ biến để xây dựng APIs. Hãy so sánh chúng.

## REST API

REST là architectural style sử dụng HTTP methods và status codes.

## GraphQL

GraphQL là query language và runtime cho APIs, cho phép clients request chính xác data cần thiết.

## So sánh

- Performance: GraphQL có thể giảm over-fetching
- Caching: REST có HTTP caching tốt hơn
- Learning curve: REST đơn giản hơn
- Flexibility: GraphQL linh hoạt hơn

## Khi nào sử dụng

Chọn REST cho simple CRUD operations, GraphQL cho complex data requirements.
    `,
    author: "John Tran",
    publishedAt: "2023-12-28",
    category: "Backend",
    tags: ["GraphQL", "REST", "API", "Backend"],
    readTime: 7,
    featured: false,
  },
];

export const categories = [
  "Frontend",
  "Backend",
  "DevOps",
  "Mobile",
  "AI/ML",
  "Database",
];

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
