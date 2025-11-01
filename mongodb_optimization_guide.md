# Toàn tập MongoDB: Kiến trúc, mô hình dữ liệu, tối ưu và chiến lược thực thi

MongoDB là hệ quản trị cơ sở dữ liệu NoSQL document-based, được thiết kế cho tính linh hoạt, khả năng mở rộng ngang (horizontal scaling), và hiệu năng cao cho các ứng dụng hiện đại.

## I. Mô hình dữ liệu và Schema Design

MongoDB là document database, không cần schema cố định như SQL databases. Tuy nhiên, thiết kế schema tốt vẫn rất quan trọng cho performance và maintainability.

### **1. Đặc điểm MongoDB Schema**

**Document Structure:**

```javascript
// MongoDB document (JSON-like BSON)
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  address: {
    street: "123 Main St",
    city: "New York",
    zip: "10001"
  },
  hobbies: ["reading", "swimming"],
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Khác biệt so với SQL:**

- ✅ **Flexible Schema**: Mỗi document có thể có cấu trúc khác nhau
- ✅ **Embedded vs Referenced**: Có thể embed hoặc reference documents
- ✅ **Array Fields**: Hỗ trợ arrays tự nhiên
- ✅ **No JOINs**: Thay vì JOIN, dùng embedded documents hoặc application-level joins

### **2. Embedded vs Referenced Documents**

**a) Embedded Documents (Embedding):**

```javascript
// ✅ Tốt khi: One-to-Few, data được truy cập cùng lúc
// Users collection
{
  _id: ObjectId("..."),
  name: "John Doe",
  addresses: [
    { street: "123 Main St", city: "New York" },
    { street: "456 Oak Ave", city: "Boston" }
  ]
}

// ✅ Ưu điểm:
// - Truy vấn nhanh (1 query lấy tất cả)
// - Atomic updates
// - Không cần JOIN

// ❌ Nhược điểm:
// - Document size tăng (limit 16MB)
// - Duplicate data
```

**b) Referenced Documents (Referencing):**

```javascript
// ✅ Tốt khi: One-to-Many, Many-to-Many, data lớn
// Users collection
{
  _id: ObjectId("user123"),
  name: "John Doe"
}

// Orders collection
{
  _id: ObjectId("order456"),
  user_id: ObjectId("user123"),
  total: 100.50,
  items: [...]
}

// ✅ Ưu điểm:
// - Document size nhỏ
// - Không duplicate data
// - Dễ update reference

// ❌ Nhược điểm:
// - Cần nhiều queries (hoặc $lookup)
// - Application-level joins
```

**c) Khi nào dùng Embedding vs Referencing:**

| Tình huống                          | Nên dùng        | Lý do                               |
| ----------------------------------- | --------------- | ----------------------------------- |
| **One-to-Few** (< 100 docs)         | **Embedding**   | Truy cập cùng lúc, document size OK |
| **One-to-Many** (> 100 docs)        | **Referencing** | Tránh document quá lớn (> 16MB)     |
| **Many-to-Many**                    | **Referencing** | Phức tạp, cần separate collection   |
| **Data thường xuyên truy cập cùng** | **Embedding**   | Giảm số queries                     |
| **Data lớn hoặc ít dùng**           | **Referencing** | Giữ document size nhỏ               |
| **Data thay đổi độc lập**           | **Referencing** | Dễ update riêng lẻ                  |

### **3. Schema Patterns**

**a) One-to-One với Embedded:**

```javascript
// User với Profile
{
  _id: ObjectId("user123"),
  name: "John Doe",
  profile: {
    bio: "Software Engineer",
    avatar: "https://...",
    preferences: {
      theme: "dark",
      language: "en"
    }
  }
}
```

**b) One-to-Many với Embedding:**

```javascript
// Blog Post với Comments
{
  _id: ObjectId("post123"),
  title: "MongoDB Best Practices",
  content: "...",
  comments: [
    { _id: ObjectId("comment1"), author: "Alice", text: "Great post!" },
    { _id: ObjectId("comment2"), author: "Bob", text: "Very helpful" }
  ]
}

// ✅ Tốt khi: Số comments < 100, comments được đọc cùng post
```

**c) One-to-Many với Referencing:**

```javascript
// Blog Posts collection
{
  _id: ObjectId("post123"),
  title: "MongoDB Best Practices",
  content: "..."
}

// Comments collection
{
  _id: ObjectId("comment1"),
  post_id: ObjectId("post123"),
  author: "Alice",
  text: "Great post!"
}

// ✅ Tốt khi: Nhiều comments, comments có thể query riêng
```

**d) Many-to-Many với Referencing:**

```javascript
// Users collection
{
  _id: ObjectId("user123"),
  name: "John Doe"
}

// Books collection
{
  _id: ObjectId("book456"),
  title: "MongoDB Guide",
  author_ids: [ObjectId("user123"), ObjectId("user789")]
}

// Hoặc dùng junction collection:
// UserBooks collection
{
  user_id: ObjectId("user123"),
  book_id: ObjectId("book456"),
  rating: 5,
  read_at: ISODate("2024-01-15")
}
```

**e) Bucket Pattern (Time Series):**

```javascript
// Thay vì 1 document per data point
// Gộp nhiều points vào 1 document (bucket)
{
  sensor_id: "sensor001",
  date: ISODate("2024-01-15"),
  measurements: [
    { time: ISODate("2024-01-15T00:00:00Z"), value: 25.5 },
    { time: ISODate("2024-01-15T00:01:00Z"), value: 25.7 },
    { time: ISODate("2024-01-15T00:02:00Z"), value: 25.6 }
    // ... up to 100-1000 points per bucket
  ]
}

// ✅ Ưu điểm:
// - Giảm số documents (từ 1000 documents → 1 document)
// - Truy vấn nhanh hơn
// - Dễ aggregate
```

**f) Attribute Pattern (Multi-Field Search):**

```javascript
// Thay vì nhiều fields riêng biệt
// Gộp vào attributes array
{
  _id: ObjectId("product123"),
  name: "Laptop",
  attributes: [
    { k: "brand", v: "Apple" },
    { k: "model", v: "MacBook Pro" },
    { k: "color", v: "Silver" },
    { k: "storage", v: "512GB" }
  ]
}

// Query với index
db.products.createIndex({ "attributes.k": 1, "attributes.v": 1 });

db.products.find({
  "attributes.k": "brand",
  "attributes.v": "Apple"
});

// ✅ Ưu điểm:
// - Flexible schema (thêm attributes mới dễ dàng)
// - Indexable
// - Dễ query
```

### **4. Denormalization trong MongoDB**

Khác với SQL databases thường normalize, MongoDB thường **denormalize** để:

- ✅ **Giảm số queries**: Lấy tất cả data cần trong 1 query
- ✅ **Tăng read performance**: Không cần JOINs
- ✅ **Atomic updates**: Update embedded data atomically

**Ví dụ Denormalization:**

```javascript
// Normalized (như SQL)
// Users collection
{ _id: ObjectId("user123"), name: "John Doe", country_id: "US" }

// Countries collection
{ _id: "US", name: "United States" }

// ❌ Cần 2 queries hoặc $lookup

// Denormalized (MongoDB style)
// Users collection
{
  _id: ObjectId("user123"),
  name: "John Doe",
  country: {
    code: "US",
    name: "United States"
  }
}

// ✅ Chỉ cần 1 query
```

**⚠️ Lưu ý:**

- Denormalization → **Duplicate data**
- Cần **update strategy**: Update ở nhiều nơi khi data thay đổi
- Cân bằng giữa **read performance** và **data consistency**

### **5. Schema Validation**

MongoDB hỗ trợ schema validation để đảm bảo data quality:

```javascript
// Tạo collection với validation rules
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "must be a valid email",
        },
        age: {
          bsonType: "int",
          minimum: 0,
          maximum: 120,
        },
      },
    },
  },
  validationLevel: "strict", // Validate mọi inserts/updates
  validationAction: "error", // Reject invalid documents
});

// Insert sẽ validate
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
}); // ✅ Valid

db.users.insertOne({
  name: "Jane",
  email: "invalid-email",
}); // ❌ Error: validation failed
```

### **6. Best Practices cho Schema Design**

1. ✅ **Start với use cases**: Thiết kế dựa trên query patterns
2. ✅ **Embed khi One-to-Few**: Nhúng documents nhỏ, ít thay đổi
3. ✅ **Reference khi One-to-Many**: Reference documents lớn, nhiều
4. ✅ **Denormalize cho reads**: Nhưng cần strategy để update
5. ✅ **Tránh document quá lớn**: Giữ < 16MB (MongoDB limit)
6. ✅ **Array sizes hợp lý**: Tránh arrays quá lớn (> 1000 elements)
7. ✅ **Prefer references cho many-to-many**: Dùng separate collections
8. ✅ **Bucket pattern cho time series**: Gộp data points vào buckets

## II. Index trong MongoDB

Indexes là yếu tố quan trọng nhất cho query performance trong MongoDB. Không có index, MongoDB phải scan toàn bộ collection (collection scan).

### **1. Các loại Index**

| Loại Index                      | Mô tả                                   | Tác dụng chính                             |
| ------------------------------- | --------------------------------------- | ------------------------------------------ |
| **Single Field Index**          | Index trên 1 field                      | Tối ưu queries filter/sort theo 1 field    |
| **Compound Index**              | Index trên nhiều fields                 | Tối ưu queries với nhiều conditions        |
| **Multikey Index**              | Index trên array fields                 | Tối ưu queries trên array elements         |
| **Text Index**                  | Full-text search index                  | Tìm kiếm text trong documents              |
| **Geospatial Index (2dsphere)** | Index cho location data                 | Geo queries (near, within, etc.)           |
| **Hashed Index**                | Hash index cho sharding                 | Shard key với hash distribution            |
| **TTL Index**                   | Auto-delete documents sau thời gian     | Expire data tự động                        |
| **Unique Index**                | Đảm bảo giá trị unique                  | Constraint cho uniqueness                  |
| **Sparse Index**                | Index chỉ cho documents có field        | Giảm index size khi nhiều docs thiếu field |
| **Partial Index**               | Index chỉ cho documents match condition | Index nhỏ hơn, performance tốt hơn         |

### **2. Cách tạo Index**

**a) Single Field Index:**

```javascript
// Tạo index trên field "email"
db.users.createIndex({ email: 1 }); // 1 = ascending, -1 = descending

// Query sẽ dùng index
db.users.find({ email: "john@example.com" });
```

**b) Compound Index:**

```javascript
// Tạo compound index trên nhiều fields
db.users.createIndex({ status: 1, created_at: -1 });

// ✅ Dùng được cho:
db.users.find({ status: "active" });
db.users.find({ status: "active", created_at: { $gt: ISODate("2024-01-01") } });

// ❌ Không dùng được cho:
db.users.find({ created_at: { $gt: ISODate("2024-01-01") } });
// → Phải scan toàn bộ collection
```

**c) Multikey Index (Array):**

```javascript
// Index trên array field
db.products.createIndex({ tags: 1 });

// Query sẽ dùng index
db.products.find({ tags: "electronics" });

// ⚠️ Multikey index chỉ hỗ trợ 1 array field trong compound index
```

**d) Text Index:**

```javascript
// Tạo text index cho full-text search
db.articles.createIndex({ title: "text", content: "text" });

// Query với $text
db.articles.find({ $text: { $search: "mongodb tutorial" } });

// ⚠️ Mỗi collection chỉ có 1 text index
```

**e) Geospatial Index:**

```javascript
// 2dsphere index cho location data
db.places.createIndex({ location: "2dsphere" });

