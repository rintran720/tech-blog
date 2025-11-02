# 🧠 Toàn tập PostgreSQL: Kiến trúc, chuẩn hóa, tối ưu và chiến lược thực thi

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ, được biết đến với tính ACID cao, hỗ trợ nhiều tính năng advanced, và hiệu năng tốt cho cả OLTP và OLAP workloads.

## I. Chuẩn hóa dữ liệu (Normalization) - SQL

Chuẩn hóa dữ liệu giúp **tránh dư thừa**, **tăng tính toàn vẹn**, và **tối ưu truy vấn** trong PostgreSQL. Có 5 cấp chính (1NF → 5NF):

### **1. 1NF (First Normal Form)**

- Mỗi ô (cell) chỉ chứa **một giá trị đơn** (atomic value).
- Không được phép lưu danh sách hoặc mảng trong một ô (trừ khi dùng ARRAY type của PostgreSQL).
- ✅ Ví dụ đúng:
  | id | name | phone |
  |----|------|------------|
  | 1 | An | 0909123456 |

  ❌ Ví dụ sai: `phone = "0909, 0910, 0911"`

  ⚠️ **Lưu ý PostgreSQL**: PostgreSQL hỗ trợ ARRAY type, nhưng vẫn nên normalize trừ khi thực sự cần thiết.

### **2. 2NF (Second Normal Form)**

- Đáp ứng 1NF
- Mọi cột **phụ thuộc hoàn toàn vào khóa chính**, không phụ thuộc **một phần**.
- Thường áp dụng khi khóa chính là **khóa tổng hợp** (gồm nhiều cột).
- ✅ Cách xử lý: tách bảng để các thuộc tính chỉ phụ thuộc vào một khóa duy nhất.

### **3. 3NF (Third Normal Form)**

- Đáp ứng 2NF
- Không có phụ thuộc bắc cầu: tức là **thuộc tính không khóa không phụ thuộc vào thuộc tính không khóa khác**.
- ✅ Ví dụ:
  Nếu `Student(student_id, dept_id, dept_name)`
  → Tách `dept_name` sang bảng `Department` riêng.

### **4. 4NF (Fourth Normal Form)**

- Không chứa **phụ thuộc đa trị (multi-valued dependencies)**.
- Ví dụ: nếu sinh viên có **nhiều kỹ năng** và **nhiều sở thích**, nên tách hai bảng riêng thay vì gộp vào một.

### **5. 5NF (Fifth Normal Form)**

- Loại bỏ **phụ thuộc nối (join dependency)**, chỉ áp dụng trong thiết kế phức tạp (OLAP, Data warehouse).
- Đảm bảo bảng không thể tách thêm mà vẫn giữ được toàn vẹn thông tin.

## II. Index trong PostgreSQL

### **1. Các loại Index**

| Loại Index                           | Mô tả                               | Tác dụng chính                                 |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------- |
| **PRIMARY KEY**                      | Duy nhất, không null                | Định danh bản ghi                              |
| **UNIQUE INDEX**                     | Không trùng giá trị                 | Tăng tốc tìm kiếm dữ liệu duy nhất             |
| **B-Tree INDEX**                     | Cây nhị phân (mặc định)             | Dùng cho điều kiện `WHERE`, `ORDER BY`, `JOIN` |
| **COMPOSITE INDEX**                  | Index trên nhiều cột (multi-column) | Tối ưu truy vấn với nhiều điều kiện cùng lúc   |
| **GIN (Generalized Inverted Index)** | Cho dữ liệu có nhiều giá trị        | Full-text search, JSONB, arrays                |
| **GiST (Generalized Search Tree)**   | Cấu trúc cây tìm kiếm tổng quát     | GIS, full-text search, range types             |
| **BRIN (Block Range Index)**         | Cho dữ liệu có thứ tự               | Tối ưu cho dữ liệu lớn, có thứ tự (timestamp)  |
| **HASH INDEX**                       | Chỉ cho equality (=)                | So sánh chính xác (PostgreSQL 10+)             |
| **SP-GiST**                          | Space-partitioned GiST              | Cho dữ liệu không-uniform distribution         |
| **BLOOM INDEX**                      | Probabilistic index                 | Cho nhiều columns với nhiều giá trị            |

### **2. Cách đánh index hiệu quả**

- Đặt index cho:
  - Các cột trong `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`.
  - Cột có tính **chọn lọc cao** (selectivity cao, ít trùng lặp).
- Hạn chế index:
  - Cột nhỏ, ít thay đổi.
  - Không nên đánh index trên cột **LOW CARDINALITY** (ví dụ: giới tính, trạng thái YES/NO).

