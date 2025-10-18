# Hướng dẫn khắc phục lỗi Database Connection trên Vercel

## Vấn đề

Lỗi: `Can't reach database server at db.fisepxqawoakyvoxsddl.supabase.co:5432`

## Các bước kiểm tra và khắc phục

### 1. Kiểm tra Environment Variables trên Vercel

Đăng nhập vào Vercel Dashboard và kiểm tra:

1. Vào project của bạn trên Vercel
2. Chọn tab "Settings"
3. Chọn "Environment Variables"
4. Đảm bảo có các biến sau:

```
DATABASE_URL=postgresql://postgres:[password]@db.fisepxqawoakyvoxsddl.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 2. Kiểm tra Supabase Database

1. Đăng nhập vào Supabase Dashboard
2. Kiểm tra project của bạn
3. Vào "Settings" > "Database"
4. Kiểm tra:
   - Database có đang chạy không?
   - Connection string có đúng không?
   - IP restrictions có chặn Vercel không?

### 3. Kiểm tra Connection Pooling

Supabase có giới hạn số kết nối đồng thời. Thêm connection pooling:

```env
DATABASE_URL=postgresql://postgres:[password]@db.fisepxqawoakyvoxsddl.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### 4. Test Database Connection

Sau khi deploy, truy cập: `https://your-domain.vercel.app/api/test-db`

Endpoint này sẽ:

- Test kết nối database
- Hiển thị thông tin chi tiết về lỗi
- Kiểm tra environment variables

### 5. Kiểm tra Supabase Settings

Trong Supabase Dashboard:

1. **Database Settings**:

   - Kiểm tra "Database URL"
   - Kiểm tra "Connection pooling"
   - Kiểm tra "SSL mode"

2. **API Settings**:
   - Kiểm tra "Project URL"
   - Kiểm tra "API Keys"

### 6. Cấu hình Connection Pooling

Nếu vẫn lỗi, thử cấu hình connection pooling trong Supabase:

1. Vào Supabase Dashboard
2. Settings > Database
3. Bật "Connection pooling"
4. Chọn "Transaction mode"
5. Cập nhật DATABASE_URL với `?pgbouncer=true`

### 7. Kiểm tra Network và Firewall

1. Kiểm tra Supabase có bị block IP không
2. Kiểm tra Vercel có thể kết nối ra ngoài không
3. Thử disable SSL nếu cần: `?sslmode=disable`

### 8. Debug Steps

1. Deploy với endpoint test: `/api/test-db`
2. Kiểm tra logs trên Vercel
3. Kiểm tra logs trên Supabase
4. So sánh với local environment

### 9. Alternative Solutions

Nếu vẫn không được:

1. **Sử dụng Supabase Edge Functions** thay vì direct database calls
2. **Implement retry logic** trong Prisma client
3. **Sử dụng connection pooling** với PgBouncer
4. **Fallback to static data** khi database không available

## Test Commands

```bash
# Test local connection
npm run dev
# Truy cập: http://localhost:3000/api/test-db

# Test production
# Truy cập: https://your-domain.vercel.app/api/test-db
```

## Common Issues

1. **Wrong DATABASE_URL format**
2. **Missing environment variables**
3. **Supabase project paused**
4. **Network connectivity issues**
5. **Connection limit exceeded**
6. **SSL/TLS issues**
