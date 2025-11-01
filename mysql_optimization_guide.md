# 🧠 Toàn tập MySQL: Kiến trúc, chuẩn hóa, tối ưu và chiến lược thực thi

## I. Chuẩn hóa dữ liệu (Normalization) - SQL

Chuẩn hóa dữ liệu giúp **tránh dư thừa**, **tăng tính toàn vẹn**, và **tối ưu truy vấn** trong MySQL. Có 5 cấp chính (1NF → 5NF):

### **1. 1NF (First Normal Form)**

- Mỗi ô (cell) chỉ chứa **một giá trị đơn** (atomic value).
- Không được phép lưu danh sách hoặc mảng trong một ô.
- ✅ Ví dụ đúng:  
  | id | name | phone |  
  |----|------|------------|  
  | 1 | An | 0909123456 |

  ❌ Ví dụ sai: `phone = "0909, 0910, 0911"`

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

## II. Index trong MySQL

### 1. **Các loại Index**

| Loại Index          | Mô tả                                    | Tác dụng chính                                     |
| ------------------- | ---------------------------------------- | -------------------------------------------------- |
| **PRIMARY KEY**     | Duy nhất, không null                     | Định danh bản ghi                                  |
| **UNIQUE INDEX**    | Không trùng giá trị                      | Tăng tốc tìm kiếm dữ liệu duy nhất                 |
| **INDEX (BTREE)**   | Cây nhị phân                             | Dùng cho điều kiện `WHERE`, `ORDER BY`             |
| **COMPOSITE INDEX** | Index trên nhiều cột (multi-column)      | Tối ưu truy vấn với nhiều điều kiện cùng lúc       |
| **FULLTEXT**        | Dành cho text lớn (MyISAM/InnoDB >= 5.6) | Tìm kiếm toàn văn (`MATCH AGAINST`)                |
| **SPATIAL**         | Chỉ cho dữ liệu hình học (geometry)      | GIS queries                                        |
| **HASH INDEX**      | Memory engine                            | So sánh chính xác (tốc độ cao, không hỗ trợ range) |

### 2. **Cách đánh index hiệu quả**

- Đặt index cho:
  - Các cột trong `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`.
  - Cột có tính **chọn lọc cao** (selectivity cao, ít trùng lặp).
- Hạn chế index:
  - Cột nhỏ, ít thay đổi.
  - Không nên đánh index trên cột **LOW CARDINALITY** (ví dụ: giới tính, trạng thái YES/NO).

#### **3. Composite Index (Index tổ hợp)**

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
-- ⚠️ MySQL có thể dùng "Index Full Scan" (quét toàn bộ index)
--    thay vì "Table Full Scan" (quét toàn bảng)
--    → Nhanh hơn quét bảng (index nhỏ hơn) nhưng vẫn chậm hơn index trực tiếp
--    → Phải quét toàn bộ index để tìm rows với created_at > '2024-01-01'

-- ✅ Với index (created_at, status) - COVERING INDEX:
SELECT status FROM users WHERE created_at > '2024-01-01';
-- ✅ Dùng được index để filter (created_at là cột đầu)
-- ✅ Lấy status trực tiếp từ index → Không cần đọc bảng (Covering Index)
-- ✅ MySQL chỉ cần đọc index, không cần "table lookup"
-- → Rất nhanh vì chỉ đọc index, kích thước index < bảng
-- → Đây là trường hợp tối ưu nhất!

-- 📌 Kết luận:
-- Với truy vấn WHERE created_at > ... và SELECT status:
-- - Index (status, created_at): ❌ Index Full Scan (chậm)
-- - Index (created_at, status): ✅ Index Range Scan + Covering Index (rất nhanh)
```

#### **4. Các loại Scan trong MySQL**

MySQL sử dụng nhiều chiến lược scan khác nhau tùy thuộc vào truy vấn và index. Hiểu rõ từng loại giúp tối ưu hiệu năng:

| Loại Scan             | Tốc độ     | Khi nào sử dụng                                            | Ví dụ                                                |
| --------------------- | ---------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| **Index Unique Scan** | ⚡⚡⚡⚡⚡ | Tìm chính xác 1 row (PRIMARY KEY, UNIQUE)                  | `WHERE id = 123`                                     |
| **Index Range Scan**  | ⚡⚡⚡⚡   | Điều kiện WHERE match leftmost prefix với range            | `WHERE created_at > '2024-01-01'`                    |
| **Index Full Scan**   | ⚡⚡⚡     | Quét toàn bộ index (không match leftmost prefix)           | `WHERE status = 'active'` với index `(name, status)` |
| **Table Full Scan**   | ⚡         | Quét toàn bảng (không có index hoặc index không dùng được) | `WHERE phone LIKE '%123%'`                           |
| **Index Skip Scan**   | ⚡⚡⚡     | MySQL 8.0.13+, bỏ qua cột đầu trong composite index        | `WHERE status = 'active'` với index `(name, status)` |
| **Index Merge Scan**  | ⚡⚡⚡     | Hợp nhất kết quả từ nhiều index                            | `WHERE a = 1 OR b = 2`                               |

**Chi tiết từng loại:**

**1. Index Unique Scan (Index Lookup)**

- **Tốc độ**: Rất nhanh ⚡⚡⚡⚡⚡ (O(log n))
- **Đặc điểm**:
  - Tìm chính xác 1 row duy nhất
  - Dùng cho PRIMARY KEY, UNIQUE INDEX
  - Chuyển trực tiếp đến row cần tìm (không scan)
- **Ví dụ:**
  ```sql
  SELECT * FROM users WHERE id = 123;
  -- Với PRIMARY KEY (id) → Index Unique Scan
  ```

**2. Index Range Scan**

- **Tốc độ**: Nhanh ⚡⚡⚡⚡ (O(log n) + số rows kết quả)
- **Đặc điểm**:
  - Dùng index để tìm phạm vi rows (range)
  - Match leftmost prefix của index
  - Hỗ trợ `>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'prefix%'`
  - Chỉ đọc phần index cần thiết, không quét toàn bộ
- **Ví dụ:**
  ```sql
  SELECT * FROM users WHERE created_at > '2024-01-01';
  -- Với index (created_at) → Index Range Scan
  -- MySQL chỉ đọc index từ '2024-01-01' trở đi, không quét toàn bộ
  ```

**3. Index Full Scan**

- **Tốc độ**: Trung bình ⚡⚡⚡ (O(n) - n là số rows trong index)
- **Đặc điểm**:
  - Quét **toàn bộ index** từ đầu đến cuối
  - Xảy ra khi **không match leftmost prefix** nhưng MySQL vẫn muốn dùng index
  - Thường xảy ra với Covering Index (SELECT chỉ có cột trong index)
  - **Nhanh hơn Table Full Scan** vì index nhỏ hơn bảng (chỉ chứa cột được index)
  - Nhưng **chậm hơn Index Range Scan** vì phải quét toàn bộ thay vì một phần
- **Ví dụ:**
  ```sql
  -- Với index (status, created_at)
  SELECT status FROM users WHERE created_at > '2024-01-01';
  -- ❌ Vi phạm leftmost prefix (WHERE không có status)
  -- → Index Full Scan: MySQL quét toàn bộ index để tìm rows có created_at > '2024-01-01'
  -- → Phải kiểm tra từng entry trong index
  ```

**4. Table Full Scan (Full Table Scan)**

- **Tốc độ**: Chậm nhất ⚡ (O(n) - n là số rows trong bảng)
- **Đặc điểm**:
  - Quét **toàn bộ bảng** từ đầu đến cuối
  - Xảy ra khi:
    - Không có index phù hợp
    - Index không dùng được (ví dụ: `LIKE '%suffix'`)
    - Query optimizer quyết định scan bảng nhanh hơn (với bảng nhỏ)
  - Phải đọc tất cả rows và so sánh điều kiện
- **Ví dụ:**
  ```sql
  SELECT * FROM users WHERE phone LIKE '%123%';
  -- ❌ LIKE với wildcard ở đầu → không dùng được index
  -- → Table Full Scan: Quét toàn bộ bảng users
  ```

**5. Index Skip Scan (MySQL 8.0.13+)**

- **Tốc độ**: Trung bình-khá ⚡⚡⚡ (O(k × log n), k là số giá trị distinct ở cột đầu)
- **Đặc điểm**:
  - **Tính năng mới** từ MySQL 8.0.13
  - Cho phép "bỏ qua" cột đầu trong composite index khi cột đó có ít giá trị distinct
  - MySQL tự động tạo "sub-range scan" cho mỗi giá trị distinct của cột đầu
  - Chỉ hiệu quả khi cột đầu có **cardinality thấp** (ít giá trị khác nhau)
- **Ví dụ:**
  ```sql
  -- Với index (status, created_at), status chỉ có 3 giá trị: 'active', 'inactive', 'pending'
  SELECT * FROM users WHERE created_at > '2024-01-01';
  -- ✅ MySQL 8.0.13+ có thể dùng Index Skip Scan:
  --    - Tự động scan cho từng giá trị status: 'active', 'inactive', 'pending'
  --    - Với mỗi status, tìm created_at > '2024-01-01'
  --    → Hiệu quả hơn Index Full Scan nhưng vẫn chậm hơn index đúng
  ```

**6. Index Merge Scan**

- **Tốc độ**: Trung bình ⚡⚡⚡ (phụ thuộc số index và kết quả)
- **Đặc điểm**:
  - Hợp nhất kết quả từ **nhiều index** (thường 2-3 index)
  - Xảy ra với điều kiện `OR` hoặc một số trường hợp đặc biệt
  - MySQL quét từng index riêng rồi hợp nhất kết quả
  - Có thể chậm nếu kết quả từ mỗi index lớn
- **Ví dụ:**
  ```sql
  -- Có index (first_name) và index (last_name)
  SELECT * FROM users WHERE first_name = 'John' OR last_name = 'Smith';
  -- → Index Merge: Quét index (first_name) → tìm 'John'
  --    Quét index (last_name) → tìm 'Smith'
  --    Hợp nhất 2 kết quả (loại bỏ duplicate)
  ```

**So sánh hiệu năng (giả sử bảng có 1M rows):**

```
Index Unique Scan:    ~0.001ms  (tìm 1 row)
Index Range Scan:     ~1-10ms   (tìm 100-1000 rows)
Index Full Scan:      ~50-200ms (quét toàn bộ index)
Table Full Scan:      ~200-500ms (quét toàn bộ bảng)
Index Skip Scan:      ~10-50ms  (tùy cardinality)
Index Merge Scan:     ~20-100ms (tùy số index và kết quả)
```

**Nguyên tắc:**

- ✅ **Index Range Scan** > **Index Full Scan** > **Table Full Scan**
- ✅ **Covering Index** (chỉ đọc index, không đọc bảng) luôn nhanh hơn
- ✅ **Index Skip Scan** là "cứu cánh" nhưng không nên dựa vào, nên thiết kế index đúng

**Nguyên tắc sắp xếp cột trong Composite Index:**

1. **Cột có selectivity cao** (ít trùng lặp) đặt trước.
2. **Cột dùng trong `WHERE`** đặt trước cột dùng trong `ORDER BY`.
3. **Cột có kích thước nhỏ** đặt trước (giảm kích thước index).

#### **5. Cách xác định thứ tự cột trong Composite Index**

Khi có 2 cột cần tạo composite index, làm theo các bước sau:

**Bước 1: Kiểm tra Selectivity (Độ chọn lọc)**

Selectivity = Số giá trị distinct / Tổng số rows

```sql
-- Tính selectivity của từng cột
SELECT
  COUNT(DISTINCT status) / COUNT(*) as status_selectivity,
  COUNT(DISTINCT created_at) / COUNT(*) as created_at_selectivity,
  COUNT(*) as total_rows
FROM users;

-- Ví dụ kết quả:
-- status_selectivity: 0.003 (3 giá trị distinct / 1000 rows = 0.3%)
-- created_at_selectivity: 0.85 (850 giá trị distinct / 1000 rows = 85%)
-- → created_at có selectivity cao hơn → đặt trước
```

**Bước 2: Phân tích Query Patterns**

Xem truy vấn nào thường được dùng nhất:

```sql
-- Trường hợp 1: Thường query theo status
SELECT * FROM users WHERE status = 'active' AND created_at > '2024-01-01';
-- → Nên tạo: (status, created_at)

-- Trường hợp 2: Thường query theo created_at
SELECT * FROM users WHERE created_at > '2024-01-01' AND status = 'active';
-- → Nên tạo: (created_at, status)

-- Trường hợp 3: Cả 2 đều được query riêng lẻ
SELECT * FROM users WHERE status = 'active';
SELECT * FROM users WHERE created_at > '2024-01-01';
-- → Nên tạo 2 index riêng:
--   INDEX (status)
--   INDEX (created_at)
```

**Bước 3: Công thức quyết định**

```sql
-- Ưu tiên theo thứ tự:
-- 1. Cột xuất hiện ở WHERE (không có ở ORDER BY) → đặt trước
-- 2. Cột có selectivity cao hơn → đặt trước
-- 3. Cột có kích thước nhỏ hơn → đặt trước
-- 4. Cột được query thường xuyên hơn → đặt trước

-- Ví dụ:
-- Column A: selectivity = 0.8, size = 4 bytes, query 80% thời gian
-- Column B: selectivity = 0.2, size = 8 bytes, query 20% thời gian
-- → Nên tạo: (A, B) vì A có selectivity cao hơn và được query nhiều hơn
```

**Bước 4: Test với EXPLAIN**

Tạo cả 2 index và test với EXPLAIN để so sánh:

```sql
-- Tạo 2 index tạm thời (hoặc test trên staging)
CREATE INDEX idx_test1 ON users(status, created_at);
CREATE INDEX idx_test2 ON users(created_at, status);

-- Test query 1: WHERE status = ... AND created_at > ...
EXPLAIN SELECT * FROM users
WHERE status = 'active' AND created_at > '2024-01-01';
-- Xem "key", "rows", "Extra"
-- Nếu idx_test1: rows ít hơn → tốt hơn
-- Nếu idx_test2: rows nhiều hơn → kém hơn

-- Test query 2: WHERE created_at > ... AND status = ...
EXPLAIN SELECT * FROM users
WHERE created_at > '2024-01-01' AND status = 'active';
-- Tương tự, so sánh kết quả

-- Sau khi test, xóa index không cần thiết
DROP INDEX idx_test1 ON users;
DROP INDEX idx_test2 ON users;
```

**Bước 5: Quy tắc thực tế (Rule of Thumb)**

| Tình huống                                                    | Thứ tự ưu tiên                |
| ------------------------------------------------------------- | ----------------------------- |
| Cột A xuất hiện ở WHERE, cột B ở ORDER BY                     | `(A, B)`                      |
| Cả 2 ở WHERE, A có selectivity cao hơn 2x                     | `(A, B)`                      |
| Cả 2 ở WHERE, selectivity tương đương, A được query nhiều hơn | `(A, B)`                      |
| Cột A = equality (=), cột B = range (>, <)                    | `(A, B)` - equality đặt trước |
| Cả 2 đều range hoặc cả 2 đều equality                         | Ưu tiên selectivity cao hơn   |
| Một cột được query đơn lẻ thường xuyên                        | Tạo index riêng cho cột đó    |

**Ví dụ thực tế:**

```sql
-- Bảng orders có: user_id, status, created_at
-- user_id: selectivity = 0.95, thường query với =
-- status: selectivity = 0.003, thường query với =
-- created_at: selectivity = 0.9, thường query với >

-- Truy vấn phổ biến:
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;

-- Phân tích:
-- 1. user_id có selectivity cao nhất (0.95) → đặt đầu
-- 2. status và created_at: status dùng equality, created_at dùng range
--    → status đặt trước created_at (equality trước range)
-- → Kết quả: INDEX (user_id, status, created_at)
```

**Công cụ hỗ trợ:**

```sql
-- Xem index đang dùng trong thực tế
SELECT
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
  AND TABLE_NAME = 'users'
GROUP BY TABLE_NAME, INDEX_NAME;

-- Xem cardinality (số giá trị distinct) của từng cột
SHOW INDEX FROM users;
-- Cột "Cardinality" cao → selectivity cao → nên đặt trước
```

**Ví dụ tối ưu:**

```sql
-- Giả sử: user_id (selectivity cao, nhỏ), status (selectivity thấp), created_at (dùng ORDER BY)
CREATE INDEX idx_optimized ON orders(user_id, status, created_at);

-- Truy vấn này sẽ rất nhanh
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;
```

## III. Chiến lược thực thi (Execution Strategy)

MySQL tối ưu truy vấn thông qua **Query Optimizer**, một bộ phận thông minh tự động chọn chiến lược thực thi tốt nhất dựa trên:

- Cấu trúc index hiện có
- Thống kê về dữ liệu (cardinality, distribution)
- Kích thước bảng
- Điều kiện truy vấn

### **1. EXPLAIN - Công cụ phân tích execution plan**

**Cú pháp:**

```sql
EXPLAIN SELECT ...;
EXPLAIN FORMAT=JSON SELECT ...;  -- Output chi tiết dạng JSON
EXPLAIN FORMAT=TREE SELECT ...;   -- MySQL 8.0+ (hierarchical tree)
```

**Các cột quan trọng trong EXPLAIN:**

| Cột               | Ý nghĩa                          | Giá trị quan trọng                        |
| ----------------- | -------------------------------- | ----------------------------------------- |
| **id**            | Thứ tự thực thi (join order)     | Số nhỏ hơn = thực thi trước               |
| **select_type**   | Loại SELECT                      | SIMPLE, PRIMARY, SUBQUERY, DERIVED, UNION |
| **table**         | Bảng được truy vấn               | Tên bảng hoặc alias                       |
| **type**          | Kiểu truy cập (quan trọng nhất!) | const, eq_ref, ref, range, index, ALL     |
| **possible_keys** | Index có thể dùng                | Danh sách index MySQL đang cân nhắc       |
| **key**           | Index thực sự được dùng          | Index được chọn                           |
| **key_len**       | Độ dài index được dùng           | Càng nhỏ càng tốt (chỉ dùng phần cần)     |
| **ref**           | Cột so sánh với index            | const, column, func                       |
| **rows**          | Số rows ước tính phải đọc        | Càng nhỏ càng tốt                         |
| **Extra**         | Thông tin bổ sung                | Using index, Using where, Using filesort  |

**Ví dụ phân tích EXPLAIN:**

```sql
EXPLAIN SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';

