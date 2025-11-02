# Tối Ưu Hóa SEO cho Blog

Tài liệu này mô tả các tối ưu hóa SEO đã được triển khai cho trang blog post.

## 📋 Tổng Quan

Trang blog post (`/blog/[slug]/page.tsx`) đã được tối ưu hóa đầy đủ cho SEO với các tính năng sau:

- ✅ Dynamic Metadata generation
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Structured Data (JSON-LD)
- ✅ Semantic HTML với Microdata
- ✅ Canonical URLs
- ✅ Robots meta tags
- ✅ Article meta tags

## 🔧 Cài Đặt

### Biến Môi Trường

Thêm biến môi trường sau vào file `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Nếu không có, hệ thống sẽ sử dụng `http://localhost:3000` làm giá trị mặc định.

## 📄 Dynamic Metadata

Hàm `generateMetadata` tự động tạo metadata dựa trên nội dung bài viết:

```typescript
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata>;
```

### Các metadata được tạo:

1. **Title**: `${post.title} | Blog Công Nghệ`
2. **Description**: Từ `post.excerpt` hoặc 160 ký tự đầu của content
3. **Keywords**: Từ tags của bài viết
4. **Authors**: Tên tác giả
5. **Category**: Tag đầu tiên hoặc "Công nghệ"

## 🌐 Open Graph Tags

Open Graph tags giúp bài viết hiển thị đẹp khi chia sẻ trên Facebook, LinkedIn, v.v.

### Các tags bao gồm:

- `og:title`: Tiêu đề bài viết
- `og:description`: Mô tả ngắn
- `og:url`: URL đầy đủ của bài viết
- `og:site_name`: "Blog Công Nghệ"
- `og:locale`: "vi_VN"
- `og:type`: "article"
- `og:published_time`: Thời gian xuất bản (ISO 8601)
- `og:modified_time`: Thời gian cập nhật (ISO 8601)
- `og:authors`: Tác giả
- `og:tags`: Danh sách tags
- `og:image`: Hình ảnh (từ author image hoặc default OG image)

## 🐦 Twitter Card Tags

Twitter Card giúp bài viết hiển thị đẹp khi chia sẻ trên Twitter.

### Các tags:

- `twitter:card`: "summary_large_image"
- `twitter:title`: Tiêu đề
- `twitter:description`: Mô tả
- `twitter:images`: Hình ảnh
- `twitter:creator`: Handle của tác giả

## 📊 Structured Data (JSON-LD)

Structured Data sử dụng Schema.org để giúp search engines hiểu rõ hơn về nội dung.

