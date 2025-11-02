import { supabase } from "../src/lib/supabase";
import { generateId } from "../src/lib/uuid";

async function seedTags() {
  console.log("🌱 Seeding tags...");

  const tags = [
    {
      name: "JavaScript",
      slug: "javascript",
      color: "#F7DF1E",
    },
    {
      name: "TypeScript",
      slug: "typescript",
      color: "#3178C6",
    },
    {
      name: "React",
      slug: "react",
      color: "#61DAFB",
    },
    {
      name: "Next.js",
      slug: "nextjs",
      color: "#000000",
    },
    {
      name: "Node.js",
      slug: "nodejs",
      color: "#339933",
    },
    {
      name: "Supabase",
      slug: "supabase",
      color: "#3ECF8E",
    },
    {
      name: "Database",
      slug: "database",
      color: "#336791",
    },
    {
      name: "Web Development",
      slug: "web-development",
      color: "#FF6B6B",
    },
    {
      name: "Frontend",
      slug: "frontend",
      color: "#4ECDC4",
    },
    {
      name: "Backend",
      slug: "backend",
      color: "#45B7D1",
    },
    {
      name: "API",
      slug: "api",
      color: "#96CEB4",
    },
    {
      name: "Authentication",
      slug: "authentication",
      color: "#FFEAA7",
    },
    {
      name: "Security",
      slug: "security",
      color: "#DDA0DD",
    },
    {
      name: "Performance",
      slug: "performance",
      color: "#98D8C8",
    },
    {
      name: "Tutorial",
      slug: "tutorial",
      color: "#F7DC6F",
    },
  ];

  const createdTags: any[] = [];

  for (const tag of tags) {
    const { data: existing } = await supabase
      .from("jt_tags")
      .select("id")
      .eq("slug", tag.slug)
      .single();

    if (!existing) {
      const tagId = generateId();
      const { error } = await supabase.from("jt_tags").insert({
        id: tagId,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        createdAt: new Date().toISOString(),
      });

      if (error) {
        console.error(`❌ Failed to create tag ${tag.slug}:`, error);
      } else {
        console.log(`✅ Created tag: ${tag.name}`);
        createdTags.push({ id: tagId, ...tag });
      }
    } else {
      console.log(`ℹ️ Tag already exists: ${tag.name}`);
      createdTags.push({ id: existing.id, ...tag });
    }
  }

  return createdTags;
}