### **3. Composite Index (Index tổ hợp)**

Composite Index là index trên **nhiều cột**, giúp tối ưu truy vấn có nhiều điều kiện.

**Quy tắc Leftmost Prefix (Tiền tố bên trái):**

- Index `(a, b, c)` có thể dùng cho:
  - ✅ `WHERE a = ...`
  - ✅ `WHERE a = ... AND b = ...`
  - ✅ `WHERE a = ... AND b = ... AND c = ...`
  - ❌ `WHERE b = ...` (không dùng được)
  - ❌ `WHERE c = ...` (không dùng được)
  - ❌ `WHERE b = ... AND c = ...` (không dùng được)

**Ví dụ:**

```sql
-- Tạo composite index
CREATE INDEX idx_user_status_date ON users(status, created_at);

-- ✅ Dùng được index
SELECT * FROM users WHERE status = 'active';
SELECT * FROM users WHERE status = 'active' AND created_at > '2024-01-01';

-- ❌ Không dùng được index
SELECT * FROM users WHERE created_at > '2024-01-01'; -- Phải scan toàn bảng

-- Trường hợp đặc biệt: SELECT chỉ có cột trong index
SELECT status FROM users WHERE created_at > '2024-01-01';

-- Với index (status, created_at):
-- ❌ Vẫn vi phạm leftmost prefix → KHÔNG dùng được index để filter
-- ⚠️ PostgreSQL có thể dùng "Index Only Scan" (quét toàn bộ index)
--    thay vì "Seq Scan" (quét toàn bảng)
--    → Nhanh hơn quét bảng (index nhỏ hơn) nhưng vẫn chậm hơn index trực tiếp
```

**Partial Index (Index có điều kiện):**

PostgreSQL hỗ trợ partial index - chỉ index một phần dữ liệu:

```sql
-- Chỉ index các rows có status = 'active'
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- ✅ Dùng được
SELECT * FROM users WHERE status = 'active' AND email = 'user@example.com';

-- ❌ Không dùng được (status khác 'active')
SELECT * FROM users WHERE status = 'inactive' AND email = 'user@example.com';
```

**Covering Index (Index Only Scan):**

PostgreSQL tự động tối ưu khi query chỉ cần dữ liệu từ index:

```sql
CREATE INDEX idx_user_covering ON users(user_id, status, total);

-- Query chỉ cần columns trong index
SELECT user_id, status, total FROM users WHERE user_id = 123;
-- → Index Only Scan (không đọc bảng!)
```

### **4. Các loại Scan trong PostgreSQL**

| Loại Scan                      | Mô tả                                               | Khi nào dùng                                 | Performance              |
| ------------------------------ | --------------------------------------------------- | -------------------------------------------- | ------------------------ |
| **Index Scan**                 | Scan index để tìm rows, sau đó đọc bảng             | WHERE có index                               | Tốt                      |
| **Index Only Scan**            | Chỉ scan index, không đọc bảng                      | Query chỉ cần columns trong index            | Rất tốt                  |
| **Bitmap Index Scan**          | Đọc index thành bitmap, sau đó đọc bảng theo bitmap | Nhiều rows cần đọc (> 5% bảng)               | Tốt (tránh random reads) |
| **Seq Scan (Sequential Scan)** | Quét toàn bảng tuần tự                              | Không có index hoặc scan toàn bảng nhanh hơn | Chậm (full scan)         |
| **Parallel Seq Scan**          | Seq Scan với nhiều workers                          | PostgreSQL tự động khi table lớn             | Tốt hơn Seq Scan         |

### **5. Cách xác định thứ tự cột trong Composite Index**

**Nguyên tắc:**

1. **Selectivity (Độ chọn lọc)**: Cột có nhiều giá trị khác nhau (high cardinality) đặt trước
2. **Query Patterns**: Cột được dùng nhiều nhất trong WHERE đặt trước
3. **Range vs Equality**: Equality conditions (`=`) đặt trước range conditions (`>`, `<`, `BETWEEN`)
4. **Covering Index**: Cột trong SELECT (nếu muốn Index Only Scan) đặt sau WHERE columns
5. **ORDER BY**: Nếu query có ORDER BY, cột trong ORDER BY có thể đặt sau WHERE columns

**Ví dụ:**