### Schema được sử dụng:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Tiêu đề bài viết",
  "description": "Mô tả",
  "image": "URL hình ảnh",
  "datePublished": "2024-01-01T00:00:00Z",
  "dateModified": "2024-01-01T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Tên tác giả",
    "email": "email@example.com",
    "image": "URL avatar"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Blog Công Nghệ"
  },
  "keywords": "tag1, tag2, tag3",
  "articleSection": "Công nghệ",
  "wordCount": 1000
}
```

### Lợi ích:

- ✅ Hiển thị rich snippets trên Google Search
- ✅ Tăng khả năng xuất hiện trong kết quả tìm kiếm
- ✅ Cung cấp thông tin chi tiết về bài viết cho search engines

## 🏗️ Semantic HTML & Microdata

HTML được cấu trúc với các semantic elements và microdata:

### Elements được sử dụng:

1. **`<article>`**: Wrapper chính cho bài viết

   - `itemScope`: Xác định phạm vi microdata
   - `itemType="https://schema.org/BlogPosting"`: Loại schema

2. **`<header>`**: Header của article

   - `itemProp="headline"`: Tiêu đề
   - `itemProp="description"`: Mô tả

3. **`<time>`**: Thời gian xuất bản/cập nhật

   - `itemProp="datePublished"` / `itemProp="dateModified"`
   - `dateTime`: ISO 8601 format

4. **Author Section**:

   - `itemScope itemType="https://schema.org/Person"`
   - `itemProp="name"`, `itemProp="email"`, `itemProp="image"`

5. **Content**:

   - `itemProp="articleBody"`: Nội dung chính

6. **Tags**:
   - `itemProp="keywords"`: Danh sách tags

### Accessibility:

- `<nav aria-label="Breadcrumb">`: Navigation với aria-label
- `<aside>`: Section phụ (author info)
- Semantic HTML giúp screen readers hiểu cấu trúc

## 🔗 Canonical URL

Canonical URL được thiết lập để tránh duplicate content:

```typescript
alternates: {
  canonical: postUrl,
}
```

Mỗi bài viết có một canonical URL duy nhất: `${siteUrl}/blog/${slug}`

## 🤖 Robots Meta Tags

Robots meta tags điều khiển cách search engines index bài viết:

```typescript
robots: {
  index: post.published !== false,
  follow: true,
  googleBot: {
    index: post.published !== false,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
}
```

### Quy tắc:

- **Published posts**: Được index và follow
- **Unpublished posts**: Không được index
- **GoogleBot**: Cho phép preview tối đa cho images, videos, snippets

## 📰 Article Meta Tags

Các meta tags bổ sung cho article:

- `article:published_time`: Thời gian xuất bản (ISO 8601)
- `article:modified_time`: Thời gian cập nhật (ISO 8601)
- `article:author`: Tên tác giả
- `article:section`: Category/Section
- `article:tag`: Danh sách tags

## ✅ Best Practices

### 1. Title Tags

- ✅ Độ dài: 50-60 ký tự
- ✅ Format: `{Post Title} | Blog Công Nghệ`
- ✅ Unique cho mỗi bài viết

### 2. Meta Descriptions

- ✅ Độ dài: 150-160 ký tự
- ✅ Mô tả hấp dẫn, kêu gọi hành động
- ✅ Sử dụng excerpt nếu có, nếu không lấy 160 ký tự đầu của content

### 3. Images

- ✅ Open Graph images: 1200x630px (tỷ lệ 1.91:1)
- ✅ Alt text mô tả rõ ràng
- ✅ Fallback image nếu không có author image

### 4. URLs

- ✅ URL-friendly slugs (tiếng Việt không dấu)
- ✅ Canonical URLs để tránh duplicate
- ✅ Consistent URL structure

### 5. Content

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy (h1 → h2 → h3...)
- ✅ Structured data cho search engines

## 🧪 Kiểm Tra SEO

### 1. Google Rich Results Test

Kiểm tra structured data: https://search.google.com/test/rich-results

### 2. Facebook Sharing Debugger

Kiểm tra Open Graph: https://developers.facebook.com/tools/debug/

### 3. Twitter Card Validator

Kiểm tra Twitter Cards: https://cards-dev.twitter.com/validator

### 4. Google Search Console

Theo dõi performance và indexing: https://search.google.com/search-console

### 5. PageSpeed Insights

Kiểm tra performance và SEO: https://pagespeed.web.dev/

## 📝 Ví Dụ Metadata Output

```html
<title>
  Toàn tập MySQL: Kiến trúc, chuẩn hóa, tối ưu và chiến lược thực thi | Blog
  Công Nghệ
</title>
<meta
  name="description"
  content="Hướng dẫn chi tiết về MySQL từ cơ bản đến nâng cao..."
/>
<meta
  name="keywords"
  content="MySQL, Database, SQL, Optimization, công nghệ, lập trình..."
/>
<meta name="author" content="Tác giả" />

<!-- Open Graph -->
<meta property="og:title" content="Toàn tập MySQL..." />
<meta property="og:description" content="Hướng dẫn chi tiết..." />
<meta
  property="og:url"
  content="https://yourdomain.com/blog/toan-tap-mysql..."
/>
<meta property="og:type" content="article" />
<meta property="og:published_time" content="2024-01-01T00:00:00Z" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Toàn tập MySQL..." />

<!-- Structured Data -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Toàn tập MySQL...",
    ...
  }