// Geo queries
db.places.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
      $maxDistance: 1000, // meters
    },
  },
});
```

**f) TTL Index:**

```javascript
// Auto-delete documents sau 24 hours
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// MongoDB tự động xóa documents có createdAt > 24h trước
```

**g) Unique Index:**

```javascript
// Đảm bảo email unique
db.users.createIndex({ email: 1 }, { unique: true });

// Insert duplicate sẽ fail
db.users.insertOne({ email: "john@example.com" });
db.users.insertOne({ email: "john@example.com" }); // ❌ Error: duplicate key
```

**h) Partial Index:**

```javascript
// Index chỉ cho active users
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { status: "active" } }
);

// ✅ Dùng được
db.users.find({ status: "active", email: "john@example.com" });

// ❌ Không dùng được (nhưng vẫn query được, chỉ không dùng index)
db.users.find({ status: "inactive", email: "john@example.com" });
```

**i) Sparse Index:**

```javascript
// Index chỉ cho documents có field "phone"
db.users.createIndex({ phone: 1 }, { sparse: true });

// Documents không có "phone" không được index
// → Giảm index size
```

### **3. Compound Index và Quy tắc Leftmost Prefix**

**Quy tắc Leftmost Prefix (tương tự SQL):**

Index `{ a: 1, b: 1, c: 1 }` có thể dùng cho:

- ✅ `{ a: value }`
- ✅ `{ a: value, b: value }`
- ✅ `{ a: value, b: value, c: value }`
- ❌ `{ b: value }` (không dùng được)
- ❌ `{ c: value }` (không dùng được)

**Ví dụ:**

```javascript
db.orders.createIndex({ status: 1, created_at: -1, user_id: 1 });

// ✅ Dùng được
db.orders.find({ status: "active" });
db.orders.find({
  status: "active",
  created_at: { $lt: ISODate("2024-01-01") },
});
db.orders.find({
  status: "active",
  created_at: { $lt: ISODate("2024-01-01") },
  user_id: ObjectId("..."),
});

// ❌ Không dùng được
db.orders.find({ created_at: { $lt: ISODate("2024-01-01") } });
db.orders.find({ user_id: ObjectId("...") });
```

### **4. Cách xác định thứ tự fields trong Compound Index**

**Nguyên tắc:**

1. **Equality trước Range**: `{ status: 1, created_at: -1 }` tốt hơn `{ created_at: -1, status: 1 }`
2. **Selectivity**: Field có nhiều giá trị khác nhau đặt trước
3. **Sort fields**: Nếu query có sort, field sort đặt sau equality fields

**Ví dụ:**

```javascript
// Query pattern:
db.orders
  .find({
    status: "active", // Equality
    created_at: { $gt: ISODate("2024-01-01") }, // Range
    user_id: ObjectId("..."), // Equality
  })
  .sort({ created_at: -1 });

// ✅ Index tốt:
db.orders.createIndex({
  status: 1, // Equality (selectivity thấp nhưng dùng nhiều)
  user_id: 1, // Equality (selectivity cao)
  created_at: -1, // Range + Sort
});

// ❌ Index xấu:
db.orders.createIndex({
  created_at: -1, // Range đặt trước equality
  status: 1,
  user_id: 1,
});
```

### **5. Index Coverage (Covering Index)**

Index coverage là khi query chỉ cần data từ index, không cần đọc documents:

```javascript
// Index
db.users.createIndex({ email: 1, name: 1 });

// Query chỉ lấy fields trong index
db.users.find(
  { email: "john@example.com" },
  { _id: 0, email: 1, name: 1 } // Chỉ projection fields trong index
);

// ✅ Index Only Scan (không đọc documents!)
// → Rất nhanh
```

**⚠️ Lưu ý:**

- Phải exclude `_id` hoặc include `_id` trong index
- Tất cả fields trong projection phải có trong index

### **6. Index Intersection**

MongoDB có thể dùng nhiều indexes cùng lúc (index intersection):

```javascript
db.users.createIndex({ email: 1 });
db.users.createIndex({ status: 1 });

// Query với cả 2 fields
db.users.find({ email: "john@example.com", status: "active" });

// MongoDB có thể:
// 1. Dùng index { email: 1 } để tìm docs với email
// 2. Dùng index { status: 1 } để tìm docs với status
// 3. Intersect 2 kết quả

// ⚠️ Tốt hơn: Tạo compound index
db.users.createIndex({ email: 1, status: 1 });
```

### **7. Indexes và Write Performance**

Indexes cải thiện read performance nhưng **làm chậm write performance**:

```javascript
// Mỗi index = 1 write operation thêm khi insert/update
db.users.createIndex({ email: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ created_at: -1 });
db.users.createIndex({ name: 1, email: 1 });

// Insert 1 document = 1 write vào collection + 4 writes vào indexes = 5 writes total
// → Chậm hơn không có indexes
```

**Best Practice:**

- ✅ Chỉ tạo indexes **cần thiết**
- ✅ Monitor index usage: `db.collection.getIndexes()` và `explain()`
- ✅ Drop indexes không dùng: `db.collection.dropIndex({ field: 1 })`

### **8. Xem và Quản lý Indexes**

```javascript
// Xem tất cả indexes
db.users.getIndexes();

// Xem index usage trong query
db.users.find({ email: "john@example.com" }).explain("executionStats");

// Output:
// {
//   executionStats: {
//     executionTimeMillis: 0,
//     totalDocsExamined: 1,
//     totalKeysExamined: 1,
//     executionStages: {
//       stage: "IXSCAN",  // Index Scan ✅
//       indexName: "email_1"
//     }
//   }
// }

// Drop index
db.users.dropIndex({ email: 1 });

// Rebuild index
db.users.reIndex();
```

### **9. Best Practices cho Indexing**

1. ✅ **Tạo index cho fields trong query**: WHERE, sort, projection
2. ✅ **Compound index theo thứ tự**: Equality → Sort → Range
3. ✅ **Index coverage**: Chỉ projection fields trong index
4. ✅ **Partial indexes**: Khi chỉ query subset của documents
5. ✅ **Sparse indexes**: Khi nhiều documents không có field
6. ✅ **Monitor index usage**: Dùng `explain()` để verify
7. ✅ **Tránh indexes không dùng**: Drop indexes không cần thiết
8. ✅ **Balance reads và writes**: Nhiều indexes → chậm writes

9. ✅ **Balance reads và writes**: Nhiều indexes → chậm writes

## III. Chiến lược thực thi (Execution Strategy)

MongoDB Query Planner tự động chọn execution plan tối ưu nhất. Hiểu rõ cách MongoDB execute queries giúp tối ưu hiệu năng.

### **1. EXPLAIN và Execution Stats**

**EXPLAIN - Xem execution plan:**

```javascript
// explain() - Không thực thi query, chỉ show plan
db.users.find({ email: "john@example.com" }).explain();

// explain("executionStats") - Thực thi query và show stats
db.users.find({ email: "john@example.com" }).explain("executionStats");

// explain("allPlansExecution") - Show tất cả plans được consider
db.users.find({ email: "john@example.com" }).explain("allPlansExecution");
```

**Output quan trọng:**

```javascript
{
  queryPlanner: {
    winningPlan: {
      stage: "IXSCAN",           // Index Scan ✅
      indexName: "email_1",       // Index được dùng
      direction: "forward"
    },
    rejectedPlans: []             // Plans không được chọn
  },
  executionStats: {
    executionTimeMillis: 0,       // Thời gian thực thi (ms)
    totalDocsExamined: 1,         // Số documents đã đọc
    totalKeysExamined: 1,         // Số index keys đã đọc
    executionStages: {
      stage: "IXSCAN",
      nReturned: 1,                // Số documents return
      keysExamined: 1,
      docsExamined: 1
    }
  }
}
```

**Các loại Stage:**

| Stage          | Mô tả                                     | Performance |
| -------------- | ----------------------------------------- | ----------- |
| **IXSCAN**     | Index Scan (tốt nhất)                     | Rất tốt     |
| **COLLSCAN**   | Collection Scan (scan toàn bộ collection) | Chậm        |
| **FETCH**      | Đọc document từ disk sau index scan       | Tốt         |
| **SORT**       | Sắp xếp kết quả                           | Tùy         |
| **LIMIT**      | Giới hạn số documents                     | Tốt         |
| **SKIP**       | Bỏ qua documents                          | Chậm        |
| **PROJECTION** | Chọn fields cần return                    | Tốt         |
| **COUNT**      | Đếm documents                             | Tốt         |
| **COUNT_SCAN** | Đếm từ index (nhanh hơn COUNT)            | Rất tốt     |

### **2. Query Performance Metrics**

**Các chỉ số quan trọng:**

```javascript
{
  executionStats: {
    executionTimeMillis: 10,      // ← Quan trọng: Tổng thời gian
    totalDocsExamined: 100,        // ← Quan trọng: Số docs đọc
    totalKeysExamined: 50,         // ← Quan trọng: Số keys đọc
    nReturned: 10,                 // ← Quan trọng: Số docs return

    // Ratio tốt: nReturned / totalDocsExamined ≈ 1
    // → Index selective tốt

    executionStages: {
      stage: "IXSCAN",
      keysExamined: 50,
      docsExamined: 100,
      nReturned: 10
    }
  }
}
```

**Phân tích Performance:**

```javascript
// ✅ Tốt: Index scan, ít docs examined
{
  stage: "IXSCAN",
  keysExamined: 5,
  docsExamined: 5,
  nReturned: 5
  // → Ratio = 1:1:1 (rất tốt!)
}

// ⚠️ Chấp nhận được: Index scan, nhiều docs examined nhưng return ít
{
  stage: "IXSCAN",
  keysExamined: 100,
  docsExamined: 100,
  nReturned: 10
  // → Ratio = 10:1 (OK, có index nhưng không selective lắm)
}

// ❌ Xấu: Collection scan, scan toàn bộ
{
  stage: "COLLSCAN",
  docsExamined: 1000000,
  nReturned: 10
  // → Phải scan 1M docs để tìm 10 docs!
}
```

### **3. Query Selectivity và Index Usage**

**Selectivity = Độ chọn lọc:**

```javascript
// High selectivity: Index có nhiều giá trị unique
// Low selectivity: Index có ít giá trị unique

// Ví dụ:
// - email: High selectivity (hầu hết unique)
// - status: Low selectivity (chỉ vài giá trị: active, inactive, deleted)
// - age: Medium selectivity (nhiều giá trị nhưng có duplicate)

// Query với high selectivity field:
db.users.find({ email: "john@example.com" });
// → Index scan, rất nhanh (1 hoặc 0 docs)

// Query với low selectivity field:
db.users.find({ status: "active" });
// → Index scan, nhưng nhiều docs (có thể hàng ngàn)
```

**Index Selectivity Score:**

```
Selectivity = DISTINCT_VALUES / TOTAL_DOCUMENTS

High selectivity (> 0.5): Index rất hiệu quả
Medium selectivity (0.1 - 0.5): Index OK
Low selectivity (< 0.1): Index ít hiệu quả, nhưng vẫn tốt hơn collection scan
```

### **4. Query Patterns và Optimization**

**a) Equality Query:**

```javascript
// ✅ Tốt: Index trên field equality
db.users.createIndex({ email: 1 });
db.users.find({ email: "john@example.com" });
// → IXSCAN, nhanh
```

**b) Range Query:**

```javascript
// ✅ Tốt: Index trên range field
db.users.createIndex({ age: 1 });
db.users.find({ age: { $gte: 18, $lte: 65 } });
// → IXSCAN, nhanh