-- Kết quả:
-- id | select_type | table | type  | key      | rows | Extra
-- 1  | SIMPLE      | u     | ref   | idx_status | 500 | Using where
-- 1  | SIMPLE      | o     | ref   | fk_user_id | 10  | Using index
-- → type=ref: tốt, dùng index
-- → rows=500 và rows=10: hợp lý
```

**Đánh giá hiệu năng dựa trên `type` (từ tốt đến xấu):**

1. **`const`** ⚡⚡⚡⚡⚡ - Tốt nhất: truy cập qua PRIMARY KEY hoặc UNIQUE, chỉ 1 row
2. **`eq_ref`** ⚡⚡⚡⚡⚡ - Rất tốt: JOIN với PRIMARY KEY hoặc UNIQUE
3. **`ref`** ⚡⚡⚡⚡ - Tốt: truy cập qua index không unique
4. **`range`** ⚡⚡⚡⚡ - Khá tốt: Index Range Scan
5. **`index`** ⚡⚡⚡ - Trung bình: Index Full Scan
6. **`ALL`** ⚡ - Chậm nhất: Full Table Scan

### **2. Các chiến lược thực thi chi tiết**

#### **2.1. Full Table Scan (ALL)**

**Khi nào xảy ra:**

- Không có index phù hợp
- Bảng quá nhỏ (< 10 rows), optimizer quyết định scan nhanh hơn
- Index không hiệu quả (selectivity quá thấp)

**Cách nhận biết:**

```sql
EXPLAIN SELECT * FROM users WHERE phone LIKE '%123%';
-- type: ALL
-- key: NULL
-- rows: 100000 (toàn bộ bảng)
```

**Giải pháp:**

- Tạo index phù hợp
- Tránh `LIKE '%suffix'` (không dùng được index)
- Sử dụng FULLTEXT index cho tìm kiếm text

#### **2.2. Index Range Scan (range)**

**Khi nào xảy ra:**

- WHERE với điều kiện range: `>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'prefix%'`
- Match leftmost prefix của index

**Cách nhận biết:**

```sql
EXPLAIN SELECT * FROM users WHERE created_at > '2024-01-01';
-- type: range
-- key: idx_created_at
-- rows: 5000 (chỉ phần cần thiết)
```

**Đặc điểm:**

- Chỉ đọc phần index cần thiết, không quét toàn bộ
- Hiệu quả cao khi selectivity tốt
- Hỗ trợ ORDER BY cùng index

#### **2.3. Ref / Eq_ref Scan (ref, eq_ref)**

**Ref Scan (`ref`):**

- Truy cập qua index không unique
- Dùng cho `WHERE column = value` hoặc JOIN với foreign key
- Có thể trả về nhiều rows

**Eq_ref Scan (`eq_ref`):**

- Truy cập qua PRIMARY KEY hoặc UNIQUE trong JOIN
- Chỉ trả về đúng 1 row
- Tốt nhất cho JOIN

**Ví dụ:**

```sql
-- Ref Scan
EXPLAIN SELECT * FROM users WHERE status = 'active';
-- type: ref
-- key: idx_status
-- rows: 10000

-- Eq_ref Scan (trong JOIN)
EXPLAIN SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;
-- users: type=ALL (scan)
-- orders: type=eq_ref (dùng PRIMARY KEY u.id)
-- key: PRIMARY
-- rows: 1 (chỉ 1 order per user trong JOIN)
```

#### **2.4. Index Merge**

**Khi nào xảy ra:**

- Điều kiện `OR` trên nhiều index khác nhau
- MySQL quét từng index riêng rồi hợp nhất kết quả

**Cách nhận biết:**

```sql
EXPLAIN SELECT * FROM users
WHERE first_name = 'John' OR last_name = 'Smith';
-- type: index_merge
-- key: idx_first_name, idx_last_name
-- Extra: Using union(idx_first_name,idx_last_name)
```

**Các loại Index Merge:**

- **Union**: Hợp nhất kết quả từ nhiều index (OR)
- **Intersection**: Giao kết quả từ nhiều index (AND)
- **Sort Union**: Union với sắp xếp

**Lưu ý:**

- Có thể chậm nếu kết quả từ mỗi index lớn
- Nên tránh, tốt hơn là tạo composite index phù hợp

#### **2.5. Loose Index Scan (index)**

**Khi nào xảy ra:**

- GROUP BY hoặc DISTINCT với index
- MySQL chỉ đọc phần index cần thiết cho nhóm

**Ví dụ:**

```sql
-- Có index (status, created_at)
EXPLAIN SELECT status, COUNT(*)
FROM users
GROUP BY status;
-- type: index
-- key: idx_status_created_at
-- Extra: Using index for group-by
```

**Đặc điểm:**

- Chỉ đọc một phần index (không quét toàn bộ)
- Hiệu quả cho GROUP BY với index phù hợp

#### **2.6. Tight Index Scan**

**Khi nào xảy ra:**

- Tương tự Loose Index Scan nhưng cần đọc nhiều phần index hơn
- GROUP BY không match hoàn toàn với index

### **3. JOIN Strategies (Chiến lược JOIN)**

MySQL có nhiều thuật toán JOIN:

| Thuật toán            | Mô tả                                            | Khi nào dùng                            |
| --------------------- | ------------------------------------------------ | --------------------------------------- |
| **Nested Loop Join**  | Lặp qua từng row bên ngoài, tìm match bên trong  | Default, hiệu quả cho bảng nhỏ          |
| **Block Nested Loop** | Cache rows bên ngoài vào buffer, giảm số lần đọc | Khi không có index trên join key        |
| **Hash Join**         | Tạo hash table từ một bên, probe từ bên kia      | MySQL 8.0.18+, bảng lớn, không có index |
| **Index Join**        | Dùng index để tìm match nhanh                    | Có index trên join key (khuyến nghị)    |

**Ví dụ phân tích JOIN:**

```sql
EXPLAIN SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';

-- Nếu có index trên o.user_id:
-- users: type=ref, key=idx_status, rows=500
-- orders: type=ref, key=fk_user_id, rows=10
-- → Hiệu quả: 500 × 10 = 5000 operations (tốt)

-- Nếu KHÔNG có index trên o.user_id:
-- users: type=ref, key=idx_status, rows=500
-- orders: type=ALL, rows=100000
-- → Hiệu quả: 500 × 100000 = 50M operations (rất chậm!)
```

### **4. Query Optimizer Hints**

MySQL cho phép can thiệp vào optimizer bằng hints:

```sql
-- Force index
SELECT * FROM users USE INDEX (idx_status) WHERE status = 'active';

-- Ignore index
SELECT * FROM users IGNORE INDEX (idx_status) WHERE status = 'active';

-- Force index cho JOIN
SELECT * FROM users u
JOIN orders o FORCE INDEX (fk_user_id) ON u.id = o.user_id;

-- Optimizer hints (MySQL 8.0+)
SELECT /*+ MAX_EXECUTION_TIME(1000) */ * FROM users;
SELECT /*+ JOIN_ORDER(t1, t2) */ * FROM t1 JOIN t2;
```

**Lưu ý:**

- Chỉ dùng hints khi thực sự cần thiết
- Optimizer thường tự quyết định tốt hơn
- Test kỹ trước khi dùng trong production

### **5. Phân tích hiệu năng với EXPLAIN ANALYZE (MySQL 8.0.18+)**

**EXPLAIN ANALYZE** thực thi query và trả về thời gian thực tế:

```sql
EXPLAIN ANALYZE SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- Output:
-- -> Nested loop inner join  (cost=... rows=...) (actual time=0.123..0.456 rows=10 loops=1)
--     -> Index lookup on u using idx_status (actual time=0.045..0.123 rows=500 loops=1)
--     -> Index lookup on o using fk_user_id (actual time=0.001..0.002 rows=10 loops=500)
```

**Giải thích:**

- `cost`: Chi phí ước tính
- `actual time`: Thời gian thực tế (min..max milliseconds)
- `rows`: Số rows thực tế
- `loops`: Số lần lặp

### **6. Best Practices**

**Để tối ưu execution plan:**

1. ✅ Luôn có index trên **join keys** và **WHERE columns**
2. ✅ Thiết kế composite index theo **leftmost prefix rule**
3. ✅ Cập nhật thống kê: `ANALYZE TABLE table_name;`
4. ✅ Tránh `SELECT *` - chỉ SELECT cột cần thiết
5. ✅ Sử dụng **Covering Index** khi có thể
6. ✅ Monitor `EXPLAIN` cho các query chậm
7. ✅ Tránh functions trong WHERE: `WHERE YEAR(created_at) = 2024` → `WHERE created_at >= '2024-01-01'`

**Các chiến lược chính (tóm tắt):**

| Chiến lược            | Mô tả                                              | Hiệu năng  |
| --------------------- | -------------------------------------------------- | ---------- |
| **Full Table Scan**   | Duyệt toàn bảng (rất chậm)                         | ⚡         |
| **Index Range Scan**  | Quét 1 phần index phù hợp (rất nhanh)              | ⚡⚡⚡⚡   |
| **Ref / Eq_ref Scan** | Truy cập theo khóa ngoại hoặc giá trị duy nhất     | ⚡⚡⚡⚡⚡ |
| **Index Merge**       | Gộp kết quả từ nhiều index                         | ⚡⚡⚡     |
| **Loose Index Scan**  | Duyệt nhóm index (sử dụng khi `GROUP BY` có index) | ⚡⚡⚡⚡   |

## IV. Cấu trúc truy vấn: WHERE, JOIN, GROUP, ORDER

### **1. WHERE - Bộ lọc điều kiện**

WHERE là phần quan trọng nhất trong truy vấn, quyết định hiệu năng. MySQL xử lý WHERE theo thứ tự từ trái sang phải nhưng optimizer có thể thay đổi thứ tự để tối ưu.

#### **1.1. Nguyên tắc tối ưu WHERE**

**✅ Nên làm:**

- Đặt điều kiện có selectivity cao trước
- Sử dụng index cho các điều kiện WHERE
- Dùng `=` (equality) trước `>` hoặc `<` (range) khi có thể
- Kết hợp nhiều điều kiện với `AND` (optimizer tự động tối ưu)

**❌ Tránh:**

- Functions trong WHERE: `WHERE YEAR(created_at) = 2024` → `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`
- `LIKE '%suffix'` (wildcard ở đầu) → `LIKE 'prefix%'` (wildcard ở cuối)
- `WHERE column IS NULL` (không dùng index được, trừ khi có index riêng)
- So sánh kiểu khác nhau: `WHERE string_column = 123` → ép kiểu chậm

**Ví dụ:**

```sql
-- ❌ Chậm: Function trong WHERE
SELECT * FROM users WHERE YEAR(created_at) = 2024;
-- → MySQL phải tính YEAR() cho mọi row

-- ✅ Nhanh: Range query
SELECT * FROM users
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- → Dùng index created_at

-- ❌ Chậm: LIKE với wildcard ở đầu
SELECT * FROM users WHERE phone LIKE '%123';
-- → Full table scan

-- ✅ Nhanh: LIKE với prefix
SELECT * FROM users WHERE phone LIKE '123%';
-- → Index range scan (nếu có index trên phone)
```

#### **1.2. Các toán tử trong WHERE**

| Toán tử           | Hỗ trợ Index       | Hiệu năng  | Ví dụ                                   |
| ----------------- | ------------------ | ---------- | --------------------------------------- |
| `=`               | ✅ Tốt             | ⚡⚡⚡⚡⚡ | `WHERE id = 123`                        |
| `IN (...)`        | ✅ Tốt             | ⚡⚡⚡⚡⚡ | `WHERE status IN ('active', 'pending')` |
| `>` `<` `>=` `<=` | ✅ Tốt (range)     | ⚡⚡⚡⚡   | `WHERE created_at > '2024-01-01'`       |
| `BETWEEN`         | ✅ Tốt             | ⚡⚡⚡⚡   | `WHERE age BETWEEN 18 AND 65`           |
| `LIKE 'prefix%'`  | ✅ Tốt             | ⚡⚡⚡⚡   | `WHERE name LIKE 'John%'`               |
| `LIKE '%suffix'`  | ❌ Không           | ⚡         | `WHERE name LIKE '%Smith'`              |
| `LIKE '%both%'`   | ❌ Không           | ⚡         | `WHERE name LIKE '%John%'`              |
| `!=` `<>`         | ⚠️ Hạn chế         | ⚡⚡       | `WHERE status != 'deleted'`             |
| `IS NULL`         | ⚠️ Cần index riêng | ⚡⚡       | `WHERE deleted_at IS NULL`              |

**Lưu ý đặc biệt:**

```sql
-- NULL handling
SELECT * FROM users WHERE email IS NULL;
-- → Không dùng index thông thường
-- ✅ Giải pháp: Tạo filtered index hoặc dùng giá trị mặc định thay NULL

-- NOT IN vs NOT EXISTS
SELECT * FROM users WHERE id NOT IN (1, 2, 3);
-- ❌ Chậm nếu danh sách lớn

SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM excluded_ids e WHERE e.id = u.id
);
-- ✅ Nhanh hơn với subquery tối ưu
```

#### **1.3. Tối ưu điều kiện phức tạp**

```sql
-- Nhiều điều kiện AND
SELECT * FROM users
WHERE status = 'active'
  AND created_at > '2024-01-01'
  AND age >= 18;
-- → Optimizer tự động chọn điều kiện tốt nhất trước

-- Nhiều điều kiện OR (cẩn thận!)
SELECT * FROM users
WHERE status = 'active' OR age > 65;
-- ⚠️ Có thể dẫn đến Index Merge (chậm)
-- ✅ Tốt hơn: Tách thành 2 query riêng hoặc dùng UNION
SELECT * FROM users WHERE status = 'active'
UNION
SELECT * FROM users WHERE age > 65;
```

### **2. JOIN - Kết hợp dữ liệu từ nhiều bảng**

JOIN là một trong những phần phức tạp nhất và có thể ảnh hưởng lớn đến hiệu năng.

#### **2.1. Các loại JOIN**

| Loại JOIN           | Mô tả                                          | Số rows kết quả     | Khi nào dùng                               |
| ------------------- | ---------------------------------------------- | ------------------- | ------------------------------------------ |
| **INNER JOIN**      | Chỉ lấy phần giao (có match)                   | ≤ min(rows1, rows2) | Khi cần dữ liệu từ cả 2 bảng và có quan hệ |
| **LEFT JOIN**       | Giữ tất cả rows bên trái, NULL nếu không match | = rows1             | Khi cần giữ tất cả rows bên trái           |
| **RIGHT JOIN**      | Giữ tất cả rows bên phải, NULL nếu không match | = rows2             | Ít dùng, thay bằng LEFT JOIN               |
| **CROSS JOIN**      | Kết hợp mọi cặp (Cartesian product)            | = rows1 × rows2     | Rất hiếm, tránh nếu không cần              |
| **FULL OUTER JOIN** | Giữ tất cả rows từ cả 2 bảng                   | ≥ max(rows1, rows2) | MySQL không hỗ trợ, dùng UNION             |

**Ví dụ:**

```sql
-- INNER JOIN: Chỉ lấy users có orders
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- → Chỉ trả về users đã đặt hàng

-- LEFT JOIN: Tất cả users, NULL nếu chưa đặt hàng
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- → Trả về tất cả users, o.total = NULL nếu chưa đặt hàng

-- RIGHT JOIN (tránh dùng)
SELECT u.name, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
-- ✅ Tốt hơn: Đổi thứ tự và dùng LEFT JOIN
SELECT u.name, o.total
FROM orders o
LEFT JOIN users u ON o.user_id = u.id;
```

#### **2.2. Tối ưu JOIN**

**Quy tắc vàng:**

1. ✅ **Luôn có index trên join keys** (foreign keys)
2. ✅ **Bảng nhỏ hơn đặt bên trái** (outer table) khi có thể
3. ✅ **WHERE trước JOIN** để giảm số rows trước khi join
4. ✅ **Tránh JOIN không cần thiết** - chỉ JOIN khi thực sự cần dữ liệu từ bảng kia

**Ví dụ tối ưu:**

```sql
-- ❌ Chậm: Không có index trên join key
EXPLAIN SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;
-- → orders: type=ALL (full scan)

-- ✅ Nhanh: Có index trên o.user_id
CREATE INDEX idx_user_id ON orders(user_id);
EXPLAIN SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;
-- → orders: type=ref, key=idx_user_id

-- ❌ Chậm: JOIN trước WHERE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';

-- ✅ Nhanh: WHERE trước JOIN (filter sớm)
SELECT u.name, o.total
FROM (SELECT * FROM users WHERE status = 'active') u
JOIN orders o ON u.id = o.user_id;
-- Hoặc:
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';
-- (Optimizer tự động tối ưu, nhưng rõ ràng hơn)
```

#### **2.3. Multiple JOINs**

```sql
-- Nhiều JOINs - thứ tự quan trọng
SELECT u.name, o.total, p.name as product_name
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
WHERE u.status = 'active';

-- Optimizer sẽ tự động chọn thứ tự tối ưu
-- Nhưng có thể force bằng STRAIGHT_JOIN:
SELECT u.name, o.total, p.name
FROM users u
STRAIGHT_JOIN orders o ON u.id = o.user_id
STRAIGHT_JOIN products p ON o.product_id = p.id;
-- → Thực thi theo thứ tự viết (không khuyến nghị)
```

#### **2.4. JOIN vs Subquery**

```sql
-- JOIN (thường nhanh hơn)
SELECT u.name
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.total > 1000;

-- Subquery tương đương (có thể chậm hơn)
SELECT name
FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);

-- ✅ JOIN thường được ưu tiên vì:
-- - Optimizer có thể tối ưu tốt hơn
-- - Có thể dùng index hiệu quả hơn
-- - Dễ đọc và maintain hơn
```

### **3. GROUP BY - Gom nhóm dữ liệu**

GROUP BY gom các rows có cùng giá trị ở các cột chỉ định.

#### **3.1. Cách GROUP BY hoạt động**

```sql
-- Đếm số orders theo status
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status;

-- Kết quả:
-- status  | count
-- pending | 150
-- completed | 800
-- cancelled | 50

-- GROUP BY nhiều cột
SELECT status, payment_method, COUNT(*) as count
FROM orders
GROUP BY status, payment_method;
-- → Gom theo cả status và payment_method
```

#### **3.2. Tối ưu GROUP BY**

**✅ Nên làm:**

- Có index trên cột GROUP BY
- Dùng WHERE trước GROUP BY để giảm rows
- Chỉ SELECT các cột trong GROUP BY hoặc aggregate functions

**❌ Tránh:**

- GROUP BY không có index (phải sort trong memory/disk)
- GROUP BY nhiều cột phức tạp
- SELECT cột không trong GROUP BY (mode ONLY_FULL_GROUP_BY)

**Ví dụ:**

```sql
-- ❌ Chậm: GROUP BY không có index
SELECT status, COUNT(*)
FROM orders
GROUP BY status;
-- → type=ALL, Extra=Using temporary; Using filesort

