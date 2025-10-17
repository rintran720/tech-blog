# Hướng dẫn tích hợp MySQL vào dự án Next.js

## Cài đặt và cấu hình

### 1. Cài đặt MySQL

#### Trên macOS (sử dụng Homebrew):

```bash
brew install mysql
brew services start mysql
```

#### Trên Ubuntu/Debian:

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Trên Windows:

Tải và cài đặt MySQL từ [mysql.com](https://dev.mysql.com/downloads/mysql/)

### 2. Tạo database

```sql
-- Đăng nhập vào MySQL
mysql -u root -p

-- Tạo database
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user (tùy chọn)
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục gốc của dự án:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/blog_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Chạy migration

```bash
# Tạo migration đầu tiên
npx prisma migrate dev --name init

# Hoặc push schema trực tiếp (cho development)
npx prisma db push
```

### 5. Seed data (tùy chọn)

Tạo file `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Tạo user mẫu
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
    },
  });

  // Tạo bài viết mẫu
  const post = await prisma.post.create({
    data: {
      title: "Chào mừng đến với blog",
      slug: "chao-mung-den-voi-blog",
      content: "Đây là bài viết đầu tiên...",
      excerpt: "Giới thiệu về blog",
      published: true,
      authorId: user.id,
    },
  });

  console.log("Seed data created:", { user, post });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Thêm script vào `package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

Chạy seed:

```bash
npm run db:seed
```

## Cấu trúc Database

### Models đã được tạo:

1. **User** - Thông tin người dùng
2. **Post** - Bài viết blog
3. **Tag** - Thẻ phân loại
4. **PostTag** - Liên kết giữa bài viết và thẻ
5. **Comment** - Bình luận

### Quan hệ:

- User có nhiều Posts và Comments
- Post thuộc về một User và có nhiều Comments
- Post có thể có nhiều Tags thông qua PostTag
- Comment thuộc về một Post và một User

## API Endpoints

### Posts

- `GET /api/posts` - Lấy danh sách bài viết
- `POST /api/posts` - Tạo bài viết mới
- `GET /api/posts/[slug]` - Lấy bài viết theo slug
- `PUT /api/posts/[slug]` - Cập nhật bài viết
- `DELETE /api/posts/[slug]` - Xóa bài viết

### Comments

- `GET /api/comments?postId=xxx` - Lấy comments của bài viết
- `POST /api/comments` - Tạo comment mới
- `PUT /api/comments/[id]` - Approve comment
- `DELETE /api/comments/[id]` - Xóa comment

## Sử dụng trong Components

```typescript
import { getPosts, getPostBySlug } from "@/lib/db-operations";

// Trong Server Component
export default async function BlogPage() {
  const posts = await getPosts({ published: true });

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
```

## Lưu ý quan trọng

1. **Bảo mật**: Luôn sử dụng biến môi trường cho thông tin database
2. **Performance**: Sử dụng Prisma's `include` và `select` để tối ưu queries
3. **Validation**: Thêm validation cho input data
4. **Error Handling**: Xử lý lỗi database một cách graceful
5. **Connection Pooling**: Prisma tự động quản lý connection pooling

## Troubleshooting

### Lỗi kết nối database:

- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin kết nối trong DATABASE_URL
- Kiểm tra firewall và port 3306

### Lỗi migration:

- Xóa database và tạo lại
- Chạy `npx prisma db push` để sync schema
- Kiểm tra syntax trong schema.prisma