// ⚠️ Range query thường scan nhiều docs hơn equality
```

**c) Sort Query:**

```javascript
// ✅ Tốt: Index hỗ trợ sort
db.users.createIndex({ created_at: -1 });
db.users.find().sort({ created_at: -1 });
// → IXSCAN, không cần sort in-memory

// ❌ Xấu: Sort không có index
db.users.find().sort({ name: 1 });
// → COLLSCAN + SORT in-memory (chậm!)
```

**d) Compound Query:**

```javascript
// ✅ Tốt: Compound index hỗ trợ query
db.orders.createIndex({ status: 1, created_at: -1 });
db.orders.find({ status: "active" }).sort({ created_at: -1 });
// → IXSCAN, nhanh

// ⚠️ Partial match: Chỉ dùng được phần đầu của compound index
db.orders.find({ status: "active" });
// → Vẫn dùng được index { status: 1, created_at: -1 } (leftmost prefix)
```

**e) Query với Projection:**

```javascript
// ✅ Tốt: Index coverage (chỉ cần data từ index)
db.users.createIndex({ email: 1, name: 1 });
db.users.find({ email: "john@example.com" }, { _id: 0, email: 1, name: 1 });
// → Index Only Scan (không đọc documents!)

// ⚠️ Projection fields không trong index → phải FETCH documents
db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1, age: 1 } // age không trong index
);
// → IXSCAN + FETCH
```

### **5. Query Planner và Cached Plans**

MongoDB cache execution plans:

```javascript
// Plan được cache sau lần execute đầu tiên
// Khi nào plan cache invalidate:
// - Index được tạo/drop
// - Collection statistics thay đổi đáng kể
// - Index rebuild
// - Manual plan cache clear: db.collection.getPlanCache().clear()
```

**Force Index Usage:**

```javascript
// Hint để force dùng index cụ thể
db.users.find({ email: "john@example.com" }).hint({ email: 1 });

// ❌ Không nên dùng thường xuyên, chỉ khi:
// - Query planner chọn sai plan
// - Testing/debugging
```

### **6. Query Performance Tuning**

**a) Tránh Collection Scans:**

```javascript
// ❌ Xấu: Không có index
db.users.find({ name: "John" });
// → COLLSCAN: Scan toàn bộ collection

// ✅ Tốt: Có index
db.users.createIndex({ name: 1 });
db.users.find({ name: "John" });
// → IXSCAN: Chỉ scan index
```

**b) Tránh In-Memory Sorts:**

```javascript
// ❌ Xấu: Sort không có index
db.users.find().sort({ created_at: -1 });
// → COLLSCAN + SORT (chậm!)

// ✅ Tốt: Index hỗ trợ sort
db.users.createIndex({ created_at: -1 });
db.users.find().sort({ created_at: -1 });
// → IXSCAN (không cần sort!)
```

**c) Limit kết quả:**

```javascript
// ✅ Tốt: Limit sớm
db.users.find({ status: "active" }).limit(10);
// → Chỉ scan đến khi đủ 10 docs

// ❌ Xấu: Không limit
db.users.find({ status: "active" });
// → Scan tất cả docs match
```

**d) Tránh $regex không prefix:**

```javascript
// ❌ Xấu: Regex không prefix (không dùng được index)
db.users.find({ email: /example\.com$/ });
// → COLLSCAN

// ✅ Tốt: Regex prefix (dùng được index)
db.users.find({ email: /^john/ });
// → IXSCAN

// ✅ Tốt hơn: Text index cho full-text search
db.users.createIndex({ email: "text" });
db.users.find({ $text: { $search: "john" } });
// → TEXT search
```

### **7. Monitoring Query Performance**

**a) Slow Query Log:**

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 }); // Log queries > 100ms

// Xem slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10);

// Profile levels:
// 0: Off
// 1: Log slow queries (> slowms)
// 2: Log all queries
```

**b) Current Operations:**

```javascript
// Xem queries đang chạy
db.currentOp({
  $or: [
    { op: "query", "command.find": { $exists: true } },
    { op: "getmore" }
  ]
});

// Kill slow query
db.killOp(<opid>);
```

**c) Index Usage Stats:**

```javascript
// Xem index usage
db.collection.aggregate([{ $indexStats: {} }]);

// Output:
// {
//   name: "email_1",
//   accesses: {
//     ops: 1000,           // Số lần dùng
//     since: ISODate("...")
//   }
// }
```

## IV. Cấu trúc truy vấn: Find, Update, Aggregation

MongoDB có nhiều cách query data. Hiểu rõ từng loại và cách tối ưu chúng.

### **1. Find Queries**

**a) Basic Find:**

```javascript
// Simple query
db.users.find({ status: "active" });

// Với projection (chọn fields)
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 } // Chỉ lấy name, email
);

// Với sort
db.users.find({ status: "active" }).sort({ created_at: -1 });

// Với limit và skip
db.users.find({ status: "active" }).sort({ created_at: -1 }).limit(10).skip(20);
```

**b) Query Operators:**

```javascript
// Comparison operators
db.users.find({ age: { $gt: 18, $lt: 65 } });
db.users.find({ status: { $in: ["active", "pending"] } });
db.users.find({ status: { $ne: "deleted" } });

// Logical operators
db.users.find({
  $and: [{ status: "active" }, { age: { $gte: 18 } }],
});

db.users.find({
  $or: [{ email: "john@example.com" }, { phone: "1234567890" }],
});

// Element operators
db.users.find({ email: { $exists: true } });
db.users.find({ tags: { $type: "array" } });

// Array operators
db.products.find({ tags: "electronics" });
db.products.find({ tags: { $all: ["electronics", "laptop"] } });
db.products.find({ tags: { $size: 3 } });

// Regex
db.users.find({ name: /^John/i }); // Case-insensitive, prefix
```

**c) Tối ưu Find Queries:**

```javascript
// ✅ Tốt: Index hỗ trợ query
db.users.createIndex({ status: 1, age: 1 });
db.users.find({ status: "active", age: { $gte: 18 } });
// → IXSCAN

// ✅ Tốt: Projection chỉ fields cần
db.users.find({ status: "active" }, { name: 1, email: 1 });
// → Giảm network traffic, memory usage

// ✅ Tốt: Limit sớm
db.users.find({ status: "active" }).limit(10);
// → Chỉ scan đến khi đủ 10 docs

// ❌ Xấu: $or với nhiều conditions (có thể scan nhiều indexes)
db.users.find({
  $or: [
    { email: "john@example.com" },
    { phone: "1234567890" },
    { name: "John Doe" },
  ],
});
// → Có thể scan 3 indexes riêng biệt

// ✅ Tốt hơn: Dùng compound index nếu có thể
db.users.createIndex({ email: 1, phone: 1, name: 1 });
// Hoặc thiết kế lại schema để tránh $or
```

### **2. Update Operations**

**a) Update Methods:**

```javascript
// updateOne - Update 1 document
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { status: "active" } }
);

// updateMany - Update nhiều documents
db.users.updateMany(
  { status: "pending" },
  { $set: { status: "active", updated_at: new Date() } }
);

// replaceOne - Thay thế toàn bộ document
db.users.replaceOne(
  { email: "john@example.com" },
  { name: "John Doe", email: "john@example.com", age: 30 }
);

// findOneAndUpdate - Update và return document
db.users.findOneAndUpdate(
  { email: "john@example.com" },
  { $inc: { login_count: 1 } },
  { returnDocument: "after" } // Return updated document
);
```

**b) Update Operators:**

```javascript
// $set - Set field value
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "active", updated_at: new Date() } }
);

// $unset - Remove field
db.users.updateOne({ _id: ObjectId("...") }, { $unset: { old_field: "" } });

// $inc - Increment numeric field
db.users.updateOne({ _id: ObjectId("...") }, { $inc: { view_count: 1 } });

// $push - Add to array
db.users.updateOne({ _id: ObjectId("...") }, { $push: { tags: "new_tag" } });

// $pull - Remove from array
db.users.updateOne({ _id: ObjectId("...") }, { $pull: { tags: "old_tag" } });

// $addToSet - Add to array if not exists
db.users.updateOne(
  { _id: ObjectId("...") },
  { $addToSet: { tags: "unique_tag" } }
);

// $pop - Remove first/last element from array
db.users.updateOne(
  { _id: ObjectId("...") },
  { $pop: { tags: 1 } } // 1 = last, -1 = first
);
```

**c) Tối ưu Update:**

```javascript
// ✅ Tốt: Index trên query filter
db.users.createIndex({ email: 1 });
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { status: "active" } }
);
// → Tìm document nhanh bằng index

// ✅ Tốt: Update chỉ fields cần thiết (không dùng $set toàn bộ document)
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "active" } } // Chỉ update status
);
// → Nhanh hơn replaceOne()

// ❌ Xấu: Update không có index
db.users.updateMany(
  { name: "John" }, // Không có index trên name
  { $set: { status: "active" } }
);
// → COLLSCAN để tìm documents

// ✅ Tốt: Batch updates với bulk operations
const bulk = db.users.initializeUnorderedBulkOp();
bulk.find({ status: "pending" }).update({ $set: { status: "active" } });
bulk.find({ status: "inactive" }).update({ $set: { status: "active" } });
bulk.execute();
// → Hiệu quả hơn nhiều updates riêng lẻ
```

### **3. Delete Operations**

```javascript
// deleteOne - Xóa 1 document
db.users.deleteOne({ email: "john@example.com" });

// deleteMany - Xóa nhiều documents
db.users.deleteMany({ status: "deleted" });

// findOneAndDelete - Xóa và return document
db.users.findOneAndDelete({ email: "john@example.com" });
```

**Tối ưu Delete:**

```javascript
// ✅ Tốt: Index trên query filter
db.users.createIndex({ status: 1 });
db.users.deleteMany({ status: "deleted" });
// → Tìm documents nhanh

// ⚠️ Lưu ý: Delete nhiều documents có thể chậm
// → Consider soft delete (set flag) thay vì hard delete
db.users.updateMany(
  { status: "deleted" },
  { $set: { deleted_at: new Date(), is_deleted: true } }
);
// → Có thể recover, không tốn thời gian delete
```

### **4. Aggregation Pipeline**

Aggregation là cách mạnh mẽ nhất để query và transform data trong MongoDB.

**a) Aggregation Stages:**

```javascript
// Basic aggregation
db.orders.aggregate([
  { $match: { status: "completed" } }, // Filter (như WHERE)
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } }, // Group by
  { $sort: { total: -1 } }, // Sort
  { $limit: 10 }, // Limit
]);
```

**b) Common Stages:**

```javascript
// $match - Filter documents (nên đặt đầu tiên)
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      created_at: { $gte: ISODate("2024-01-01") },
    },
  },
]);

// $group - Group và aggregate
db.orders.aggregate([
  {
    $group: {
      _id: "$user_id",
      total: { $sum: "$amount" },
      count: { $sum: 1 },
      avg: { $avg: "$amount" },
      max: { $max: "$amount" },
      min: { $min: "$amount" },
    },
  },
]);

// $project - Select/transform fields
db.orders.aggregate([
  {
    $project: {
      user_id: 1,
      total: 1,
      year: { $year: "$created_at" },
      month: { $month: "$created_at" },
    },
  },
]);

// $lookup - Join với collection khác
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" }, // Convert array thành object
]);

// $sort - Sort
db.orders.aggregate([{ $sort: { created_at: -1 } }]);

// $limit và $skip
db.orders.aggregate([{ $skip: 10 }, { $limit: 20 }]);

// $unwind - Expand array thành documents
db.products.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
]);

// $facet - Multiple pipelines cùng lúc
db.orders.aggregate([
  {
    $facet: {
      total: [{ $group: { _id: null, sum: { $sum: "$amount" } } }],
      avg: [{ $group: { _id: null, avg: { $avg: "$amount" } } }],
      count: [{ $count: "total" }],
    },
  },
]);
```