```sql
-- Bảng users có 1M rows
-- status: 3 giá trị ('active', 'inactive', 'deleted') - LOW cardinality
-- created_at: 1M giá trị - HIGH cardinality
-- email: 1M giá trị - HIGH cardinality

-- Query pattern:
SELECT * FROM users
WHERE status = 'active'
  AND created_at > '2024-01-01'
ORDER BY created_at DESC;

-- ❌ Index (status, created_at):
--    → Selectivity thấp ở đầu (status chỉ có 3 giá trị)
--    → Không tối ưu cho ORDER BY

-- ✅ Index (created_at, status):
--    → Selectivity cao ở đầu (created_at có nhiều giá trị)
--    → Tối ưu cho WHERE và ORDER BY

-- Hoặc tốt hơn nữa:
CREATE INDEX idx_users_optimized ON users(created_at DESC)
WHERE status = 'active';
-- → Partial index với created_at DESC cho ORDER BY
```

**Công thức quyết định:**

```
Priority = (Selectivity × Usage_Frequency × Query_Type_Weight)

Selectivity = DISTINCT_VALUES / TOTAL_ROWS
Usage_Frequency = Số lần xuất hiện trong queries
Query_Type_Weight:
  - Equality (=): 3
  - Range (>, <): 2
  - LIKE: 1
```

## III. Chiến lược thực thi (Execution Strategy)

PostgreSQL Query Planner tự động chọn execution plan tối ưu nhất dựa trên statistics của bảng.

### **1. EXPLAIN và EXPLAIN ANALYZE**

**EXPLAIN:**

```sql
-- Xem execution plan (không thực thi query)
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- Output:
-- Index Scan using idx_email on users
--   Index Cond: (email = 'user@example.com'::text)
```

**Các loại Node trong EXPLAIN:**

| Node Type                                    | Mô tả                                         |
| -------------------------------------------- | --------------------------------------------- |
| **Seq Scan**                                 | Quét toàn bảng tuần tự                        |
| **Index Scan**                               | Scan index rồi đọc bảng                       |
| **Index Only Scan**                          | Chỉ scan index (Covering Index)               |
| **Bitmap Index Scan** + **Bitmap Heap Scan** | Scan index thành bitmap, đọc bảng theo bitmap |
| **Hash Join**                                | Join bằng hash table                          |
| **Nested Loop**                              | Join bằng nested loop                         |
| **Merge Join**                               | Join bằng merge (2 sorted lists)              |
| **Sort**                                     | Sắp xếp                                       |
| **Aggregate**                                | Tổng hợp (GROUP BY, COUNT, SUM, etc.)         |

**EXPLAIN ANALYZE:**

```sql
-- Thực thi query và show thời gian thực tế
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Output:
-- Index Scan using idx_email on users
--   Index Cond: (email = 'user@example.com'::text)
--   Planning Time: 0.123 ms
--   Execution Time: 0.456 ms
```

**Các thông số quan trọng:**

- **cost**: Estimated cost (unit: sequential page reads)
- **rows**: Estimated rows
- **width**: Average row width (bytes)
- **actual time**: Thời gian thực tế (ms)
- **actual rows**: Số rows thực tế
- **Buffers**: shared hit/read (cache hits/misses)

### **2. Query Planner và Optimizer**

PostgreSQL Query Planner tự động chọn plan tốt nhất:

**Statistics:**

```sql
-- Xem statistics của bảng
SELECT
  schemaname,
  tablename,
  n_live_tup as rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- Update statistics (sau khi insert/update nhiều)
ANALYZE users;
```

**Planner Settings:**

```sql
-- Xem planner settings
SHOW enable_seqscan;
SHOW enable_indexscan;
SHOW enable_bitmapscan;

-- Tắt seq scan để force dùng index (debugging only!)
SET enable_seqscan = off;
-- ⚠️ Chỉ dùng để test, không set trong production!
```

### **3. JOIN Strategies**

**a) Nested Loop Join:**

```
For each row in outer table:
  For each matching row in inner table:
    Join
```

- Tốt cho: Bảng nhỏ, có index trên join key
- Chậm cho: Bảng lớn không có index

**b) Hash Join:**

```
1. Build hash table từ outer table
2. Probe hash table với inner table
```

- Tốt cho: Bảng lớn, không cần sort
- Cần: Đủ memory cho hash table

**c) Merge Join:**

```
1. Sort cả 2 bảng theo join key
2. Merge 2 sorted lists
```

- Tốt cho: Bảng đã được sort hoặc có index
- Cần: Ít nhất 1 bảng sorted

**Ví dụ:**

```sql
EXPLAIN ANALYZE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- Nếu users.id và orders.user_id có index:
-- → Hash Join hoặc Nested Loop

-- Nếu không có index:
-- → Seq Scan + Hash Join
```

### **4. Parallel Query Execution**

PostgreSQL tự động parallelize queries lớn:

```sql
-- Enable parallel queries
SET max_parallel_workers_per_gather = 4;

-- Query sẽ tự động parallelize
EXPLAIN ANALYZE
SELECT COUNT(*) FROM orders WHERE created_at > '2024-01-01';

-- Output:
-- Finalize Aggregate
--   -> Gather
--       Workers Planned: 4
--       -> Partial Aggregate
--           -> Parallel Seq Scan on orders
```

**Tối ưu:**

```sql
-- Config trong postgresql.conf
max_parallel_workers_per_gather = 4  # Số workers per query
max_parallel_workers = 8               # Tổng số parallel workers
max_worker_processes = 8                # Tổng số background workers
```

## IV. Cấu trúc truy vấn: WHERE, JOIN, GROUP, ORDER

### **1. WHERE Clause**

**Tối ưu WHERE:**

```sql
-- ✅ Tốt: Index trên filter column
CREATE INDEX idx_email ON users(email);
SELECT * FROM users WHERE email = 'user@example.com';

-- ❌ Xấu: Function trong WHERE
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';
-- → Không dùng được index

-- ✅ Tốt: Function-based index
CREATE INDEX idx_email_upper ON users(UPPER(email));
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';

-- ✅ Tốt: Index cho range queries
CREATE INDEX idx_created_at ON users(created_at);
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- ❌ Xấu: Pattern matching không prefix
SELECT * FROM users WHERE email LIKE '%@example.com';
-- → Không dùng được index

-- ✅ Tốt: Prefix matching
SELECT * FROM users WHERE email LIKE 'user%@example.com';

-- ✅ Tốt: Full-text search với GIN index
CREATE INDEX idx_content_gin ON articles USING GIN(to_tsvector('english', content));
SELECT * FROM articles WHERE to_tsvector('english', content) @@ to_tsquery('english', 'postgresql');
```

**NULL Handling:**

```sql
-- ❌ Không dùng được index
SELECT * FROM users WHERE email IS NULL;

-- ✅ Tốt: Partial index cho NULL
CREATE INDEX idx_email_not_null ON users(email) WHERE email IS NOT NULL;
SELECT * FROM users WHERE email IS NOT NULL;
```

### **2. JOIN**

**Các loại JOIN:**

- **INNER JOIN**: Chỉ rows match ở cả 2 bảng
- **LEFT JOIN**: Tất cả rows từ bảng trái
- **RIGHT JOIN**: Tất cả rows từ bảng phải
- **FULL OUTER JOIN**: Tất cả rows từ cả 2 bảng
- **CROSS JOIN**: Cartesian product

**Tối ưu JOIN:**

```sql
-- ✅ Tốt: Index trên join keys
CREATE INDEX idx_user_id ON orders(user_id);
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- ✅ Tốt: Bảng nhỏ hơn làm outer table
-- PostgreSQL tự động chọn, nhưng có thể force:
SELECT /*+ HashJoin(users orders) */ ...

-- ❌ Xấu: Cartesian product
SELECT * FROM users, orders;  -- N × M rows!
```

**Multiple JOINs:**

```sql
-- PostgreSQL tự động chọn join order
SELECT
  u.name,
  o.total,
  p.name as product_name
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id;

-- Có thể force join order với JOIN syntax:
FROM users u
  JOIN orders o ON u.id = o.user_id
  JOIN products p ON o.product_id = p.id;
```

### **3. GROUP BY**

**Cách hoạt động:**

```sql
-- GROUP BY tự động sort (PostgreSQL)
SELECT status, COUNT(*)
FROM orders
GROUP BY status;

-- Execution:
-- 1. Scan orders
-- 2. Group by status
-- 3. Aggregate (COUNT)
```

**Tối ưu:**

```sql
-- ✅ Tốt: Index hỗ trợ GROUP BY
CREATE INDEX idx_status ON orders(status);
SELECT status, COUNT(*) FROM orders GROUP BY status;
-- → Có thể dùng Index Only Scan hoặc Index Scan

-- ✅ Tốt: WHERE trước GROUP BY
SELECT status, COUNT(*)
FROM orders
WHERE created_at >= '2024-01-01'  -- Filter sớm
GROUP BY status;

-- ⚠️ HAVING vs WHERE:
-- WHERE: Filter trước aggregation (tốt hơn)
-- HAVING: Filter sau aggregation (chậm hơn)
```

### **4. ORDER BY**

**Cách hoạt động:**

```sql
-- ORDER BY cần sort
SELECT * FROM users ORDER BY created_at DESC;

-- Execution:
-- 1. Scan users
-- 2. Sort by created_at DESC
-- 3. Return
```

**Tối ưu:**