-- ✅ Nhanh: Có index trên status
CREATE INDEX idx_status ON orders(status);
SELECT status, COUNT(*)
FROM orders
GROUP BY status;
-- → type=index, Extra=Using index for group-by

-- ✅ Rất nhanh: Covering index
CREATE INDEX idx_status_created_at ON orders(status, created_at);
SELECT status, COUNT(*), MIN(created_at), MAX(created_at)
FROM orders
GROUP BY status;
-- → type=index, Extra=Using index for group-by
-- → Chỉ đọc index, không đọc bảng!
```

#### **3.3. Aggregate Functions với GROUP BY**

| Function         | Mô tả               | Ví dụ                              |
| ---------------- | ------------------- | ---------------------------------- |
| `COUNT(*)`       | Đếm tổng số rows    | `COUNT(*) as total`                |
| `COUNT(column)`  | Đếm non-NULL values | `COUNT(email) as users_with_email` |
| `SUM(column)`    | Tổng giá trị        | `SUM(total) as revenue`            |
| `AVG(column)`    | Trung bình          | `AVG(age) as avg_age`              |
| `MIN(column)`    | Giá trị nhỏ nhất    | `MIN(created_at) as first_order`   |
| `MAX(column)`    | Giá trị lớn nhất    | `MAX(created_at) as last_order`    |
| `GROUP_CONCAT()` | Nối chuỗi           | `GROUP_CONCAT(name) as names`      |

**Ví dụ phức tạp:**

```sql
-- Thống kê chi tiết
SELECT
  status,
  COUNT(*) as order_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
WHERE created_at >= '2024-01-01'
GROUP BY status
HAVING COUNT(*) > 100  -- Lọc sau GROUP BY
ORDER BY total_revenue DESC;
```

#### **3.4. HAVING vs WHERE**

```sql
-- WHERE: Lọc TRƯỚC GROUP BY
SELECT status, COUNT(*)
FROM orders
WHERE total > 100  -- Lọc rows trước khi group
GROUP BY status;

-- HAVING: Lọc SAU GROUP BY
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
HAVING COUNT(*) > 100;  -- Lọc groups sau khi đếm

-- ✅ Luôn dùng WHERE khi có thể (nhanh hơn)
-- HAVING chỉ dùng khi cần filter trên aggregate
```

### **4. ORDER BY - Sắp xếp kết quả**

ORDER BY sắp xếp kết quả theo cột chỉ định, có thể rất tốn kém nếu không có index.

#### **4.1. Cách ORDER BY hoạt động**

```sql
-- Sắp xếp đơn giản
SELECT * FROM users ORDER BY created_at DESC;

-- Sắp xếp nhiều cột
SELECT * FROM users
ORDER BY status ASC, created_at DESC;
-- → Sắp xếp theo status trước, sau đó theo created_at
```

#### **4.2. Tối ưu ORDER BY**

**✅ Nên làm:**

- Có index trên cột ORDER BY
- Kết hợp với WHERE cùng index (composite index)
- ORDER BY cùng chiều với index (ASC/DESC)

**❌ Tránh:**

- ORDER BY không có index (phải sort trong memory hoặc disk)
- ORDER BY cột tính toán: `ORDER BY YEAR(created_at)`
- ORDER BY RAND() (rất chậm với bảng lớn)

**Ví dụ:**

```sql
-- ❌ Chậm: ORDER BY không có index
SELECT * FROM users ORDER BY name;
-- → type=ALL, Extra=Using filesort
-- → Phải sort toàn bộ rows trong memory/disk

-- ✅ Nhanh: Có index trên name
CREATE INDEX idx_name ON users(name);
SELECT * FROM users ORDER BY name;
-- → type=index, Extra=Using index
-- → Đọc index đã được sắp xếp sẵn

-- ✅ Rất nhanh: WHERE + ORDER BY cùng index
CREATE INDEX idx_status_created_at ON users(status, created_at);
SELECT * FROM users
WHERE status = 'active'
ORDER BY created_at DESC;
-- → type=ref, key=idx_status_created_at, Extra=Using index
-- → Không cần sort!
```

#### **4.3. ORDER BY với LIMIT**

```sql
-- Lấy 10 users mới nhất
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Nếu có index trên created_at:
-- → Chỉ cần đọc 10 rows đầu tiên từ index
-- → Rất nhanh, không cần sort toàn bộ

-- ❌ Không có index:
-- → Phải sort toàn bộ bảng trước, rồi lấy 10 rows đầu
-- → Rất chậm với bảng lớn
```

#### **4.4. Thứ tự chiều sắp xếp (ASC/DESC)**

```sql
-- Index: (status, created_at ASC)
SELECT * FROM users
WHERE status = 'active'
ORDER BY created_at ASC;  -- ✅ Match index

-- Index: (status, created_at ASC)
SELECT * FROM users
WHERE status = 'active'
ORDER BY created_at DESC;  -- ⚠️ Không match hoàn toàn
-- → Có thể cần reverse index hoặc sort

-- ✅ Giải pháp: Tạo index với DESC
CREATE INDEX idx_status_created_at_desc
ON users(status, created_at DESC);
```

### **5. Kết hợp WHERE, JOIN, GROUP BY, ORDER BY**

**Thứ tự thực thi (logical):**

1. FROM (và JOIN)
2. WHERE
3. GROUP BY
4. HAVING
5. SELECT
6. ORDER BY
7. LIMIT

**Ví dụ tối ưu hoàn chỉnh:**

```sql
-- Query phức tạp nhưng tối ưu
SELECT
  u.status,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.total) as total_revenue
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
  AND o.status = 'completed'
GROUP BY u.status
HAVING COUNT(DISTINCT o.id) > 10
ORDER BY total_revenue DESC
LIMIT 10;

-- Index khuyến nghị:
-- users: (created_at, status)
-- orders: (user_id, status, total)
-- → Tối ưu cho cả WHERE, JOIN, GROUP BY, ORDER BY
```

**Best Practices tổng hợp:**

1. ✅ **Index strategy:**

   - WHERE columns → Index
   - JOIN keys → Index
   - GROUP BY columns → Index
   - ORDER BY columns → Index
   - Composite index khi có nhiều điều kiện cùng lúc

2. ✅ **Thứ tự tối ưu:**

   - WHERE sớm nhất có thể (giảm rows)
   - JOIN bảng nhỏ trước (nếu có thể control)
   - GROUP BY sau WHERE (giảm rows cần group)
   - ORDER BY cuối (chỉ sort kết quả cuối)

3. ✅ **Avoid:**
   - Functions trong WHERE/ORDER BY
   - LIKE với wildcard ở đầu
   - JOIN không cần thiết
   - ORDER BY RAND() với bảng lớn

## V. Subquery (Truy vấn lồng)

Subquery (hay Nested Query) là truy vấn con nằm bên trong một truy vấn chính. Subquery có thể xuất hiện ở nhiều vị trí và có nhiều dạng khác nhau, mỗi dạng có đặc điểm và hiệu năng riêng.

### **1. Các loại Subquery**

#### **1.1. Phân loại theo vị trí**

**a) Scalar Subquery (Trả về 1 giá trị):**

```sql
-- Trong SELECT
SELECT
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
FROM users;

-- Trong WHERE
SELECT * FROM users
WHERE age > (SELECT AVG(age) FROM users);

-- Trong HAVING
SELECT dept_id, COUNT(*) as emp_count
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > (SELECT AVG(emp_count) FROM (
  SELECT dept_id, COUNT(*) as emp_count FROM employees GROUP BY dept_id
) sub);
```

**b) Row Subquery (Trả về 1 row, nhiều cột):**

```sql
SELECT * FROM users
WHERE (status, created_at) = (
  SELECT status, MAX(created_at)
  FROM users
  WHERE status = 'active'
);
```

**c) Table Subquery (Trả về nhiều rows):**

```sql
-- Trong FROM (Derived Table)
SELECT u.name, sub.total
FROM users u
JOIN (
  SELECT user_id, SUM(total) as total
  FROM orders
  GROUP BY user_id
) sub ON u.id = sub.user_id;

-- Trong WHERE với IN/EXISTS
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);
```

#### **1.2. Phân loại theo dependency**

**a) Uncorrelated Subquery (Độc lập):**

- Subquery có thể chạy độc lập, không phụ thuộc vào outer query
- Thường nhanh hơn vì có thể cache kết quả

```sql
-- Subquery chạy 1 lần, không phụ thuộc vào từng row của users
SELECT * FROM users
WHERE dept_id IN (
  SELECT id FROM departments WHERE status = 'active'
);
```

**b) Correlated Subquery (Phụ thuộc):**

- Subquery phụ thuộc vào outer query, chạy lại cho mỗi row
- Thường chậm hơn, cần tối ưu cẩn thận

```sql
-- Subquery chạy lại cho MỖI row của users
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.total > 1000
);
-- → Subquery phụ thuộc vào u.id (correlated)
```

### **2. Subquery trong các mệnh đề khác nhau**

#### **2.1. Subquery trong WHERE**

**a) Với IN:**

```sql
-- Tìm users đã đặt hàng
SELECT * FROM users
WHERE id IN (
  SELECT DISTINCT user_id FROM orders
);

-- ✅ Tối ưu: Thay bằng JOIN
SELECT DISTINCT u.*
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

**b) Với EXISTS:**

```sql
-- Kiểm tra sự tồn tại (thường nhanh hơn IN với bảng lớn)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
);

-- ✅ Tốt cho correlated subquery
-- ✅ MySQL dừng ngay khi tìm thấy 1 row (không cần scan hết)
```

**c) Với NOT IN / NOT EXISTS:**

```sql
-- Tìm users chưa đặt hàng
SELECT * FROM users
WHERE id NOT IN (
  SELECT user_id FROM orders
);
-- ⚠️ Chậm nếu subquery trả về nhiều rows

-- ✅ Tốt hơn: Dùng NOT EXISTS
SELECT * FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
);
-- → Nhanh hơn, đặc biệt với correlated subquery
```

**d) Với Comparison Operators:**

```sql
-- So sánh với giá trị từ subquery
SELECT * FROM employees
WHERE salary > (
  SELECT AVG(salary) FROM employees
);

-- Subquery với ALL/ANY/SOME
SELECT * FROM products
WHERE price > ALL (
  SELECT price FROM products WHERE category = 'Budget'
);
-- → price lớn hơn TẤT CẢ giá trị trong subquery
```

#### **2.2. Subquery trong FROM (Derived Table)**

```sql
-- Tạo bảng tạm từ subquery
SELECT u.name, sub.total
FROM users u
JOIN (
  SELECT user_id, SUM(total) as total
  FROM orders
  WHERE created_at >= '2024-01-01'
  GROUP BY user_id
  HAVING SUM(total) > 1000
) sub ON u.id = sub.user_id;

-- ✅ Tối ưu: Đặt alias cho derived table
-- ✅ Tối ưu: Index trên các cột JOIN trong derived table
```

**Lưu ý:**

- Derived table không thể có index riêng
- MySQL phải materialize (tạo bảng tạm) nếu phức tạp
- Có thể chậm với dữ liệu lớn

#### **2.3. Subquery trong SELECT**

```sql
-- Thêm cột từ subquery (scalar subquery)
SELECT
  name,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count,
  (SELECT SUM(total) FROM orders WHERE user_id = users.id) as total_spent
FROM users;

-- ⚠️ Cảnh báo: Correlated subquery trong SELECT
-- → Chạy lại cho MỖI row → rất chậm với bảng lớn
-- ✅ Tốt hơn: Dùng JOIN với GROUP BY
SELECT
  u.name,
  COUNT(o.id) as order_count,
  COALESCE(SUM(o.total), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### **3. Subquery vs JOIN - Khi nào dùng gì?**

#### **3.1. So sánh hiệu năng**

| Tình huống                  | Subquery | JOIN       | Khuyến nghị                |
| --------------------------- | -------- | ---------- | -------------------------- |
| Kiểm tra tồn tại (EXISTS)   | ⚡⚡⚡⚡ | ⚡⚡⚡⚡⚡ | JOIN (LEFT JOIN + IS NULL) |
| Lấy giá trị từ bảng khác    | ⚡⚡⚡   | ⚡⚡⚡⚡⚡ | JOIN                       |
| Filter với danh sách (IN)   | ⚡⚡⚡   | ⚡⚡⚡⚡⚡ | JOIN                       |
| Tính toán aggregate per row | ⚡⚡     | ⚡⚡⚡⚡⚡ | JOIN + GROUP BY            |
| Subquery trong SELECT       | ⚡       | ⚡⚡⚡⚡⚡ | JOIN                       |
| Derived table phức tạp      | ⚡⚡⚡   | ⚡⚡⚡⚡   | Cân nhắc, có thể tạo view  |

#### **3.2. Ví dụ chuyển đổi**

**Ví dụ 1: IN → JOIN**

```sql
-- ❌ Subquery với IN
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);

-- ✅ JOIN (thường nhanh hơn)
SELECT DISTINCT u.*
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 1000;
```

**Ví dụ 2: EXISTS → JOIN**

```sql
-- ❌ Correlated subquery
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.status = 'completed'
);

-- ✅ JOIN (MySQL optimizer tốt hơn)
SELECT DISTINCT u.*
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';
```

**Ví dụ 3: Scalar subquery trong SELECT → JOIN**

```sql
-- ❌ Chậm: Correlated subquery cho mỗi row
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

#### **3.3. Khi nào Subquery vẫn tốt?**

**a) EXISTS cho correlated subquery:**

```sql
-- ✅ EXISTS tốt cho kiểm tra tồn tại
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
    AND o.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
);
-- → MySQL dừng ngay khi tìm thấy 1 row
-- → Có thể nhanh hơn JOIN nếu chỉ cần check existence
```

**b) Derived table cho logic phức tạp:**

```sql
-- ✅ Derived table cho tính toán phức tạp
SELECT u.name, stats.avg_order_value
FROM users u
JOIN (
  SELECT
    user_id,
    AVG(total) as avg_order_value,
    COUNT(*) as order_count
  FROM orders
  WHERE created_at >= '2024-01-01'
  GROUP BY user_id
  HAVING COUNT(*) > 5
) stats ON u.id = stats.user_id;
-- → Rõ ràng, dễ maintain hơn JOIN phức tạp
```

**c) Scalar subquery đơn giản:**

```sql
-- ✅ Scalar subquery uncorrelated (chạy 1 lần)
SELECT
  name,
  salary,
  salary - (SELECT AVG(salary) FROM employees) as diff_from_avg
FROM employees;
-- → Subquery chỉ chạy 1 lần, có thể cache
```

### **4. Tối ưu Subquery**

#### **4.1. Chuyển Correlated → Uncorrelated**

```sql
-- ❌ Correlated subquery (chậm)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
    AND o.total > 1000
);

-- ✅ Uncorrelated với JOIN
SELECT DISTINCT u.*
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 1000;
```

#### **4.2. Sử dụng EXISTS thay vì IN (khi phù hợp)**

```sql
-- ⚠️ IN: Phải materialize toàn bộ subquery
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);

-- ✅ EXISTS: Dừng ngay khi tìm thấy
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.total > 1000
);
-- → Đặc biệt tốt nếu subquery có thể trả về nhiều rows
```

#### **4.3. Index cho Subquery**

```sql
-- Subquery với WHERE trong subquery
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders
  WHERE status = 'completed'  -- ✅ Cần index trên status
    AND created_at > '2024-01-01'  -- ✅ Cần index trên created_at
);

-- Index khuyến nghị:
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at);
-- → Tối ưu cho cả JOIN và subquery
```

#### **4.4. Derived Table Materialization**

```sql
-- ⚠️ Derived table phức tạp có thể materialize
SELECT u.name, sub.total
FROM users u
JOIN (
  SELECT user_id, SUM(total) as total
  FROM orders
  GROUP BY user_id
) sub ON u.id = sub.user_id;

-- ✅ Tối ưu: Đảm bảo derived table nhỏ
SELECT u.name, sub.total
FROM users u
JOIN (
  SELECT user_id, SUM(total) as total
  FROM orders
  WHERE created_at >= '2024-01-01'  -- Filter sớm
  GROUP BY user_id
  HAVING SUM(total) > 1000  -- Filter sớm
) sub ON u.id = sub.user_id;
```

### **5. Subquery Optimization trong MySQL**

#### **5.1. Subquery Cache (MySQL 8.0+)**

Từ MySQL 8.0, optimizer tự động cache kết quả uncorrelated subquery:

```sql
-- Uncorrelated subquery được cache
SELECT * FROM users
WHERE dept_id IN (
  SELECT id FROM departments WHERE status = 'active'
);
-- → Subquery chỉ chạy 1 lần, kết quả được cache
```

#### **5.2. Subquery Materialization**

MySQL có thể materialize subquery thành temporary table:

```sql
EXPLAIN SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders WHERE total > 1000
);

-- Có thể thấy:
-- type: <subquery2>
-- Extra: Materialize
-- → MySQL tạo temporary table từ subquery, rồi JOIN
```

#### **5.3. Subquery → JOIN Transformation**

MySQL optimizer tự động chuyển một số subquery thành JOIN:

```sql
-- MySQL có thể tự động chuyển thành JOIN
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
);

-- Optimizer tự động convert thành:
-- SELECT DISTINCT u.* FROM users u INNER JOIN orders o ON u.id = o.user_id
```

### **6. Best Practices**

#### **6.1. Quy tắc chung**

1. ✅ **Ưu tiên JOIN khi có thể:**

   - JOIN thường nhanh hơn subquery
   - Optimizer tối ưu JOIN tốt hơn
   - Dễ đọc và maintain hơn

2. ✅ **Dùng EXISTS cho correlated subquery:**

   - EXISTS thường nhanh hơn IN cho correlated subquery
   - Dừng ngay khi tìm thấy kết quả

3. ✅ **Index cho subquery:**

   - Đảm bảo có index trên các cột trong WHERE của subquery
   - Đặc biệt quan trọng với correlated subquery

4. ✅ **Tránh correlated subquery trong SELECT:**
   - Chạy lại cho mỗi row → rất chậm
   - Thay bằng JOIN + GROUP BY

#### **6.2. Checklist tối ưu**

**Trước khi dùng Subquery, hỏi:**

- [ ] Có thể thay bằng JOIN không? → Nên thay
- [ ] Subquery có correlated không? → Tránh nếu có thể
- [ ] Subquery trong SELECT có correlated không? → Tuyệt đối tránh
- [ ] Có index cho subquery không? → Cần có
- [ ] Derived table có quá lớn không? → Filter sớm