**c) Tối ưu Aggregation:**

```javascript
// ✅ Tốt: $match đầu tiên (giảm số documents)
db.orders.aggregate([
  { $match: { status: "completed" } }, // Filter sớm
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
]);

// ❌ Xấu: $match sau $group
db.orders.aggregate([
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
  { $match: { total: { $gt: 1000 } } }, // Filter sau (đã process nhiều docs)
]);

// ✅ Tốt: Index hỗ trợ $match
db.orders.createIndex({ status: 1, created_at: 1 });
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      created_at: { $gte: ISODate("2024-01-01") },
    },
  },
]);
// → Dùng index cho $match

// ✅ Tốt: $sort với index
db.orders.createIndex({ created_at: -1 });
db.orders.aggregate([{ $sort: { created_at: -1 } }, { $limit: 10 }]);
// → Dùng index cho sort, không cần in-memory sort

// ⚠️ Lưu ý: $lookup có thể chậm (như JOIN trong SQL)
// → Consider denormalize hoặc embedded documents
```

### **5. Bulk Operations**

Bulk operations hiệu quả hơn nhiều so với operations riêng lẻ:

```javascript
// Bulk Write
const bulk = db.users.initializeOrderedBulkOp();

bulk.insert({ name: "John", email: "john@example.com" });
bulk.find({ email: "jane@example.com" }).update({ $set: { status: "active" } });
bulk.find({ email: "bob@example.com" }).remove();

bulk.execute();

// Bulk Write với options
db.users.bulkWrite(
  [
    { insertOne: { document: { name: "John", email: "john@example.com" } } },
    {
      updateOne: {
        filter: { email: "jane@example.com" },
        update: { $set: { status: "active" } },
      },
    },
    { deleteOne: { filter: { email: "bob@example.com" } } },
  ],
  { ordered: false }
); // unordered = parallel execution
```

**Tối ưu Bulk Operations:**

```javascript
// ✅ Tốt: Batch size hợp lý (100-1000 operations)
const operations = [];
for (let i = 0; i < 1000; i++) {
  operations.push({
    insertOne: {
      document: { name: `User ${i}`, email: `user${i}@example.com` },
    },
  });
}
db.users.bulkWrite(operations);

// ✅ Tốt: Unordered bulk (parallel) khi không cần order
db.users.bulkWrite(operations, { ordered: false });
// → Nhanh hơn ordered bulk

// ✅ Tốt: Bulk update với index
db.users.createIndex({ email: 1 });
db.users.bulkWrite([
  {
    updateOne: {
      filter: { email: "john@example.com" },
      update: { $set: { status: "active" } },
    },
  },
]);
// → Tìm documents nhanh
```

### **6. Best Practices cho Queries**

1. ✅ **Index cho query filters**: $match conditions nên có index
2. ✅ **$match đầu tiên**: Giảm số documents trong pipeline
3. ✅ **Projection sớm**: Chỉ lấy fields cần thiết
4. ✅ **Limit sớm**: Giảm số documents xử lý
5. ✅ **Tránh $lookup nếu có thể**: Denormalize hoặc embedded docs
6. ✅ **Bulk operations**: Dùng bulk thay vì operations riêng lẻ
7. ✅ **Monitor với explain()**: Kiểm tra execution plan
8. ✅ **Tránh collection scans**: Luôn có index cho querieseturn | Tốt |
   | **COUNT** | Đếm documents | Tốt |
   | **COUNT_SCAN** | Đếm từ index (nhanh hơn COUNT) | Rất tốt |

### **2. Query Performance Metrics**

**Các chỉ số quan trọng:**

```javascript
{
  executionStats: {
    executionTimeMillis: 10,      // ← Quan trọng: Tổng thời gian
    totalDocsExamined: 100,        // ← Quan trọng: Số docs đọc
    totalKeysExamined: 50,         // ← Quan trọng: Số keys đọc
    nReturned: 10,                 // ← Quan trọng: Số docs return

    // Ratio tốt: nReturned / totalDocsExamined ≈ 1
    // → Index selective tốt

    executionStages: {
      stage: "IXSCAN",
      keysExamined: 50,
      docsExamined: 100,
      nReturned: 10
    }
  }
}
```

**Phân tích Performance:**

```javascript
// ✅ Tốt: Index scan, ít docs examined
{
  stage: "IXSCAN",
  keysExamined: 5,
  docsExamined: 5,
  nReturned: 5
  // → Ratio = 1:1:1 (rất tốt!)
}

// ⚠️ Chấp nhận được: Index scan, nhiều docs examined nhưng return ít
{
  stage: "IXSCAN",
  keysExamined: 100,
  docsExamined: 100,
  nReturned: 10
  // → Ratio = 10:1 (OK, có index nhưng không selective lắm)
}

// ❌ Xấu: Collection scan, scan toàn bộ
{
  stage: "COLLSCAN",
  docsExamined: 1000000,
  nReturned: 10
  // → Phải scan 1M docs để tìm 10 docs!
}
```

### **3. Query Selectivity và Index Usage**

**Selectivity = Độ chọn lọc:**

```javascript
// High selectivity: Index có nhiều giá trị unique
// Low selectivity: Index có ít giá trị unique

// Ví dụ:
// - email: High selectivity (hầu hết unique)
// - status: Low selectivity (chỉ vài giá trị: active, inactive, deleted)
// - age: Medium selectivity (nhiều giá trị nhưng có duplicate)

// Query với high selectivity field:
db.users.find({ email: "john@example.com" });
// → Index scan, rất nhanh (1 hoặc 0 docs)

// Query với low selectivity field:
db.users.find({ status: "active" });
// → Index scan, nhưng nhiều docs (có thể hàng ngàn)
```

**Index Selectivity Score:**

```
Selectivity = DISTINCT_VALUES / TOTAL_DOCUMENTS

High selectivity (> 0.5): Index rất hiệu quả
Medium selectivity (0.1 - 0.5): Index OK
Low selectivity (< 0.1): Index ít hiệu quả, nhưng vẫn tốt hơn collection scan
```

### **4. Query Patterns và Optimization**

**a) Equality Query:**

```javascript
// ✅ Tốt: Index trên field equality
db.users.createIndex({ email: 1 });
db.users.find({ email: "john@example.com" });
// → IXSCAN, nhanh
```

**b) Range Query:**

```javascript
// ✅ Tốt: Index trên range field
db.users.createIndex({ age: 1 });
db.users.find({ age: { $gte: 18, $lte: 65 } });
// → IXSCAN, nhanh

// ⚠️ Range query thường scan nhiều docs hơn equality
```

**c) Sort Query:**

```javascript
// ✅ Tốt: Index hỗ trợ sort
db.users.createIndex({ created_at: -1 });
db.users.find().sort({ created_at: -1 });
// → IXSCAN, không cần sort in-memory

// ❌ Xấu: Sort không có index
db.users.find().sort({ name: 1 });
// → COLLSCAN + SORT in-memory (chậm!)
```

**d) Compound Query:**

```javascript
// ✅ Tốt: Compound index hỗ trợ query
db.orders.createIndex({ status: 1, created_at: -1 });
db.orders.find({ status: "active" }).sort({ created_at: -1 });
// → IXSCAN, nhanh

// ⚠️ Partial match: Chỉ dùng được phần đầu của compound index
db.orders.find({ status: "active" });
// → Vẫn dùng được index { status: 1, created_at: -1 } (leftmost prefix)
```

**e) Query với Projection:**

```javascript
// ✅ Tốt: Index coverage (chỉ cần data từ index)
db.users.createIndex({ email: 1, name: 1 });
db.users.find({ email: "john@example.com" }, { _id: 0, email: 1, name: 1 });
// → Index Only Scan (không đọc documents!)

// ⚠️ Projection fields không trong index → phải FETCH documents
db.users.find(
  { email: "john@example.com" },
  { email: 1, name: 1, age: 1 } // age không trong index
);
// → IXSCAN + FETCH
```

### **5. Query Planner và Cached Plans**

MongoDB cache execution plans:

```javascript
// Plan được cache sau lần execute đầu tiên
// Khi nào plan cache invalidate:
// - Index được tạo/drop
// - Collection statistics thay đổi đáng kể
// - Index rebuild
// - Manual plan cache clear: db.collection.getPlanCache().clear()
```

**Force Index Usage:**

```javascript
// Hint để force dùng index cụ thể
db.users.find({ email: "john@example.com" }).hint({ email: 1 });

// ❌ Không nên dùng thường xuyên, chỉ khi:
// - Query planner chọn sai plan
// - Testing/debugging
```

### **6. Query Performance Tuning**

**a) Tránh Collection Scans:**

```javascript
// ❌ Xấu: Không có index
db.users.find({ name: "John" });
// → COLLSCAN: Scan toàn bộ collection

// ✅ Tốt: Có index
db.users.createIndex({ name: 1 });
db.users.find({ name: "John" });
// → IXSCAN: Chỉ scan index
```

**b) Tránh In-Memory Sorts:**

```javascript
// ❌ Xấu: Sort không có index
db.users.find().sort({ created_at: -1 });
// → COLLSCAN + SORT (chậm!)

// ✅ Tốt: Index hỗ trợ sort
db.users.createIndex({ created_at: -1 });
db.users.find().sort({ created_at: -1 });
// → IXSCAN (không cần sort!)
```

**c) Limit kết quả:**

```javascript
// ✅ Tốt: Limit sớm
db.users.find({ status: "active" }).limit(10);
// → Chỉ scan đến khi đủ 10 docs

// ❌ Xấu: Không limit
db.users.find({ status: "active" });
// → Scan tất cả docs match
```

**d) Tránh $regex không prefix:**

```javascript
// ❌ Xấu: Regex không prefix (không dùng được index)
db.users.find({ email: /example\.com$/ });
// → COLLSCAN

// ✅ Tốt: Regex prefix (dùng được index)
db.users.find({ email: /^john/ });
// → IXSCAN

// ✅ Tốt hơn: Text index cho full-text search
db.users.createIndex({ email: "text" });
db.users.find({ $text: { $search: "john" } });
// → TEXT search
```

### **7. Monitoring Query Performance**

**a) Slow Query Log:**

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 }); // Log queries > 100ms

// Xem slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10);

// Profile levels:
// 0: Off
// 1: Log slow queries (> slowms)
// 2: Log all queries
```

**b) Current Operations:**

```javascript
// Xem queries đang chạy
db.currentOp({
  $or: [
    { op: "query", "command.find": { $exists: true } },
    { op: "getmore" }
  ]
});

// Kill slow query
db.killOp(<opid>);
```

**c) Index Usage Stats:**

```javascript
// Xem index usage
db.collection.aggregate([{ $indexStats: {} }]);

// Output:
// {
//   name: "email_1",
//   accesses: {
//     ops: 1000,           // Số lần dùng
//     since: ISODate("...")
//   }
// }
```

## IV. Cấu trúc truy vấn: Find, Update, Aggregation

MongoDB có nhiều cách query data. Hiểu rõ từng loại và cách tối ưu chúng.

### **1. Find Queries**

**a) Basic Find:**

```javascript
// Simple query
db.users.find({ status: "active" });

// Với projection (chọn fields)
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 } // Chỉ lấy name, email
);

// Với sort
db.users.find({ status: "active" }).sort({ created_at: -1 });