```sql
-- ✅ Tốt: Index hỗ trợ ORDER BY
CREATE INDEX idx_created_at ON users(created_at DESC);
SELECT * FROM users ORDER BY created_at DESC;
-- → Index Scan (không cần sort!)

-- ✅ Tốt: INDEX với cả WHERE và ORDER BY
CREATE INDEX idx_status_created ON orders(status, created_at DESC);
SELECT * FROM orders
WHERE status = 'active'
ORDER BY created_at DESC;
-- → Index Scan (không cần sort!)

-- ✅ Tốt: LIMIT với ORDER BY có index
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10;
-- → Chỉ cần đọc 10 rows từ index!
```

### **5. Kết hợp WHERE, JOIN, GROUP BY, ORDER BY**

**Thứ tự thực thi logic:**

```
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

**Ví dụ tối ưu:**

```sql
-- Query phức tạp
SELECT
  u.name,
  COUNT(o.id) as order_count,
  SUM(o.total) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2024-01-01'
  AND u.status = 'active'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 10;

-- Indexes cần thiết:
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_created_at ON orders(created_at);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_user_composite ON users(id, name) WHERE status = 'active';
```

## V. Subquery (Truy vấn lồng)

### **1. Các loại Subquery**

**a) Scalar Subquery:**

```sql
-- Trả về 1 giá trị
SELECT
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
FROM users;
```

**b) Row Subquery:**

```sql
-- Trả về 1 row
SELECT * FROM users
WHERE (status, created_at) = (
  SELECT status, created_at FROM users WHERE id = 1
);
```

**c) Table Subquery (Derived Table):**

```sql
-- Trả về nhiều rows
SELECT u.name, o_stats.order_count
FROM users u
JOIN (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  GROUP BY user_id
) o_stats ON u.id = o_stats.user_id;
```

**d) Correlated vs Uncorrelated:**

```sql
-- Correlated: Subquery tham chiếu outer query
SELECT
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
FROM users;
-- → Execute cho mỗi row của users (CHẬM!)

-- Uncorrelated: Subquery độc lập
SELECT *
FROM users
WHERE id IN (SELECT user_id FROM orders WHERE status = 'active');
-- → Execute 1 lần (NHANH HƠN!)
```

### **2. Tối ưu Subquery**

**a) Chuyển Correlated thành JOIN:**

```sql
-- ❌ Chậm: Correlated subquery
SELECT
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
FROM users;

-- ✅ Nhanh: JOIN với GROUP BY
SELECT
  u.name,
  COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

**b) EXISTS vs IN:**

```sql
-- EXISTS thường tốt hơn IN cho correlated subqueries
SELECT *
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.status = 'active'
);

-- IN tốt cho uncorrelated subqueries với ít giá trị
SELECT *
FROM users
WHERE id IN (1, 2, 3, 4, 5);
```

**c) LATERAL JOIN:**

PostgreSQL hỗ trợ LATERAL JOIN - subquery có thể tham chiếu rows từ previous tables:

```sql
-- Lấy 3 orders gần nhất của mỗi user
SELECT u.name, o.total
FROM users u
CROSS JOIN LATERAL (
  SELECT total, created_at
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 3
) o;

-- Tương đương với:
-- SELECT u.name, o.total
-- FROM users u
-- JOIN (
--   SELECT DISTINCT ON (user_id) ...
-- ) o ON ...
```

### **3. Common Table Expressions (CTE)**

```sql
-- CTE giúp code rõ ràng hơn
WITH active_orders AS (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  WHERE status = 'active'
  GROUP BY user_id
),
user_stats AS (
  SELECT
    u.id,
    u.name,
    COALESCE(ao.order_count, 0) as order_count
  FROM users u
  LEFT JOIN active_orders ao ON u.id = ao.user_id
)
SELECT * FROM user_stats WHERE order_count > 5;
```

**⚠️ Lưu ý:** CTE trong PostgreSQL được materialize (tính toán trước), có thể chậm nếu CTE lớn.

## VI. Isolation Level (Khả năng cô lập giao dịch)

PostgreSQL hỗ trợ đầy đủ 4 isolation levels theo SQL standard.

### **1. ACID Properties**

- **Atomicity**: Tất cả hoặc không có gì
- **Consistency**: Data luôn trong trạng thái hợp lệ
- **Isolation**: Giao dịch không ảnh hưởng lẫn nhau
- **Durability**: Dữ liệu đã commit không bị mất

### **2. Các vấn đề Concurrency**