#### **6.3. Ví dụ tối ưu hoàn chỉnh**

```sql
-- ❌ Query chậm: Nhiều correlated subquery
SELECT
  u.name,
  (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
  (SELECT SUM(total) FROM orders WHERE user_id = u.id) as total_spent,
  (SELECT MAX(created_at) FROM orders WHERE user_id = u.id) as last_order
FROM users u
WHERE u.id IN (
  SELECT user_id FROM orders WHERE status = 'completed'
);

-- ✅ Query tối ưu: JOIN + GROUP BY
SELECT
  u.name,
  COUNT(o.id) as order_count,
  COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total END), 0) as total_spent,
  MAX(o.created_at) as last_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE EXISTS (
  SELECT 1 FROM orders o2
  WHERE o2.user_id = u.id AND o2.status = 'completed'
)
GROUP BY u.id, u.name;

-- Hoặc đơn giản hơn:
SELECT
  u.name,
  COUNT(o.id) as order_count,
  COALESCE(SUM(o.total), 0) as total_spent,
  MAX(o.created_at) as last_order
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.name;
```

### **7. Tóm tắt**

**Subquery nên dùng khi:**

- ✅ EXISTS để check existence (correlated subquery)
- ✅ Derived table cho logic phức tạp, dễ đọc
- ✅ Scalar subquery uncorrelated (chạy 1 lần)
- ✅ Tính toán phức tạp cần tách biệt

**Subquery nên tránh khi:**

- ❌ Có thể thay bằng JOIN (thường nhanh hơn)
- ❌ Correlated subquery trong SELECT (rất chậm)
- ❌ IN với subquery lớn (dùng JOIN hoặc EXISTS)
- ❌ Derived table quá lớn (filter sớm hoặc dùng JOIN)

**MySQL 8.0+ improvements:**

- ✅ Subquery cache tự động
- ✅ Materialization tự động
- ✅ Subquery → JOIN transformation tự động
- ✅ Window functions (thay thế một số subquery)

## VI. Isolation Level (Khả năng cô lập giao dịch)

Isolation Level là mức độ **cô lập giữa các transaction** đồng thời trong database, đảm bảo tính nhất quán dữ liệu. Isolation là một trong 4 thuộc tính ACID (Atomicity, Consistency, Isolation, Durability) của transaction.

### **1. ACID Properties**

**ACID** là 4 thuộc tính cơ bản đảm bảo tính toàn vẹn dữ liệu:

| Thuộc tính      | Mô tả                                 | Cách đảm bảo                        |
| --------------- | ------------------------------------- | ----------------------------------- |
| **Atomicity**   | Tất cả hoặc không có gì               | Transaction rollback nếu có lỗi     |
| **Consistency** | Dữ liệu luôn hợp lệ                   | Constraints, foreign keys, triggers |
| **Isolation**   | Transactions không ảnh hưởng lẫn nhau | Isolation levels, locking           |
| **Durability**  | Thay đổi được lưu vĩnh viễn           | Write-ahead log, redo log           |

### **2. Các vấn đề Concurrency**

Trước khi hiểu Isolation Level, cần biết các vấn đề có thể xảy ra khi nhiều transaction chạy đồng thời:

#### **2.1. Dirty Read (Đọc dữ liệu bẩn)**

**Mô tả**: Đọc dữ liệu từ transaction chưa commit, sau đó transaction đó rollback → đọc được dữ liệu không tồn tại.

**Ví dụ:**

```sql
-- Transaction A
BEGIN;
UPDATE users SET balance = balance - 100 WHERE id = 1;
-- balance = 900 (chưa commit)

-- Transaction B (READ UNCOMMITTED)
BEGIN;
SELECT balance FROM users WHERE id = 1;
-- → Đọc được 900 (dirty read)

-- Transaction A
ROLLBACK;  -- balance quay về 1000

-- Transaction B đã đọc 900 nhưng giá trị thực là 1000!
```

#### **2.2. Non-repeatable Read (Đọc không nhất quán)**

**Mô tả**: Đọc cùng một row 2 lần trong cùng transaction nhưng nhận giá trị khác nhau do transaction khác đã update và commit.

**Ví dụ:**

```sql
-- Transaction A
BEGIN;
SELECT balance FROM users WHERE id = 1;
-- → balance = 1000

-- Transaction B
BEGIN;
UPDATE users SET balance = 900 WHERE id = 1;
COMMIT;

-- Transaction A
SELECT balance FROM users WHERE id = 1;
-- → balance = 900 (khác với lần đọc đầu!)
-- → Non-repeatable read
```

#### **2.3. Phantom Read (Đọc ma)**

**Mô tả**: Query cùng điều kiện 2 lần trong cùng transaction nhưng nhận số rows khác nhau do transaction khác đã insert/delete và commit.

**Ví dụ:**

```sql
-- Transaction A
BEGIN;
SELECT COUNT(*) FROM users WHERE status = 'active';
-- → 100 users

-- Transaction B
BEGIN;
INSERT INTO users (name, status) VALUES ('New User', 'active');
COMMIT;

-- Transaction A
SELECT COUNT(*) FROM users WHERE status = 'active';
-- → 101 users (xuất hiện "ghost" row)
-- → Phantom read
```

#### **2.4. Lost Update (Mất cập nhật)**

**Mô tả**: 2 transactions cùng update một row, transaction sau ghi đè lên transaction trước.

**Ví dụ:**

```sql
-- Transaction A
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 1000
UPDATE users SET balance = balance + 100 WHERE id = 1;
COMMIT;  -- balance = 1100

-- Transaction B (chạy song song)
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 1000 (đọc trước khi A commit)
UPDATE users SET balance = balance + 50 WHERE id = 1;
COMMIT;  -- balance = 1050 (ghi đè mất 100 từ A!)
```

### **3. Các Isolation Level trong MySQL**

MySQL hỗ trợ 4 isolation levels, từ thấp đến cao:

| Level                         | Dirty Read | Non-repeatable Read | Phantom Read | Hiệu năng  | Mô tả                                   |
| ----------------------------- | ---------- | ------------------- | ------------ | ---------- | --------------------------------------- |
| **READ UNCOMMITTED**          | ❌ Có      | ❌ Có               | ❌ Có        | ⚡⚡⚡⚡⚡ | Nhanh nhất, không an toàn               |
| **READ COMMITTED**            | ✅ Không   | ❌ Có               | ❌ Có        | ⚡⚡⚡⚡   | Oracle default, đọc snapshot từng câu   |
| **REPEATABLE READ (Default)** | ✅ Không   | ✅ Không            | ⚠️ Có\*      | ⚡⚡⚡     | MySQL default, đọc snapshot transaction |
| **SERIALIZABLE**              | ✅ Không   | ✅ Không            | ✅ Không     | ⚡         | An toàn nhất, khóa range locks          |

\* _REPEATABLE READ trong InnoDB tránh được Phantom Read nhờ Next-Key Locks_

#### **3.1. READ UNCOMMITTED (Level 0)**

**Đặc điểm:**

- ✅ Nhanh nhất (không có lock, không có snapshot)
- ❌ Không tránh được bất kỳ vấn đề nào
- ❌ Có thể đọc dữ liệu chưa commit

**Khi nào dùng:**

- Rất hiếm, chỉ dùng cho báo cáo thống kê không cần chính xác
- Đọc dữ liệu không quan trọng (logs, metrics)

**Ví dụ:**

```sql
-- Set isolation level
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

BEGIN;
-- Có thể đọc dữ liệu từ transaction chưa commit
SELECT * FROM users;
COMMIT;
```

#### **3.2. READ COMMITTED (Level 1)**

**Đặc điểm:**

- ✅ Tránh Dirty Read
- ❌ Vẫn có Non-repeatable Read và Phantom Read
- ✅ Mỗi câu SELECT đọc snapshot tại thời điểm đó (không phải lúc BEGIN)

**Khi nào dùng:**

- Oracle default
- Ứng dụng cần đọc dữ liệu mới nhất (không cần snapshot cố định)

**Ví dụ:**

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

BEGIN;
SELECT balance FROM users WHERE id = 1;
-- → 1000

-- Transaction khác UPDATE và COMMIT
-- ...

SELECT balance FROM users WHERE id = 1;
-- → Có thể khác 1000 (Non-repeatable Read)
COMMIT;
```

**MVCC trong READ COMMITTED:**

- Mỗi SELECT đọc snapshot mới nhất đã commit
- Có thể thấy changes từ transactions khác đã commit

#### **3.3. REPEATABLE READ (Level 2) - MySQL Default**

**Đặc điểm:**

- ✅ Tránh Dirty Read và Non-repeatable Read
- ⚠️ Phantom Read: InnoDB tránh được nhờ Next-Key Locks
- ✅ Toàn bộ transaction đọc cùng một snapshot (tại lúc BEGIN)
- ✅ Dùng MVCC để đọc snapshot cũ

**Khi nào dùng:**

- MySQL default, phù hợp cho hầu hết ứng dụng
- Cần snapshot nhất quán trong suốt transaction
- Cân bằng giữa hiệu năng và consistency

**Ví dụ:**

```sql
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- Hoặc dùng default (MySQL)

BEGIN;
SELECT balance FROM users WHERE id = 1;
-- → 1000

-- Transaction khác UPDATE và COMMIT
-- ...

SELECT balance FROM users WHERE id = 1;
-- → Vẫn 1000 (đọc cùng snapshot)
COMMIT;
```

**MVCC trong REPEATABLE READ:**

- Toàn bộ transaction đọc snapshot tại thời điểm BEGIN
- Không thấy changes từ transactions khác (kể cả đã commit)
- InnoDB dùng undo log để tái tạo snapshot cũ

**Next-Key Locks:**

- InnoDB dùng Next-Key Locks (Gap Lock + Record Lock) để tránh Phantom Read
- Lock cả record và gap (khoảng trống) trước record

```sql
-- REPEATABLE READ với Next-Key Lock
BEGIN;
SELECT * FROM users WHERE age BETWEEN 20 AND 30 FOR UPDATE;
-- → Lock các rows có age 20-30 VÀ gap trước/sau
-- → Transaction khác không thể INSERT row mới vào range này
COMMIT;
```

#### **3.4. SERIALIZABLE (Level 3)**

**Đặc điểm:**

- ✅ Tránh tất cả vấn đề (Dirty Read, Non-repeatable Read, Phantom Read)
- ❌ Chậm nhất (phải khóa range locks)
- ✅ Transactions chạy tuần tự (serialized)

**Khi nào dùng:**

- Cần mức an toàn cao nhất
- Có thể chấp nhận hiệu năng chậm
- Tránh race conditions nghiêm trọng

**Ví dụ:**

```sql
SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN;
SELECT * FROM users WHERE status = 'active';
-- → Auto thêm SELECT ... FOR SHARE (shared lock)
-- → Transaction khác không thể UPDATE/INSERT rows matching

COMMIT;
```

### **4. MVCC (Multi-Version Concurrency Control)**

MVCC là cơ chế cho phép MySQL đọc snapshot dữ liệu cũ mà không cần khóa (lock), giúp tăng concurrency.

#### **4.1. Cách MVCC hoạt động**

**Cơ chế:**

1. Mỗi row có **version number** (trx_id trong InnoDB)
2. Khi UPDATE/DELETE, không xóa row cũ, tạo row mới
3. Mỗi transaction có **read view** (snapshot) tại thời điểm BEGIN
4. Đọc chỉ lấy rows visible với read view của transaction

**Ví dụ:**

```
Time  Transaction A              Transaction B
----  -------------------------  -------------------------
T1    BEGIN                      BEGIN
T2    INSERT user (id=1)        -
T3    COMMIT (row visible)       -
T4    -                          SELECT * FROM users
                                  → Không thấy user id=1 (snapshot tại T1)
T5    -                          COMMIT
```

#### **4.2. Undo Log trong MVCC**

InnoDB dùng **Undo Log** để lưu các version cũ của rows:

```sql
-- Row ban đầu
users: id=1, name='John', balance=1000, trx_id=100

-- Transaction 200 UPDATE
UPDATE users SET balance=900 WHERE id=1;
-- Undo Log: {trx_id: 200, old_balance: 1000}

-- Row mới
users: id=1, name='John', balance=900, trx_id=200

-- Transaction 150 (BEGIN trước 200) đọc
SELECT balance FROM users WHERE id=1;
-- → Đọc từ Undo Log: balance=1000 (snapshot cũ)
```

#### **4.3. Read View**

Read View xác định rows nào visible cho transaction:

**Các trường trong Read View:**

- `m_low_limit_id`: Transaction ID lớn nhất đã commit
- `m_up_limit_id`: Transaction ID nhỏ nhất chưa commit
- `m_trx_ids`: Danh sách transaction IDs chưa commit

**Rules để row visible:**

1. `trx_id < m_up_limit_id` → Visible (transaction đã commit trước snapshot)
2. `trx_id >= m_low_limit_id` → Not visible (transaction bắt đầu sau snapshot)
3. `trx_id IN m_trx_ids` → Not visible (transaction chưa commit)

### **5. Locking trong MySQL**

#### **5.1. Types of Locks**

| Loại Lock              | Mô tả                              | Khi nào dùng                                |
| ---------------------- | ---------------------------------- | ------------------------------------------- |
| **Shared Lock (S)**    | Cho phép đọc, không cho ghi        | `SELECT ... FOR SHARE`                      |
| **Exclusive Lock (X)** | Không cho đọc và ghi               | `SELECT ... FOR UPDATE`, `UPDATE`, `DELETE` |
| **Intention Lock**     | Lock cấp table trước khi lock rows | Tự động, không cần set                      |

#### **5.2. Row-level Locking**

```sql
-- Shared Lock (cho phép đọc, chặn ghi)
SELECT * FROM users WHERE id = 1 FOR SHARE;
-- → Transaction khác có thể SELECT nhưng không UPDATE/DELETE

-- Exclusive Lock (chặn cả đọc và ghi)
SELECT * FROM users WHERE id = 1 FOR UPDATE;
-- → Transaction khác không thể SELECT/UPDATE/DELETE
```

#### **5.3. Gap Locks và Next-Key Locks**

**Gap Lock:**

- Lock khoảng trống giữa các rows
- Tránh Phantom Read

**Next-Key Lock:**

- Gap Lock + Record Lock
- Lock record và gap trước nó

```sql
-- REPEATABLE READ với Next-Key Lock
BEGIN;
SELECT * FROM users WHERE age = 25 FOR UPDATE;
-- → Lock row age=25 VÀ gap (age < 25)
-- → Transaction khác không thể INSERT user với age < 25
COMMIT;
```

### **6. Cách set và kiểm tra Isolation Level**

#### **6.1. Set Isolation Level**

```sql
-- Set cho session hiện tại
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Set cho transaction tiếp theo
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
-- Transaction này dùng REPEATABLE READ

-- Set global (ảnh hưởng tất cả sessions mới)
SET GLOBAL TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Xem trong config file (my.cnf)
[mysqld]
transaction-isolation = READ-COMMITTED
```

#### **6.2. Kiểm tra Isolation Level**

```sql
-- Xem isolation level hiện tại
SELECT @@SESSION.transaction_isolation;
SELECT @@GLOBAL.transaction_isolation;

-- Hoặc
SHOW VARIABLES LIKE 'transaction_isolation';
```

### **7. So sánh và Best Practices**

#### **7.1. Khi nào dùng level nào?**

| Isolation Level      | Use Case                                     | Ví dụ               |
| -------------------- | -------------------------------------------- | ------------------- |
| **READ UNCOMMITTED** | Rất hiếm, thống kê không cần chính xác       | Analytics, logs     |
| **READ COMMITTED**   | Cần đọc dữ liệu mới nhất, không cần snapshot | Web apps, reporting |
| **REPEATABLE READ**  | Cần snapshot nhất quán, balance hiệu năng    | E-commerce, banking |
| **SERIALIZABLE**     | Cần an toàn tuyệt đối, chấp nhận chậm        | Financial critical  |

#### **7.2. Best Practices**

**1. ✅ Dùng REPEATABLE READ làm default:**

- MySQL default, cân bằng tốt giữa performance và consistency
- InnoDB đã tối ưu tốt cho level này

**2. ✅ Tránh thay đổi isolation level trong ứng dụng:**

- Set ở connection pool level
- Hoặc set global trong config

**3. ✅ Dùng SELECT ... FOR UPDATE khi cần:**

```sql
-- Tránh Lost Update
BEGIN;
SELECT balance FROM users WHERE id = 1 FOR UPDATE;
-- → Lock row, transaction khác phải chờ
UPDATE users SET balance = balance + 100 WHERE id = 1;
COMMIT;
```

**4. ✅ Giữ transaction ngắn:**

- Transaction dài → lock lâu → chậm
- Tách transaction lớn thành nhiều transaction nhỏ

**5. ✅ Index cho các cột trong WHERE:**

- Giúp lock chính xác rows cần thiết
- Tránh lock quá nhiều rows

**6. ✅ Hiểu MVCC:**

- REPEATABLE READ đọc snapshot cũ → có thể không thấy data mới
- Cân nhắc dùng READ COMMITTED nếu cần data real-time

### **8. Ví dụ thực tế**

#### **8.1. Ví dụ: Lost Update**

```sql
-- ❌ Vấn đề: Lost Update
-- Transaction A
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 1000
UPDATE users SET balance = 1000 + 100 WHERE id = 1;
COMMIT;

-- Transaction B (song song)
BEGIN;
SELECT balance FROM users WHERE id = 1;  -- 1000 (đọc trước A commit)
UPDATE users SET balance = 1000 + 50 WHERE id = 1;
COMMIT;
-- → Mất 100 từ A!

-- ✅ Giải pháp: SELECT ... FOR UPDATE
BEGIN;
SELECT balance FROM users WHERE id = 1 FOR UPDATE;  -- Lock row
UPDATE users SET balance = balance + 100 WHERE id = 1;
COMMIT;
```

#### **8.2. Ví dụ: Phantom Read với REPEATABLE READ**

```sql
-- REPEATABLE READ + Next-Key Lock tránh Phantom Read
BEGIN;
SELECT * FROM users WHERE age BETWEEN 20 AND 30 FOR UPDATE;
-- → Lock rows 20-30 VÀ gap → không thể INSERT row mới vào range