// Với limit và skip
db.users.find({ status: "active" }).sort({ created_at: -1 }).limit(10).skip(20);
```

**b) Query Operators:**

```javascript
// Comparison operators
db.users.find({ age: { $gt: 18, $lt: 65 } });
db.users.find({ status: { $in: ["active", "pending"] } });
db.users.find({ status: { $ne: "deleted" } });

// Logical operators
db.users.find({
  $and: [{ status: "active" }, { age: { $gte: 18 } }],
});

db.users.find({
  $or: [{ email: "john@example.com" }, { phone: "1234567890" }],
});

// Element operators
db.users.find({ email: { $exists: true } });
db.users.find({ tags: { $type: "array" } });

// Array operators
db.products.find({ tags: "electronics" });
db.products.find({ tags: { $all: ["electronics", "laptop"] } });
db.products.find({ tags: { $size: 3 } });

// Regex
db.users.find({ name: /^John/i }); // Case-insensitive, prefix
```

**c) Tối ưu Find Queries:**

```javascript
// ✅ Tốt: Index hỗ trợ query
db.users.createIndex({ status: 1, age: 1 });
db.users.find({ status: "active", age: { $gte: 18 } });
// → IXSCAN

// ✅ Tốt: Projection chỉ fields cần
db.users.find({ status: "active" }, { name: 1, email: 1 });
// → Giảm network traffic, memory usage

// ✅ Tốt: Limit sớm
db.users.find({ status: "active" }).limit(10);
// → Chỉ scan đến khi đủ 10 docs

// ❌ Xấu: $or với nhiều conditions (có thể scan nhiều indexes)
db.users.find({
  $or: [
    { email: "john@example.com" },
    { phone: "1234567890" },
    { name: "John Doe" },
  ],
});
// → Có thể scan 3 indexes riêng biệt

// ✅ Tốt hơn: Dùng compound index nếu có thể
db.users.createIndex({ email: 1, phone: 1, name: 1 });
// Hoặc thiết kế lại schema để tránh $or
```

### **2. Update Operations**

**a) Update Methods:**

```javascript
// updateOne - Update 1 document
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { status: "active" } }
);

// updateMany - Update nhiều documents
db.users.updateMany(
  { status: "pending" },
  { $set: { status: "active", updated_at: new Date() } }
);

// replaceOne - Thay thế toàn bộ document
db.users.replaceOne(
  { email: "john@example.com" },
  { name: "John Doe", email: "john@example.com", age: 30 }
);

// findOneAndUpdate - Update và return document
db.users.findOneAndUpdate(
  { email: "john@example.com" },
  { $inc: { login_count: 1 } },
  { returnDocument: "after" } // Return updated document
);
```

**b) Update Operators:**

```javascript
// $set - Set field value
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "active", updated_at: new Date() } }
);

// $unset - Remove field
db.users.updateOne({ _id: ObjectId("...") }, { $unset: { old_field: "" } });

// $inc - Increment numeric field
db.users.updateOne({ _id: ObjectId("...") }, { $inc: { view_count: 1 } });

// $push - Add to array
db.users.updateOne({ _id: ObjectId("...") }, { $push: { tags: "new_tag" } });

// $pull - Remove from array
db.users.updateOne({ _id: ObjectId("...") }, { $pull: { tags: "old_tag" } });

// $addToSet - Add to array if not exists
db.users.updateOne(
  { _id: ObjectId("...") },
  { $addToSet: { tags: "unique_tag" } }
);

// $pop - Remove first/last element from array
db.users.updateOne(
  { _id: ObjectId("...") },
  { $pop: { tags: 1 } } // 1 = last, -1 = first
);
```

**c) Tối ưu Update:**

```javascript
// ✅ Tốt: Index trên query filter
db.users.createIndex({ email: 1 });
db.users.updateOne(
  { email: "john@example.com" },
  { $set: { status: "active" } }
);
// → Tìm document nhanh bằng index

// ✅ Tốt: Update chỉ fields cần thiết (không dùng $set toàn bộ document)
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { status: "active" } } // Chỉ update status
);
// → Nhanh hơn replaceOne()

// ❌ Xấu: Update không có index
db.users.updateMany(
  { name: "John" }, // Không có index trên name
  { $set: { status: "active" } }
);
// → COLLSCAN để tìm documents

// ✅ Tốt: Batch updates với bulk operations
const bulk = db.users.initializeUnorderedBulkOp();
bulk.find({ status: "pending" }).update({ $set: { status: "active" } });
bulk.find({ status: "inactive" }).update({ $set: { status: "active" } });
bulk.execute();
// → Hiệu quả hơn nhiều updates riêng lẻ
```

### **3. Delete Operations**

```javascript
// deleteOne - Xóa 1 document
db.users.deleteOne({ email: "john@example.com" });

// deleteMany - Xóa nhiều documents
db.users.deleteMany({ status: "deleted" });

// findOneAndDelete - Xóa và return document
db.users.findOneAndDelete({ email: "john@example.com" });
```

**Tối ưu Delete:**

```javascript
// ✅ Tốt: Index trên query filter
db.users.createIndex({ status: 1 });
db.users.deleteMany({ status: "deleted" });
// → Tìm documents nhanh

// ⚠️ Lưu ý: Delete nhiều documents có thể chậm
// → Consider soft delete (set flag) thay vì hard delete
db.users.updateMany(
  { status: "deleted" },
  { $set: { deleted_at: new Date(), is_deleted: true } }
);
// → Có thể recover, không tốn thời gian delete
```

### **4. Aggregation Pipeline**

Aggregation là cách mạnh mẽ nhất để query và transform data trong MongoDB.

**a) Aggregation Stages:**

```javascript
// Basic aggregation
db.orders.aggregate([
  { $match: { status: "completed" } }, // Filter (như WHERE)
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } }, // Group by
  { $sort: { total: -1 } }, // Sort
  { $limit: 10 }, // Limit
]);
```

**b) Common Stages:**

```javascript
// $match - Filter documents (nên đặt đầu tiên)
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      created_at: { $gte: ISODate("2024-01-01") },
    },
  },
]);

// $group - Group và aggregate
db.orders.aggregate([
  {
    $group: {
      _id: "$user_id",
      total: { $sum: "$amount" },
      count: { $sum: 1 },
      avg: { $avg: "$amount" },
      max: { $max: "$amount" },
      min: { $min: "$amount" },
    },
  },
]);

// $project - Select/transform fields
db.orders.aggregate([
  {
    $project: {
      user_id: 1,
      total: 1,
      year: { $year: "$created_at" },
      month: { $month: "$created_at" },
    },
  },
]);

// $lookup - Join với collection khác
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" }, // Convert array thành object
]);

// $sort - Sort
db.orders.aggregate([{ $sort: { created_at: -1 } }]);

// $limit và $skip
db.orders.aggregate([{ $skip: 10 }, { $limit: 20 }]);

// $unwind - Expand array thành documents
db.products.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
]);

// $facet - Multiple pipelines cùng lúc
db.orders.aggregate([
  {
    $facet: {
      total: [{ $group: { _id: null, sum: { $sum: "$amount" } } }],
      avg: [{ $group: { _id: null, avg: { $avg: "$amount" } } }],
      count: [{ $count: "total" }],
    },
  },
]);
```

**c) Tối ưu Aggregation:**

```javascript
// ✅ Tốt: $match đầu tiên (giảm số documents)
db.orders.aggregate([
  { $match: { status: "completed" } }, // Filter sớm
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
]);

// ❌ Xấu: $match sau $group
db.orders.aggregate([
  { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
  { $match: { total: { $gt: 1000 } } }, // Filter sau (đã process nhiều docs)
]);

// ✅ Tốt: Index hỗ trợ $match
db.orders.createIndex({ status: 1, created_at: 1 });
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      created_at: { $gte: ISODate("2024-01-01") },
    },
  },
]);
// → Dùng index cho $match

// ✅ Tốt: $sort với index
db.orders.createIndex({ created_at: -1 });
db.orders.aggregate([{ $sort: { created_at: -1 } }, { $limit: 10 }]);
// → Dùng index cho sort, không cần in-memory sort

// ⚠️ Lưu ý: $lookup có thể chậm (như JOIN trong SQL)
// → Consider denormalize hoặc embedded documents
```

### **5. Bulk Operations**

Bulk operations hiệu quả hơn nhiều so với operations riêng lẻ:

```javascript
// Bulk Write
const bulk = db.users.initializeOrderedBulkOp();

bulk.insert({ name: "John", email: "john@example.com" });
bulk.find({ email: "jane@example.com" }).update({ $set: { status: "active" } });
bulk.find({ email: "bob@example.com" }).remove();

bulk.execute();

// Bulk Write với options
db.users.bulkWrite(
  [
    { insertOne: { document: { name: "John", email: "john@example.com" } } },
    {
      updateOne: {
        filter: { email: "jane@example.com" },
        update: { $set: { status: "active" } },
      },
    },
    { deleteOne: { filter: { email: "bob@example.com" } } },
  ],
  { ordered: false }
); // unordered = parallel execution
```

**Tối ưu Bulk Operations:**

```javascript
// ✅ Tốt: Batch size hợp lý (100-1000 operations)
const operations = [];
for (let i = 0; i < 1000; i++) {
  operations.push({
    insertOne: {
      document: { name: `User ${i}`, email: `user${i}@example.com` },
    },
  });
}
db.users.bulkWrite(operations);

// ✅ Tốt: Unordered bulk (parallel) khi không cần order
db.users.bulkWrite(operations, { ordered: false });
// → Nhanh hơn ordered bulk

// ✅ Tốt: Bulk update với index
db.users.createIndex({ email: 1 });
db.users.bulkWrite([
  {
    updateOne: {
      filter: { email: "john@example.com" },
      update: { $set: { status: "active" } },
    },
  },
]);
// → Tìm documents nhanh
```

### **6. Best Practices cho Queries**

1. ✅ **Index cho query filters**: $match conditions nên có index
2. ✅ **$match đầu tiên**: Giảm số documents trong pipeline
3. ✅ **Projection sớm**: Chỉ lấy fields cần thiết
4. ✅ **Limit sớm**: Giảm số documents xử lý
5. ✅ **Tránh $lookup nếu có thể**: Denormalize hoặc embedded docs
6. ✅ **Bulk operations**: Dùng bulk thay vì operations riêng lẻ
7. ✅ **Monitor với explain()**: Kiểm tra execution plan
8. ✅ **Tránh collection scans**: Luôn có index cho queries

## V. Sharding và Replication

MongoDB hỗ trợ **Replication** (high availability, data redundancy) và **Sharding** (horizontal scaling, phân tán dữ liệu) để đáp ứng nhu cầu mở rộng và độ tin cậy.

### **1. Replication trong MongoDB**

**Replication** là cơ chế sao chép dữ liệu từ một MongoDB instance (primary) sang nhiều instances khác (secondaries).

**a) Replica Set Architecture:**

```javascript
// Replica Set gồm:
// - 1 Primary node (nhận writes, đọc chính)
// - N Secondaries (đọc, backup)
// - Optional: 1 Arbiter (chỉ vote, không lưu data)

// Replica Set với 3 members:
{
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb1:27017", priority: 1 },  // Primary
    { _id: 1, host: "mongodb2:27017", priority: 1 },  // Secondary
    { _id: 2, host: "mongodb3:27017", priority: 1 }   // Secondary
  ]
}