- **Dirty Read**: Đọc dữ liệu chưa commit (PostgreSQL KHÔNG cho phép)
- **Non-repeatable Read**: Đọc lại cùng một row có giá trị khác
- **Phantom Read**: Đọc lại cùng một query có thêm rows mới
- **Lost Update**: Update bị ghi đè bởi transaction khác

### **3. Isolation Levels**

| Isolation Level              | Dirty Read         | Non-repeatable Read | Phantom Read                 | Lost Update |
| ---------------------------- | ------------------ | ------------------- | ---------------------------- | ----------- |
| **READ UNCOMMITTED**         | ❌ (Not supported) | N/A                 | N/A                          | ❌          |
| **READ COMMITTED** (Default) | ❌                 | ✅ Có thể           | ✅ Có thể                    | ❌          |
| **REPEATABLE READ**          | ❌                 | ❌                  | ❌ (Phantom Read vẫn có thể) | ❌          |
| **SERIALIZABLE**             | ❌                 | ❌                  | ❌                           | ❌          |

**a) READ COMMITTED (Mặc định):**

```sql
-- Mỗi query trong transaction thấy snapshot tại thời điểm query
BEGIN;
SELECT * FROM users WHERE id = 1;  -- Query 1
-- Nếu có transaction khác update row này
SELECT * FROM users WHERE id = 1;  -- Query 2 có thể thấy giá trị mới
COMMIT;
```

**b) REPEATABLE READ:**

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT * FROM users WHERE id = 1;  -- Query 1
-- Nếu có transaction khác update row này
SELECT * FROM users WHERE id = 1;  -- Query 2 vẫn thấy giá trị cũ
COMMIT;
```

**c) SERIALIZABLE:**

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
-- Tất cả queries trong transaction thấy cùng snapshot
-- Nếu có conflict → Error: "could not serialize access"
COMMIT;
```

### **4. MVCC (Multi-Version Concurrency Control)**

PostgreSQL dùng MVCC để đảm bảo isolation:

- **Tuple versioning**: Mỗi update tạo version mới
- **Transaction ID**: Mỗi transaction có xid
- **Visibility rules**: Quyết định version nào visible cho transaction

**Vacuum:**

```sql
-- Xóa old versions không còn cần
VACUUM users;

-- VACUUM FULL: Reclaim space (LOCK table)
VACUUM FULL users;

-- Auto vacuum (mặc định bật)
-- Config trong postgresql.conf
autovacuum = on
autovacuum_naptime = 1min
```

### **5. Locking**

**Lock types:**

- **Shared Lock**: Cho SELECT
- **Exclusive Lock**: Cho INSERT, UPDATE, DELETE
- **Advisory Lock**: Application-level locking

**Row-level Locking:**

```sql
-- SELECT FOR UPDATE: Lock rows để update sau
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- SELECT FOR SHARE: Lock rows để đọc (không cho update)
SELECT * FROM users WHERE id = 1 FOR SHARE;

-- NOWAIT: Không chờ nếu lock
SELECT * FROM users WHERE id = 1 FOR UPDATE NOWAIT;
```

## VII. Connection Pool (Pool kết nối)

PostgreSQL connections tốn tài nguyên đáng kể, connection pooling là cần thiết.

### **1. Khái niệm và kiến trúc**

**Vấn đề không có Connection Pool:**

```
Request 1: Mở connection → Query → Đóng connection (100-200ms overhead)
Request 2: Mở connection → Query → Đóng connection (100-200ms overhead)
...
→ Mỗi request tốn 100-200ms chỉ để mở/đóng connection!
```

**Với Connection Pool:**

```
Pool: [conn1, conn2, conn3, ...] (đã tạo sẵn)
Request 1: Lấy conn1 từ pool → Query → Trả về pool (~1-5ms)
Request 2: Lấy conn2 từ pool → Query → Trả về pool (~1-5ms)
...
→ Tiết kiệm 95-195ms mỗi request!
```

### **2. pgBouncer (Connection Pooler cho PostgreSQL)**

**Cài đặt và cấu hình:**

```ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction  # transaction, session, statement
max_client_conn = 1000    # Max client connections
default_pool_size = 20     # Connections per database
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50   # Max connections to PostgreSQL
```

**Pool modes:**

- **Session**: Client giữ connection trong suốt session
- **Transaction**: Connection được trả về pool sau mỗi transaction (recommended)
- **Statement**: Connection được trả về pool sau mỗi statement (fastest, nhưng hạn chế)

### **3. Connection Pool trong Application**

**Node.js với pg:**

```javascript
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "mydb",
  user: "user",
  password: "password",

  // Pool settings
  max: 20, // max connections
  min: 5, // min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sử dụng
async function getUser(userId) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  return result.rows[0];
}
```