-- Transaction khác không thể:
INSERT INTO users (name, age) VALUES ('New', 25);
-- → Phải chờ transaction trên commit
COMMIT;
```

### **9. Tóm tắt**

**Isolation Level là gì?**

- Mức độ cô lập giữa các transactions đồng thời
- Quyết định transactions "nhìn thấy" dữ liệu như thế nào

**MySQL Default:**

- **REPEATABLE READ** - Cân bằng tốt giữa performance và consistency
- InnoDB dùng MVCC và Next-Key Locks để tối ưu

**Quy tắc chọn:**

- ✅ **REPEATABLE READ**: Hầu hết trường hợp (default)
- ✅ **READ COMMITTED**: Cần data real-time
- ✅ **SERIALIZABLE**: Cần an toàn tuyệt đối
- ❌ **READ UNCOMMITTED**: Tránh dùng

**MVCC:**

- Cho phép đọc snapshot cũ mà không cần lock
- Tăng concurrency đáng kể
- Dùng Undo Log để tái tạo snapshot

### **10. Kết luận về Isolation Level**

Isolation Level là một khái niệm quan trọng trong database, quyết định cách transactions tương tác với nhau và đảm bảo tính nhất quán dữ liệu.

**Điểm quan trọng cần nhớ:**

1. **MySQL Default = REPEATABLE READ**: Cân bằng tốt giữa performance và consistency
2. **MVCC**: Cho phép đọc không block, tăng concurrency đáng kể
3. **Next-Key Locks**: InnoDB tránh được Phantom Read trong REPEATABLE READ
4. **Chọn level phù hợp**:
   - REPEATABLE READ cho hầu hết trường hợp
   - READ COMMITTED khi cần data real-time
   - SERIALIZABLE chỉ khi cần an toàn tuyệt đối
5. **Best Practice**:
   - Giữ transaction ngắn
   - Dùng SELECT ... FOR UPDATE khi cần
   - Hiểu rõ cách MVCC hoạt động

## VII. Connection Pool (Pool kết nối)

Connection Pool là một kỹ thuật quan trọng trong quản lý database connections, cho phép tái sử dụng kết nối thay vì tạo mới mỗi lần, giúp giảm overhead đáng kể và tăng hiệu năng ứng dụng.

### **1. Khái niệm và Tổng quan**

#### **1.1. Connection Pool là gì?**

Connection Pool là một **cache các database connections** được tạo trước và tái sử dụng, thay vì tạo connection mới cho mỗi database operation.

**Vấn đề không có Connection Pool:**

```
Request 1: Mở connection → Query → Đóng connection (200ms overhead)
Request 2: Mở connection → Query → Đóng connection (200ms overhead)
Request 3: Mở connection → Query → Đóng connection (200ms overhead)
...
→ Tốn 200ms mỗi request chỉ để mở/đóng connection!
```

**Với Connection Pool:**

```
Pool: [conn1, conn2, conn3, ...] (đã tạo sẵn)

Request 1: Lấy conn1 từ pool → Query → Trả conn1 về pool (5ms)
Request 2: Lấy conn2 từ pool → Query → Trả conn2 về pool (5ms)
...
→ Chỉ tốn 5ms để lấy connection!
```

#### **1.2. Kiến trúc Connection Pool**

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Request  │  │ Request  │  │ Request  │            │
│  │   #1     │  │   #2     │  │   #3     │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
└───────┼──────────────┼─────────────┼──────────────────┘
        │              │             │
        └──────────────┼─────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     Connection Pool         │
        │  ┌────┐ ┌────┐ ┌────┐     │
        │  │conn│ │conn│ │conn│ ... │
        │  │ 1  │ │ 2  │ │ 3  │     │
        │  └────┘ └────┘ └────┘     │
        │    │      │      │         │
        └────┼──────┼──────┼─────────┘
             │      │      │
             └──────┼──────┘
                    │
        ┌───────────▼───────────┐
        │   MySQL Database      │
        └───────────────────────┘
```

### **2. Các tham số quan trọng**

#### **2.1. Tham số cơ bản**

| Tham số                   | Mô tả                                              | Giá trị khuyến nghị | Tác động                          |
| ------------------------- | -------------------------------------------------- | ------------------- | --------------------------------- |
| **min / minimumIdle**     | Số kết nối tối thiểu luôn giữ trong pool           | 5–10                | Pool khởi tạo sẵn số này          |
| **max / maximumPoolSize** | Số kết nối tối đa trong pool                       | 20–100 (tùy tải)    | Giới hạn tối đa connections       |
| **idleTimeout**           | Thời gian chờ trước khi đóng connection không dùng | 10–30 phút          | Đóng connection idle để tiết kiệm |
| **connectionTimeout**     | Thời gian chờ khi pool hết connection              | 30–60 giây          | Timeout khi không lấy được conn   |
| **acquireTimeout**        | Thời gian chờ lấy connection từ pool               | 10–30 giây          | Timeout khi acquire connection    |
| **maxLifetime**           | Thời gian sống tối đa của connection               | 1–2 giờ             | Đóng connection sau thời gian này |
| **validationQuery**       | Query để kiểm tra connection còn sống              | `SELECT 1`          | Test connection health            |
| **testOnBorrow**          | Test connection trước khi cho mượn                 | true/false          | Đảm bảo connection hoạt động      |
| **testWhileIdle**         | Test connection khi idle                           | true                | Phát hiện connection chết         |

#### **2.2. Công thức tính toán tham số**

**Tính `max` (maximum connections):**

```python
max = (expected_concurrent_requests × avg_query_time) / target_response_time

# Ví dụ:
# - 100 requests đồng thời
# - Query trung bình: 50ms
# - Mục tiêu response time: 100ms
# → max = (100 × 0.05) / 0.1 = 50 connections
```

**Tính `min` (minimum connections):**

```python
min = max × 0.2  # 20% của max
# → min = 50 × 0.2 = 10 connections
```

**Kiểm tra với MySQL `max_connections`:**

```sql
-- Kiểm tra MySQL limit
SHOW VARIABLES LIKE 'max_connections';

-- Đảm bảo: max_connections >= (số pools × max_per_pool)
-- Ví dụ: 10 apps, mỗi app pool max=20
-- → max_connections >= 200
```

### **3. Lợi ích và Hiệu năng**

#### **3.1. Lợi ích chính**

**a) Giảm Overhead:**

- Mở/đóng connection: ~50–200ms mỗi lần
- Lấy từ pool: ~1–5ms mỗi lần
- **Tiết kiệm: 45–195ms mỗi request!**

**b) Tăng Throughput:**

- Xử lý nhiều request đồng thời không block
- Không phải chờ tạo connection mới
- Giảm contention trên MySQL server

**c) Quản lý tài nguyên:**

- Kiểm soát số connection tối đa
- Tránh quá tải MySQL (max_connections)
- Tự động cleanup connections chết

**d) Giảm Latency:**

- Connection sẵn có → response nhanh hơn
- Đặc biệt quan trọng với high-frequency requests

#### **3.2. Benchmark hiệu năng**

```
Scenario: 1000 requests, mỗi query 10ms

Không có Pool:
- Time: 1000 × (200ms + 10ms) = 210 giây
- Connections tạo: 1000

Có Pool (max=20):
- Time: 1000 × (5ms + 10ms) = 15 giây
- Connections tạo: 20
- → Nhanh hơn 14x!
```

### **4. Cấu trúc hoạt động chi tiết**

#### **4.1. Lifecycle của Connection trong Pool**

```
┌─────────────────────────────────────────────────┐
│          Connection Lifecycle                    │
└─────────────────────────────────────────────────┘

1. [POOL START]
   → Tạo min connections
   → Đặt vào pool (idle state)

2. [REQUEST ARRIVES]
   → Application request connection
   → Pool check: có idle connection?
   ├─ YES → Lấy từ pool (5ms)
   └─ NO  → Tạo mới (nếu < max) hoặc chờ (nếu = max)

3. [IN USE]
   → Connection được dùng cho query
   → Status: ACTIVE

4. [QUERY COMPLETE]
   → Trả connection về pool
   → Status: IDLE (ready for next request)

5. [IDLE TIMEOUT]
   → Nếu idle > idleTimeout → Đóng connection
   → Giữ lại min connections

6. [MAX LIFETIME]
   → Nếu age > maxLifetime → Đóng connection
   → Tạo connection mới thay thế

7. [POOL SHUTDOWN]
   → Đóng tất cả connections
   → Graceful cleanup
```

#### **4.2. Flow diagram chi tiết**

```
Application                    Pool                      MySQL
    │                           │                         │
    │── request connection ────>│                         │
    │                           │                         │
    │                           ├─ Check idle connections │
    │                           │                         │
    │                           ├─ [CASE 1: Has idle]     │
    │                           │  ┌─ Get idle conn ─────>│
    │<── return connection ─────┤  └─ Execute query      │
    │                           │     │                   │
    │── execute query ──────────┼────>│                   │
    │                           │     │<── result ────────┤
    │<── result ────────────────┼─────┤                   │
    │                           │                         │
    │── release connection ────>│                         │
    │                           ├─ Return to pool         │
    │                           │                         │
    │                           ├─ [CASE 2: No idle, < max]
    │                           │  ┌─ Create new ────────>│
    │<── return new connection ─┤  └─ Add to pool        │
    │                           │                         │
    │                           ├─ [CASE 3: No idle, = max]
    │                           │  ┌─ Wait in queue       │
    │                           │  └─ Timeout if > connectionTimeout
    │                           │                         │
```

### **5. Ví dụ cấu hình chi tiết**

#### **5.1. Node.js (mysql2)**

```javascript
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  // Connection config
  host: "localhost",
  user: "root",
  password: "password",
  database: "mydb",

  // Pool config
  connectionLimit: 10, // max connections
  queueLimit: 0, // unlimited queue
  waitForConnections: true, // wait if pool full

  // Connection management
  enableKeepAlive: true, // keep connections alive
  keepAliveInitialDelay: 0, // start keep-alive immediately

  // Timeouts
  connectTimeout: 60000, // 60s to establish connection

  // SSL
  ssl: false, // use SSL if needed
});

// Sử dụng
async function queryUser(id) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return rows;
  } finally {
    connection.release(); // QUAN TRỌNG: Trả về pool
  }
}

// Hoặc dùng pool trực tiếp (auto release)
async function queryUser(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows;
}
```

#### **5.2. Java (HikariCP - Recommended)**

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.SQLException;

// Cấu hình
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost/mydb");
config.setUsername("root");
config.setPassword("password");

// Pool settings
config.setMinimumIdle(5);           // min connections
config.setMaximumPoolSize(20);       // max connections
config.setConnectionTimeout(30000);  // 30s timeout
config.setIdleTimeout(600000);       // 10 minutes
config.setMaxLifetime(3600000);      // 1 hour

// Connection validation
config.setConnectionTestQuery("SELECT 1");
config.setConnectionTimeout(30000);

// Leak detection
config.setLeakDetectionThreshold(60000); // 60s

// Performance
config.addDataSourceProperty("cachePrepStmts", "true");
config.addDataSourceProperty("prepStmtCacheSize", "250");
config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

HikariDataSource ds = new HikariDataSource(config);

// Sử dụng
public User getUser(int id) throws SQLException {
    try (Connection conn = ds.getConnection()) {
        // Auto-close (try-with-resources)
        // Connection tự động trả về pool
        PreparedStatement stmt = conn.prepareStatement(
            "SELECT * FROM users WHERE id = ?"
        );
        stmt.setInt(1, id);
        ResultSet rs = stmt.executeQuery();
        // ... process results
    }
}
```

#### **5.3. Python (SQLAlchemy)**

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# Cấu hình cơ bản
engine = create_engine(
    'mysql+pymysql://user:pass@localhost/db',

    # Pool settings
    pool_size=10,                  # max connections
    max_overflow=20,               # extra connections when needed
    pool_timeout=30,               # wait time for connection
    pool_recycle=3600,             # recycle after 1 hour
    pool_pre_ping=True,            # test connection before use

    # Connection settings
    connect_args={
        "connect_timeout": 60,
        "read_timeout": 30,
        "write_timeout": 30,
    }
)

# Sử dụng
from sqlalchemy.orm import sessionmaker
Session = sessionmaker(bind=engine)

def get_user(user_id):
    session = Session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        return user
    finally:
        session.close()  # Trả connection về pool

# Context manager (auto close)
def get_user(user_id):
    with Session() as session:
        return session.query(User).filter(User.id == user_id).first()
```

#### **5.4. Go (database/sql với go-sql-driver/mysql)**

```go
package main

import (
    "database/sql"
    _ "github.com/go-sql-driver/mysql"
    "time"
)

func main() {
    dsn := "user:password@tcp(localhost:3306)/dbname?parseTime=true"

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        panic(err)
    }
    defer db.Close()

    // Pool settings
    db.SetMaxOpenConns(25)         // max connections
    db.SetMaxIdleConns(5)          // max idle connections
    db.SetConnMaxLifetime(5 * time.Minute)  // max lifetime
    db.SetConnMaxIdleTime(10 * time.Minute) // max idle time

    // Sử dụng
    rows, err := db.Query("SELECT * FROM users WHERE id = ?", 1)
    // Auto-release connection khi rows.Close()
}
```

### **6. Best Practices và Anti-patterns**

#### **6.1. Best Practices**

**1. ✅ Tính toán `max` hợp lý:**

```python
# Dựa trên:
# - Số requests đồng thời
# - Thời gian query trung bình
# - Mục tiêu response time
max = (concurrent_requests × avg_query_time) / target_response_time

# Nhưng không quá:
max <= MySQL.max_connections / số_ứng_dụng
```

**2. ✅ Luôn release connection:**

```javascript
// ❌ Sai
const conn = await pool.getConnection();
await conn.query("SELECT ...");
// Quên release → connection leak!

// ✅ Đúng
const conn = await pool.getConnection();
try {
  await conn.query("SELECT ...");
} finally {
  conn.release(); // Luôn release
}

// ✅ Đúng hơn: dùng pool.query() (auto-release)
await pool.query("SELECT ...");
```

**3. ✅ Connection health check:**

```java
// Bật testOnBorrow hoặc testWhileIdle
config.setConnectionTestQuery("SELECT 1");
config.setTestOnBorrow(true);
// → Phát hiện connection chết trước khi dùng
```

**4. ✅ Monitor pool metrics:**

```java
// HikariCP metrics
HikariPoolMXBean poolBean = ds.getHikariPoolMXBean();
System.out.println("Active: " + poolBean.getActiveConnections());
System.out.println("Idle: " + poolBean.getIdleConnections());
System.out.println("Total: " + poolBean.getTotalConnections());
System.out.println("Threads waiting: " + poolBean.getThreadsAwaitingConnection());
```

**5. ✅ Graceful shutdown:**

```java
// Đóng pool khi ứng dụng tắt
@PreDestroy
public void closePool() {
    if (ds != null) {
        ds.close(); // Đóng tất cả connections
    }
}
```

**6. ✅ Tách pool theo use case:**

```java
// Pool cho read (nhiều connections)
HikariDataSource readPool = createPool(50);

// Pool cho write (ít connections, ưu tiên)
HikariDataSource writePool = createPool(10);
```

#### **6.2. Anti-patterns (Tránh)**

**1. ❌ Connection leak:**

```javascript
// Không release connection
const conn = await pool.getConnection();
await conn.query("SELECT ...");
// Quên conn.release() → pool hết connections!
```

**2. ❌ Pool quá lớn:**

```java
// ❌ Quá nhiều connections
config.setMaximumPoolSize(1000);
// → Quá tải MySQL, lãng phí tài nguyên
```

**3. ❌ Pool quá nhỏ:**

```java
// ❌ Quá ít connections
config.setMaximumPoolSize(2);
// → Nhiều requests phải chờ
```

**4. ❌ Không set timeout:**

```java
// ❌ Không có timeout
config.setConnectionTimeout(0); // wait forever
// → Requests có thể hang mãi mãi
```

**5. ❌ Dùng connection sau khi release:**

```javascript
// ❌ Dùng connection đã release
const conn = await pool.getConnection();
conn.release();
await conn.query("SELECT ..."); // Error!
```

### **7. Troubleshooting và Monitoring**

#### **7.1. Các vấn đề thường gặp**

| Vấn đề                   | Triệu chứng                                  | Nguyên nhân                          | Giải pháp                                   |
| ------------------------ | -------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| **Connection timeout**   | Requests bị timeout, pool đầy                | Pool hết connection, đang chờ        | Tăng `max` hoặc tối ưu query chậm           |
| **Too many connections** | MySQL error: "Too many connections"          | MySQL đạt giới hạn `max_connections` | Tăng MySQL limit hoặc giảm `max` pool       |
| **Connection leak**      | Pool từ từ hết connections                   | Không trả connection về pool         | Dùng try/finally hoặc connection wrapper    |
| **Slow queries**         | Response time tăng dần                       | Connection bị giữ quá lâu            | Set timeout cho query, monitor long queries |
| **Stale connections**    | Errors: "Connection lost", "MySQL gone away" | Connection bị đóng bởi MySQL         | Bật testOnBorrow, giảm maxLifetime          |
| **Pool starvation**      | Requests queue lâu, timeout                  | Pool quá nhỏ hoặc queries quá chậm   | Tăng pool size hoặc optimize queries        |

#### **7.2. Monitoring Metrics**

**Metrics quan trọng cần theo dõi:**

```java
// HikariCP Metrics
public class PoolMetrics {
    // Số connections đang active
    int activeConnections = poolBean.getActiveConnections();

    // Số connections idle
    int idleConnections = poolBean.getIdleConnections();

    // Tổng số connections
    int totalConnections = poolBean.getTotalConnections();

    // Số threads đang chờ connection
    int threadsAwaiting = poolBean.getThreadsAwaitingConnection();

    // Số connections đã tạo
    long totalCreated = poolBean.getTotalConnections();

    // Số connections bị timeout
    long timeoutCount = // từ monitoring tool
}
```

**Alerting thresholds:**

- `activeConnections > max * 0.8` → Cảnh báo pool sắp đầy
- `threadsAwaiting > 10` → Cảnh báo requests đang chờ
- `timeoutCount > 5/min` → Cảnh báo có vấn đề

### **8. Tích hợp với Isolation Level**

#### **8.1. Isolation Level trong Pool**

Mỗi connection trong pool có thể có isolation level riêng. Mặc định: REPEATABLE READ (MySQL default).

**Set isolation level cho connection:**

```java
// Set khi lấy connection
try (Connection conn = ds.getConnection()) {
    conn.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
    // Transaction này dùng READ COMMITTED
}
```

**Set isolation level cho toàn bộ pool:**

```java
// HikariCP: set trong connectionInitSql
config.setConnectionInitSql(
    "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
);
```

#### **8.2. Tách Pool theo Isolation Level**