// ✅ Ưu điểm:
// - High Availability: Nếu primary down, secondary tự động promote thành primary
// - Read Scaling: Có thể đọc từ secondaries
// - Data Redundancy: Dữ liệu được replicate ở nhiều nodes
```

**b) Replication Flow:**

```javascript
// 1. Client gửi write request đến Primary
// 2. Primary write vào oplog (operations log)
// 3. Secondaries đọc oplog từ Primary và apply operations
// 4. Secondary confirm đã replicate xong

// Oplog là circular buffer (vòng lặp), lưu các operations gần đây
// Size: ~5% disk space (mặc định)
```

**c) Read Preferences:**

```javascript
// Mặc định: Đọc từ primary
db.users.find({ status: "active" });

// Read từ secondary (để giảm load primary)
db.getMongo().setReadPref("secondary");

// Hoặc trong connection string:
// mongodb://mongodb1:27017,mongodb2:27017/?replicaSet=rs0&readPreference=secondary

// Read preferences:
// - primary (default): Chỉ đọc từ primary
// - primaryPreferred: Đọc từ primary, fallback secondary nếu primary down
// - secondary: Chỉ đọc từ secondary
// - secondaryPreferred: Đọc từ secondary, fallback primary nếu không có secondary
// - nearest: Đọc từ node gần nhất (lowest latency)
```

**d) Write Concerns:**

```javascript
// Write concern xác định khi nào MongoDB confirm write đã thành công

// Default: w: 1 (chỉ cần primary confirm)
db.users.insertOne({ name: "John" }, { writeConcern: { w: 1 } });

// w: "majority" - Cần majority nodes confirm
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

// w: 2 - Cần 2 nodes confirm (primary + 1 secondary)
db.users.insertOne({ name: "John" }, { writeConcern: { w: 2 } });

// j: true - Đảm bảo write đã được ghi vào disk journal
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", j: true } }
);

// ⚠️ Lưu ý:
// - w: "majority" = High durability, nhưng chậm hơn
// - w: 1 = Nhanh, nhưng có thể mất data nếu primary crash trước khi replicate
```

### **2. Sharding trong MongoDB**

**Sharding** là cách phân tán dữ liệu across nhiều MongoDB instances (shards) để mở rộng horizontal.

**a) Sharded Cluster Architecture:**

```
Sharded Cluster gồm:
1. Config Servers (metadata về cluster)
2. Shards (MongoDB instances lưu data)
3. Mongos (routing service, nhận queries từ clients)
```

```javascript
// Client → Mongos → Config Server (xem data ở shard nào)
//         → Mongos → Shard (lấy data)

// ✅ Ưu điểm:
// - Horizontal Scaling: Thêm shards để tăng capacity
// - Distributed Load: Phân tán load across shards
// - Large Datasets: Xử lý datasets lớn hơn single server
```

**b) Shard Key:**

```javascript
// Shard key xác định document được lưu ở shard nào

// Tạo sharded collection với shard key
sh.shardCollection("mydb.users", { user_id: 1 });

// MongoDB hash shard key và map vào shard
// Document với user_id = 123 → Shard A
// Document với user_id = 456 → Shard B

// ✅ Chọn shard key tốt:
// 1. High Cardinality (nhiều giá trị khác nhau)
// 2. Low Frequency (giá trị không quá common)
// 3. Non-monotonic (không tăng đều, tránh hotspot)

// ❌ Xấu: Shard key monotonic
sh.shardCollection("mydb.logs", { created_at: 1 });
// → Tất cả writes mới vào 1 shard (hotspot!)

// ✅ Tốt: Shard key có hash hoặc random component
sh.shardCollection("mydb.users", { user_id: "hashed" });
// → Writes được phân tán đều

// ✅ Tốt: Compound shard key với timestamp
sh.shardCollection("mydb.events", { event_type: 1, created_at: 1 });
// → Phân tán theo event_type, mỗi type có timestamp riêng
```

**c) Chunk và Balancing:**

```javascript
// MongoDB chia data thành chunks (ranges của shard key)

// Ví dụ:
// Shard A: [user_id: 0 - 1000]
// Shard B: [user_id: 1001 - 2000]
// Shard C: [user_id: 2001 - 3000]

// Khi 1 shard có quá nhiều chunks, MongoDB tự động move chunks sang shards khác
// → Chunk balancing (tự động)

// Xem chunk distribution
sh.status();

// Manual split chunk (nếu cần)
sh.splitFind("mydb.users", { user_id: 1500 });

// ⚠️ Lưu ý:
// - Chunk size default: 64MB
// - Balancing xảy ra khi imbalance > threshold
// - Balancing có thể tốn tài nguyên, nên monitor
```

**d) Queries trong Sharded Cluster:**

```javascript
// Targeted Query (dùng shard key) - Tốt nhất
db.users.find({ user_id: 123 });
// → Mongos chỉ query 1 shard (rất nhanh!)

// Scatter-Gather Query (không có shard key) - Chậm
db.users.find({ status: "active" });
// → Mongos phải query tất cả shards, sau đó merge kết quả
// → Chậm hơn, tốn tài nguyên hơn

// ✅ Best Practice:
// - Luôn include shard key trong queries nếu có thể
// - Compound shard key: Có thể query với prefix
sh.shardCollection("mydb.orders", { user_id: 1, created_at: 1 });
db.orders.find({ user_id: 123 }); // ✅ Targeted (dùng prefix)
db.orders.find({ user_id: 123, created_at: { $gt: ISODate("2024-01-01") } }); // ✅ Targeted
db.orders.find({ created_at: { $gt: ISODate("2024-01-01") } }); // ❌ Scatter-Gather
```

### **3. Replica Set với Sharding**

```javascript
// Mỗi shard trong cluster thường là một Replica Set

// Architecture:
// Shard 1: Replica Set (Primary + 2 Secondaries)
// Shard 2: Replica Set (Primary + 2 Secondaries)
// Shard 3: Replica Set (Primary + 2 Secondaries)
// Config Servers: Replica Set (3 nodes)
// Mongos: Multiple instances (for high availability)

// ✅ Ưu điểm:
// - High Availability: Mỗi shard có replication
// - Scalability: Có thể thêm shards
// - Fault Tolerance: Có thể mất 1 node trong mỗi shard mà vẫn hoạt động
```

### **4. Best Practices cho Replication và Sharding**

1. ✅ **Replication cho Production**: Luôn dùng replica set (minimum 3 nodes)
2. ✅ **Read from Secondaries**: Dùng `readPreference=secondary` để giảm load primary
3. ✅ **Write Concern**: Dùng `w: "majority"` cho critical writes
4. ✅ **Shard Key Selection**: Chọn shard key có cardinality cao, không monotonic
5. ✅ **Targeted Queries**: Luôn include shard key trong queries khi có thể
6. ✅ **Monitor Chunk Distribution**: Kiểm tra chunk balance trong sharded cluster
7. ✅ **Config Servers**: Dùng replica set cho config servers (minimum 3)
8. ✅ **Mongos Instances**: Deploy nhiều mongos instances để high availability

## VI. Transaction và Concurrency Control

MongoDB hỗ trợ **ACID transactions** (từ version 4.0+) và có cơ chế **concurrency control** để đảm bảo data consistency.

### **1. Transactions trong MongoDB**

**a) Single Document Transactions (mặc định):**

```javascript
// Mặc định, MongoDB đảm bảo atomic cho single document operations

db.users.updateOne(
  { email: "john@example.com" },
  { $set: { status: "active", updated_at: new Date() } }
);
// → Atomic: Hoặc update cả 2 fields, hoặc không update gì

// ✅ Single document operations luôn atomic
```

**b) Multi-Document Transactions:**

```javascript
// Multi-document transactions (cần replica set hoặc sharded cluster)

const session = db.getMongo().startSession();

try {
  session.startTransaction();

  // Operations trong transaction
  db.users.updateOne(
    { email: "john@example.com" },
    { $set: { status: "active" } },
    { session }
  );

  db.orders.insertOne(
    { user_id: ObjectId("..."), total: 100 },
    { session }
  );

  // Commit transaction
  session.commitTransaction();
} catch (error) {
  // Rollback nếu có lỗi
  session.abortTransaction();
} finally {
  session.endSession();
}

// ✅ ACID properties:
// - Atomicity: Tất cả hoặc không có gì
// - Consistency: Database luôn ở trạng thái valid
// - Isolation: Transactions không interfere với nhau
// - Durability: Committed changes persist
```

**c) Transaction Timeout:**

```javascript
// Transaction có timeout mặc định (60 giây)
// Operations trong transaction không được chạy quá lâu

const session = db.getMongo().startSession();
session.startTransaction({
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  maxTimeMS: 5000, // 5 seconds timeout
});

// ⚠️ Lưu ý:
// - Long-running transactions có thể cause locks
// - Nên giữ transactions ngắn (< 1 giây nếu có thể)
// - Tránh operations tốn thời gian trong transactions
```

### **2. Read Concern và Write Concern**

**a) Read Concern:**

```javascript
// Read Concern xác định data consistency level khi đọc

// "local" (default): Đọc data mới nhất từ node (có thể chưa committed)
db.users.find({ status: "active" }).readConcern("local");

// "available" (sharded): Tương tự local cho sharded clusters
db.users.find({ status: "active" }).readConcern("available");

// "majority": Chỉ đọc data đã được majority nodes confirm
db.users.find({ status: "active" }).readConcern("majority");
// → Đảm bảo data đã được replicate, không bị rollback

// "snapshot": Đọc từ consistent snapshot (cho transactions)
db.users.find({ status: "active" }).readConcern("snapshot");
// → Đảm bảo data consistent trong transaction

// "linearizable": Đọc từ majority-committed data (strongest)
db.users.find({ status: "active" }).readConcern("linearizable");
// → Đảm bảo data đã committed, nhưng chậm hơn
```

**b) Write Concern:**

```javascript
// Write Concern xác định khi nào MongoDB confirm write

// w: 1 (default) - Chỉ cần primary confirm
db.users.insertOne({ name: "John" }, { writeConcern: { w: 1 } });

// w: "majority" - Cần majority nodes confirm
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority" } }
);

// wtimeout: Timeout cho write concern
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

// j: true - Đảm bảo write đã được ghi vào journal (disk)
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority", j: true } }
);

// ✅ Best Practice:
// - Critical writes: w: "majority", j: true
// - Fast writes: w: 1 (chấp nhận rủi ro)
```

### **3. Concurrency Control: Locks và Writes**

**a) Storage Engine và Locking:**

```javascript
// MongoDB (WiredTiger storage engine) dùng document-level locking

// ❌ Old (MMAPv1): Collection-level locking
// ✅ WiredTiger: Document-level locking
// → Nhiều operations có thể chạy concurrent trên cùng collection
// → Chỉ lock documents đang được modify

// Ví dụ:
// Thread 1: Update document A
// Thread 2: Update document B (trong cùng collection)
// → Có thể chạy concurrent (không block nhau)

// Thread 1: Update document A
// Thread 2: Update document A (cùng document)
// → Thread 2 phải wait Thread 1 hoàn thành
```

**b) Write Conflicts:**

```javascript
// Khi 2 operations update cùng document concurrent

// Operation 1:
db.users.updateOne(
  { _id: ObjectId("..."), version: 1 },
  { $set: { status: "active", version: 2 } }
);

// Operation 2 (concurrent):
db.users.updateOne(
  { _id: ObjectId("..."), version: 1 },
  { $set: { name: "John", version: 2 } }
);

// → Chỉ 1 operation thành công (last write wins)
// → Operation thứ 2 fail nếu dùng optimistic locking (version field)