**Python với psycopg2:**

```python
import psycopg2
from psycopg2 import pool

# Tạo connection pool
connection_pool = psycopg2.pool.SimpleConnectionPool(
    1,  # min connections
    20, # max connections
    host="localhost",
    port=5432,
    database="mydb",
    user="user",
    password="password"
)

# Sử dụng
def get_user(user_id):
    conn = connection_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        return cur.fetchone()
    finally:
        connection_pool.putconn(conn)
```

### **4. Best Practices**

1. ✅ **Dùng pgBouncer** cho connection pooling ở application level
2. ✅ **Transaction pooling mode** cho most use cases
3. ✅ **Monitor connections**: `SELECT count(*) FROM pg_stat_activity;`
4. ✅ **Set max_connections** trong PostgreSQL phù hợp với pool size
5. ✅ **Luôn release connections** về pool

## VIII. Giới hạn & Hiệu năng của PostgreSQL

### **1. Các giới hạn của PostgreSQL**

| Hạng mục                 | Giới hạn                   | Ghi chú                                    |
| ------------------------ | -------------------------- | ------------------------------------------ |
| **Kích thước bảng**      | ~32 TB (theo lý thuyết)    | Phụ thuộc file system                      |
| **Kích thước row**       | ~1.6 GB (không tính TOAST) | TOAST cho large values                     |
| **Số cột tối đa**        | 1600                       | Thực tế thường < 100 cho hiệu năng tốt     |
| **Số index trên 1 bảng** | Không giới hạn             | Nhiều index → chậm INSERT/UPDATE           |
| **Kích thước index key** | 2704 bytes (B-tree)        | Composite index: tổng các cột ≤ 2704 bytes |
| **max_connections**      | 100 (mặc định)             | Có thể tăng đến hàng ngàn                  |
| **Kích thước database**  | Không giới hạn             | Phụ thuộc file system                      |

### **2. Hiệu năng thực tế**

**Throughput (TPS):**

| Cấu hình                         | Read TPS | Write TPS | Mixed TPS | Ghi chú                        |
| -------------------------------- | -------- | --------- | --------- | ------------------------------ |
| **PostgreSQL, HDD, default**     | 1k–5k    | 500–2k    | 1k–3k     | Cấu hình cơ bản                |
| **PostgreSQL, SSD, default**     | 5k–20k   | 2k–10k    | 3k–15k    | Cải thiện với SSD              |
| **PostgreSQL, SSD, optimized**   | 15k–40k  | 10k–25k   | 12k–35k   | Tối ưu shared_buffers, WAL     |
| **PostgreSQL, SSD, cluster**     | 40k–100k | 25k–80k   | 35k–90k   | Read replicas, connection pool |
| **PostgreSQL, optimized (OLAP)** | 100k+    | —         | —         | Columnar storage (TimescaleDB) |

**Latency:**

| Loại query                   | Latency (p50) | Latency (p99) | Ghi chú                 |
| ---------------------------- | ------------- | ------------- | ----------------------- |
| **Primary key lookup**       | < 1ms         | < 5ms         | Index hit, trong memory |
| **Index range scan**         | 1–10ms        | 10–50ms       | Phụ thuộc số rows       |
| **Seq scan (small)**         | 10–100ms      | 100–500ms     | < 1M rows               |
| **Parallel seq scan**        | 5–50ms        | 50–200ms      | < 1M rows, parallel     |
| **JOIN (2 tables, indexed)** | 5–50ms        | 50–200ms      | Với indexes tốt         |

### **3. Configuration tối ưu**

**postgresql.conf:**

```ini
# Memory settings
shared_buffers = 4GB           # 25% RAM cho dedicated server
effective_cache_size = 12GB     # 50-75% RAM
work_mem = 64MB                # Per operation (GROUP BY, SORT)
maintenance_work_mem = 1GB     # For VACUUM, CREATE INDEX

# WAL (Write-Ahead Logging)
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# Connections
max_connections = 100
superuser_reserved_connections = 3

# Query Planner
random_page_cost = 1.1          # For SSD (default: 4.0 for HDD)
effective_io_concurrency = 200  # For SSD

# Parallel queries
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

## IX. Nâng cao hiệu năng (Performance Tuning)

### **1. Partitioning**

PostgreSQL hỗ trợ table partitioning từ version 10+:

**Range Partitioning:**

```sql
-- Partition theo range
CREATE TABLE orders (
  id SERIAL,
  user_id INT,
  order_date DATE,
  total DECIMAL(10,2)
) PARTITION BY RANGE (order_date);