</script>
```

## 🔍 SEO Checklist

Khi tạo bài viết mới, đảm bảo:

- [ ] Title rõ ràng, hấp dẫn (50-60 ký tự)
- [ ] Excerpt/mô tả chất lượng (150-160 ký tự)
- [ ] Slug URL-friendly (tiếng Việt không dấu)
- [ ] Tags phù hợp với nội dung
- [ ] Published status đúng (true cho bài công khai)
- [ ] Author information đầy đủ
- [ ] Content có cấu trúc rõ ràng với headings
- [ ] Images có alt text
- [ ] Canonical URL chính xác

## 🚀 Tối Ưu Bổ Sung (Future)

Có thể thêm trong tương lai:

1. **Sitemap.xml**: Tự động generate sitemap
2. **robots.txt**: Cấu hình robots.txt
3. **Breadcrumbs**: Structured data cho breadcrumbs
4. **FAQ Schema**: Nếu bài viết có FAQ
5. **Video Schema**: Nếu có video trong bài
6. **Image optimization**: WebP format, lazy loading
7. **Preload critical resources**: Fonts, images
8. **AMP pages**: Accelerated Mobile Pages

## 📚 Tài Liệu Tham Khảo

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org BlogPosting](https://schema.org/BlogPosting)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search)

## 🐛 Troubleshooting

### Metadata không hiển thị đúng

1. Kiểm tra `NEXT_PUBLIC_SITE_URL` trong `.env.local`
2. Kiểm tra console logs để xem có lỗi không
3. Verify với các công cụ test ở trên

### Structured Data không validate

1. Kiểm tra JSON-LD syntax với [JSON-LD Playground](https://json-ld.org/playground/)
2. Đảm bảo tất cả required fields đã có
3. Kiểm tra date formats (phải là ISO 8601)

### Open Graph images không hiển thị

1. Kiểm tra image URL có accessible không
2. Image phải có size tối thiểu 200x200px
3. Đảm bảo image là absolute URL (không phải relative)

## ⚡ Service Worker & Performance

### Service Worker đã được triển khai để cải thiện performance:

#### 1. **Caching Strategies**

**Cache First** (cho static assets):

- Next.js static files (`/_next/static/`)
- Images và fonts
- Độ trễ tải giảm đáng kể

**Network First** (cho dynamic content):

- HTML pages
- API responses
- Luôn cố gắng fetch mới nhất, fallback về cache nếu offline

#### 2. **Các tính năng**

- ✅ **Offline Support**: Trang có thể hoạt động offline với cached content
- ✅ **Fast Loading**: Static assets được cache ngay lần đầu load
- ✅ **Auto Update**: Service worker tự động kiểm tra updates mỗi giờ
- ✅ **Cache Management**: Tự động xóa old caches khi có version mới
- ✅ **Background Sync**: Có thể mở rộng để sync data khi online lại

#### 3. **Cache Names**

- `blog-cache-v1`: Static assets được cache khi install
- `blog-runtime-v1`: Runtime assets (images, fonts, HTML)
- `blog-api-v1`: API responses được cache

#### 4. **PWA Manifest**

File `manifest.json` đã được tạo để biến app thành Progressive Web App (PWA):

- Có thể "Add to Home Screen" trên mobile
- Standalone mode (giống native app)
- Icons và theme colors
- Offline capability

#### 5. **Cách sử dụng**

Service worker tự động register trong production mode:

```typescript
// ServiceWorkerProvider tự động register /sw.js
// Chỉ hoạt động trong production (NODE_ENV === 'production')
```

#### 6. **Testing Service Worker**

**Trong Development:**

- Service worker không chạy trong dev mode
- Chỉ hoạt động sau khi build và chạy production

**Kiểm tra:**

1. Build: `npm run build`
2. Start: `npm start`
3. Mở DevTools → Application → Service Workers
4. Kiểm tra cache trong Application → Cache Storage

#### 7. **Performance Benefits**

- ⚡ **First Load**: Giảm thời gian load nhờ cached assets
- ⚡ **Subsequent Loads**: Gần như instant với cached content
- ⚡ **Offline Experience**: Có thể đọc bài viết đã cache khi offline
- ⚡ **Reduced Bandwidth**: Giảm data usage nhờ cache
- ⚡ **Better UX**: Smooth experience ngay cả khi network chậm

#### 8. **Best Practices**

- ✅ Service worker chỉ chạy trong production
- ✅ Cache versioning để dễ quản lý updates
- ✅ Clean up old caches tự động
- ✅ Network-first cho dynamic content
- ✅ Cache-first cho static assets

#### 9. **Future Enhancements**

Có thể mở rộng thêm:

- **Background Sync**: Sync form submissions khi online lại
- **Push Notifications**: Thông báo bài viết mới
- **Precaching**: Pre-cache các routes quan trọng
- **Cache Invalidation**: Smart cache invalidation strategies
- **Workbox Integration**: Sử dụng Workbox để quản lý cache dễ hơn

---

**Cập nhật lần cuối**: Tháng 1, 2025