```java
// Pool cho read (READ COMMITTED - đọc data mới nhất)
HikariConfig readConfig = new HikariConfig();
readConfig.setConnectionInitSql(
    "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
);
HikariDataSource readPool = new HikariDataSource(readConfig);

// Pool cho write (REPEATABLE READ - consistency)
HikariConfig writeConfig = new HikariConfig();
writeConfig.setConnectionInitSql(
    "SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ"
);
HikariDataSource writePool = new HikariDataSource(writeConfig);
```

### **9. Advanced Topics**

#### **9.1. Connection Pool Patterns**

**Pattern 1: Read/Write Separation**

```java
// Separate pools for read and write
HikariDataSource readPool;   // Nhiều connections, READ COMMITTED
HikariDataSource writePool;  // Ít connections, REPEATABLE READ
```

**Pattern 2: Tenant-based Pools**

```java
// Pool riêng cho mỗi tenant
Map<String, HikariDataSource> tenantPools;
// → Isolation tốt hơn, dễ scale
```

**Pattern 3: Shard-based Pools**

```java
// Pool riêng cho mỗi database shard
Map<Integer, HikariDataSource> shardPools;
// → Load balancing tốt hơn
```

#### **9.2. Connection Pool với Connection String Routing**

```java
// Dynamic connection string based on shard
public Connection getConnectionForShard(int shardId) {
    String jdbcUrl = buildJdbcUrl(shardId);
    HikariDataSource pool = shardPools.get(shardId);
    return pool.getConnection();
}
```

### **10. Kết luận**

Connection Pool là một kỹ thuật quan trọng để tối ưu hiệu năng database:

**Điểm quan trọng:**

1. ✅ **Giảm overhead đáng kể**: Từ 50–200ms xuống 1–5ms
2. ✅ **Tăng throughput**: Xử lý nhiều requests đồng thời
3. ✅ **Quản lý tài nguyên**: Kiểm soát số connections
4. ✅ **Tính toán `max` hợp lý**: Dựa trên workload
5. ✅ **Luôn release connections**: Tránh connection leak
6. ✅ **Monitor metrics**: Phát hiện vấn đề sớm
7. ✅ **Health checks**: Đảm bảo connections hoạt động
8. ✅ **Graceful shutdown**: Cleanup khi ứng dụng tắt

**Best Practice:**

- Sử dụng library đã được test (HikariCP, c3p0, DBCP)
- Monitor và tune pool size theo workload thực tế
- Tách pool theo use case (read/write, tenant, shard)

## VIII. Giới hạn & Hiệu năng của MySQL

Hiểu rõ giới hạn và hiệu năng của MySQL giúp thiết kế hệ thống phù hợp, tránh bottlenecks và đạt performance tối ưu.

### **1. Các giới hạn của MySQL**

#### **1.1. Giới hạn về kích thước và cấu trúc**

| Hạng mục                     | Giới hạn                               | Ghi chú                                        |
| ---------------------------- | -------------------------------------- | ---------------------------------------------- |
| **Kích thước bảng (InnoDB)** | ~64 TB                                 | Phụ thuộc file system (ext4: 16TB, xfs: 500TB) |
| **Kích thước hàng (row)**    | 65,535 bytes (không tính BLOB/TEXT)    | BLOB/TEXT được lưu off-page                    |
| **Kích thước cột VARCHAR**   | 65,535 bytes                           | UTF-8: ~21,844 ký tự                           |
| **Kích thước TEXT**          | 65,535 bytes (TEXT), 16MB (MEDIUMTEXT) | Lưu off-page, không tính vào row size          |
| **Số cột tối đa**            | 4096                                   | Thực tế thường <100 cho hiệu năng tốt          |
| **Số index trên 1 bảng**     | 64 (trước 5.7) / Không giới hạn (5.7+) | Nhiều index → chậm INSERT/UPDATE               |
| **Độ sâu index B-Tree**      | ~3-4 levels (với 1M rows)              | Mỗi level = 1 disk read                        |
| **Kích thước index key**     | 3072 bytes (InnoDB)                    | Composite index: tổng các cột ≤ 3072 bytes     |

**Chi tiết:**

**a) Kích thước bảng:**

```sql
-- Kiểm tra kích thước bảng
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'your_database'
ORDER BY (data_length + index_length) DESC;

-- Giới hạn thực tế:
-- - InnoDB: 64 TB (theo lý thuyết)
-- - Thực tế: File system limit (ext4: 16TB, xfs: 500TB)
-- - Nên partition khi > 10GB cho hiệu năng tốt
```

**b) Kích thước row:**

```sql
-- Kiểm tra row size
SELECT
    table_name,
    avg_row_length,
    data_length / (table_rows + 1) as avg_row_size
FROM information_schema.TABLES
WHERE table_schema = 'your_database';

-- Giới hạn:
-- - Row data: 65,535 bytes
-- - BLOB/TEXT: Lưu off-page (không tính vào row size)
-- - Tối ưu: Giữ row size < 8KB cho hiệu năng tốt
```

**c) Số cột:**

```sql
-- Kiểm tra số cột trong bảng
SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.COLUMNS
WHERE table_schema = 'your_database'
GROUP BY table_name
ORDER BY column_count DESC;

-- Best practice:
-- - Giới hạn: 4096 columns
-- - Thực tế: Nên < 100 columns cho hiệu năng tốt
-- - Nhiều cột → chậm SELECT *, tốn memory cho buffer pool
```

#### **1.2. Giới hạn về connections và queries**

| Hạng mục                    | Giới hạn mặc định | Có thể tăng đến | Ghi chú                                |
| --------------------------- | ----------------- | --------------- | -------------------------------------- |
| **max_connections**         | 151               | Hàng ngàn       | Mỗi connection tốn ~256KB RAM          |
| **max_user_connections**    | 0 (unlimited)     | Per user limit  | Giới hạn cho từng user                 |
| **max_prepared_stmt_count** | 16382             | Có thể tăng     | Prepared statements                    |
| **table_open_cache**        | 4000              | 200000          | Số bảng có thể mở đồng thời            |
| **table_definition_cache**  | 1400              | 2000            | Số table definitions cached            |
| **query_cache_size**        | 0 (từ 8.0)        | Deprecated      | Query cache đã bị loại bỏ từ MySQL 8.0 |

**Chi tiết:**

**a) max_connections:**

```sql
-- Kiểm tra và set max_connections
SHOW VARIABLES LIKE 'max_connections';
-- Mặc định: 151

-- Set trong my.cnf:
-- [mysqld]
-- max_connections = 1000

-- Tính toán RAM cần thiết:
-- RAM = max_connections × (thread_stack + connection_overhead)
-- Ví dụ: 1000 connections × 256KB = ~256MB

-- Kiểm tra connections hiện tại:
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
```

**b) Connection overhead:**

```
Mỗi connection tốn:
- Thread stack: ~256KB
- Connection buffer: ~256KB
- Total: ~512KB per connection

1000 connections = ~512MB RAM
10000 connections = ~5GB RAM
```

#### **1.3. Giới hạn về transactions và locks**

| Hạng mục                         | Giới hạn                       | Ghi chú                         |
| -------------------------------- | ------------------------------ | ------------------------------- |
| **InnoDB log file size**         | 4GB per file (default 2 files) | Tổng 8GB redo log               |
| **InnoDB buffer pool size**      | Phụ thuộc RAM                  | Khuyến nghị: 70-80% RAM         |
| **Transaction isolation levels** | 4 levels                       | READ UNCOMMITTED → SERIALIZABLE |
| **Lock wait timeout**            | 50 giây (mặc định)             | Có thể điều chỉnh               |
| **Deadlock detection**           | Automatic (InnoDB)             | Rollback transaction nhỏ hơn    |
| **Max locks per transaction**    | 10,000,000                     | InnoDB lock limit               |

### **2. Hiệu năng thực tế (Performance Benchmarks)**

#### **2.1. Throughput (TPS - Transactions Per Second)**

**TPS theo cấu hình:**

| Cấu hình                        | Read TPS | Write TPS | Mixed TPS | Ghi chú                        |
| ------------------------------- | -------- | --------- | --------- | ------------------------------ |
| **InnoDB, HDD, default config** | 1k–5k    | 500–2k    | 1k–3k     | Cấu hình cơ bản                |
| **InnoDB, SSD, default config** | 5k–20k   | 2k–10k    | 3k–15k    | Cải thiện đáng kể với SSD      |
| **InnoDB, SSD, optimized**      | 20k–50k  | 10k–30k   | 15k–40k   | Tối ưu buffer pool, indexes    |
| **InnoDB, SSD, cluster**        | 50k–100k | 30k–80k   | 40k–90k   | Read replicas, connection pool |
| **MyISAM (read-only)**          | 100k+    | —         | —         | Chỉ cho read-only workloads    |

**Yếu tố ảnh hưởng TPS:**

1. **Storage type:**

   - HDD: ~1k–5k TPS
   - SSD: ~10k–50k TPS
   - NVMe SSD: ~50k–100k TPS

2. **Buffer pool size:**

   - < 1GB: Giới hạn bởi disk I/O
   - 1–8GB: Cải thiện đáng kể
   - > 8GB: Diminishing returns

3. **Query complexity:**
   - Simple SELECT: ~50k–100k QPS
   - JOIN queries: ~1k–10k QPS
   - Aggregations: ~500–5k QPS

#### **2.2. Latency (Thời gian phản hồi)**

| Loại query                   | Latency (p50) | Latency (p99) | Ghi chú                 |
| ---------------------------- | ------------- | ------------- | ----------------------- |
| **Primary key lookup**       | < 1ms         | < 5ms         | Index hit, trong memory |
| **Index range scan**         | 1–10ms        | 10–50ms       | Phụ thuộc số rows       |
| **Full table scan (small)**  | 10–100ms      | 100–500ms     | < 1M rows               |
| **Full table scan (large)**  | 100ms–10s     | 1s–60s        | > 10M rows              |
| **JOIN (2 tables, indexed)** | 5–50ms        | 50–200ms      | Với indexes tốt         |
| **JOIN (3+ tables)**         | 20–200ms      | 200ms–2s      | Phụ thuộc complexity    |
| **Aggregation (GROUP BY)**   | 10–500ms      | 500ms–10s     | Phụ thuộc số groups     |
| **INSERT (single row)**      | 1–5ms         | 5–20ms        | Auto-increment          |
| **INSERT (bulk 1000 rows)**  | 50–200ms      | 200ms–1s      | Batch insert            |
| **UPDATE (indexed)**         | 1–10ms        | 10–50ms       | Với WHERE có index      |
| **DELETE (indexed)**         | 1–10ms        | 10–50ms       | Với WHERE có index      |

**Benchmark test:**

```bash
# Test latency với sysbench
# Install: sudo apt-get install sysbench

# 1. Prepare test data (1M rows)
sysbench mysql \
  --mysql-host=localhost \
  --mysql-user=root \
  --mysql-password=password \
  --mysql-db=testdb \
  --tables=1 \
  --table-size=1000000 \
  prepare

# 2. Run read-only test
sysbench mysql \
  --mysql-host=localhost \
  --mysql-user=root \
  --mysql-password=password \
  --mysql-db=testdb \
  --threads=16 \
  --time=60 \
  --report-interval=10 \
  oltp_read_only \
  run

# Kết quả mẫu:
# queries: 50000 (833.33 per sec)
# latency: 12ms (avg), 25ms (p99)
```

#### **2.3. Concurrent connections performance**

| Số connections đồng thời | TPS trung bình | Latency (p99) | Tình trạng               |
| ------------------------ | -------------- | ------------- | ------------------------ |
| **1–10**                 | 100%           | Baseline      | Optimal                  |
| **10–50**                | 95–100%        | +10%          | Good                     |
| **50–100**               | 80–95%         | +20%          | Acceptable               |
| **100–500**              | 60–80%         | +50%          | Cần optimize             |
| **500–1000**             | 40–60%         | +100%         | Cần scaling              |
| **> 1000**               | < 40%          | +200%+        | Cần sharding/replication |

**Nguyên nhân giảm hiệu năng khi nhiều connections:**

1. **Context switching overhead**
2. **Lock contention** (InnoDB row locks)
3. **Buffer pool contention**
4. **Network I/O bottleneck**

### **3. Các yếu tố ảnh hưởng hiệu năng**

#### **3.1. Hardware Factors**

**CPU:**

- **Cores**: MySQL đa luồng tốt với nhiều cores
- **Clock speed**: Quan trọng cho single-threaded queries
- **Cache**: L1/L2/L3 cache ảnh hưởng lớn đến performance

**RAM:**

- **Buffer pool size**: 70–80% RAM cho InnoDB
- **Query cache**: Deprecated từ MySQL 8.0
- **Sort buffer**: `sort_buffer_size`, `read_buffer_size`

**Storage:**

- **IOPS**: Quan trọng nhất cho database
  - HDD: ~100–200 IOPS
  - SSD: ~10k–100k IOPS
  - NVMe: ~100k–1M IOPS
- **Latency**:
  - HDD: 5–10ms
  - SSD: 0.1–1ms
  - NVMe: 0.01–0.1ms

**Network:**

- **Bandwidth**: 1Gbps → 10Gbps → 100Gbps
- **Latency**: < 1ms (local), < 10ms (same region)

#### **3.2. Configuration Factors**

**InnoDB Settings:**

```ini
# my.cnf - Tối ưu cho server 16GB RAM
[mysqld]
# Buffer pool (70% RAM)
innodb_buffer_pool_size = 11G
innodb_buffer_pool_instances = 8

# Log files
innodb_log_file_size = 2G
innodb_log_buffer_size = 64M

# Flush method
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1  # ACID, chậm hơn
# hoặc = 2 cho performance, trade-off durability

# Thread concurrency
innodb_thread_concurrency = 0  # Unlimited
innodb_read_io_threads = 4
innodb_write_io_threads = 4
```

**Connection settings:**

```ini
max_connections = 1000
thread_cache_size = 50
table_open_cache = 4000
```

#### **3.3. Application Factors**

**Query patterns:**

- ✅ **Tốt**: Indexed lookups, prepared statements, batch operations
- ❌ **Xấu**: Full table scans, N+1 queries, SELECT \*

**Connection management:**

- ✅ **Tốt**: Connection pooling, keep-alive
- ❌ **Xấu**: Mở/đóng connection mỗi query

**Transaction management:**

- ✅ **Tốt**: Ngắn, chỉ lock khi cần
- ❌ **Xấu**: Dài, lock nhiều rows

### **4. So sánh hiệu năng MySQL với các database khác**

| Database         | Read TPS | Write TPS | ACID Support | Use Case                   |
| ---------------- | -------- | --------- | ------------ | -------------------------- |
| **MySQL InnoDB** | 20k–50k  | 10k–30k   | ✅ Full      | General purpose, web apps  |
| **PostgreSQL**   | 15k–40k  | 10k–25k   | ✅ Full      | Complex queries, analytics |
| **MongoDB**      | 50k–100k | 30k–80k   | ⚠️ Limited   | Document store, flexible   |
| **Redis**        | 100k+    | 100k+     | ❌ No        | Cache, sessions, real-time |
| **Cassandra**    | 100k+    | 50k–100k  | ❌ No        | Distributed, high write    |

**Kết luận:**

- MySQL cân bằng tốt giữa **consistency** và **performance**
- Phù hợp cho hầu hết ứng dụng web thông thường
- Có thể scale với replication và sharding

### **5. Benchmarks và Testing**

#### **5.1. Tools để benchmark**

**sysbench:**

```bash
# Install
sudo apt-get install sysbench

# Test read-only
sysbench mysql --mysql-db=testdb oltp_read_only run

# Test read-write
sysbench mysql --mysql-db=testdb oltp_read_write run
```

**mysqlslap:**

```bash
# Simulate concurrent clients
mysqlslap \
  --user=root \
  --password=password \
  --host=localhost \
  --concurrency=100 \
  --iterations=10 \
  --query="SELECT * FROM users WHERE id=1"
```

#### **5.2. Metrics cần theo dõi**

**Performance metrics:**

```sql
-- Queries per second
SHOW GLOBAL STATUS LIKE 'Questions';
SHOW GLOBAL STATUS LIKE 'Queries';

-- Slow queries
SHOW GLOBAL STATUS LIKE 'Slow_queries';

-- Connection stats
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Max_used_connections';

-- InnoDB stats
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read_requests';
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_reads';
-- Hit rate = (requests - reads) / requests × 100%
```

**Calculate buffer pool hit rate:**

```sql
SELECT
  (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100
  AS buffer_pool_hit_rate
FROM (
  SELECT
    VARIABLE_VALUE AS Innodb_buffer_pool_reads
  FROM information_schema.GLOBAL_STATUS
  WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads'
) reads,
(
  SELECT
    VARIABLE_VALUE AS Innodb_buffer_pool_read_requests
  FROM information_schema.GLOBAL_STATUS
  WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests'
) requests;
-- Mục tiêu: > 99%
```

### **6. Best Practices để đạt hiệu năng tốt**

#### **6.1. Hardware optimization**

1. ✅ **SSD thay vì HDD**: Cải thiện 10–100x IOPS
2. ✅ **Đủ RAM**: Buffer pool = 70–80% RAM
3. ✅ **CPU cores**: MySQL scale tốt với nhiều cores
4. ✅ **Network**: 10Gbps cho high-load applications

#### **6.2. Configuration optimization**

1. ✅ **Buffer pool size**: Đủ lớn để cache toàn bộ hot data
2. ✅ **Log file size**: 2–4GB per file (4–8GB total)
3. ✅ **Connection limits**: Phù hợp với workload
4. ✅ **Query cache**: Không dùng (deprecated từ 8.0)

#### **6.3. Application optimization**

1. ✅ **Indexes**: Đảm bảo có indexes cho WHERE, JOIN, ORDER BY
2. ✅ **Query optimization**: Tránh SELECT \*, N+1 queries
3. ✅ **Connection pooling**: Tái sử dụng connections
4. ✅ **Batch operations**: INSERT/UPDATE nhiều rows cùng lúc

#### **6.4. Monitoring và tuning**

1. ✅ **Monitor buffer pool hit rate**: Mục tiêu > 99%
2. ✅ **Monitor slow query log**: Tối ưu queries > 1s
3. ✅ **Monitor connections**: Tránh quá tải
4. ✅ **Regular maintenance**: ANALYZE TABLE, OPTIMIZE TABLE

### **7. Kết luận**

**Giới hạn MySQL:**

- Đủ lớn cho hầu hết ứng dụng thực tế
- Có thể scale với partitioning, replication, sharding
- Cần hiểu rõ để thiết kế hệ thống phù hợp

**Hiệu năng thực tế:**