-- Tạo partitions
CREATE TABLE orders_2023 PARTITION OF orders
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Query tự động chỉ scan partition liên quan
SELECT * FROM orders WHERE order_date >= '2024-01-01';
-- → Chỉ scan orders_2024 partition
```

**List Partitioning:**

```sql
CREATE TABLE users (
  id SERIAL,
  name VARCHAR(100),
  region VARCHAR(50)
) PARTITION BY LIST (region);

CREATE TABLE users_north PARTITION OF users
  FOR VALUES IN ('north', 'northeast');
CREATE TABLE users_south PARTITION OF users
  FOR VALUES IN ('south', 'southeast');
```

### **2. Read Replicas**

**Setup Streaming Replication:**

```sql
-- Master: postgresql.conf
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3

-- Master: pg_hba.conf
host replication replica_user 0.0.0.0/0 md5

-- Slave: recovery.conf (PostgreSQL 12+)
primary_conninfo = 'host=master_ip port=5432 user=replica_user'
```

**Query Distribution:**

```javascript
// Application-level read/write splitting
class Database {
  constructor() {
    this.master = new Pool(masterConfig);
    this.replicas = [new Pool(replica1Config), new Pool(replica2Config)];
  }

  async query(sql, params) {
    // Write operations → Master
    if (sql.match(/INSERT|UPDATE|DELETE|CREATE|ALTER|DROP/i)) {
      return this.master.query(sql, params);
    }

    // Read operations → Replica (round-robin)
    const replica = this.getReplica();
    return replica.query(sql, params);
  }
}
```

### **3. Caching**

**Application-level caching với Redis:**

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  let user = await redis.get(cacheKey);

  if (!user) {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    user = result.rows[0];
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return JSON.parse(user);
}
```

**PostgreSQL Query Cache:**

PostgreSQL không có built-in query cache như MySQL. Cần dùng external cache (Redis, Memcached).

### **4. Query Optimization**

**a) EXPLAIN và EXPLAIN ANALYZE:**

```sql
-- Phân tích execution plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

**b) Index Optimization:**

```sql
-- Tạo indexes phù hợp
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_status_created ON orders(status, created_at);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Covering index (Index Only Scan)
CREATE INDEX idx_user_covering ON orders(user_id, status, total);
```

**c) VACUUM và ANALYZE:**

```sql
-- Regular maintenance
VACUUM ANALYZE users;

-- VACUUM FULL (LOCK table)
VACUUM FULL users;

-- Update statistics
ANALYZE users;
```

### **5. Monitoring**

**pg_stat_statements:**

```sql
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- Xem queries chậm nhất
SELECT
  query,
  calls,
  total_exec_time / 1000 as total_sec,
  mean_exec_time / 1000 as mean_sec,
  max_exec_time / 1000 as max_sec
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**pg_stat_activity:**

```sql
-- Xem connections hiện tại
SELECT
  pid,
  usename,
  application_name,
  state,
  query,
  query_start
FROM pg_stat_activity
WHERE state = 'active';
```

## X. Kết luận

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ với tính năng phong phú, performance tốt, và đảm bảo ACID cao. Để đạt được hiệu năng tối ưu, cần hiểu rõ và áp dụng đúng các kỹ thuật đã trình bày.

### **Tổng kết các điểm chính:**

1. ✅ **Normalization**: Cân bằng giữa normalization và performance
2. ✅ **Indexing**: B-Tree (default), GIN, GiST, BRIN - chọn đúng loại cho từng use case
3. ✅ **Query Optimization**: EXPLAIN, EXPLAIN ANALYZE, pg_stat_statements
4. ✅ **Connection Pooling**: pgBouncer, application-level pooling
5. ✅ **Partitioning**: Cho bảng lớn, tự động partition pruning
6. ✅ **Read Replicas**: Scale reads với streaming replication
7. ✅ **Caching**: Application-level caching (Redis, Memcached)
8. ✅ **MVCC**: Hiểu MVCC, VACUUM, autovacuum
9. ✅ **Monitoring**: pg_stat_statements, pg_stat_activity

### **Best Practices:**

- ✅ **Indexes**: Đúng loại, đúng columns, partial indexes khi cần
- ✅ **VACUUM**: Regular maintenance, monitor autovacuum
- ✅ **Connection Pooling**: Dùng pgBouncer hoặc application pooling
- ✅ **Query Analysis**: Dùng EXPLAIN ANALYZE và pg_stat_statements
- ✅ **Monitoring**: Monitor connections, slow queries, statistics

**"Measure, don't guess"** — Đo đạc performance trước khi tối ưu, và verify sau mỗi thay đổi.