// ✅ Best Practice: Dùng optimistic locking với version field
db.users.updateOne(
  { _id: ObjectId("..."), version: 1 },
  { $set: { status: "active", version: 2 } }
);
// → Nếu version không match → update fail → retry
```

**c) Read-Modify-Write Operations:**

```javascript
// Atomic operations cho read-modify-write

// ❌ Không atomic (có thể có race condition)
const user = db.users.findOne({ _id: ObjectId("...") });
user.balance += 100;
db.users.updateOne({ _id: ObjectId("...") }, { $set: { balance: user.balance } });

// ✅ Atomic với findOneAndUpdate
db.users.findOneAndUpdate(
  { _id: ObjectId("...") },
  { $inc: { balance: 100 } },
  { returnDocument: "after" }
);

// ✅ Atomic với $inc, $set, $push, etc.
db.users.updateOne(
  { _id: ObjectId("...") },
  { $inc: { view_count: 1 } }
);
```

### **4. Cursor và Concurrency**

```javascript
// Cursors trong MongoDB

const cursor = db.users.find({ status: "active" });

// ⚠️ Lưu ý:
// - Cursor có thể return stale data nếu documents được update trong lúc iterate
// - MongoDB không lock documents khi đọc (non-blocking reads)

// ✅ Snapshot mode: Đảm bảo consistent snapshot
const cursor = db.users
  .find({ status: "active" })
  .snapshot(); // → Không cho phép trong sharded clusters

// ✅ Better: Dùng read concern "snapshot" cho transactions
```

### **5. Isolation Levels**

MongoDB không có explicit isolation levels như SQL databases, nhưng có thể đạt được thông qua read concern:

```javascript
// Read Uncommitted (không có trong MongoDB)
// → MongoDB không hỗ trợ dirty reads

// Read Committed (default - "local" read concern)
db.users.find({ status: "active" });
// → Đọc committed data từ node hiện tại

// Repeatable Read / Snapshot Isolation ("snapshot" read concern)
db.users.find({ status: "active" }).readConcern("snapshot");
// → Đọc từ consistent snapshot

// Serializable (strongest - "linearizable" read concern)
db.users.find({ status: "active" }).readConcern("linearizable");
// → Đọc từ majority-committed data
```

### **6. Best Practices cho Transactions và Concurrency**

1. ✅ **Single Document Operations**: Ưu tiên single document atomic operations
2. ✅ **Short Transactions**: Giữ transactions ngắn (< 1 giây)
3. ✅ **Read Concern "majority"**: Cho critical reads cần consistency
4. ✅ **Write Concern "majority"**: Cho critical writes cần durability
5. ✅ **Optimistic Locking**: Dùng version field cho concurrent updates
6. ✅ **Atomic Operators**: Dùng `$inc`, `$set`, `$push` thay vì read-modify-write
7. ✅ **Monitor Lock Waits**: Monitor lock contention trong application
8. ✅ **Avoid Long Transactions**: Tránh operations tốn thời gian trong transactions

## VII. Performance Tuning và Connection Pooling

Tối ưu hiệu năng MongoDB không chỉ về queries mà còn về connection management, caching, và resource allocation.

### **1. Connection Pooling**

**a) Connection Pool Architecture:**

```javascript
// MongoDB drivers sử dụng connection pooling

// Node.js (MongoDB Driver)
const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017', {
  maxPoolSize: 10,        // Maximum connections trong pool
  minPoolSize: 2,         // Minimum connections trong pool
  maxIdleTimeMS: 30000,   // Close idle connections sau 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

// ✅ Ưu điểm:
// - Tái sử dụng connections (không phải tạo mới mỗi request)
// - Giảm overhead của connection establishment
// - Better resource management
```

**b) Connection Pool Parameters:**

```javascript
// Quan trọng cho MongoDB connection pooling:

{
  maxPoolSize: 100,           // Max connections trong pool
  minPoolSize: 10,             // Min connections (luôn giữ sẵn)
  maxIdleTimeMS: 30000,       // Close idle connections sau 30s
  waitQueueTimeoutMS: 1000,   // Timeout khi chờ connection từ pool
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000, // Kiểm tra server health mỗi 10s
}

// ⚠️ Lưu ý:
// - maxPoolSize không nên quá lớn (100-200 cho most cases)
// - Quá nhiều connections có thể overwhelm MongoDB server
// - Monitor connection usage để tune parameters
```

**c) Connection Pool Best Practices:**

```javascript
// ✅ Tốt: Singleton pattern cho MongoDB client
class Database {
  private static client: MongoClient;
  
  static async connect() {
    if (!this.client) {
      this.client = new MongoClient(uri, {
        maxPoolSize: 50,
        minPoolSize: 5,
      });
      await this.client.connect();
    }
    return this.client;
  }
}

// ✅ Tốt: Reuse client instance
const client = await Database.connect();
const db = client.db('mydb');

// ❌ Xấu: Tạo client mới cho mỗi request
app.get('/users', async (req, res) => {
  const client = new MongoClient(uri); // ❌ Tạo mới mỗi request!
  await client.connect();
  // ...
});

// ✅ Tốt: Dùng connection pool
app.get('/users', async (req, res) => {
  const db = await Database.connect(); // ✅ Reuse pool
  const users = await db.collection('users').find().toArray();
  // ...
});
```

### **2. Query Performance Optimization**

**a) Batch Operations:**

```javascript
// ✅ Tốt: Batch reads với in()
db.users.find({ _id: { $in: [ObjectId("1"), ObjectId("2"), ObjectId("3")] } });
// → 1 query thay vì 3 queries riêng lẻ

// ✅ Tốt: Batch writes với bulk operations
const bulk = db.users.initializeUnorderedBulkOp();
for (const user of users) {
  bulk.insert(user);
}
bulk.execute();
// → Nhanh hơn nhiều so với insertOne() nhiều lần

// ❌ Xấu: Individual operations
for (const user of users) {
  await db.users.insertOne(user); // ❌ Chậm!
}
```

**b) Projection Optimization:**

```javascript
// ✅ Tốt: Chỉ lấy fields cần thiết
db.users.find(
  { status: "active" },
  { name: 1, email: 1, _id: 0 } // Chỉ lấy name, email
);
// → Giảm network traffic, memory usage

// ❌ Xấu: Lấy tất cả fields
db.users.find({ status: "active" });
// → Lấy tất cả fields, tốn bộ nhớ và network

// ✅ Tốt: Index coverage
db.users.createIndex({ email: 1, name: 1 });
db.users.find(
  { email: "john@example.com" },
  { _id: 0, email: 1, name: 1 }
);
// → Index only scan, không đọc documents!
```

**c) Pagination Optimization:**

```javascript
// ✅ Tốt: Cursor-based pagination (tốt cho large datasets)
const cursor = db.users.find({ status: "active" }).sort({ _id: 1 });
cursor.skip(0).limit(20);
// → Dùng index nếu có sort field

// ⚠️ Skip có thể chậm với large offsets
db.users.find().skip(1000000).limit(20);
// → Phải scan 1M documents để skip

// ✅ Tốt hơn: Range-based pagination
const lastId = ObjectId("...");
db.users.find({
  status: "active",
  _id: { $gt: lastId }
}).sort({ _id: 1 }).limit(20);
// → Không cần skip, dùng index

// ❌ Xấu: Skip với large offset
db.users.find().skip(100000).limit(20);
// → Chậm với large skip values
```

### **3. Caching Strategies**

**a) Application-Level Caching:**

```javascript
// ✅ Tốt: Cache frequent queries
const redis = require('redis');
const client = redis.createClient();

async function getCachedUser(userId) {
  const cached = await client.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await db.users.findOne({ _id: ObjectId(userId) });
  await client.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}

// ✅ Tốt: Cache với TTL
await client.setex('active_users_count', 300, count); // Cache 5 phút

// ⚠️ Lưu ý:
// - Cache invalidation strategy
// - Cache coherence với database
// - Memory usage
```

**b) MongoDB Query Cache:**

```javascript
// MongoDB tự động cache execution plans

// Plan cache được invalidate khi:
// - Index được tạo/drop
// - Collection statistics thay đổi
// - Manual clear: db.collection.getPlanCache().clear()

// ⚠️ Lưu ý:
// - Query cache không lưu results, chỉ execution plans
// - Application-level caching cho query results
```

### **4. Index Management và Maintenance**

**a) Index Building:**

```javascript
// ✅ Tốt: Background index building
db.users.createIndex({ email: 1 }, { background: true });
// → Không block operations trong khi build index

// ⚠️ Foreground index building block writes
db.users.createIndex({ email: 1 }); // Foreground (default)
// → Block writes trong khi build

// ✅ Tốt: Build indexes trên collections nhỏ trước
db.small_collection.createIndex({ field: 1 });
db.large_collection.createIndex({ field: 1 }, { background: true });
```

**b) Index Rebuilding:**

```javascript
// Rebuild indexes khi cần thiết
db.users.reIndex();

// ⚠️ Lưu ý:
// - Rebuild indexes tốn tài nguyên
// - Chỉ rebuild khi thực sự cần (fragmentation, corruption)
// - Monitor index usage trước khi rebuild
```

**c) Index Fragmentation:**

```javascript
// MongoDB tự động maintain indexes
// Nhưng đôi khi cần compact collection

// Compact collection (giảm fragmentation)
db.runCommand({ compact: "users" });

// ⚠️ Lưu ý:
// - Compact block operations
// - Chỉ dùng khi cần thiết
// - Consider trong maintenance window
```

### **5. Write Performance Optimization**

**a) Write Concern Tuning:**

```javascript
// ✅ Fast writes: w: 1 (chấp nhận rủi ro)
db.logs.insertOne({ message: "..." }, { writeConcern: { w: 1 } });
// → Nhanh nhất, không chờ replication

// ✅ Safe writes: w: "majority" (durability)
db.users.insertOne(
  { name: "John" },
  { writeConcern: { w: "majority" } }
);
// → Chậm hơn nhưng đảm bảo durability

// ✅ Balanced: w: 2 (primary + 1 secondary)
db.orders.insertOne({ ... }, { writeConcern: { w: 2 } });
// → Cân bằng giữa speed và safety
```

**b) Batch Writes:**

```javascript
// ✅ Tốt: Batch inserts
const operations = users.map(user => ({
  insertOne: { document: user }
}));
db.users.bulkWrite(operations, { ordered: false });
// → Nhanh hơn nhiều so với insertOne() nhiều lần

// ✅ Tốt: Unordered bulk (parallel)
db.users.bulkWrite(operations, { ordered: false });
// → Nhanh hơn ordered bulk

// ❌ Xấu: Individual writes
for (const user of users) {
  await db.users.insertOne(user); // ❌ Chậm!
}
```

**c) Write Concern Patterns:**

```javascript
// Pattern 1: Fire-and-forget (logs, metrics)
db.metrics.insertOne({ ... }, { writeConcern: { w: 0 } });
// → Không chờ confirmation (nhanh nhất)

// Pattern 2: Fast but safe (user data)
db.users.insertOne({ ... }, { writeConcern: { w: 1 } });
// → Chỉ chờ primary confirm

// Pattern 3: Critical data (financial transactions)
db.transactions.insertOne(
  { ... },
  { writeConcern: { w: "majority", j: true } }
);
// → Chờ majority + journal flush
```

### **6. Memory và Resource Management**

**a) WiredTiger Cache:**

```javascript
// MongoDB WiredTiger storage engine cache

// Default cache size: 50% of (RAM - 1GB)
// Có thể config trong mongod.conf:
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8  # 8GB cache

// ⚠️ Lưu ý:
// - Cache size nên là 50-60% RAM
// - Quá nhỏ → nhiều disk I/O
// - Quá lớn → thiếu RAM cho OS và operations
```

**b) Memory Monitoring:**

```javascript
// Xem memory usage
db.serverStatus().wiredTiger.cache;