- **20k–50k TPS** với cấu hình tối ưu
- **< 1ms latency** cho indexed lookups
- Có thể scale lên **100k+ TPS** với replication và clustering

**Yếu tố quan trọng nhất:**

1. **Storage type** (SSD > HDD)
2. **Buffer pool size** (đủ lớn để cache hot data)
3. **Indexes** (đảm bảo queries dùng indexes)
4. **Query optimization** (tránh full table scans)

**Best practice:**

- Benchmark với workload thực tế
- Monitor metrics liên tục
- Tune dựa trên data thực tế, không phải assumptions

## IX. Nâng cao hiệu năng (Performance Tuning)

Performance Tuning là quá trình tối ưu hóa MySQL để đạt hiệu năng cao nhất với tài nguyên có sẵn. Có nhiều kỹ thuật và chiến lược khác nhau, từ đơn giản đến phức tạp.

### **1. Partitioning (Phân vùng bảng)**

Partitioning chia một bảng lớn thành nhiều phần vật lý nhỏ hơn, giúp cải thiện hiệu năng truy vấn và quản lý dữ liệu.

#### **1.1. Khi nào nên dùng Partitioning?**

**✅ Nên dùng khi:**

- Bảng có **> 10GB** dữ liệu
- Có cột **date/time** để phân vùng theo thời gian
- Cần **xóa dữ liệu cũ** thường xuyên (drop partition nhanh hơn DELETE)
- Truy vấn thường filter theo cột phân vùng
- Cần **parallel processing** cho queries lớn

**❌ Không nên dùng khi:**

- Bảng nhỏ (< 1GB)
- Không có cột phù hợp để phân vùng
- Queries không filter theo partition key
- Quá nhiều partitions (> 1000) gây overhead

#### **1.2. Các loại Partitioning**

**a) RANGE Partitioning:**

```sql
-- Phân vùng theo range giá trị (thường dùng cho date)
CREATE TABLE orders (
  id INT AUTO_INCREMENT,
  user_id INT,
  order_date DATE,
  total DECIMAL(10,2),
  PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (YEAR(order_date)) (
  PARTITION p2022 VALUES LESS THAN (2023),
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Query tự động chỉ scan partition liên quan
SELECT * FROM orders WHERE order_date >= '2024-01-01';
-- → Chỉ scan partition p2024

-- Xóa partition cũ (rất nhanh)
ALTER TABLE orders DROP PARTITION p2022;
-- → Nhanh hơn DELETE rất nhiều!
```

**b) LIST Partitioning:**

```sql
-- Phân vùng theo danh sách giá trị cụ thể
CREATE TABLE users (
  id INT AUTO_INCREMENT,
  name VARCHAR(100),
  region VARCHAR(50),
  PRIMARY KEY (id, region)
) PARTITION BY LIST COLUMNS (region) (
  PARTITION p_north VALUES IN ('north', 'northeast'),
  PARTITION p_south VALUES IN ('south', 'southeast'),
  PARTITION p_west VALUES IN ('west', 'northwest'),
  PARTITION p_east VALUES IN ('east', 'southeast')
);

-- Query tự động chỉ scan partition liên quan
SELECT * FROM users WHERE region = 'north';
-- → Chỉ scan partition p_north
```

**c) HASH Partitioning:**

```sql
-- Phân vùng đều theo hash function
CREATE TABLE products (
  id INT AUTO_INCREMENT,
  name VARCHAR(100),
  category_id INT,
  PRIMARY KEY (id, category_id)
) PARTITION BY HASH(category_id)
PARTITIONS 4;

-- Hash tự động phân bố đều
-- Không kiểm soát được row nào vào partition nào
```

**d) KEY Partitioning:**

```sql
-- Tương tự HASH nhưng dùng hash function của MySQL
CREATE TABLE logs (
  id INT AUTO_INCREMENT,
  user_id INT,
  log_data TEXT,
  PRIMARY KEY (id, user_id)
) PARTITION BY KEY(user_id)
PARTITIONS 8;
```

**e) Composite Partitioning:**

```sql
-- Kết hợp RANGE và HASH
CREATE TABLE sales (
  id INT AUTO_INCREMENT,
  sale_date DATE,
  product_id INT,
  amount DECIMAL(10,2),
  PRIMARY KEY (id, sale_date, product_id)
) PARTITION BY RANGE (YEAR(sale_date))
SUBPARTITION BY HASH(product_id)
SUBPARTITIONS 4 (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025)
);
-- → 2 partitions × 4 subpartitions = 8 partitions tổng cộng
```

#### **1.3. Tối ưu Partitioning**

**Best practices:**

1. ✅ **Chọn partition key phù hợp:**

   - Thường dùng cột **date/time** (RANGE)
   - Hoặc cột có **cardinality cao** (HASH/KEY)

2. ✅ **Số partitions hợp lý:**

   - RANGE: 10–50 partitions (tùy data)
   - HASH/KEY: 2^n partitions (2, 4, 8, 16, 32)
   - Tránh quá nhiều (> 1000) gây overhead

3. ✅ **Partition pruning:**
   - Đảm bảo WHERE clause có partition key
   - MySQL tự động skip partitions không liên quan

```sql
-- ✅ Tốt: Partition pruning hoạt động
SELECT * FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01';

-- ❌ Xấu: Phải scan tất cả partitions
SELECT * FROM orders WHERE user_id = 123;
-- → Không có partition key trong WHERE → scan tất cả
```

4. ✅ **Maintenance:**

```sql
-- Thêm partition mới (cho RANGE)
ALTER TABLE orders ADD PARTITION (
  PARTITION p2025 VALUES LESS THAN (2026)
);

-- Xóa partition cũ
ALTER TABLE orders DROP PARTITION p2022;

-- Reorganize partition
ALTER TABLE orders REORGANIZE PARTITION p_future INTO (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Kiểm tra partitions
SELECT
  PARTITION_NAME,
  TABLE_ROWS,
  DATA_LENGTH / 1024 / 1024 AS size_mb
FROM information_schema.PARTITIONS
WHERE TABLE_SCHEMA = 'your_db'
  AND TABLE_NAME = 'orders';
```

#### **1.4. Hạn chế của Partitioning**

**Không hỗ trợ:**

- Foreign keys giữa partitioned tables
- Full-text indexes trên partitioned tables
- Spatial indexes
- Subpartitioning với các loại khác nhau

**Overhead:**

- Metadata overhead cho mỗi partition
- Quá nhiều partitions → chậm hơn
- Một số queries không được tối ưu tốt

### **2. Sharding (Phân mảnh dữ liệu)**

Sharding là kỹ thuật chia dữ liệu thành nhiều **database servers** riêng biệt, giúp scale ngang (horizontal scaling).

#### **2.1. Khái niệm Sharding**

**Vấn đề không sharding:**

```
Single Database Server
├── Users table: 100M rows
├── Orders table: 500M rows
└── Products table: 10M rows
→ Quá tải khi scale
```

**Với Sharding:**

```
Shard 1 (Server 1)          Shard 2 (Server 2)          Shard 3 (Server 3)
├── Users: 0-33M           ├── Users: 34-66M          ├── Users: 67-100M
├── Orders: 0-166M         ├── Orders: 167-333M       ├── Orders: 334-500M
└── Products: 0-3M         └── Products: 4-6M          └── Products: 7-10M
```

#### **2.2. Sharding Strategies**

**a) Range-based Sharding:**

```sql
-- Shard theo range giá trị
Shard 1: user_id 1-1000000
Shard 2: user_id 1000001-2000000
Shard 3: user_id 2000001-3000000

-- Ưu điểm: Dễ implement
-- Nhược điểm: Hot spots (shard mới có nhiều traffic)
```

**b) Hash-based Sharding:**

```sql
-- Shard theo hash function
shard_id = hash(user_id) % num_shards

-- Ưu điểm: Phân bố đều
-- Nhược điểm: Khó rebalance
```

**c) Directory-based Sharding:**

```sql
-- Dùng lookup table để map
shard_lookup_table:
  user_id | shard_id
  1       | shard_1
  1000001 | shard_2

-- Ưu điểm: Linh hoạt, dễ migrate
-- Nhược điểm: Cần lookup table (single point of failure)
```

**d) Geographic Sharding:**

```sql
-- Shard theo địa lý
Shard US: Users ở Mỹ
Shard EU: Users ở Châu Âu
Shard ASIA: Users ở Châu Á

-- Ưu điểm: Giảm latency, compliance
-- Nhược điểm: Phức tạp quản lý
```

#### **2.3. Sharding Key Selection**

**Quan trọng: Chọn shard key đúng:**

✅ **Tốt:**

- **user_id**: Phân bố đều, queries thường filter theo user
- **tenant_id**: Multi-tenant applications
- **region**: Geographic distribution

❌ **Xấu:**

- **created_at**: Hot spots (shard mới có nhiều traffic)
- **status**: Không phân bố đều (nhiều "active", ít "deleted")
- **email**: Không cần thiết cho queries

**Ví dụ:**

```sql
-- ✅ Tốt: Shard theo user_id
SELECT * FROM orders WHERE user_id = 123;
-- → Chỉ query shard chứa user_id = 123

-- ❌ Xấu: Query không có shard key
SELECT * FROM orders WHERE order_date > '2024-01-01';
-- → Phải query TẤT CẢ shards → chậm!
```

#### **2.4. Sharding Challenges**

**a) Cross-shard Queries:**

```sql
-- Query cần data từ nhiều shards
SELECT u.name, SUM(o.total)
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- Giải pháp:
-- 1. Aggregate trên mỗi shard
-- 2. Merge kết quả ở application layer
-- 3. Hoặc dùng materialized view
```

**b) Transactions across Shards:**

```sql
-- Transaction cần update nhiều shards
BEGIN;
UPDATE users SET balance = balance - 100 WHERE id = 1; -- Shard 1
UPDATE orders SET status = 'paid' WHERE id = 123; -- Shard 2
COMMIT;

-- Giải pháp:
-- 1. Two-phase commit (phức tạp, chậm)
-- 2. Saga pattern (compensating transactions)
-- 3. Design để tránh cross-shard transactions
```

**c) Rebalancing:**

```sql
-- Khi một shard quá lớn, cần chia lại
-- Quá trình:
-- 1. Tạo shard mới
-- 2. Migrate data từ shard cũ
-- 3. Update routing logic
-- 4. Verify data integrity
-- 5. Switch traffic
```

#### **2.5. Sharding Tools và Middleware**

**a) Application-level Sharding:**

```javascript
// Tự implement trong ứng dụng
function getShard(userId) {
  const shardId = hash(userId) % NUM_SHARDS;
  return shards[shardId];
}

const shard = getShard(userId);
const orders = await shard.query("SELECT * FROM orders WHERE user_id = ?", [
  userId,
]);
```

**b) Proxy-based Sharding:**

```
Application → ProxySQL/Vitess → MySQL Shards
             ↑
       Routing logic ở đây
```

**Vitess (Youtube):**

- Automatic sharding
- Connection pooling
- Query routing
- Rebalancing

**ProxySQL:**

- Query routing rules
- Load balancing
- Read/write splitting

**c) Database-level Sharding:**

```sql
-- MySQL Cluster (NDB)
-- Tự động sharding ở database level
-- Phức tạp, ít dùng trong production
```

### **3. Master–Slave Replication**

Replication tạo bản sao dữ liệu từ Master sang Slave(s), cho phép scale read operations và tăng availability.

#### **3.1. Kiến trúc Replication**

```
┌─────────────┐
│   Master    │ ← Write operations
│  (Primary)  │
└──────┬──────┘
       │ Binary Log
       │
       ├──────────────┬──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│   Slave 1   │ │  Slave 2  │ │  Slave 3  │
│  (Replica)  │ │ (Replica) │ │ (Replica) │
└─────────────┘ └───────────┘ └───────────┘
     ↑              ↑              ↑
     └──────────────┴──────────────┘
          Read operations
```

#### **3.2. Setup Master–Slave Replication**

**Step 1: Cấu hình Master**

```ini
# Master my.cnf
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW
binlog-row-image = FULL
```

**Step 2: Tạo replication user trên Master**

```sql
CREATE USER 'replica'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
FLUSH PRIVILEGES;

-- Lấy binlog position
FLUSH TABLES WITH READ LOCK;
SHOW MASTER STATUS;
-- Ghi lại: File và Position
UNLOCK TABLES;
```

**Step 3: Backup và restore trên Slave**

```bash
# Trên Master
mysqldump --all-databases --master-data=2 > backup.sql

# Trên Slave
mysql < backup.sql
```

**Step 4: Cấu hình Slave**

```ini
# Slave my.cnf
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
read-only = 1
```

**Step 5: Start replication trên Slave**

```sql
CHANGE MASTER TO
  MASTER_HOST='master_ip',
  MASTER_USER='replica',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=154;

START SLAVE;

-- Kiểm tra status
SHOW SLAVE STATUS\G
-- Xem: Slave_IO_Running, Slave_SQL_Running = Yes
```

#### **3.3. Replication Types**

**a) Statement-based Replication (SBR):**

- Ghi lại SQL statements
- Nhỏ gọn, nhưng có thể không deterministic
- Deprecated từ MySQL 5.7.7

**b) Row-based Replication (RBR):**

- Ghi lại changes của từng row
- An toàn hơn, nhưng tốn băng thông
- **Recommended từ MySQL 5.7.7**

**c) Mixed Replication:**

- Kết hợp SBR và RBR
- Tự động chọn theo query

#### **3.4. Read/Write Splitting**

**Vấn đề:**

```javascript
// Tất cả queries đi đến một server
const result = await db.query("SELECT * FROM users");
const orders = await db.query("SELECT * FROM orders");
// → Master bị quá tải với reads
```

**Giải pháp: Read/Write Splitting**

```javascript
// Application-level
class Database {
  constructor() {
    this.master = mysql.createConnection(masterConfig);
    this.slaves = [
      mysql.createConnection(slave1Config),
      mysql.createConnection(slave2Config),
    ];
  }

  async query(sql, params) {
    // Write operations → Master
    if (sql.match(/INSERT|UPDATE|DELETE|CREATE|ALTER|DROP/i)) {
      return this.master.query(sql, params);
    }

    // Read operations → Slave (round-robin)
    const slave = this.getSlave();
    return slave.query(sql, params);
  }

  getSlave() {
    // Round-robin hoặc load balancing
    return this.slaves[Math.floor(Math.random() * this.slaves.length)];
  }
}
```

**ProxySQL cho Read/Write Splitting:**

```sql
-- ProxySQL config
INSERT INTO mysql_servers(hostgroup_id, hostname, port) VALUES
(0, 'master', 3306),  -- Write group
(1, 'slave1', 3306), -- Read group
(1, 'slave2', 3306); -- Read group

-- Routing rules
INSERT INTO mysql_query_rules(rule_id, match_pattern, destination_hostgroup) VALUES
(1, '^SELECT.*FOR UPDATE', 0),  -- SELECT FOR UPDATE → Master
(2, '^SELECT', 1),              -- SELECT → Slaves
(3, '.*', 0);                   -- Default → Master
```

#### **3.5. Replication Lag và Monitoring**

**Replication Lag:**

```sql
-- Kiểm tra lag trên Slave
SHOW SLAVE STATUS\G

-- Quan trọng:
-- Seconds_Behind_Master: Số giây lag
-- Relay_Log_Pos: Position của relay log
-- Exec_Master_Log_Pos: Position đã execute

-- Kiểm tra lag real-time
SELECT
  TIMESTAMPDIFF(SECOND,
    (SELECT MAX(ts) FROM master.log_table),
    (SELECT MAX(ts) FROM slave.log_table)
  ) AS lag_seconds;
```

**Giảm Replication Lag:**

1. ✅ **Parallel replication** (MySQL 5.6+):

```ini
slave_parallel_workers = 4
slave_parallel_type = LOGICAL_CLOCK
```

2. ✅ **Tối ưu queries trên Master**: Queries chậm → lag cao
3. ✅ **Network bandwidth**: Đảm bảo đủ băng thông
4. ✅ **Slave hardware**: Slave nhanh hơn hoặc bằng Master

#### **3.6. Failover và High Availability**

**Manual Failover:**

```sql
-- 1. Đọc-only Master
SET GLOBAL read_only = 1;

-- 2. Kiểm tra lag trên Slave
SHOW SLAVE STATUS\G

-- 3. Stop replication
STOP SLAVE;

-- 4. Promote Slave thành Master
STOP SLAVE;
RESET SLAVE;
SET GLOBAL read_only = 0;

-- 5. Update application config
-- Point to new master
```

**Automatic Failover với MHA (Master High Availability):**

```bash
# MHA tự động detect master failure
# Tự động promote best slave thành master
# Tự động update các slaves khác
```

**MySQL Group Replication (MySQL 5.7.17+):**

```sql
-- Multi-master replication
-- Tự động failover
-- Strong consistency
-- Phức tạp hơn nhưng robust hơn
```

### **4. Caching Layer**

Caching là một trong những cách hiệu quả nhất để cải thiện hiệu năng, giảm load trên database.

#### **4.1. Cache Strategies**

**a) Cache-aside (Lazy Loading):**

```
Application Flow:
1. Check cache
2. If miss → Query database
3. Store result in cache
4. Return result

❌ Cache miss → 2 queries (cache + DB)
✅ Đơn giản, dễ implement
```

```javascript
async function getUser(userId) {
  // 1. Check cache
  let user = await redis.get(`user:${userId}`);

  if (!user) {
    // 2. Query database
    user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    // 3. Store in cache (TTL 1 hour)
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  }

  return JSON.parse(user);
}
```

**b) Write-through:**

```
Application Flow:
1. Write to cache
2. Write to database
3. Return

✅ Cache luôn consistent
❌ Slower writes (2 writes)
```

```javascript
async function updateUser(userId, data) {
  // 1. Update database
  await db.query("UPDATE users SET ... WHERE id = ?", [userId]);

  // 2. Update cache
  const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
}
```

**c) Write-back (Write-behind):**

```
Application Flow:
1. Write to cache only
2. Async write to database later

✅ Very fast writes
❌ Risk of data loss (cache crash)
❌ Complexity cao
```

#### **4.2. Cache Invalidation**

**Vấn đề: Cache có thể stale**

**Giải pháp:**

**a) TTL (Time-To-Live):**

```javascript
// Cache tự động expire sau 1 giờ
await redis.setex("key", 3600, value);

// ✅ Đơn giản
// ❌ Có thể serve stale data trong TTL
```

**b) Invalidate on Update:**

