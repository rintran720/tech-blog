# Performance Optimization Guide

Tài liệu này tổng hợp các tối ưu hóa performance đã được triển khai cho website.

## 📋 Mục Lục

1. [Service Worker & Caching](#service-worker--caching)
2. [Back/Forward Cache (bfcache)](#backforward-cache-bfcache)
3. [Cache-Control Headers](#cache-control-headers)
4. [Static Assets Optimization](#static-assets-optimization)

---

## ⚡ Service Worker & Caching

### Đã Triển Khai

Service Worker đã được triển khai để cải thiện performance:

#### Caching Strategies

**Cache First** (cho static assets):

- Next.js static files (`/_next/static/`)
- Images và fonts
- Độ trễ tải giảm đáng kể

**Network First** (cho dynamic content):

- HTML pages
- API responses
- Luôn cố gắng fetch mới nhất, fallback về cache nếu offline

#### Các tính năng

- ✅ **Offline Support**: Trang có thể hoạt động offline với cached content
- ✅ **Fast Loading**: Static assets được cache ngay lần đầu load
- ✅ **Auto Update**: Service worker tự động kiểm tra updates mỗi giờ
- ✅ **Cache Management**: Tự động xóa old caches khi có version mới
- ✅ **Background Sync**: Có thể mở rộng để sync data khi online lại

#### Cache Names

- `blog-cache-v1`: Static assets được cache khi install
- `blog-runtime-v1`: Runtime assets (images, fonts, HTML)
- `blog-api-v1`: API responses được cache

#### Testing

Xem chi tiết trong [SERVICE_WORKER_TEST.md](./SERVICE_WORKER_TEST.md)

---

## 🔄 Back/Forward Cache (bfcache)

### Vấn Đề

Lighthouse báo: **"Pages with cache-control:no-store header cannot enter back/forward cache."**

**Nguyên nhân:** `export const dynamic = "force-dynamic"` trong các pages khiến Next.js tự động set `cache-control: no-store`, ngăn pages vào back/forward cache.

### Giải Pháp Đã Triển Khai

#### 1. Headers Configuration trong next.config.ts

Đã thêm headers config để override cache-control và cho phép bfcache:

```typescript
// next.config.ts
async headers() {
  return [
    {
      // HTML pages - Allow back/forward cache
      source: "/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
      ],
    },
    {
      // Static assets - Long cache
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      // Images and fonts - Medium cache
      source: "/:all*(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
  ];
}
```

#### 2. Middleware Override

Đã cập nhật `middleware.ts` để override cache-control cho HTML pages:

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Only apply to HTML pages
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.match(
      /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js)$/
    )
  ) {
    // Override Next.js force-dynamic default no-store header
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return response;
}
```

**Lưu ý:** `must-revalidate` cho phép bfcache, nhưng browser sẽ revalidate khi quay lại.

### Alternative Solutions

#### Option 2: Thay đổi Dynamic Strategy

Nếu có thể, thay `force-dynamic` thành `auto` hoặc sử dụng ISR:

```typescript
// Thay vì:
export const dynamic = "force-dynamic";

// Sử dụng:
export const revalidate = 3600; // Revalidate mỗi giờ
```

#### Option 3: Sử dụng Route Segment Config

Cho phép bfcache bằng cách set `dynamic` và headers phù hợp:

```typescript
export const dynamic = "auto"; // Thay vì "force-dynamic"
export const revalidate = 60; // Revalidate mỗi 60 giây
```

### Trade-offs

- **force-dynamic**: Luôn fresh, nhưng không vào bfcache
- **ISR với revalidate**: Có thể cache, cho phép bfcache, nhưng có thể có stale data
- **must-revalidate**: Cho phép bfcache, nhưng browser sẽ revalidate

### Best Practice

1. **Static pages**: Sử dụng static generation hoặc ISR
2. **Dynamic pages**: Sử dụng `revalidate` thay vì `force-dynamic` nếu có thể
3. **Real-time pages**: Chấp nhận `force-dynamic` nếu cần data luôn fresh

### Testing

Sau khi fix, test với Lighthouse:

1. Run Lighthouse audit
2. Kiểm tra "Does not use cache-control: no-store" không còn warning
3. Test back/forward navigation speed

---

## 📦 Cache-Control Headers

### Configuration hiện tại

Đã được config trong `next.config.ts` và `middleware.ts`:

#### HTML Pages

```
Cache-Control: public, max-age=0, must-revalidate
```

- Cho phép bfcache
- Browser sẽ revalidate khi cần
- Data vẫn fresh với `force-dynamic`

#### Static Assets

```
Cache-Control: public, max-age=31536000, immutable
```

- Cache lâu dài (1 năm)
- Immutable = không bao giờ thay đổi
- Tăng performance đáng kể

#### Fonts

```
Cache-Control: public, max-age=31536000, immutable
```

- Cache lâu dài (1 năm)
- Immutable vì fonts có hash trong filename
- Tối ưu performance cho repeat visits
- Lighthouse recommendation: ít nhất 1 tuần, tốt nhất 1 năm

#### Favicon

```
Cache-Control: public, max-age=31536000, immutable
```

- Cache lâu dài (1 năm)
- Favicon hiếm khi thay đổi
- Lighthouse recommendation: ít nhất 1 tuần, tốt nhất 1 năm

#### Images

```
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

- Cache 24 giờ
- Có thể serve stale trong 7 ngày trong khi revalidate
- Balance giữa freshness và performance

### Cách Hoạt Động

1. **Browser nhận response** với `must-revalidate`
2. **Store vào bfcache** khi user navigate away
3. **Revalidate khi quay lại** nếu cần
4. **Serve từ cache** nếu vẫn fresh

---

## 🚀 Static Assets Optimization

### Next.js Static Files

- Auto-optimized by Next.js
- Code splitting tự động
- Tree shaking
- Minification trong production

### Image Optimization

- Next.js Image component với auto-optimization
- WebP format support
- Lazy loading
- Responsive images

### Font Optimization

- Next.js font optimization
- Preload critical fonts
- Font display: swap để tránh FOIT/FOUT

---

## 📊 Performance Metrics

### Expected Improvements

- ⚡ **First Load**: Giảm 10-20% nhờ cached assets
- ⚡ **Subsequent Loads**: Tăng 50-80% (hầu hết từ cache)
- ⚡ **Offline**: 100% improvement (có thể dùng khi offline)
- ⚡ **Back/Forward**: Instant navigation nhờ bfcache
- ⚡ **Repeat Visits**: Fonts và favicon cache 1 năm giảm network requests
- ⚡ **Lighthouse Score**: Cải thiện "Uses long cache lifetime" audit

### Monitoring

Sử dụng các tools sau để monitor performance:

1. **Chrome DevTools → Lighthouse**

   - Run Performance audit
   - Kiểm tra PWA score
   - Xem First Contentful Paint, Time to Interactive

2. **Chrome DevTools → Performance Tab**

   - Record performance
   - So sánh metrics với và không có optimizations

3. **Network Tab**
   - Compare load time với và không có cache
   - Xem Transfer size (nên nhỏ hơn với cache)

---

## 🔧 Troubleshooting

### Service Worker không register

Xem [SERVICE_WORKER_TEST.md](./SERVICE_WORKER_TEST.md) để troubleshoot.

### Cache-Control không hoạt động

1. Kiểm tra `next.config.ts` có headers config
2. Kiểm tra `middleware.ts` có override headers
3. Clear browser cache và test lại
4. Verify với DevTools → Network → Headers

### bfcache warning vẫn còn

1. Đảm bảo middleware đang chạy
2. Kiểm tra headers trong Network tab
3. Verify không có `no-store` trong response headers
4. Test với fresh browser session

### Cache TTL warning từ Lighthouse

**Vấn đề:** Lighthouse báo "A long cache lifetime can speed up repeat visits"

**Triệu chứng:**

- Font files (.woff2) cache chỉ 1 ngày (1d)
- Favicon.ico cache chỉ 1 ngày (1d)
- Lighthouse warning về short cache lifetime

**Giải pháp đã áp dụng:**

- ✅ Fonts: `max-age=31536000, immutable` (1 năm)
- ✅ Favicon: `max-age=31536000, immutable` (1 năm)
- ✅ Static assets: `max-age=31536000, immutable` (1 năm)

**Kiểm tra:**

1. DevTools → Network → Click vào font file hoặc favicon
2. Headers tab → Verify `Cache-Control: public, max-age=31536000, immutable`
3. Run Lighthouse audit → "Uses long cache lifetime" should pass
4. Clear browser cache và reload để test với headers mới

**Lưu ý:**

- Fonts thường có hash trong filename (ví dụ: `797e433ab948586e-s.p.dbea232f.woff2`)
- Vì có hash, fonts là immutable và an toàn để cache lâu dài
- Favicon hiếm khi thay đổi, cache 1 năm không gây vấn đề

### Critical Request Chain Warning

**Vấn đề:** Lighthouse báo "Avoid chaining critical requests"

**Triệu chứng:**

- Maximum critical path latency cao (ví dụ: 2,604 ms)
- Fonts hoặc manifest.json trong critical chain
- External requests (như Google Fonts) chậm

**Nguyên nhân:**

- Request đến Google Fonts (`fonts.googleapis.com`) mất nhiều thời gian (2.6s)
- Chain: `/blog/redis-nang-cao` → Google Fonts CSS → ...
- Manifest.json cũng trong chain (908ms)

**Giải pháp đã áp dụng:**

#### 1. Font Loading Optimization

Đã optimize font loading trong `layout.tsx`:

```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Avoid FOIT (Flash of Invisible Text)
  preload: true, // Preload critical font
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
});
```

**Lợi ích:**

- `display: "swap"`: Fonts hiển thị ngay với fallback, không block render
- `preload: true`: Preload font chính để giảm latency
- Next.js tự động self-host fonts (không cần request đến Google Fonts)

#### 2. Next.js Font Optimization

Next.js `next/font/google` tự động:

- Self-host fonts (không cần request đến Google Fonts)
- Optimize font loading
- Reduce critical request chain

#### 3. Giảm Chain Length

**Best Practices:**

- ✅ Preload chỉ critical fonts
- ✅ Use `font-display: swap` để tránh block
- ✅ Self-host fonts với Next.js
- ✅ Minimize external requests

#### 4. Nếu Vẫn Thấy Google Fonts Request

**Nguyên nhân có thể:**

1. Browser extension đang inject Google Fonts
2. Một dependency đang import Google Fonts
3. Cached request từ lần trước

**Giải pháp:**

1. **Clear browser cache** và test lại
2. **Disable extensions** và test
3. **Check dependencies**: `npm list | grep font`
4. **Block Google Fonts** trong service worker (nếu cần)

**Kiểm tra:**

1. DevTools → Network → Throttle network
2. Verify fonts load từ `/_next/static/media/` (self-hosted)
3. Check không có request đến `fonts.googleapis.com`
4. Run Lighthouse → "Avoid chaining critical requests" should improve

**Expected Improvements:**

- ⚡ **Reduced chain length**: Fonts preloaded, không block
- ⚡ **Faster LCP**: Fonts load với swap, không block render
- ⚡ **Better performance**: Self-hosted fonts, no external requests
- ⚡ **Improved Lighthouse score**: Critical request chain audit should improve

---

## 📚 Tài Liệu Tham Khảo

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Back/Forward Cache](https://web.dev/bfcache/)
- [Cache-Control Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

---

**Cập nhật lần cuối**: Tháng 1, 2025