// Output:
// {
//   "maximum bytes configured": 8589934592,
//   "bytes currently in the cache": 4294967296,
//   "bytes read into cache": ...,
//   "bytes written from cache": ...
// }

// ✅ Monitor:
// - Cache hit ratio (should be > 80%)
// - Cache evictions (nên ít)
// - Memory pressure
```

### **7. Best Practices cho Performance Tuning**

1. ✅ **Connection Pooling**: Dùng connection pool, không tạo connection mới mỗi request
2. ✅ **Batch Operations**: Dùng bulk operations thay vì individual operations
3. ✅ **Projection**: Chỉ lấy fields cần thiết
4. ✅ **Pagination**: Dùng range-based pagination thay vì skip với large offsets
5. ✅ **Caching**: Cache frequent queries ở application level
6. ✅ **Write Concern**: Balance giữa speed và durability
7. ✅ **Memory**: Tune WiredTiger cache size (50-60% RAM)
8. ✅ **Monitor**: Monitor performance metrics thường xuyên

## VIII. Monitoring, Troubleshooting và Best Practices

Monitoring và troubleshooting là kỹ năng quan trọng để maintain MongoDB cluster hiệu quả.

### **1. Monitoring Tools và Metrics**

**a) MongoDB Metrics:**

```javascript
// Server status
const status = db.serverStatus();

// Quan trọng metrics:
// - connections.current: Số connections hiện tại
// - connections.available: Số connections còn available
// - globalLock.activeClients: Số active clients
// - opcounters: Số operations (insert, update, delete, query)
// - network.bytesIn/bytesOut: Network traffic
// - metrics.operation.executionTime: Query execution time
// - wiredTiger.cache: Cache statistics

// Ví dụ:
{
  connections: {
    current: 50,
    available: 950,
    active: 10
  },
  opcounters: {
    insert: 1000,
    update: 500,
    delete: 100,
    query: 5000
  },
  metrics: {
    operation: {
      executionTime: {
        reads: { microseconds: 100 },
        writes: { microseconds: 200 }
      }
    }
  }
}
```

**b) Database Stats:**

```javascript
// Collection statistics
db.users.stats();

// Output:
// {
//   count: 1000000,           // Số documents
//   size: 104857600,          // Size (bytes)
//   avgObjSize: 104,          // Average document size
//   storageSize: 52428800,    // Storage size (bytes)
//   indexes: 5,               // Số indexes
//   indexSize: 20971520,      // Index size (bytes)
//   totalIndexSize: 31457280,
//   nindexes: 5
// }

// Database statistics
db.stats();

// ✅ Monitor:
// - Collection size và growth
// - Index size (nên < 50% collection size)
// - Storage vs data size (fragmentation)
```

**c) Current Operations:**

```javascript
// Xem operations đang chạy
db.currentOp();

// Filter specific operations
db.currentOp({
  "active": true,
  "op": "query",
  "secs_running": { $gt: 5 }  // Queries chạy > 5 giây
});

// Kill slow operation
db.killOp(<opid>);

// ⚠️ Lưu ý:
// - Chỉ kill operations khi thực sự cần
// - Kiểm tra operation trước khi kill
```

### **2. Query Profiling**

**a) Profiler Setup:**

```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 }); // Log queries > 100ms

// Profile levels:
// 0: Off
// 1: Log slow queries (> slowms)
// 2: Log all queries

// ⚠️ Lưu ý:
// - Profiling level 2 tốn performance và disk space
// - Chỉ dùng trong development hoặc khi troubleshoot
// - Production: Dùng level 1 với slowms hợp lý
```

**b) Analyze Profiler Data:**

```javascript
// Xem slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10);

// Top slowest queries
db.system.profile.find(
  { op: "query" }
).sort({ millis: -1 }).limit(10);

// Queries không dùng index
db.system.profile.find({
  op: "query",
  "execStats.stage": "COLLSCAN"  // Collection scan
});

// ✅ Analyze:
// - Query patterns
// - Missing indexes
// - Slow operations
// - Optimize queries dựa trên profiler data
```

**c) Profiler Output:**

```javascript
// Example profiler entry:
{
  op: "query",
  ns: "mydb.users",
  query: { status: "active" },
  keysExamined: 0,        // Không dùng index
  docsExamined: 1000000,  // Scan 1M documents!
  nreturned: 100,         // Chỉ return 100
  millis: 5000,           // Chậm 5 giây
  execStats: {
    stage: "COLLSCAN"     // Collection scan ❌
  }
}

// → Cần tạo index trên status field!
```

### **3. Index Analysis**

**a) Index Usage:**

```javascript
// Xem index usage statistics
db.collection.aggregate([{ $indexStats: {} }]);

// Output:
// {
//   name: "email_1",
//   accesses: {
//     ops: 1000,           // Số lần dùng
//     since: ISODate("...")
//   }
// }

// ✅ Analyze:
// - Indexes không được dùng → Consider drop
// - Indexes được dùng nhiều → Verify performance
// - Unused indexes → Wasted storage và write performance
```

**b) Index Efficiency:**

```javascript
// Check index efficiency với explain()
const result = db.users.find({ email: "john@example.com" })
  .explain("executionStats");

// Metrics quan trọng:
// - executionStats.totalKeysExamined: Số keys đọc từ index
// - executionStats.totalDocsExamined: Số documents đọc
// - executionStats.nReturned: Số documents return

// ✅ Ratio tốt:
// nReturned / totalDocsExamined ≈ 1 (selective index)
// totalKeysExamined / nReturned ≈ 1 (efficient index usage)

// ❌ Ratio xấu:
// totalDocsExamined >> nReturned (không selective)
// totalKeysExamined >> nReturned (inefficient)
```

### **4. Common Issues và Solutions**

**a) High Memory Usage:**

```javascript
// Issue: MongoDB sử dụng quá nhiều RAM
// Solution:
// 1. Check WiredTiger cache size
// 2. Reduce cache size nếu cần
// 3. Check for memory leaks (connection leaks)
// 4. Monitor indexes (quá nhiều indexes tốn memory)

// Fix:
// - Tune wiredTiger.cacheSizeGB
// - Drop unused indexes
// - Check connection pool size
```

**b) Slow Queries:**

```javascript
// Issue: Queries chạy chậm
// Solution:
// 1. Check explain() output
// 2. Look for COLLSCAN (collection scans)
// 3. Check indexes
// 4. Analyze query patterns

// Fix:
// - Tạo indexes cho queries chậm
// - Optimize query structure
// - Use projection để giảm data transfer
// - Consider caching
```

**c) Connection Pool Exhaustion:**

```javascript
// Issue: Hết connections trong pool
// Solution:
// 1. Check maxPoolSize
// 2. Check connection leaks
// 3. Monitor connection usage

// Fix:
// - Increase maxPoolSize
// - Fix connection leaks (ensure connections closed)
// - Use connection pooling properly
// - Monitor connection metrics
```

**d) Disk I/O Issues:**

```javascript
// Issue: High disk I/O, slow performance
// Solution:
// 1. Check cache hit ratio (should be > 80%)
// 2. Check for missing indexes
// 3. Check disk speed
// 4. Consider SSD

// Fix:
// - Increase WiredTiger cache
// - Add missing indexes
// - Use faster storage (SSD)
// - Consider sharding để distribute load
```

### **5. Logging và Debugging**

**a) MongoDB Logs:**

```javascript
// Xem MongoDB logs
// Log location: /var/log/mongodb/mongod.log (default)

// Log levels:
// 0: Off
// 1-5: Increasing verbosity

// Set log level:
db.setLogLevel(2, "query");  // Set query log level to 2

// ⚠️ Lưu ý:
// - Verbose logging tốn disk space
// - Chỉ enable khi troubleshoot
// - Rotate logs regularly
```

**b) Application Logging:**

```javascript
// ✅ Tốt: Log slow operations
const start = Date.now();
const result = await db.users.find({ ... }).toArray();
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn(`Slow query: ${duration}ms`, { query: "..." });
}

// ✅ Tốt: Log errors
try {
  await db.users.insertOne({ ... });
} catch (error) {
  logger.error('MongoDB error', { error, operation: 'insertOne' });
}
```

### **6. Health Checks**

**a) Server Health:**

```javascript
// Check server health
db.serverStatus();

// Key health metrics:
// - uptime: Server uptime
// - connections: Connection stats
// - opcounters: Operation counters
// - repl: Replication status (nếu replica set)
// - sharding: Sharding status (nếu sharded)

// ✅ Healthy indicators:
// - connections.available > 0
// - No errors trong logs
// - Replication lag < 1 second (replica set)
// - Cache hit ratio > 80%
```

**b) Replica Set Health:**

```javascript
// Check replica set status
rs.status();

// ✅ Healthy indicators:
// - All members "PRIMARY" or "SECONDARY"
// - Replication lag < 1 second
// - No members in "DOWN" hoặc "RECOVERING" state
// - Majority of members healthy

// ⚠️ Issues:
// - Members down
// - High replication lag
// - Split brain scenarios
```

### **7. Performance Benchmarks**

**a) Query Performance:**

```javascript
// Benchmark query performance
const start = Date.now();
const result = await db.users.find({ ... }).toArray();
const duration = Date.now() - start;

console.log(`Query took ${duration}ms`);

// ✅ Performance targets:
// - Simple queries: < 10ms
// - Indexed queries: < 50ms
// - Aggregation queries: < 500ms
// - Complex queries: < 1000ms
```

**b) Write Performance:**

```javascript
// Benchmark write performance
const start = Date.now();
await db.users.insertOne({ ... });
const duration = Date.now() - start;

// ✅ Performance targets:
// - Single document insert: < 5ms
// - Bulk insert (1000 docs): < 1000ms
// - Update: < 10ms
// - Delete: < 10ms
```

### **8. Best Practices cho Monitoring**

1. ✅ **Regular Monitoring**: Monitor metrics thường xuyên (daily/weekly)
2. ✅ **Set Alerts**: Alert khi metrics vượt threshold
3. ✅ **Profiler**: Dùng profiler để identify slow queries
4. ✅ **Index Analysis**: Regularly analyze index usage
5. ✅ **Health Checks**: Implement health checks trong application
6. ✅ **Logging**: Log errors và slow operations
7. ✅ **Performance Baselines**: Establish performance baselines
8. ✅ **Document Issues**: Document common issues và solutions

### **9. Production Checklist**

**Trước khi Deploy Production:**

1. ✅ **Replica Set**: Setup replica set (minimum 3 nodes)
2. ✅ **Backup Strategy**: Configure regular backups
3. ✅ **Indexes**: Create all necessary indexes
4. ✅ **Connection Pooling**: Configure connection pooling properly
5. ✅ **Monitoring**: Setup monitoring và alerting
6. ✅ **Logging**: Configure logging và log rotation
7. ✅ **Security**: Enable authentication và authorization
8. ✅ **Write Concern**: Use appropriate write concern cho critical data
9. ✅ **Read Preference**: Configure read preferences cho replica set
10. ✅ **Performance Testing**: Test performance với production-like data

**Ongoing Maintenance:**

1. ✅ **Regular Backups**: Test restore procedures regularly
2. ✅ **Index Maintenance**: Monitor và optimize indexes
3. ✅ **Performance Monitoring**: Monitor query performance
4. ✅ **Capacity Planning**: Monitor growth và plan scaling
5. ✅ **Security Updates**: Keep MongoDB updated
6. ✅ **Documentation**: Keep documentation updated