```javascript
async function updateUser(userId, data) {
  // 1. Update database
  await db.query("UPDATE users ...");

  // 2. Invalidate cache
  await redis.del(`user:${userId}`);
  await redis.del("users:list"); // Invalidate related caches

  // ✅ Fresh data
  // ❌ Cache miss sau update
}
```

**c) Cache Tags:**

```javascript
// Group related cache keys
await redis.sadd("user:123:tags", "users", "user_list", "profile");

// Invalidate all with tag
async function invalidateTag(tag) {
  const keys = await redis.smembers(`${tag}:keys`);
  await redis.del(...keys);
}
```

#### **4.3. Cache Patterns**

**a) Query Result Caching:**

```javascript
// Cache kết quả query
const cacheKey = `query:${hash(sql + JSON.stringify(params))}`;
const cached = await redis.get(cacheKey);

if (cached) return JSON.parse(cached);

const result = await db.query(sql, params);
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
```

**b) Object Caching:**

```javascript
// Cache objects (users, products, etc.)
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  await redis.setex(cacheKey, 3600, JSON.stringify(user));
  return user;
}
```

**c) Cache Warming:**

```javascript
// Pre-load cache với hot data
async function warmCache() {
  const hotUsers = await db.query(
    "SELECT * FROM users ORDER BY last_login DESC LIMIT 1000"
  );

  for (const user of hotUsers) {
    await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user));
  }
}

// Run on startup hoặc scheduled job
```

**d) Cache Stampede Prevention:**

```javascript
// Tránh nhiều requests cùng query khi cache miss
async function getUserWithLock(userId) {
  const cacheKey = `user:${userId}`;
  const lockKey = `lock:user:${userId}`;

  // Try get from cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try acquire lock
  const lock = await redis.set(lockKey, "1", "EX", 10, "NX");
  if (!lock) {
    // Another process is fetching, wait and retry
    await sleep(100);
    return getUserWithLock(userId);
  }

  try {
    // Query database
    const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    // Store in cache
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
    return user;
  } finally {
    // Release lock
    await redis.del(lockKey);
  }
}
```

#### **4.4. Redis vs Memcached**

| Feature          | Redis                                     | Memcached      |
| ---------------- | ----------------------------------------- | -------------- |
| **Data types**   | Strings, Lists, Sets, Hashes, Sorted Sets | Strings only   |
| **Persistence**  | ✅ RDB, AOF                               | ❌ No          |
| **Replication**  | ✅ Master-Slave                           | ❌ No          |
| **Memory usage** | Higher (overhead)                         | Lower          |
| **Performance**  | Slightly slower                           | Faster         |
| **Use case**     | Rich features needed                      | Simple caching |

**Khi nào dùng Redis:**

- Cần persistence
- Cần complex data structures
- Cần pub/sub, Lua scripting

**Khi nào dùng Memcached:**

- Chỉ cần simple key-value caching
- Cần performance tối đa
- Không cần persistence

#### **4.5. Cache Best Practices**

1. ✅ **Cache hot data**: 80/20 rule - cache 20% data được access 80%
2. ✅ **Reasonable TTL**: Không quá dài (stale data) hoặc quá ngắn (cache miss)
3. ✅ **Cache invalidation**: Đảm bảo invalidate khi data thay đổi
4. ✅ **Monitor hit rate**: Mục tiêu > 80% cache hit rate
5. ✅ **Eviction policy**: LRU (Least Recently Used) cho memory management
6. ✅ **Cache sizing**: Đủ lớn để cache hot data, không quá lớn gây OOM

### **5. Query Optimization**

Query optimization là tối ưu hóa các truy vấn SQL để chạy nhanh hơn, hiệu quả hơn.

#### **5.1. Tools để phân tích queries**

**a) EXPLAIN:**

```sql
-- Xem execution plan
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- Các cột quan trọng:
-- type: ALL (bad), ref (good), const (best)
-- key: Index được dùng
-- rows: Số rows ước tính
-- Extra: Using index, Using filesort, etc.
```

**b) EXPLAIN ANALYZE (MySQL 8.0.18+):**

```sql
-- Thực thi query và show thời gian thực tế
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Output:
-- -> Index lookup on users using idx_email (actual time=0.1..0.2 rows=1 loops=1)
--    actual time: min..max (milliseconds)
```

**c) SHOW PROFILE:**

```sql
-- Enable profiling
SET profiling = 1;

-- Run query
SELECT * FROM users WHERE email = 'user@example.com';

-- Xem profile
SHOW PROFILE;
SHOW PROFILE FOR QUERY 1;

-- Các stages:
-- starting, checking permissions, opening tables,
-- init, optimizing, executing, end, query end
```

**d) Performance Schema:**

```sql
-- Enable performance schema
-- Xem trong performance_schema database

-- Xem queries chậm nhất
SELECT
  sql_text,
  exec_count,
  avg_timer_wait / 1000000000000 as avg_time_sec,
  max_timer_wait / 1000000000000 as max_time_sec
FROM performance_schema.events_statements_summary_by_digest
ORDER BY avg_timer_wait DESC
LIMIT 10;
```

**e) Slow Query Log:**

```ini
# my.cnf
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1  # Log queries > 1 second
log_queries_not_using_indexes = 1
```

```sql
-- Analyze slow query log
mysqldumpslow /var/log/mysql/slow.log

-- Hoặc dùng pt-query-digest (Percona Toolkit)
pt-query-digest /var/log/mysql/slow.log
```

#### **5.2. Query Optimization Techniques**

**a) Index Optimization:**

```sql
-- ✅ Đảm bảo có index cho WHERE, JOIN, ORDER BY
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_status_created ON orders(status, created_at);

-- ✅ Covering index (chỉ đọc index, không đọc bảng)
CREATE INDEX idx_user_covering ON orders(user_id, status, total);
SELECT user_id, status, total FROM orders WHERE user_id = 123;
-- → Chỉ đọc index, không đọc bảng!

-- ❌ Tránh indexes không dùng
-- Monitor unused indexes
SELECT
  t.table_schema,
  t.table_name,
  s.index_name,
  s.cardinality
FROM information_schema.statistics s
JOIN information_schema.tables t ON s.table_name = t.table_name
WHERE s.table_schema = 'your_db'
  AND s.index_name != 'PRIMARY'
  AND s.cardinality IS NULL;  -- Unused indexes
```

**b) SELECT Optimization:**

```sql
-- ❌ Chậm: SELECT *
SELECT * FROM users;

-- ✅ Nhanh: Chỉ SELECT cột cần
SELECT id, name, email FROM users;

-- Lý do:
-- - Giảm network traffic
-- - Giảm memory usage
-- - Có thể dùng covering index
```

**c) JOIN Optimization:**

```sql
-- ✅ Tốt: Index trên join keys
CREATE INDEX idx_user_id ON orders(user_id);
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- ✅ Tốt: Bảng nhỏ hơn làm driving table
-- MySQL optimizer tự động, nhưng có thể force:
SELECT /*+ STRAIGHT_JOIN */ ...

-- ❌ Xấu: Cartesian product
SELECT * FROM users, orders;  -- N × M rows!
```

**d) Subquery Optimization:**

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

**e) Aggregation Optimization:**

```sql
-- ✅ Tốt: Index hỗ trợ GROUP BY
CREATE INDEX idx_status ON orders(status);
SELECT status, COUNT(*) FROM orders GROUP BY status;
-- → type: index, Extra: Using index for group-by

-- ✅ Tốt: WHERE trước GROUP BY
SELECT status, COUNT(*)
FROM orders
WHERE created_at >= '2024-01-01'  -- Filter sớm
GROUP BY status;
```

**f) LIMIT Optimization:**

```sql
-- ✅ Tốt: LIMIT với ORDER BY có index
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10;
-- → Chỉ cần đọc 10 rows từ index

-- ❌ Xấu: LIMIT với ORDER BY không có index
SELECT * FROM users
ORDER BY name
LIMIT 10;
-- → Phải sort toàn bộ bảng rồi lấy 10 rows!
```

#### **5.3. Advanced Optimization**

**a) Prepared Statements:**

```javascript
// ✅ Tốt: Prepared statements
const stmt = await db.prepare("SELECT * FROM users WHERE id = ?");
const user = await stmt.execute([userId]);

// Benefits:
// - Parse once, execute many
// - SQL injection protection
// - Better caching
```

**b) Batch Operations:**

```sql
-- ❌ Chậm: Insert từng row
INSERT INTO orders (user_id, total) VALUES (1, 100);
INSERT INTO orders (user_id, total) VALUES (2, 200);
INSERT INTO orders (user_id, total) VALUES (3, 300);

-- ✅ Nhanh: Batch insert
INSERT INTO orders (user_id, total) VALUES
  (1, 100),
  (2, 200),
  (3, 300);
-- → 10-100x nhanh hơn!
```

**c) Bulk Updates:**

```sql
-- ❌ Chậm: Update từng row trong loop
UPDATE users SET status = 'active' WHERE id = 1;
UPDATE users SET status = 'active' WHERE id = 2;

-- ✅ Nhanh: Update nhiều rows cùng lúc
UPDATE users SET status = 'active' WHERE id IN (1, 2, 3, ...);
-- Hoặc dùng CASE
UPDATE users
SET status = CASE id
  WHEN 1 THEN 'active'
  WHEN 2 THEN 'active'
  ...
END
WHERE id IN (1, 2, 3, ...);
```

**d) Query Rewriting:**

```sql
-- ❌ Chậm: NOT IN
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM banned_users);

-- ✅ Nhanh: LEFT JOIN
SELECT u.*
FROM users u
LEFT JOIN banned_users b ON u.id = b.user_id
WHERE b.user_id IS NULL;

-- ❌ Chậm: LIKE với wildcard ở đầu
SELECT * FROM users WHERE email LIKE '%@example.com';

-- ✅ Nhanh: Full-text search hoặc reverse index
-- Hoặc dùng external search engine (Elasticsearch)
```

#### **5.4. Monitoring và Tuning**

**a) Key Metrics:**

```sql
-- Queries per second
SHOW GLOBAL STATUS LIKE 'Questions';
SHOW GLOBAL STATUS LIKE 'Queries';

-- Slow queries
SHOW GLOBAL STATUS LIKE 'Slow_queries';

-- Table scans
SHOW GLOBAL STATUS LIKE 'Handler_read_rnd_next';
-- Nếu cao → nhiều full table scans

-- Index usage
SHOW GLOBAL STATUS LIKE 'Handler_read_key';
SHOW GLOBAL STATUS LIKE 'Handler_read_next';
```

**b) Regular Maintenance:**

```sql
-- Analyze tables (update statistics)
ANALYZE TABLE users, orders;

-- Optimize tables (defragment)
OPTIMIZE TABLE users, orders;
-- ⚠️ LOCK table trong quá trình optimize

-- Check và repair
CHECK TABLE users;
REPAIR TABLE users;  -- Nếu cần
```

### **6. Kết luận về Performance Tuning**

**Tóm tắt các kỹ thuật:**

1. ✅ **Partitioning**: Cho bảng lớn (> 10GB), phân vùng theo thời gian
2. ✅ **Sharding**: Scale ngang khi single server không đủ
3. ✅ **Replication**: Scale reads, tăng availability
4. ✅ **Caching**: Giảm 70–90% database load
5. ✅ **Query Optimization**: Tối ưu từng query

**Thứ tự ưu tiên:**

1. **Query Optimization** (dễ nhất, hiệu quả cao)
2. **Indexes** (rất quan trọng)
3. **Caching** (giảm load đáng kể)
4. **Replication** (scale reads)
5. **Partitioning** (cho bảng lớn)
6. **Sharding** (cuối cùng, phức tạp nhất)

**Best Practice:**

- ✅ Đo đạc trước khi tối ưu (benchmark, profile)
- ✅ Tối ưu từng bước, verify sau mỗi thay đổi
- ✅ Monitor liên tục để phát hiện vấn đề sớm
- ✅ Balance giữa complexity và performance gain

## X. Kết luận

MySQL là hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, được sử dụng rộng rãi trong các ứng dụng web và doanh nghiệp. Để đạt được hiệu năng tối ưu với MySQL, cần hiểu rõ và áp dụng đúng các nguyên tắc, kỹ thuật và best practices đã được trình bày trong guide này.

### **Tổng kết các điểm chính:**

#### **1. Thiết kế cơ sở dữ liệu (Normalization)**

- ✅ **Chuẩn hóa** (1NF, 2NF, 3NF, 4NF, 5NF) giúp giảm redundancy, đảm bảo data integrity
- ✅ **Denormalization** có chọn lọc khi cần optimize read performance
- ✅ Cân bằng giữa normalization và performance theo từng use case

#### **2. Indexing (Chỉ mục)**

- ✅ **Indexes** là yếu tố quan trọng nhất cho query performance
- ✅ Hiểu rõ các loại index: PRIMARY, UNIQUE, BTREE, FULLTEXT, SPATIAL, HASH, **COMPOSITE**
- ✅ **Composite Index**: Áp dụng Leftmost Prefix Rule, chọn thứ tự cột dựa trên selectivity và query patterns
- ✅ Hiểu các loại scan: Index Unique Scan, Index Range Scan, **Index Full Scan**, Table Full Scan
- ✅ Covering Index giúp tránh đọc bảng, cải thiện hiệu năng đáng kể

#### **3. Chiến lược thực thi (Execution Strategy)**

- ✅ Sử dụng **EXPLAIN** và **EXPLAIN ANALYZE** để phân tích execution plan
- ✅ Hiểu các loại scan và join strategies
- ✅ Query Optimizer tự động tối ưu, nhưng có thể can thiệp với hints khi cần

#### **4. Cấu trúc truy vấn (Query Structure)**

- ✅ **WHERE**: Filter sớm, tránh functions trong WHERE, index trên filter columns
- ✅ **JOIN**: Index trên join keys, bảng nhỏ làm driving table, tránh Cartesian products
- ✅ **GROUP BY**: Index hỗ trợ, WHERE trước GROUP BY
- ✅ **ORDER BY**: Index hỗ trợ, kết hợp với LIMIT để giảm sort cost
- ✅ Hiểu thứ tự thực thi logic: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

#### **5. Subquery (Truy vấn lồng)**

- ✅ Chuyển **correlated subquery** thành **JOIN** khi có thể
- ✅ **EXISTS** thường tốt hơn **IN** cho correlated subqueries
- ✅ Index subquery columns để cải thiện performance
- ✅ MySQL 8.0+ có subquery cache và auto-transformation tốt hơn

#### **6. Isolation Level và Concurrency**

- ✅ Hiểu 4 **Isolation Levels**: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ (default), SERIALIZABLE
- ✅ Hiểu các vấn đề concurrency: Dirty Read, Non-repeatable Read, Phantom Read, Lost Update
- ✅ **MVCC** (Multi-Version Concurrency Control) là cơ chế quan trọng của InnoDB
- ✅ Locking: Shared locks, Exclusive locks, Gap locks, Next-Key locks
- ✅ Chọn isolation level phù hợp với từng use case

#### **7. Connection Pool (Pool kết nối)**

- ✅ **Connection Pool** giảm overhead từ 50–200ms xuống 1–5ms mỗi request
- ✅ Tính toán `max` và `min` hợp lý dựa trên workload và MySQL `max_connections`
- ✅ Luôn release connections, tránh connection leak
- ✅ Monitor pool metrics: active, idle, waiting connections
- ✅ Tách pool theo use case: read/write, tenant, shard

#### **8. Giới hạn và Hiệu năng**

- ✅ Hiểu các **giới hạn** của MySQL: kích thước bảng (~64TB), số cột (4096), connections (mặc định 151)
- ✅ **Hiệu năng thực tế**: 20k–50k TPS với cấu hình tối ưu, < 1ms latency cho indexed lookups
- ✅ Yếu tố quan trọng nhất: **Storage type** (SSD > HDD), **Buffer pool size**, **Indexes**, **Query optimization**

#### **9. Nâng cao hiệu năng (Performance Tuning)**

- ✅ **Partitioning**: Cho bảng lớn (> 10GB), phân vùng theo thời gian, giúp maintenance và query nhanh hơn
- ✅ **Sharding**: Scale ngang khi single server không đủ, cần chọn shard key đúng
- ✅ **Replication**: Scale reads, tăng availability, read/write splitting
- ✅ **Caching**: Giảm 70–90% database load, sử dụng Redis/Memcached
- ✅ **Query Optimization**: Sử dụng tools (EXPLAIN, Performance Schema), tối ưu từng query

### **Thứ tự ưu tiên khi tối ưu:**

1. **Query Optimization** và **Indexes** (dễ nhất, hiệu quả cao nhất)
2. **Caching** (giảm load đáng kể)
3. **Connection Pool** (giảm overhead)
4. **Replication** (scale reads)
5. **Partitioning** (cho bảng lớn)
6. **Sharding** (cuối cùng, phức tạp nhất)

### **Best Practices tổng hợp:**

**Thiết kế:**

- ✅ Normalize đúng mức, denormalize khi cần
- ✅ Chọn data types phù hợp
- ✅ Thiết kế indexes dựa trên query patterns

**Phát triển:**

- ✅ Tránh SELECT \*, N+1 queries
- ✅ Sử dụng prepared statements
- ✅ Batch operations thay vì từng row
- ✅ Connection pooling, không mở/đóng connection mỗi query

**Monitoring:**

- ✅ Monitor slow query log
- ✅ Monitor buffer pool hit rate (> 99%)
- ✅ Monitor connection pool metrics
- ✅ Regular maintenance: ANALYZE TABLE, OPTIMIZE TABLE

**Performance:**

- ✅ SSD thay vì HDD
- ✅ Buffer pool = 70–80% RAM
- ✅ Indexes cho WHERE, JOIN, ORDER BY
- ✅ Tránh full table scans

### **Kết luận cuối:**

MySQL là hệ quản trị cơ sở dữ liệu mạnh mẽ với hệ sinh thái phong phú và khả năng mở rộng tốt. Khi hiểu rõ và áp dụng đúng các kỹ thuật đã trình bày — từ **chuẩn hóa**, **indexing**, **query optimization**, đến **replication**, **sharding**, và **caching** — ta có thể đạt được hiệu năng rất cao (20k–100k+ TPS), gần ngang với nhiều hệ thống NoSQL trong nhiều trường hợp, **mà vẫn đảm bảo ACID properties** và tính nhất quán dữ liệu.

Quan trọng nhất: **Đo đạc trước khi tối ưu, tối ưu từng bước, và monitor liên tục**. Không có một công thức chung cho tất cả — mỗi hệ thống có đặc thù riêng, cần phân tích và tối ưu dựa trên workload thực tế.

**"Premature optimization is the root of all evil"** — Tối ưu khi cần thiết, dựa trên data và metrics thực tế, không phải assumptions.