async function seedSamplePosts(tags: any[]) {
  console.log("🌱 Seeding sample posts...");

  // Get admin user
  const { data: adminUser } = await supabase
    .from("jt_users")
    .select("id")
    .eq("email", process.env.ADMIN_EMAIL || "admin@example.com")
    .single();

  if (!adminUser) {
    console.error(
      "❌ Admin user not found. Please run admin user seeding first."
    );
    return;
  }

  const posts = [
    {
      title: "Giới thiệu về Next.js 15 và App Router",
      slug: "gioi-thieu-nextjs-15-app-router",
      content: `# Giới thiệu về Next.js 15 và App Router

Next.js 15 đã mang đến nhiều cải tiến đáng kể, đặc biệt là với App Router mới. Trong bài viết này, chúng ta sẽ tìm hiểu về những tính năng mới và cách sử dụng chúng.

## App Router là gì?

App Router là một kiến trúc routing mới trong Next.js 13+ cho phép bạn xây dựng ứng dụng React với các tính năng mạnh mẽ hơn:

- **Server Components**: Render components trên server
- **Streaming**: Load nội dung theo từng phần
- **Nested Layouts**: Tạo layout phức tạp dễ dàng
- **Loading States**: Quản lý trạng thái loading tự động

## Cách sử dụng App Router

\`\`\`typescript
// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Next.js 15!</h1>
      <p>This is a server component.</p>
    </div>
  );
}
\`\`\`

## Kết luận

App Router mang lại trải nghiệm phát triển tốt hơn và hiệu suất cao hơn cho ứng dụng Next.js của bạn.`,
      excerpt:
        "Tìm hiểu về Next.js 15 và App Router - những tính năng mới giúp xây dựng ứng dụng React hiệu quả hơn.",
      category: "Web Development",
      tagSlugs: ["nextjs", "react", "web-development", "frontend"],
    },
    {
      title: "Xây dựng API với Supabase và Next.js",
      slug: "xay-dung-api-supabase-nextjs",
      content: `# Xây dựng API với Supabase và Next.js

Supabase là một Backend-as-a-Service (BaaS) mạnh mẽ giúp bạn xây dựng ứng dụng web nhanh chóng. Trong bài viết này, chúng ta sẽ tìm hiểu cách tích hợp Supabase với Next.js.

## Tại sao chọn Supabase?

- **PostgreSQL Database**: Database quan hệ mạnh mẽ
- **Real-time Subscriptions**: Cập nhật dữ liệu theo thời gian thực
- **Authentication**: Hệ thống xác thực tích hợp sẵn
- **Storage**: Lưu trữ file đơn giản
- **Edge Functions**: Chạy serverless functions

## Cài đặt Supabase

\`\`\`bash
npm install @supabase/supabase-js
\`\`\`

## Cấu hình Supabase Client

\`\`\`typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
\`\`\`

## Sử dụng trong API Routes

\`\`\`typescript
// app/api/posts/route.ts
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ posts: data })
}
\`\`\`

## Kết luận

Supabase giúp bạn tập trung vào việc xây dựng tính năng thay vì quản lý infrastructure.`,
      excerpt:
        "Hướng dẫn chi tiết cách tích hợp Supabase với Next.js để xây dựng API mạnh mẽ và hiệu quả.",
      category: "Backend",
      tagSlugs: ["supabase", "nextjs", "api", "database", "backend"],
    },
    {
      title: "Authentication với NextAuth.js và Google OAuth",
      slug: "authentication-nextauth-google-oauth",
      content: `# Authentication với NextAuth.js và Google OAuth

NextAuth.js là thư viện authentication phổ biến cho Next.js. Trong bài viết này, chúng ta sẽ tìm hiểu cách thiết lập Google OAuth với NextAuth.js.

## Tại sao chọn NextAuth.js?

- **Multiple Providers**: Hỗ trợ nhiều nhà cung cấp OAuth
- **Session Management**: Quản lý session tự động
- **TypeScript Support**: Hỗ trợ TypeScript đầy đủ
- **Database Adapters**: Tích hợp với nhiều database
- **Security**: Bảo mật cao với JWT và session

## Cài đặt NextAuth.js

\`\`\`bash
npm install next-auth
\`\`\`

## Cấu hình Google OAuth

Đầu tiên, bạn cần tạo Google OAuth credentials tại [Google Cloud Console](https://console.cloud.google.com/).

\`\`\`typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      // Customize session data
      return session
    },
  },
}
\`\`\`

## API Route cho Authentication

\`\`\`typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
\`\`\`

## Sử dụng trong Components

\`\`\`typescript
// components/auth-button.tsx
import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn('google')}>
      Sign in with Google
    </button>
  )
}
\`\`\`

## Kết luận

NextAuth.js giúp bạn tích hợp authentication một cách dễ dàng và bảo mật.`,
      excerpt:
        "Hướng dẫn chi tiết cách thiết lập Google OAuth authentication với NextAuth.js trong Next.js.",
      category: "Security",
      tagSlugs: [
        "authentication",
        "nextauth",
        "google-oauth",
        "security",
        "tutorial",
      ],
    },
    {
      title: "Tối ưu hóa hiệu suất React với useMemo và useCallback",
      slug: "toi-uu-hieu-suat-react-usememo-usecallback",
      content: `# Tối ưu hóa hiệu suất React với useMemo và useCallback

React cung cấp nhiều hooks để tối ưu hóa hiệu suất ứng dụng. Trong bài viết này, chúng ta sẽ tìm hiểu về useMemo và useCallback.

## useMemo - Memoization cho giá trị

useMemo giúp bạn "ghi nhớ" kết quả của một phép tính và chỉ tính toán lại khi dependencies thay đổi.

\`\`\`typescript
import { useMemo } from 'react'

function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter)
  }, [items, filter])

  return (
    <div>
      {filteredItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
\`\`\`

## useCallback - Memoization cho functions

useCallback giúp bạn "ghi nhớ" một function và chỉ tạo lại khi dependencies thay đổi.

\`\`\`typescript
import { useCallback } from 'react'

function ParentComponent() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  const handleClick = useCallback(() => {
    console.log('Button clicked!')
  }, [])

  const handleNameChange = useCallback((newName: string) => {
    setName(newName)
  }, [])

  return (
    <div>
      <ChildComponent onClick={handleClick} />
      <NameInput onChange={handleNameChange} />
    </div>
  )
}
\`\`\`

## Khi nào nên sử dụng?

### Sử dụng useMemo khi:
- Tính toán phức tạp và tốn kém
- Tạo objects/arrays mới trong render
- Dependencies ít thay đổi

### Sử dụng useCallback khi:
- Truyền functions xuống child components
- Functions được sử dụng trong useEffect dependencies
- Child components được memoized với React.memo

## Ví dụ thực tế

\`\`\`typescript
import { useMemo, useCallback, memo } from 'react'

interface User {
  id: string
  name: string
  email: string
  age: number
}

interface UserListProps {
  users: User[]
  searchTerm: string
  onUserSelect: (user: User) => void
}

const UserItem = memo(({ user, onSelect }: { user: User; onSelect: (user: User) => void }) => {
  return (
    <div onClick={() => onSelect(user)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
})

function UserList({ users, searchTerm, onUserSelect }: UserListProps) {
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleUserSelect = useCallback((user: User) => {
    onUserSelect(user)
  }, [onUserSelect])

  return (
    <div>
      {filteredUsers.map(user => (
        <UserItem 
          key={user.id} 
          user={user} 
          onSelect={handleUserSelect}
        />
      ))}
    </div>
  )
}
\`\`\`

## Kết luận

useMemo và useCallback là những công cụ mạnh mẽ để tối ưu hóa hiệu suất React. Tuy nhiên, hãy sử dụng chúng một cách thông minh và chỉ khi thực sự cần thiết.`,
      excerpt:
        "Tìm hiểu cách sử dụng useMemo và useCallback để tối ưu hóa hiệu suất React application.",
      category: "Performance",
      tagSlugs: [
        "react",
        "performance",
        "usememo",
        "usecallback",
        "optimization",
      ],
    },
    {
      title: "TypeScript Best Practices cho React Developers",
      slug: "typescript-best-practices-react-developers",
      content: `# TypeScript Best Practices cho React Developers

TypeScript giúp bạn viết code React an toàn và dễ bảo trì hơn. Trong bài viết này, chúng ta sẽ tìm hiểu các best practices quan trọng.

## 1. Định nghĩa Props Interface

Luôn định nghĩa interface cho component props:

\`\`\`typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
\`\`\`

## 2. Sử dụng Generic Types

Generic types giúp bạn tạo reusable components:

\`\`\`typescript
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  )
}

// Usage
const users = [
  { id: '1', name: 'John', email: 'john@example.com' },
  { id: '2', name: 'Jane', email: 'jane@example.com' }
]

<List
  items={users}
  renderItem={(user) => <span>{user.name} - {user.email}</span>}
  keyExtractor={(user) => user.id}
/>
\`\`\`

## 3. Event Handlers với Type Safety

\`\`\`typescript
interface FormProps {
  onSubmit: (data: FormData) => void
}

interface FormData {
  name: string
  email: string
  age: number
}

function Form({ onSubmit }: FormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const data: FormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      age: parseInt(formData.get('age') as string)
    }
    
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <input name="age" type="number" required />
      <button type="submit">Submit</button>
    </form>
  )
}
\`\`\`

## 4. Custom Hooks với TypeScript

\`\`\`typescript
interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
\`\`\`

## 5. API Response Types

\`\`\`typescript
interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

interface User {
  id: string
  name: string
  email: string
}

// Usage
const { data, loading, error } = useApi<ApiResponse<User[]>>('/api/users')

if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
if (data?.success) {
  return (
    <div>
      {data.data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
\`\`\`

## 6. Utility Types

Sử dụng utility types để tạo types mới từ types có sẵn:

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
}

// Tạo type cho form input (loại bỏ id, password, createdAt)
type UserFormData = Omit<User, 'id' | 'password' | 'createdAt'>

// Tạo type cho user update (tất cả fields optional)
type UserUpdateData = Partial<Pick<User, 'name' | 'email'>>

// Tạo type cho user display (chỉ hiển thị một số fields)
type UserDisplay = Pick<User, 'id' | 'name' | 'email'>
\`\`\`

## Kết luận

TypeScript giúp bạn viết code React an toàn và dễ bảo trì. Hãy áp dụng những best practices này để tận dụng tối đa sức mạnh của TypeScript.`,
      excerpt:
        "Các best practices quan trọng khi sử dụng TypeScript với React để viết code an toàn và dễ bảo trì.",
      category: "Frontend",
      tagSlugs: [
        "typescript",
        "react",
        "frontend",
        "best-practices",
        "tutorial",
      ],
    },
  ];

  for (const post of posts) {
    const { data: existing } = await supabase
      .from("jt_posts")
      .select("id")
      .eq("slug", post.slug)
      .single();

    if (!existing) {
      const postId = generateId();
      const { error: postError } = await supabase.from("jt_posts").insert({
        id: postId,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        published: true,
        hotScore: Math.floor(Math.random() * 100),
        authorId: adminUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (postError) {
        console.error(`❌ Failed to create post ${post.slug}:`, postError);
        continue;
      }

      console.log(`✅ Created post: ${post.title}`);

      // Add tags to post
      for (const tagSlug of post.tagSlugs) {
        const tag = tags.find((t) => t.slug === tagSlug);
        if (tag) {
          const { error: tagError } = await supabase
            .from("jt_post_tags")
            .insert({
              postId: postId,
              tagId: tag.id,
            });

          if (tagError) {
            console.error(
              `❌ Failed to add tag ${tagSlug} to post ${post.slug}:`,
              tagError
            );
          }
        }
      }
    } else {
      console.log(`ℹ️ Post already exists: ${post.title}`);
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting tags and posts seeding...");

    const tags = await seedTags();
    await seedSamplePosts(tags);

    console.log("✅ Tags and posts seeding completed!");
  } catch (error) {
    console.error("❌ Tags and posts seeding failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedTags, seedSamplePosts };
