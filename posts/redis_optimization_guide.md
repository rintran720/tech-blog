# Toàn tập Redis: Kiến trúc, cấu trúc dữ liệu, tối ưu và chiến lược thực thi

Redis (Remote Dictionary Server) là một in-memory data structure store, được sử dụng như database, cache, message broker, và streaming engine. Redis cực kỳ nhanh nhờ hoạt động trong memory và được tối ưu cho performance cao.

## I. Redis Architecture và Data Structures

Redis là một key-value store với nhiều cấu trúc dữ liệu (data structures) được tối ưu cho các use cases khác nhau. Hiểu rõ architecture và data structures giúp chọn đúng cấu trúc cho từng bài toán.

### **1. Redis Architecture Overview**

**Kiến trúc cơ bản:**

```
┌─────────────────────────────────────────┐
│          Client Application              │
│  (Python, Node.js, Java, Go, etc.)      │
└──────────────┬──────────────────────────┘
               │
               │ Redis Protocol (RESP)
               │
┌──────────────▼──────────────────────────┐
│         Redis Server                     │
│  ┌──────────────────────────────────┐   │
│  │   Command Processor (Single      │   │
│  │    Thread, Event Loop)           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │   In-Memory Data Store            │   │
│  │   (All data in RAM)               │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │   Persistence Layer (Optional)    │   │
│  │   - RDB (Snapshot)                │   │
│  │   - AOF (Append-Only File)        │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Đặc điểm chính:**

- ✅ **In-Memory**: Tất cả dữ liệu lưu trong RAM → cực kỳ nhanh
- ✅ **Single-Threaded**: Command processor chạy đơn luồng (tránh locks, atomic operations)
- ✅ **Event Loop**: I/O multiplexing (epoll, kqueue) cho high concurrency
- ✅ **Data Structures**: Nhiều loại (Strings, Hashes, Lists, Sets, Sorted Sets, etc.)
- ✅ **Persistence**: Optional (RDB, AOF) cho durability

**Performance Characteristics:**

- **Throughput**: 100k+ commands/second (single instance)
- **Latency**: < 1ms (local network)
- **Memory-based**: Không có disk I/O cho reads/writes (trừ persistence)

### **2. Các Data Structures trong Redis**

Redis hỗ trợ nhiều data structures, mỗi loại tối ưu cho use cases khác nhau:

| Data Structure  | Mô tả                                          | Use Cases                                     | Complexity         |
| --------------- | ---------------------------------------------- | --------------------------------------------- | ------------------ |
| **String**      | Binary-safe string (max 512MB)                 | Cache, counters, simple key-value             | O(1)               |
| **Hash**        | Field-value pairs (như object/dict)            | User profiles, object attributes              | O(1) per field     |
| **List**        | Ordered collection, double-ended (linked list) | Queues, timelines, stacks                     | O(1) for head/tail |
| **Set**         | Unordered collection of unique strings         | Tags, memberships, unique items               | O(1) average       |
| **Sorted Set**  | Set với score (sorted by score)                | Leaderboards, rankings, time-series           | O(log N)           |
| **Bitmap**      | Bit operations trên string                     | Analytics, flags, presence tracking           | O(1)               |
| **HyperLogLog** | Probabilistic cardinality estimation           | Unique visitors, distinct count (approximate) | O(1)               |
| **Stream**      | Append-only log (like Kafka)                   | Event streaming, message queues               | O(1) append        |
| **Geospatial**  | Geographic coordinates (lat/long)              | Location-based queries, nearby searches       | O(log N)           |

### **3. String - Cấu trúc cơ bản nhất**

**Đặc điểm:**

- Binary-safe: Có thể lưu bất kỳ data nào (string, JSON, binary, etc.)
- Maximum size: 512MB
- Operations: GET, SET, INCR, APPEND, GETRANGE, etc.

**Use Cases:**

```redis
# Cache simple values
SET user:1001:name "John Doe"
GET user:1001:name

# Counters
INCR page:views
INCRBY page:views 10
GET page:views

# Expiration (TTL)
SET session:abc123 "user_data" EX 3600  # Expire sau 1 giờ
TTL session:abc123  # Check remaining time

# Atomic operations
SETNX lock:resource "locked"  # Set if not exists
GETSET counter:value 100      # Get old value, set new value

# Bitmap operations
SETBIT user:1001:online 0 1    # Mark online
GETBIT user:1001:online 0      # Check status
BITCOUNT user:1001:online      # Count online bits
```

**Optimization:**

```redis
# ✅ Tốt: Sử dụng INCR thay vì GET + SET
INCR counter:views
# → Atomic, nhanh hơn

# ❌ Xấu: GET + SET (race condition)
GET counter:views
SET counter:views 11

# ✅ Tốt: Batch operations với PIPELINE
PIPELINE
  SET key1 "value1"
  SET key2 "value2"
  GET key3
EXEC

# → Gửi tất cả commands cùng lúc, giảm round trips
```

### **4. Hash - Objects/Dictionaries**

**Đặc điểm:**

- Lưu field-value pairs (như hashmap/object)
- Tối ưu cho objects có nhiều fields
- Memory efficient hơn String khi có nhiều fields

**Use Cases:**

```redis
# User profile
HSET user:1001 name "John Doe" email "john@example.com" age 30
HGET user:1001 name
HGETALL user:1001

# Increment numeric field
HINCRBY user:1001 age 1

# Check field exists
HEXISTS user:1001 email

# Get multiple fields
HMGET user:1001 name email age

# Get all fields and values
HGETALL user:1001

# Get only keys or values
HKEYS user:1001
HVALS user:1001
```

**Memory Comparison:**

```redis
# ❌ Xấu: Multiple keys (overhead cho mỗi key)
SET user:1001:name "John Doe"
SET user:1001:email "john@example.com"
SET user:1001:age "30"
# → 3 keys, overhead cao

# ✅ Tốt: Single Hash (ít overhead)
HSET user:1001 name "John Doe" email "john@example.com" age 30
# → 1 key, memory efficient hơn
```

**Hash vs String cho Objects:**

```redis
# String (JSON) - Khi cần serialize/deserialize
SET user:1001 '{"name":"John","email":"john@example.com"}'
# → Phải parse JSON mỗi lần, không thể update từng field

# Hash - Khi cần update từng field
HSET user:1001 name "John" email "john@example.com"
HINCRBY user:1001 age 1  # Update chỉ 1 field
# → Không cần parse, có thể update từng field
```

### **5. List - Ordered Collections**

**Đặc điểm:**

- Doubly linked list (thêm/bớt ở đầu hoặc cuối đều O(1))
- Giữ thứ tự insertion
- Có thể dùng như queue (FIFO) hoặc stack (LIFO)

**Use Cases:**

```redis
# Queue (FIFO - First In First Out)
LPUSH task:queue "task1"
LPUSH task:queue "task2"
RPOP task:queue  # Lấy "task1" (oldest)

# Stack (LIFO - Last In First Out)
LPUSH history:user:1001 "page1"
LPUSH history:user:1001 "page2"
LPOP history:user:1001  # Lấy "page2" (newest)

# Timeline / Feed
LPUSH user:1001:timeline "post123"
LPUSH user:1001:timeline "post456"
LRANGE user:1001:timeline 0 9  # Lấy 10 posts mới nhất

# Blocking operations (message queue)
BLPOP task:queue 10  # Wait 10s for item
# → Block until item available hoặc timeout
```

**Performance:**

```redis
# ✅ Tốt: O(1) operations
LPUSH list:items "item1"
RPUSH list:items "item2"
LPOP list:items
RPOP list:items

# ⚠️ Chậm: O(N) operations (N = list length)
LINDEX list:items 1000      # Get item at index
LINSERT list:items BEFORE "item" "new"  # Insert before value
LREM list:items 1 "item"    # Remove first occurrence
```

### **6. Set - Unordered Unique Collections**

**Đặc điểm:**

- Unordered collection of unique strings
- O(1) average time complexity cho most operations
- Hỗ trợ set operations (union, intersection, difference)

**Use Cases:**

```redis
# Tags
SADD post:123:tags "javascript" "redis" "tutorial"
SMEMBERS post:123:tags
SISMEMBER post:123:tags "javascript"  # Check if member

# Unique users
SADD users:active "user1001" "user1002"
SCARD users:active  # Count members
SRANDMEMBER users:active  # Get random member

# Set operations
SADD set1 "a" "b" "c"
SADD set2 "b" "c" "d"
SINTER set1 set2      # Intersection: {"b", "c"}
SUNION set1 set2       # Union: {"a", "b", "c", "d"}
SDIFF set1 set2        # Difference: {"a"}
```

**Set Operations Performance:**

```redis
# ✅ Tốt: Operations trên sets nhỏ (< 1000 members)
SADD small:set "item1"
SMEMBERS small:set

# ⚠️ Chậm: SMEMBERS trên sets lớn (> 10k members)
SMEMBERS large:set  # O(N), có thể block Redis
# → Dùng SSCAN để iterate

# ✅ Tốt: SSCAN cho sets lớn
SSCAN large:set 0 MATCH "*pattern*" COUNT 100
# → Iterate từng batch, không block
```

### **7. Sorted Set (ZSet) - Ranked Collections**

**Đặc điểm:**

- Set với score (float) để sắp xếp
- Members unique, scores có thể duplicate
- O(log N) operations (skip list + hash table)
- Hỗ trợ range queries theo score hoặc rank

**Use Cases:**

```redis
# Leaderboard
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZADD leaderboard 150 "player3"
ZREVRANGE leaderboard 0 9  # Top 10 players
ZRANK leaderboard "player2"  # Get rank (0-based)

# Time-series data
ZADD events:2024:01:15 1640995200 "event1"  # timestamp as score
ZRANGEBYSCORE events:2024:01:15 1640995200 1641081600
# → Get events in time range

# Priority queue
ZADD tasks:queue 1 "low_priority_task"
ZADD tasks:queue 10 "high_priority_task"
ZPOPMAX tasks:queue  # Get highest priority task

# Real-time rankings
ZINCRBY leaderboard 10 "player1"  # Add 10 points
ZSCORE leaderboard "player1"      # Get current score
```

**Range Operations:**

```redis
# Range by rank (index)
ZRANGE leaderboard 0 9 WITHSCORES        # Top 10
ZREVRANGE leaderboard 0 9 WITHSCORES     # Bottom 10

# Range by score
ZRANGEBYSCORE leaderboard 100 200        # Scores 100-200
ZREVRANGEBYSCORE leaderboard 200 100     # Reverse order

# Count by range
ZCOUNT leaderboard 100 200               # Number of players with score 100-200

# Remove by range
ZREMRANGEBYRANK leaderboard 0 9          # Remove bottom 10
ZREMRANGEBYSCORE leaderboard -inf 50     # Remove scores < 50
```

**Sorted Set vs Set:**

```redis
# ✅ Sorted Set: Khi cần ranking/ordering
ZADD leaderboard 100 "player1"
ZREVRANGE leaderboard 0 9  # Get top players

# ✅ Set: Khi chỉ cần uniqueness
SADD tags:post:123 "javascript" "redis"
SMEMBERS tags:post:123  # No specific order
```

### **8. Bitmap - Bit Operations**

**Đặc điểm:**

- String với bit operations
- Rất memory efficient (1 bit per value)
- O(1) operations cho most cases
- Tối ưu cho analytics và flags

**Use Cases:**

```redis
# User online status (1 bit per user)
SETBIT users:online:2024:01:15 1001 1  # User 1001 online
GETBIT users:online:2024:01:15 1001    # Check status
BITCOUNT users:online:2024:01:15        # Count online users

# Feature flags
SETBIT features:enabled feature_id 1
GETBIT features:enabled feature_id

# Daily active users (DAU)
SETBIT dau:2024:01:15 1001 1
SETBIT dau:2024:01:15 1002 1
BITCOUNT dau:2024:01:15  # DAU count

# Analytics (AND/OR operations)
SETBIT monday:active 1001 1
SETBIT tuesday:active 1001 1
BITOP AND both:days monday:active tuesday:active  # Active both days
BITCOUNT both:days  # Users active both days
```

**Memory Efficiency:**

```
1000 users online status:
- String: 1000 bytes (1000 × 1 byte)
- Bitmap: 125 bytes (1000 bits / 8)

→ Bitmap tiết kiệm 87.5% memory!
```

**Bit Operations:**

```redis
# Logical operations
BITOP AND result key1 key2     # AND
BITOP OR result key1 key2      # OR
BITOP XOR result key1 key2     # XOR
BITOP NOT result key1          # NOT

# Analytics example
SETBIT monday:active 1001 1
SETBIT monday:active 1002 1
SETBIT tuesday:active 1002 1
SETBIT tuesday:active 1003 1

BITOP AND both:days monday:active tuesday:active
BITCOUNT both:days  # = 1 (only user 1002 active both days)

BITOP OR either:day monday:active tuesday:active
BITCOUNT either:day  # = 3 (users 1001, 1002, 1003)
```

### **9. HyperLogLog - Probabilistic Cardinality**

**Đặc điểm:**

- Ước tính số phần tử unique (cardinality)
- Rất memory efficient (12KB per HyperLogLog)
- Error rate: ~0.81% (standard error)
- O(1) operations

**Use Cases:**

```redis
# Unique visitors (approximate)
PFADD visitors:2024:01:15 "192.168.1.1" "192.168.1.2" "192.168.1.1"
PFCOUNT visitors:2024:01:15  # ≈ 2 (duplicate IP ignored)

# Merge multiple days
PFADD visitors:week visitors:2024:01:15 visitors:2024:01:16
PFCOUNT visitors:week  # Unique visitors across week

# Distinct count (không cần lưu tất cả items)
PFADD users:active:today "user1" "user2" "user3"
PFCOUNT users:active:today  # ≈ 3
```

**Memory Efficiency:**

```
1 million unique IPs:
- Set: ~16MB (với overhead)
- HyperLogLog: 12KB

→ Tiết kiệm 99.9% memory!
(Đổi lại: Chỉ approximate, không lấy được danh sách)
```

**Limitations:**

- ❌ Không lấy được danh sách items
- ❌ Không check membership (không có PFISMEMBER)
- ❌ Chỉ là approximate count

### **10. Stream - Event Logging**

**Đặc điểm:**

- Append-only log (giống Kafka topics)
- Tối ưu cho event streaming
- Consumer groups support
- Time-ordered entries

**Use Cases:**

```redis
# Event logging
XADD events:user:1001 * action "login" timestamp 1640995200
XADD events:user:1001 * action "purchase" item "product123"

# Read from beginning
XREAD STREAMS events:user:1001 0

# Read new events (blocking)
XREAD BLOCK 1000 STREAMS events:user:1001 $

# Consumer groups (multiple consumers)
XGROUP CREATE events:user:1001 processing-group 0
XREADGROUP GROUP processing-group consumer1 STREAMS events:user:1001 >

# Process events
XREADGROUP GROUP processing-group consumer1 COUNT 10 STREAMS events:user:1001 >
# → Process events, then ACK
XACK events:user:1001 processing-group <message-id>
```

### **11. Geospatial - Location Data**

**Đặc điểm:**

- Lưu geographic coordinates (latitude, longitude)
- Hỗ trợ distance calculations
- Range queries (radius search)
- Implemented bằng Sorted Set

**Use Cases:**

```redis
# Add locations
GEOADD restaurants:nyc -73.97 40.77 "Restaurant A"
GEOADD restaurants:nyc -73.98 40.78 "Restaurant B"

# Get distance
GEODIST restaurants:nyc "Restaurant A" "Restaurant B" km

# Find nearby (radius search)
GEORADIUS restaurants:nyc -73.97 40.77 5 km WITHDIST
# → Restaurants within 5km

# Get coordinates
GEOPOS restaurants:nyc "Restaurant A"
```

### **12. Chọn Data Structure Phù Hợp**

**Decision Tree:**

```
Cần simple key-value?
├─ YES → String
└─ NO
   │
   Cần object với nhiều fields?
   ├─ YES → Hash
   └─ NO
      │
      Cần ordering?
      ├─ YES
      │  ├─ Cần ranking/score? → Sorted Set
      │  └─ Không cần score? → List
      └─ NO
         │
         Cần uniqueness?
         ├─ YES → Set
         └─ NO
            │
            Cần approximate count? → HyperLogLog
            Cần bit operations? → Bitmap
            Cần event streaming? → Stream
            Cần geolocation? → Geospatial
```

**Best Practices:**

1. ✅ **String**: Simple cache, counters
2. ✅ **Hash**: Objects với nhiều fields (memory efficient hơn multiple keys)
3. ✅ **List**: Queues, stacks, timelines
4. ✅ **Set**: Tags, unique collections, set operations
5. ✅ **Sorted Set**: Leaderboards, time-series, priority queues
6. ✅ **Bitmap**: Flags, analytics, presence tracking
7. ✅ **HyperLogLog**: Distinct count (approximate), không cần danh sách
8. ✅ **Stream**: Event logging, message queues
9. ✅ **Geospatial**: Location-based queries

## II. Memory Management và Optimization

Redis lưu tất cả dữ liệu trong RAM, nên memory management là yếu tố quan trọng nhất. Tối ưu memory usage giúp tăng capacity và giảm chi phí.

### **1. Memory Allocation trong Redis**

**Cấu trúc Memory:**

```
Redis Memory Layout:
├── Data (keys + values)
├── Overhead (key objects, value objects)
├── Buffer pools
├── Client buffers
├── Replication buffer
└── AOF buffer
```

**Memory Overhead:**

```
String key-value:
- Key: ~60 bytes overhead (RedisObject + SDS)
- Value: Actual size + overhead
- Total: ~64 bytes minimum per key-value pair

Hash (10 fields):
- Key: ~60 bytes
- Hash: ~100 bytes overhead
- Fields: 10 × (~30 bytes each) = ~300 bytes
- Total: ~460 bytes (efficient hơn 10 separate keys!)
```

### **2. Memory Optimization Techniques**

#### **2.1. Chọn Data Structure Đúng**

**Hash vs Multiple Keys:**

```redis
# ❌ Xấu: Multiple keys (overhead cao)
SET user:1001:name "John Doe"          # 60 bytes overhead
SET user:1001:email "john@example.com" # 60 bytes overhead
SET user:1001:age "30"                 # 60 bytes overhead
# Total: 180 bytes overhead + data

# ✅ Tốt: Single Hash (ít overhead)
HSET user:1001 name "John Doe" email "john@example.com" age "30"
# Total: ~60 bytes overhead + data
# → Tiết kiệm ~120 bytes per user!
```

**String vs Hash vs JSON:**

```redis
# ❌ Xấu: JSON string (phải parse, không thể update từng field)
SET user:1001 '{"name":"John","email":"john@example.com","age":30}'
# → Phải GET + parse JSON + update + SET (4 operations)

# ✅ Tốt: Hash (update từng field)
HSET user:1001 name "John" email "john@example.com" age 30
HINCRBY user:1001 age 1  # Update chỉ 1 field
# → 1 operation, không cần parse
```

#### **2.2. Key Naming và Compression**

**Key Naming:**

```redis
# ❌ Xấu: Keys dài (tốn memory)
SET user:1001:profile:name "John Doe"
SET user:1001:profile:email "john@example.com"

# ✅ Tốt: Keys ngắn (tiết kiệm memory)
SET u:1001:name "John Doe"
SET u:1001:email "john@example.com"
# → Tiết kiệm ~10 bytes per key

# ⚠️ Balance: Vẫn phải readable, không quá cryptic
```

**Value Compression:**

```redis
# ❌ Xấu: Lưu data dư thừa
SET user:1001 '{"id":1001,"name":"John Doe","email":"john@example.com","age":30,"status":"active","created_at":"2024-01-15T10:30:00Z"}'

# ✅ Tốt: Chỉ lưu data cần thiết
HSET user:1001 name "John" email "john@example.com" age 30
# → Bỏ id (đã có trong key), status có thể dùng SET flag
```

#### **2.3. Expiration và TTL**

**TTL (Time-To-Live):**

```redis
# Set expiration
SET key "value" EX 3600          # Expire sau 1 giờ
SET key "value" PX 3600000       # Expire sau 1 giờ (milliseconds)
SETEX key 3600 "value"           # Set với expiration
EXPIRE key 3600                  # Set expiration cho key tồn tại

# Check TTL
TTL key                          # Seconds remaining (-1 = no expiry, -2 = not exists)
PTTL key                         # Milliseconds remaining

# Remove expiration
PERSIST key                      # Remove expiration
```

**Expiration Strategies:**

```redis
# ✅ Tốt: Set TTL khi tạo key
SET session:abc123 "data" EX 3600

# ✅ Tốt: Refresh TTL khi access
GET session:abc123
EXPIRE session:abc123 3600  # Refresh TTL

# ✅ Tốt: TTL dựa trên access pattern
# Hot data: TTL ngắn (5-10 phút)
SET cache:hot:key "value" EX 300

# Warm data: TTL trung bình (1-6 giờ)
SET cache:warm:key "value" EX 3600

# Cold data: TTL dài (24 giờ)
SET cache:cold:key "value" EX 86400
```

**Expiration Implementation:**

- Redis dùng 2 strategies: Passive và Active
- **Passive**: Xóa khi key được access và đã expired
- **Active**: Background task xóa expired keys mỗi 100ms
- Max 25% expired keys per active expiration cycle

#### **2.4. Memory-Efficient Data Structures**

**Small Aggregates:**

```redis
# ✅ Tốt: Hash cho small objects (< 100 fields)
HSET user:1001 name "John" email "john@example.com"

# ⚠️ Hash có overhead nhỏ cho mỗi field
# → Hiệu quả khi có nhiều fields

# ✅ Tốt: String cho single values
SET counter:views 1000
```

**Large Collections:**

```redis
# ✅ Tốt: Chia nhỏ large collections
# Thay vì 1 set với 1M members
SADD huge:set member1 member2 ... member1000000

# Chia thành nhiều sets nhỏ hơn
SADD set:1 member1 ... member10000
SADD set:2 member10001 ... member20000
# → Dễ manage, dễ delete
```

**Compression:**

```redis
# ✅ Tốt: Compress large values (application-level)
import gzip
import redis

data = {"large": "data"} * 1000
compressed = gzip.compress(json.dumps(data).encode())
redis_client.set("key", compressed)

# Decompress when reading
compressed = redis_client.get("key")
data = json.loads(gzip.decompress(compressed))
```

### **3. Memory Policies (maxmemory-policy)**

Khi Redis đạt `maxmemory`, cần chọn policy để evict keys:

| Policy              | Mô tả                                      | Khi nào dùng                      |
| ------------------- | ------------------------------------------ | --------------------------------- |
| **noeviction**      | Từ chối writes khi đầy (default)           | Critical data, không thể mất data |
| **allkeys-lru**     | Evict least recently used từ tất cả keys   | Cache, có thể mất bất kỳ key nào  |
| **volatile-lru**    | Evict LRU chỉ từ keys có TTL               | Mix critical và cache data        |
| **allkeys-lfu**     | Evict least frequently used từ tất cả keys | Cache với access patterns         |
| **volatile-lfu**    | Evict LFU chỉ từ keys có TTL               | Mix với frequency-based eviction  |
| **allkeys-random**  | Evict random keys                          | Cache, không quan tâm access      |
| **volatile-random** | Evict random keys có TTL                   | Mix với random eviction           |
| **volatile-ttl**    | Evict keys có TTL ngắn nhất                | Prefer giữ keys có TTL dài        |

**Cấu hình:**

```redis
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru  # Hoặc volatile-lru, allkeys-lfu, etc.
```

**Ví dụ sử dụng:**

```redis
# noeviction: Critical data (không thể mất)
maxmemory-policy noeviction
# → Từ chối writes khi đầy, phải monitor và scale

# allkeys-lru: Cache (có thể mất bất kỳ key nào)
maxmemory-policy allkeys-lru
# → Evict keys ít dùng nhất khi đầy

# volatile-lru: Mix critical và cache
SET critical:data "value"  # Không có TTL, không bị evict
SET cache:data "value" EX 3600  # Có TTL, có thể bị evict
maxmemory-policy volatile-lru
# → Chỉ evict keys có TTL
```

### **4. Memory Monitoring và Analysis**

**Commands để monitor memory:**

```redis
# Xem memory usage
INFO memory

# Output:
# used_memory:1073741824
# used_memory_human:1.00G
# used_memory_rss:1075838976
# used_memory_peak:1075841024
# used_memory_peak_human:1.00G
# used_memory_overhead:1052672
# used_memory_startup:983040
# used_memory_dataset:1072689152
# used_memory_dataset_perc:99.90%
# mem_fragmentation_ratio:1.00
# mem_allocator:jemalloc-5.2.1

# Memory breakdown theo data types
MEMORY STATS

# Xem memory cho key cụ thể
MEMORY USAGE key

# Xem keys lớn nhất
redis-cli --bigkeys

# Memory usage cho patterns
MEMORY DOCTOR  # Diagnostic và recommendations
```

**Memory Fragmentation:**

```redis
# Fragmentation ratio = used_memory_rss / used_memory
# > 1.5: Fragmentation cao, cần restart
# < 1.0: Không thể xảy ra (data compression)

# Giảm fragmentation:
# 1. Restart Redis (memory sẽ compact)
# 2. Tăng maxmemory-policy để evict keys
# 3. Monitor và cleanup unused keys
```

**Best Practices cho Memory Management:**

1. ✅ **Set maxmemory**: Luôn set để tránh OOM (Out of Memory)
2. ✅ **Chọn eviction policy phù hợp**: Dựa trên data importance
3. ✅ **Monitor memory usage**: Track memory growth patterns
4. ✅ **Set TTL cho cache**: Tự động cleanup expired keys
5. ✅ **Dùng Hash thay vì multiple keys**: Giảm overhead
6. ✅ **Compress large values**: Application-level compression
7. ✅ **Regular cleanup**: Xóa keys không dùng
8. ✅ **Memory-efficient data structures**: Bitmap, HyperLogLog khi phù hợp

## III. Persistence và Durability

Redis là in-memory database, nên persistence (lưu dữ liệu ra disk) là optional nhưng quan trọng để đảm bảo data durability. Redis hỗ trợ 2 cơ chế persistence: RDB (snapshot) và AOF (append-only file).

### **1. RDB (Redis Database Backup)**

**RDB là gì:**

- Snapshot của toàn bộ dataset tại một thời điểm
- Binary format, compact và nhanh
- Point-in-time backup
- Compressed để giảm kích thước

**Cách RDB hoạt động:**

```redis
# RDB được tạo bằng:
# 1. SAVE (blocking - block tất cả commands)
SAVE

# 2. BGSAVE (background - không block)
BGSAVE

# 3. Tự động theo config
# redis.conf:
save 900 1      # Save nếu có ít nhất 1 key thay đổi trong 900s
save 300 10    # Save nếu có ít nhất 10 keys thay đổi trong 300s
save 60 10000  # Save nếu có ít nhất 10000 keys thay đổi trong 60s
```

**RDB Workflow:**

```
1. Fork process (copy-on-write)
2. Child process tạo RDB file
3. Parent process tiếp tục serve requests
4. Child process write snapshot ra disk
5. Child process exit, signal parent
```

**Ưu điểm RDB:**

- ✅ **Compact**: RDB file nhỏ hơn AOF
- ✅ **Fast restore**: Load nhanh hơn AOF
- ✅ **Point-in-time backup**: Backup cho specific time
- ✅ **Minimal performance impact**: BGSAVE không block (fork once)

**Nhược điểm RDB:**

- ❌ **Data loss risk**: Mất data giữa các snapshots
- ❌ **Fork overhead**: Copy-on-write tốn memory khi dataset lớn
- ❌ **Not real-time**: Chỉ backup tại thời điểm snapshot

**Cấu hình RDB:**

```redis
# redis.conf
# Enable RDB
save 900 1
save 300 10
save 60 10000

# Disable RDB (nếu chỉ dùng AOF)
save ""

# RDB file location
dir /var/lib/redis
dbfilename dump.rdb

# Compression
rdbcompression yes

# Checksum
rdbchecksum yes
```

**RDB Best Practices:**

1. ✅ **Multiple save points**: Configure nhiều save rules
2. ✅ **Background saves**: Dùng BGSAVE, không dùng SAVE
3. ✅ **Monitor fork time**: Watch memory usage khi fork
4. ✅ **Regular backups**: Copy RDB files to backup storage
5. ✅ **Test restore**: Regularly test restore từ RDB files

### **2. AOF (Append-Only File)**

**AOF là gì:**

- Ghi lại tất cả write commands vào log file
- Replay log để restore data
- More durable hơn RDB (có thể mất tối đa 1 second)

**Cách AOF hoạt động:**

```redis
# AOF ghi lại commands:
SET key1 "value1"
HSET user:1001 name "John"
INCR counter:views

# AOF file content:
*2
$6
SELECT
$1
0
*3
$3
SET
$4
key1
$6
value1
*3
$4
HSET
$9
user:1001
$4
name
$4
John
...
```

**AOF Sync Modes:**

| Mode                   | Sync Frequency | Durability | Performance | Risk                                   |
| ---------------------- | -------------- | ---------- | ----------- | -------------------------------------- |
| **no**                 | Kernel decides | Thấp       | Cao nhất    | Có thể mất nhiều giây data             |
| **everysec** (default) | Mỗi giây       | Cao        | Cao         | Có thể mất tối đa 1 giây data          |
| **always**             | Mỗi command    | Cao nhất   | Thấp nhất   | Mất tối đa 1 command (blocking writes) |

**Cấu hình AOF:**

```redis
# redis.conf
# Enable AOF
appendonly yes
appendfilename "appendonly.aof"

# Sync policy
appendfsync everysec  # no, everysec, always

# AOF rewrite (compress log)
auto-aof-rewrite-percentage 100  # Rewrite khi AOF size tăng 100%
auto-aof-rewrite-min-size 64mb   # Minimum size để rewrite

# AOF directory
dir /var/lib/redis
```

**AOF Rewrite:**

```redis
# AOF file tăng dần → cần rewrite (compress)

# Manual rewrite
BGREWRITEAOF

# Automatic rewrite khi:
# - AOF size > auto-aof-rewrite-min-size
# - Growth > auto-aof-rewrite-percentage

# Rewrite process:
# 1. Fork process
# 2. Write current dataset thành commands
# 3. Append new writes vào temp file
# 4. Atomically replace old AOF với new AOF
```

**AOF Workflow:**

```
Write Command:
1. Execute command in memory
2. Append to AOF buffer
3. Sync to disk (theo appendfsync policy)
4. Return to client
```

**Ưu điểm AOF:**

- ✅ **High durability**: Mất tối đa 1 giây data (everysec)
- ✅ **Real-time logging**: Log mọi write command
- ✅ **Human-readable**: Có thể đọc và edit (cẩn thận!)
- ✅ **Automatic rewrite**: Compress log file

**Nhược điểm AOF:**

- ❌ **Larger file size**: AOF thường lớn hơn RDB
- ❌ **Slower restore**: Phải replay toàn bộ log
- ❌ **Performance impact**: Sync có thể ảnh hưởng performance

**AOF Best Practices:**

1. ✅ **Dùng everysec**: Balance giữa durability và performance
2. ✅ **Auto rewrite**: Enable auto-aof-rewrite để compress
3. ✅ **Monitor AOF size**: Track growth patterns
4. ✅ **Regular backups**: Backup AOF files
5. ✅ **Test AOF recovery**: Test restore từ AOF

### **3. RDB vs AOF - So sánh**

| Tiêu chí               | RDB                            | AOF                          |
| ---------------------- | ------------------------------ | ---------------------------- |
| **Durability**         | Thấp (mất data giữa snapshots) | Cao (mất tối đa 1 giây)      |
| **File Size**          | Nhỏ (compressed)               | Lớn (chưa rewrite)           |
| **Restore Speed**      | Nhanh (load snapshot)          | Chậm (replay log)            |
| **Performance Impact** | Thấp (background)              | Trung bình (sync overhead)   |
| **Use Case**           | Backups, disaster recovery     | High durability requirements |
| **Data Loss**          | Có thể mất nhiều phút          | Mất tối đa 1 giây            |

**Kết hợp RDB + AOF (Recommended):**

```redis
# redis.conf
# Enable cả 2
save 900 1          # RDB snapshots
appendonly yes      # AOF logging
appendfsync everysec # AOF sync policy

# Ưu điểm:
# - RDB: Fast backups, point-in-time recovery
# - AOF: High durability, minimal data loss
# → Best of both worlds!
```

**Recovery Priority:**

```
Redis startup:
1. Nếu có AOF → Load AOF (more recent)
2. Nếu không có AOF → Load RDB
3. Nếu không có cả 2 → Start empty
```

### **4. Persistence Best Practices**

1. ✅ **Dùng cả RDB và AOF**: RDB cho backups, AOF cho durability
2. ✅ **AOF everysec**: Balance durability và performance
3. ✅ **RDB snapshots**: Regular snapshots cho point-in-time recovery
4. ✅ **Monitor persistence**: Track RDB/AOF file sizes và creation time
5. ✅ **Backup strategy**: Copy RDB/AOF files to remote storage
6. ✅ **Test recovery**: Regularly test restore procedures
7. ✅ **Disable persistence cho cache-only**: Nếu chỉ cache, có thể tắt
8. ✅ **Tune for workload**: Adjust save frequency và AOF sync based on needs

## IV. Replication và High Availability

Redis replication cho phép tạo bản sao (replica) của master Redis instance, giúp scale reads, tăng availability, và đảm bảo data redundancy.

### **1. Redis Replication Architecture**

**Kiến trúc cơ bản:**

```
┌─────────────────┐
│  Master (Primary)│
│  Port: 6379     │
│  Read/Write     │
└────────┬────────┘
         │ Replication
         │ (async)
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐
│Replica│ │Replica│ │Replica│ │Replica│
│   1   │ │   2   │ │   3   │ │   N   │
│Read   │ │Read   │ │Read   │ │Read   │
└───────┘ └───────┘ └───────┘ └───────┘
```

**Đặc điểm:**

- ✅ **Master-Slave (Primary-Replica)**: Master nhận writes, replicas nhận reads
- ✅ **Asynchronous**: Replication không đồng bộ (non-blocking)
- ✅ **One-way**: Master → Replica (không có writes trên replica)
- ✅ **Full or Partial**: Có thể replicate toàn bộ hoặc chỉ specific databases

### **2. Setup Replication**

**Step 1: Cấu hình Replica**

```redis
# Trên Replica server (redis.conf)
replicaof 192.168.1.10 6379  # Master IP và port

# Hoặc dùng command
REPLICAOF 192.168.1.10 6379

# Hoặc deprecated command (Redis < 5.0)
SLAVEOF 192.168.1.10 6379
```

**Step 2: Master Authentication (nếu có password)**

```redis
# Trên Master
requirepass masterpassword

# Trên Replica
masterauth masterpassword
```

**Step 3: Kiểm tra Replication Status**

```redis
# Trên Replica
INFO replication

# Output:
# role:slave
# master_host:192.168.1.10
# master_port:6379
# master_link_status:up
# master_last_io_seconds_ago:1
# master_sync_in_progress:0
# slave_repl_offset:12345
# slave_priority:100
# slave_read_only:1
```

### **3. Replication Process**

**Full Synchronization (Initial Sync):**

```
1. Replica connects to Master
2. Replica sends SYNC command
3. Master creates RDB snapshot (BGSAVE)
4. Master sends RDB file to Replica
5. Replica loads RDB vào memory
6. Master sends commands từ replication buffer
7. Replica applies commands
8. → Replication complete
```

**Incremental Synchronization (After Initial Sync):**

```
1. Master ghi command vào replication buffer
2. Master gửi command đến tất cả replicas (async)
3. Replicas nhận và apply commands
4. → Continuous sync
```

**Replication Buffer:**

```redis
# redis.conf
# Replication buffer size
repl-backlog-size 100mb

# Replication backlog TTL
repl-backlog-ttl 3600

# → Buffer lưu commands để resync khi replica reconnect
```

### **4. Read Scaling với Replicas**

**Read từ Replicas:**

```javascript
// Application-level read/write splitting
class RedisClient {
  constructor() {
    this.master = redis.createClient({ host: "master" });
    this.replicas = [
      redis.createClient({ host: "replica1" }),
      redis.createClient({ host: "replica2" }),
    ];
  }

  // Write → Master
  async set(key, value) {
    return this.master.set(key, value);
  }

  // Read → Replica (round-robin)
  async get(key) {
    const replica = this.getReplica();
    return replica.get(key);
  }

  getReplica() {
    // Round-robin hoặc random
    return this.replicas[Math.floor(Math.random() * this.replicas.length)];
  }
}
```

**Redis Sentinel (Automatic Failover):**

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Sentinel │     │ Sentinel │     │ Sentinel │
│    1     │     │    2     │     │    3     │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                     │
              ┌──────▼──────┐
              │   Master    │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌───▼────┐
    │ Replica │ │ Replica │ │Replica │
    │    1    │ │    2    │ │   3    │
    └─────────┘ └─────────┘ └────────┘
```

**Sentinel Features:**

- ✅ **Automatic failover**: Tự động promote replica thành master khi master down
- ✅ **Service discovery**: Clients query Sentinel để biết master address
- ✅ **Monitoring**: Monitor master và replicas health
- ✅ **Notifications**: Alert khi có failover

**Setup Sentinel:**

```redis
# sentinel.conf
sentinel monitor mymaster 192.168.1.10 6379 2
# → Monitor master, quorum = 2 (cần 2 Sentinels đồng ý để failover)

sentinel down-after-milliseconds mymaster 5000
# → Consider master down sau 5s không response

sentinel failover-timeout mymaster 10000
# → Failover timeout 10s
```

### **5. Replication Lag**

**Replication Lag là gì:**

- Delay giữa khi master write và replica apply
- Do asynchronous replication
- Có thể dẫn đến stale reads trên replica

**Monitor Lag:**

```redis
# Trên Replica
INFO replication

# Quan trọng:
# master_last_io_seconds_ago: 1  # Lag 1 giây
# slave_repl_offset: 12345        # Offset của replica
# master_repl_offset: 12350      # Offset của master (cần query master)
# → Lag = master_repl_offset - slave_repl_offset
```

**Giảm Replication Lag:**

1. ✅ **Network bandwidth**: Đảm bảo đủ bandwidth giữa master và replica
2. ✅ **Replica performance**: Replica nhanh hơn hoặc bằng master
3. ✅ **Replication buffer**: Đủ lớn để handle burst writes
4. ✅ **Monitor lag**: Alert khi lag > threshold

### **6. Partial Replication (Redis 2.8+)**

**PSYNC (Partial Synchronization):**

```redis
# Khi replica reconnect:
# 1. Nếu offset trong backlog → Chỉ sync commands mới (fast!)
# 2. Nếu offset không trong backlog → Full sync (slow)

# Config:
repl-backlog-size 100mb  # Backlog size
repl-backlog-ttl 3600    # Backlog TTL
```

### **7. Read-Only Replicas**

**Replica mặc định là read-only:**

```redis
# Replica chỉ nhận reads
GET key  # ✅ OK

# Writes bị reject
SET key "value"  # ❌ Error: READONLY You can't write against a read only replica.
```

**Allow writes trên replica (không khuyến nghị):**

```redis
# redis.conf trên replica
replica-read-only no  # Cho phép writes (không đồng bộ với master!)
# ⚠️ Không nên dùng trong production!
```

### **8. Replication Best Practices**

1. ✅ **Multiple Replicas**: Có ít nhất 2-3 replicas cho high availability
2. ✅ **Monitor Replication**: Track lag và connection status
3. ✅ **Network**: Low latency network giữa master và replicas
4. ✅ **Replica Performance**: Replicas nhanh hơn hoặc bằng master
5. ✅ **Backup từ Replicas**: Tránh load master khi backup
6. ✅ **Sentinel**: Dùng Sentinel cho automatic failover
7. ✅ **Test Failover**: Regularly test failover scenarios
8. ✅ **Read Scaling**: Route reads đến replicas để giảm load master

## V. Redis Cluster và Sharding

Redis Cluster là giải pháp sharding tự động của Redis, cho phép phân tán dữ liệu trên nhiều nodes để scale ngang (horizontal scaling). Cluster đảm bảo high availability và khả năng chịu lỗi.

### **1. Redis Cluster Architecture**

**Kiến trúc cơ bản:**

```
Redis Cluster (6 nodes minimum):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Node 1    │  │   Node 2    │  │   Node 3    │
│  Master     │  │  Master     │  │  Master     │
│  Slot 0-5460│  │ Slot 5461-  │  │ Slot 10923- │
│             │  │   10922     │  │   16383     │
│  ┌────────┐ │  │  ┌────────┐ │  │  ┌────────┐ │
│  │Replica│ │  │  │Replica│ │  │  │Replica│ │
│  │ Node 4 │ │  │ │ Node 5 │ │  │ │ Node 6 │ │
│  └────────┘ │  │  └────────┘ │  │  └────────┘ │
└─────────────┘  └─────────────┘  └─────────────┘
       │               │               │
       └───────────────┴───────────────┘
                    Gossip Protocol
```

**Đặc điểm:**

- ✅ **Hash Slots**: 16384 slots được phân bổ cho các nodes
- ✅ **Automatic Sharding**: Dữ liệu tự động phân tán theo hash slot
- ✅ **High Availability**: Mỗi master có 1+ replicas
- ✅ **No Proxy**: Clients connect trực tiếp đến cluster nodes
- ✅ **Gossip Protocol**: Nodes communicate với nhau qua gossip
- ✅ **Automatic Failover**: Replica tự động promote khi master down

**Hash Slot Distribution:**

```redis
# Redis Cluster có 16384 hash slots (0-16383)
# Slots được phân bổ đều cho các master nodes

# 3 masters:
# Node 1: Slots 0-5460
# Node 2: Slots 5461-10922
# Node 3: Slots 10923-16383

# Key → Slot calculation:
slot = CRC16(key) % 16384

# Ví dụ:
# Key "user:1001" → CRC16("user:1001") % 16384 = 15243
# → Key thuộc Node 3 (slot 10923-16383)
```

### **2. Setup Redis Cluster**

**Step 1: Cấu hình mỗi Node**

```redis
# redis.conf cho mỗi node
port 7000                    # Port khác nhau cho mỗi node
cluster-enabled yes          # Enable cluster mode
cluster-config-file nodes-7000.conf  # Cluster config file
cluster-node-timeout 15000   # Node timeout (ms)
appendonly yes               # Enable AOF

# Directory
dir /var/lib/redis/7000
```

**Step 2: Start tất cả Nodes**

```bash
# Start 6 nodes (3 masters + 3 replicas)
redis-server redis-7000.conf
redis-server redis-7001.conf
redis-server redis-7002.conf
redis-server redis-7003.conf
redis-server redis-7004.conf
redis-server redis-7005.conf
```

**Step 3: Create Cluster**

```bash
# Tạo cluster với 3 masters và 3 replicas
redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  127.0.0.1:7003 \
  127.0.0.1:7004 \
  127.0.0.1:7005 \
  --cluster-replicas 1

# Output:
# >>> Performing hash slots allocation on 6 nodes...
# Master[0] -> Slots 0 - 5460
# Master[1] -> Slots 5461 - 10922
# Master[2] -> Slots 10923 - 16383
# Adding replica 127.0.0.1:7003 to 127.0.0.1:7000
# Adding replica 127.0.0.1:7004 to 127.0.0.1:7001
# Adding replica 127.0.0.1:7005 to 127.0.0.1:7002
```

**Step 4: Verify Cluster**

```redis
# Connect đến bất kỳ node
redis-cli -c -p 7000

# Check cluster info
CLUSTER INFO
# cluster_state:ok
# cluster_slots_assigned:16384
# cluster_slots_ok:16384
# cluster_slots_pfail:0
# cluster_slots_fail:0
# cluster_known_nodes:6

# Check nodes
CLUSTER NODES
# List tất cả nodes trong cluster
```

### **3. Client Connection và Routing**

**Redirected Commands (MOVED/ASK):**

```redis
# Client connect đến node bất kỳ
redis-cli -c -p 7000

# Nếu key không ở node hiện tại:
SET user:1001 "data"
# → MOVED 15243 127.0.0.1:7002
# Client tự động redirect đến node đúng

# -c flag: Cluster mode (auto-redirect)
# Không có -c: Single-node mode (không redirect)
```

**Smart Clients:**

```javascript
// Cluster-aware client (node-redis)
const { createCluster } = require("redis");

const cluster = createCluster({
  rootNodes: [
    { host: "127.0.0.1", port: 7000 },
    { host: "127.0.0.1", port: 7001 },
    { host: "127.0.0.1", port: 7002 },
  ],
  defaults: {
    socket: {
      connectTimeout: 5000,
    },
  },
});

await cluster.connect();

// Client tự động biết slot distribution
await cluster.set("user:1001", "data"); // Auto-routed
await cluster.get("user:1001"); // Auto-routed
```

**Hash Tags (Key Groups):**

```redis
# Vấn đề: Multi-key operations cần keys ở cùng node
MSET user:1001:name "John" user:1001:email "john@example.com"
# → Keys có thể ở nodes khác nhau (error!)

# Giải pháp: Hash tags
# {tag} trong key → chỉ dùng tag để tính slot

MSET {user:1001}:name "John" {user:1001}:email "john@example.com"
# → Cả 2 keys cùng slot (dùng "user:1001" để tính slot)
# → Đảm bảo cùng node
```

**Multi-key Operations:**

```redis
# ✅ Supported trong cluster (nếu keys cùng slot):
MSET {key}:field1 "value1" {key}:field2 "value2"
MGET {key}:field1 {key}:field2

# ❌ Không supported (keys khác slots):
MSET key1 "value1" key2 "value2"  # Error: CROSSSLOT

# ✅ Supported operations:
# - Single key: GET, SET, HGET, HSET, etc.
# - Same slot multi-key: MSET {tag}key1 {tag}key2
# - EVAL/EVALSHA: Lua scripts (keys phải cùng slot)
```

### **4. Cluster Operations**

**Adding Nodes:**

```bash
# Add new master node
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000

# Add replica node
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7000 --cluster-slave

# Reshard slots (manual)
redis-cli --cluster reshard 127.0.0.1:7000
# → Interactive: Chọn slots để move
```

**Removing Nodes:**

```bash
# Remove node (phải empty slots trước)
redis-cli --cluster del-node 127.0.0.1:7000 <node-id>

# Reshard slots từ node cần xóa
redis-cli --cluster reshard --from <node-id> --to <target-node-id> --slots <num> --yes
```

**Rebalancing:**

```bash
# Rebalance cluster (auto-distribute slots)
redis-cli --cluster rebalance 127.0.0.1:7000

# With options
redis-cli --cluster rebalance \
  --weight <node-id>=<weight> \
  127.0.0.1:7000
```

**Failover:**

```redis
# Automatic failover:
# 1. Master down
# 2. Replica detect master down
# 3. Replica request failover từ other masters
# 4. Replica promoted thành master
# 5. Cluster update configuration

# Manual failover (promote replica):
CLUSTER FAILOVER  # Failover từ replica
```

### **5. Cluster Limitations**

**Limitations:**

1. ❌ **Multi-key operations**: Chỉ khi keys cùng slot (dùng hash tags)
2. ❌ **Transactions**: MULTI/EXEC chỉ khi keys cùng slot
3. ❌ **Lua scripts**: Keys phải cùng slot (hoặc không có keys - global)
4. ❌ **Database selection**: Không có SELECT (chỉ DB 0)
5. ❌ **Pub/Sub**: Hoạt động nhưng có limitations
6. ❌ **Single key operations**: Giới hạn 1 key per operation (trừ hash tags)

**Workarounds:**

```redis
# Multi-key operations: Dùng hash tags
MSET {user:1001}:name "John" {user:1001}:email "john@example.com"

# Transactions: Đảm bảo keys cùng slot
MULTI
SET {user:1001}:name "John"
SET {user:1001}:email "john@example.com"
EXEC

# Lua scripts: Keys cùng slot hoặc không có keys
EVAL "return redis.call('GET', KEYS[1])" 1 {tag}key1
```

### **6. Cluster Best Practices**

1. ✅ **Minimum 3 masters + 3 replicas**: 6 nodes minimum cho cluster
2. ✅ **Odd number of masters**: 3, 5, 7 masters (better for quorum)
3. ✅ **Hash tags**: Dùng cho multi-key operations
4. ✅ **Monitor cluster health**: Track node status và slot distribution
5. ✅ **Network**: Low latency giữa nodes
6. ✅ **Consistent hashing**: Client nên cache slot mapping
7. ✅ **Test failover**: Regularly test node failures
8. ✅ **Backup strategy**: Backup từ mỗi node hoặc replicas

## VI. Performance Tuning và Optimization

Tối ưu hiệu năng Redis đòi hỏi hiểu rõ các yếu tố ảnh hưởng đến performance và áp dụng các kỹ thuật phù hợp.

### **1. Network Optimization**

**Connection Pooling:**

```javascript
// ✅ Tốt: Connection pool
const redis = require("redis");

const client = redis.createClient({
  url: "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    keepAlive: true,
  },
});

// Pool size (Node.js node-redis tự động pool)
// Default: 10 connections per client

// ⚠️ Lưu ý:
// - Không tạo client mới cho mỗi request
// - Reuse client instance
```

**Pipelining:**

```redis
# ✅ Tốt: Pipeline nhiều commands
PIPELINE
  SET key1 "value1"
  SET key2 "value2"
  GET key3
  HGET user:1001 name
EXEC

# → Gửi tất cả commands cùng lúc, giảm round trips
# → Giảm latency đáng kể
```

```javascript
// JavaScript example
const pipeline = client.multi();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.get("key3");
const results = await pipeline.exec();
```

**Batch Operations:**

```redis
# ✅ Tốt: Batch SET
MSET key1 "value1" key2 "value2" key3 "value3"

# ✅ Tốt: Batch GET
MGET key1 key2 key3

# ✅ Tốt: Hash operations
HMSET user:1001 name "John" email "john@example.com" age 30
HMGET user:1001 name email age

# → Giảm số commands, giảm round trips
```

### **2. Command Optimization**

**Tránh Slow Commands:**

```redis
# ❌ Chậm: KEYS * (scan toàn bộ keys)
KEYS *

# ✅ Tốt: SCAN (iterate từng batch)
SCAN 0 MATCH "user:*" COUNT 100
# → Không block Redis, iterate từng batch

# ❌ Chậm: SMEMBERS trên sets lớn
SMEMBERS large:set  # O(N), block Redis

# ✅ Tốt: SSCAN
SSCAN large:set 0 COUNT 100

# ❌ Chậm: HGETALL trên hash lớn
HGETALL large:hash

# ✅ Tốt: HSCAN hoặc chỉ get fields cần
HGET large:hash field1
HMGET large:hash field1 field2
```

**Efficient Data Structures:**

```redis
# ✅ Tốt: Dùng đúng data structure
# Counter: String INCR
INCR page:views

# Small object: Hash
HSET user:1001 name "John"

# Large collection: Chia nhỏ hoặc dùng Scan
# → Tránh operations O(N) trên collections lớn
```

**Atomic Operations:**

```redis
# ✅ Tốt: Atomic operations
INCR counter:views  # Atomic
HINCRBY user:1001 age 1  # Atomic

# ❌ Xấu: GET + SET (race condition)
GET counter:views
SET counter:views 11  # Not atomic!
```

### **3. Memory Optimization**

**Data Structure Selection:**

```redis
# ✅ Tốt: Hash cho objects
HSET user:1001 name "John" email "john@example.com"

# ❌ Xấu: Multiple keys
SET user:1001:name "John"
SET user:1001:email "john@example.com"
# → Overhead cao hơn

# ✅ Tốt: Bitmap cho flags/analytics
SETBIT users:online 1001 1

# ❌ Xấu: Set cho simple flags
SADD users:online 1001
# → Memory overhead cao
```

**Key Naming:**

```redis
# ❌ Xấu: Keys dài
SET user:1001:profile:settings:theme "dark"

# ✅ Tốt: Keys ngắn (vẫn readable)
SET u:1001:p:theme "dark"
# → Tiết kiệm memory
```

**TTL Management:**

```redis
# ✅ Tốt: Set TTL cho cache
SET cache:key "value" EX 3600

# ✅ Tốt: Refresh TTL khi access
GET cache:key
EXPIRE cache:key 3600

# → Tự động cleanup, giảm memory usage
```

### **4. Redis Configuration Tuning**

**Memory Settings:**

```redis
# redis.conf
# Set maxmemory
maxmemory 4gb

# Eviction policy
maxmemory-policy allkeys-lru  # Hoặc volatile-lru

# → Tránh OOM, tự động evict keys
```

**Persistence Settings:**

```redis
# redis.conf
# AOF sync (balance durability và performance)
appendfsync everysec  # everysec (recommended)

# RDB saves
save 900 1
save 300 10
save 60 10000

# → Balance persistence và performance
```

**Network Settings:**

```redis
# redis.conf
# TCP keepalive
tcp-keepalive 60

# Max clients
maxclients 10000

# Timeout
timeout 0  # 0 = no timeout
```

**Performance Settings:**

```redis
# redis.conf
# Disable some commands (production)
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""

# → Security và prevent accidental slow commands

# TCP backlog
tcp-backlog 511

# Disable transparent huge pages (Linux)
# → echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

### **5. Monitoring và Profiling**

**Redis INFO:**

```redis
# General stats
INFO

# Specific sections
INFO memory
INFO stats
INFO replication
INFO cluster
INFO clients
INFO server
```

**Slow Log:**

```redis
# Enable slow log
CONFIG SET slowlog-log-slower-than 10000  # Log commands > 10ms

# View slow log
SLOWLOG GET 10  # 10 slowest commands

# Clear slow log
SLOWLOG RESET
```

**Memory Analysis:**

```redis
# Big keys
redis-cli --bigkeys

# Memory usage
MEMORY USAGE key

# Memory stats
MEMORY STATS

# Memory doctor
MEMORY DOCTOR
```

**Latency Monitoring:**

```redis
# Latency monitoring
CONFIG SET latency-monitor-threshold 100  # Monitor commands > 100ms

# Latency stats
LATENCY LATEST
LATENCY HISTORY command
LATENCY GRAPH command
```

**Performance Testing:**

```bash
# redis-benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50 -d 100

# Options:
# -n: Number of requests
# -c: Number of parallel connections
# -d: Data size (bytes)
# -t: Only test specific commands
```

### **6. Client-Side Optimization**

**Connection Management:**

```javascript
// ✅ Tốt: Singleton pattern
class RedisClient {
  private static instance: RedisClient;

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisClient();
    }
    return this.instance;
  }
}

// ❌ Xấu: Tạo client mới mỗi request
app.get('/users', async (req, res) => {
  const client = redis.createClient();  // ❌ Bad!
  // ...
});
```

**Caching Strategies:**

```javascript
// ✅ Tốt: Cache với TTL
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // Check cache
  let user = await redis.get(cacheKey);
  if (user) {
    return JSON.parse(user);
  }

  // Fetch from DB
  user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

  // Cache với TTL
  await redis.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}
```

**Error Handling:**

```javascript
// ✅ Tốt: Graceful degradation
async function getCachedUser(userId) {
  try {
    return await redis.get(`user:${userId}`);
  } catch (error) {
    // Fallback to database
    console.error("Redis error:", error);
    return await db.getUser(userId);
  }
}
```

### **7. Advanced Optimization Techniques**

**Lua Scripts:**

```redis
# ✅ Tốt: Lua scripts cho atomic operations
EVAL "
  local counter = redis.call('GET', KEYS[1])
  if counter then
    counter = tonumber(counter) + 1
    redis.call('SET', KEYS[1], counter)
    return counter
  else
    redis.call('SET', KEYS[1], 1)
    return 1
  end
" 1 counter:views

# → Atomic operation, reduce round trips
```

**Pub/Sub Optimization:**

```redis
# ✅ Tốt: Pub/Sub cho real-time updates
PUBLISH channel:updates "message"

# Multiple subscribers
SUBSCRIBE channel:updates

# → Efficient message broadcasting
```

**Stream Optimization:**

```redis
# ✅ Tốt: Streams cho event logging
XADD events:user:1001 * action "login"
XREAD BLOCK 1000 STREAMS events:user:1001 $

# → Efficient append-only logging
```

### **8. Performance Best Practices**

1. ✅ **Connection Pooling**: Reuse connections, không tạo mới mỗi request
2. ✅ **Pipelining**: Batch commands để giảm round trips
3. ✅ **Avoid Slow Commands**: Dùng SCAN thay vì KEYS, SSCAN thay vì SMEMBERS
4. ✅ **Memory Efficient**: Chọn data structure phù hợp, set TTL
5. ✅ **Monitor Performance**: Track slow log, latency, memory usage
6. ✅ **Configuration Tuning**: Tune maxmemory, eviction policy, persistence
7. ✅ **Error Handling**: Graceful degradation khi Redis down
8. ✅ **Test Performance**: Benchmark với workload thực tế

## VII. Security và Authentication

Security là yếu tố quan trọng khi deploy Redis vào production. Redis mặc định không có authentication, nên cần cấu hình đúng để bảo vệ dữ liệu.

### **1. Authentication (Password Protection)**

**Setup Password:**

```redis
# redis.conf
requirepass your_strong_password_here

# Hoặc dùng command
CONFIG SET requirepass your_strong_password_here

# Connect với password
redis-cli -a your_strong_password_here

# Hoặc authenticate sau khi connect
AUTH your_strong_password_here
```

**Application Connection:**

```javascript
// Node.js
const redis = require("redis");

const client = redis.createClient({
  url: "redis://:password@localhost:6379",
  // hoặc
  password: "your_password",
});

// Python
import redis
r = redis.Redis(host='localhost', port=6379, password='your_password')
```

**Password Best Practices:**

1. ✅ **Strong password**: Dùng password mạnh, không dùng default
2. ✅ **Rotate passwords**: Đổi password định kỳ
3. ✅ **Environment variables**: Không hardcode password trong code
4. ✅ **Separate passwords**: Khác nhau cho dev, staging, production

### **2. Network Security**

**Bind to Specific Interface:**

```redis
# redis.conf
# ❌ Không an toàn: Bind to all interfaces
bind 0.0.0.0

# ✅ An toàn: Chỉ bind to localhost hoặc internal network
bind 127.0.0.1
# hoặc
bind 192.168.1.10  # Internal IP only
```

**Firewall Rules:**

```bash
# Chỉ allow connections từ trusted IPs
# UFW (Ubuntu)
ufw allow from 192.168.1.0/24 to any port 6379

# iptables
iptables -A INPUT -p tcp --dport 6379 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 6379 -j DROP
```

**Protected Mode:**

```redis
# redis.conf
protected-mode yes  # Enable protected mode (default từ Redis 3.2)

# Protected mode:
# - Nếu không có bind hoặc password → Chỉ accept localhost
# - Nếu có bind/password → Accept từ configured interfaces
```

### **3. Command Security**

**Disable Dangerous Commands:**

```redis
# redis.conf
# Disable FLUSHDB và FLUSHALL
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# Disable CONFIG (hoặc rename để protect)
rename-command CONFIG "CONFIG_a8f5f21f2e34cc"

# Disable DEBUG
rename-command DEBUG ""

# Disable KEYS (slow command)
rename-command KEYS ""
```

**Rename Commands với Password:**

```redis
# Rename và protect với password
rename-command CONFIG "9c203913bf5cccba89145d904b19549a"
# → Phải biết tên mới + password để dùng CONFIG
```

**ACL (Access Control List) - Redis 6.0+:**

```redis
# ACL cho phép fine-grained permissions

# Tạo user với quyền cụ thể
ACL SETUSER alice on >password123 ~cached:* +get +set

# Giải thích:
# - alice: Username
# - on: Account enabled
# - >password123: Password
# - ~cached:*: Allowed keys pattern (chỉ keys bắt đầu với "cached:")
# - +get +set: Allowed commands

# Tạo readonly user
ACL SETUSER readonly on >readonly123 ~* +get +exists +scan

# Tạo admin user
ACL SETUSER admin on >admin123 ~* &* +@all

# List users
ACL LIST

# Save ACL config
ACL SAVE
```

**ACL trong redis.conf:**

```redis
# redis.conf
user default on nopass ~* &* +@all
user alice on >password123 ~cached:* +get +set
user readonly on >readonly123 ~* +get +exists +scan
```

### **4. TLS/SSL Encryption**

**Setup TLS:**

```redis
# redis.conf
# Enable TLS
port 0                      # Disable non-TLS port
tls-port 6379              # TLS port

# TLS certificates
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt

# TLS settings
tls-protocols "TLSv1.2 TLSv1.3"
tls-ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256"
```

**Client Connection với TLS:**

```javascript
// Node.js
const client = redis.createClient({
  url: "rediss://localhost:6379", // rediss = Redis over TLS
  socket: {
    tls: true,
    ca: fs.readFileSync("/path/to/ca.crt"),
  },
});
```

**Generate Certificates:**

```bash
# Self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout redis.key -out redis.crt -days 365 \
  -subj "/CN=redis.example.com"
```

### **5. Data Encryption**

**Application-Level Encryption:**

```javascript
// Encrypt sensitive data trước khi store
const crypto = require("crypto");

function encrypt(text, key) {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encrypted, key) {
  const decipher = crypto.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Store encrypted
await redis.set("user:1001:credit_card", encrypt(cardNumber, secretKey));

// Retrieve và decrypt
const encrypted = await redis.get("user:1001:credit_card");
const cardNumber = decrypt(encrypted, secretKey);
```

### **6. Security Best Practices**

1. ✅ **Authentication**: Luôn enable password (requirepass hoặc ACL)
2. ✅ **Network**: Bind to specific interfaces, dùng firewall
3. ✅ **TLS**: Enable TLS cho production (encrypted connections)
4. ✅ **Disable dangerous commands**: FLUSHDB, FLUSHALL, CONFIG
5. ✅ **ACL**: Dùng ACL cho fine-grained access control (Redis 6.0+)
6. ✅ **Regular updates**: Update Redis lên version mới nhất
7. ✅ **Monitoring**: Monitor failed authentication attempts
8. ✅ **Backup security**: Encrypt backup files
9. ✅ **Environment variables**: Không hardcode credentials
10. ✅ **Least privilege**: Chỉ cấp quyền cần thiết cho users

## VIII. Troubleshooting, Monitoring và Best Practices

Troubleshooting và monitoring là kỹ năng quan trọng để maintain Redis cluster ổn định. Phần này tổng hợp các vấn đề thường gặp, cách giải quyết, và best practices.

### **1. Common Issues và Solutions**

**a) Memory Issues:**

```redis
# Vấn đề: OOM (Out of Memory)
# Error: OOM command not allowed when used memory > 'maxmemory'

# Giải pháp:
# 1. Check memory usage
INFO memory
# used_memory_human: 2.00G
# maxmemory_human: 2.00G

# 2. Set eviction policy
CONFIG SET maxmemory-policy allkeys-lru

# 3. Tăng maxmemory hoặc optimize data
CONFIG SET maxmemory 4gb
```

**b) Connection Issues:**

```redis
# Vấn đề: Too many connections
# Error: max number of clients reached

# Giải pháp:
# 1. Check connections
INFO clients
# connected_clients: 10000
# maxclients: 10000

# 2. Tăng maxclients
CONFIG SET maxclients 20000

# 3. Check connection leaks (application-level)
# → Đảm bảo connections được close đúng cách
```

**c) Replication Lag:**

```redis
# Vấn đề: Replication lag cao
# Replica không sync kịp master

# Giải pháp:
# 1. Check lag
INFO replication
# master_last_io_seconds_ago: 10  # Lag 10 giây

# 2. Tăng replication buffer
CONFIG SET repl-backlog-size 200mb

# 3. Tối ưu queries trên master
# → Tránh slow commands

# 4. Tăng network bandwidth
# → Low latency network giữa master và replica
```

**d) Slow Commands:**

```redis
# Vấn đề: Commands chạy chậm

# Giải pháp:
# 1. Check slow log
SLOWLOG GET 10

# 2. Tránh slow commands
# ❌ KEYS * → ✅ SCAN
# ❌ SMEMBERS → ✅ SSCAN
# ❌ HGETALL → ✅ HSCAN hoặc HMGET

# 3. Optimize data structures
# → Chọn data structure phù hợp
```

**e) Cluster Issues:**

```redis
# Vấn đề: Cluster không stable

# Giải pháp:
# 1. Check cluster status
CLUSTER INFO
# cluster_state:fail  # ❌ Có node down

# 2. Check nodes
CLUSTER NODES
# → Tìm nodes failed

# 3. Fix failed nodes
# → Restart nodes hoặc check network

# 4. Check slot coverage
CLUSTER SLOTS
# → Đảm bảo tất cả slots covered (16384 slots)
```

### **2. Monitoring Tools**

**Redis INFO:**

```redis
# General information
INFO

# Sections:
INFO memory      # Memory usage
INFO stats       # Command statistics
INFO replication # Replication status
INFO cluster     # Cluster information
INFO clients     # Client connections
INFO server      # Server information
INFO cpu         # CPU usage
```

**Redis-cli Monitoring:**

```bash
# Real-time monitoring
redis-cli --stat
# → Real-time stats: commands/sec, keys, memory, etc.

# Latency monitoring
redis-cli --latency
# → Min/max/avg latency

# Latency distribution
redis-cli --latency-history -i 1
# → Latency over time

# Monitor commands
redis-cli MONITOR
# → Stream all commands (⚠️ có thể ảnh hưởng performance)
```

**External Monitoring Tools:**

- **RedisInsight**: Official Redis GUI (monitoring, profiling)
- **Prometheus + Redis Exporter**: Metrics collection
- **Grafana**: Dashboards cho Redis metrics
- **Datadog/New Relic**: APM với Redis integration
- **Redis Commander**: Web-based management

**Prometheus Setup:**

```bash
# Install Redis Exporter
docker run -d \
  --name redis-exporter \
  -p 9121:9121 \
  oliver006/redis_exporter \
  --redis.addr=redis://localhost:6379

# Metrics endpoint: http://localhost:9121/metrics
```

### **3. Performance Metrics**

**Key Metrics:**

```redis
# Throughput
INFO stats
# total_commands_processed: 1000000
# instantaneous_ops_per_sec: 50000

# Memory
INFO memory
# used_memory: 2147483648
# used_memory_human: 2.00G
# mem_fragmentation_ratio: 1.2

# Connections
INFO clients
# connected_clients: 100
# client_recent_max_input_buffer: 2048
# client_recent_max_output_buffer: 0

# Hit Rate (application-level)
# Cache hits / (Cache hits + Cache misses) × 100%
# Target: > 80%
```

**Latency Metrics:**

```redis
# Latency monitoring
CONFIG SET latency-monitor-threshold 100

# Latency events
LATENCY LATEST
# → Recent latency events

# Latency history
LATENCY HISTORY command
# → Historical latency for command

# Latency graph
LATENCY GRAPH command
# → ASCII graph của latency
```

**Memory Metrics:**

```redis
# Memory breakdown
MEMORY STATS

# Key memory usage
MEMORY USAGE key

# Big keys
redis-cli --bigkeys
# → Find keys using most memory
```

### **4. Logging và Debugging**

**Slow Log:**

```redis
# Enable slow log
CONFIG SET slowlog-log-slower-than 10000  # 10ms

# View slow log
SLOWLOG GET 10

# Clear slow log
SLOWLOG RESET

# Get slow log length
SLOWLOG LEN
```

**Redis Logs:**

```bash
# redis.conf
loglevel notice  # debug, verbose, notice, warning

# Log file
logfile /var/log/redis/redis-server.log

# Syslog
syslog-enabled yes
syslog-ident redis
```

**Debugging Commands:**

```redis
# Client list
CLIENT LIST
# → List all connected clients

# Client info
CLIENT INFO

# Kill client
CLIENT KILL ip:port

# Set client name
CLIENT SETNAME myclient

# Get client name
CLIENT GETNAME
```

### **5. Backup và Recovery**

**RDB Backup:**

```bash
# Manual backup
redis-cli BGSAVE

# Check backup status
redis-cli LASTSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Automated backup script
#!/bin/bash
redis-cli BGSAVE
while [ $(redis-cli LASTSAVE) -lt $(date +%s) ]; do
  sleep 1
done
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d-%H%M%S).rdb
```

**AOF Backup:**

```bash
# AOF file tự động update
# → Copy AOF file khi cần

cp /var/lib/redis/appendonly.aof /backup/aof-$(date +%Y%m%d).aof
```

**Recovery:**

```bash
# Stop Redis
redis-cli SHUTDOWN

# Copy backup file
cp /backup/redis-20240115.rdb /var/lib/redis/dump.rdb

# Start Redis
redis-server /etc/redis/redis.conf

# → Redis sẽ load RDB file
```

### **6. Production Best Practices**

**Configuration:**

1. ✅ **Set maxmemory**: Luôn set để tránh OOM
2. ✅ **Enable persistence**: RDB + AOF cho production
3. ✅ **Set eviction policy**: Phù hợp với use case
4. ✅ **Enable protected mode**: Nếu không có password
5. ✅ **Disable dangerous commands**: FLUSHDB, FLUSHALL, KEYS
6. ✅ **TLS encryption**: Cho production deployments
7. ✅ **ACL**: Dùng ACL cho fine-grained access control

**Application:**

1. ✅ **Connection pooling**: Reuse connections
2. ✅ **Error handling**: Graceful degradation
3. ✅ **Timeout configuration**: Set timeouts cho connections
4. ✅ **Retry logic**: Retry với exponential backoff
5. ✅ **Circuit breaker**: Prevent cascade failures
6. ✅ **Monitoring**: Track metrics và alerts

**Operations:**

1. ✅ **Regular backups**: Automated backup strategy
2. ✅ **Test recovery**: Regularly test restore procedures
3. ✅ **Monitor metrics**: Track performance và health
4. ✅ **Alerting**: Set alerts cho critical issues
5. ✅ **Capacity planning**: Plan for growth
6. ✅ **Documentation**: Document configuration và procedures

**Security:**

1. ✅ **Authentication**: Enable password hoặc ACL
2. ✅ **Network security**: Firewall, bind to specific interfaces
3. ✅ **TLS**: Enable TLS cho production
4. ✅ **Regular updates**: Keep Redis updated
5. ✅ **Audit logs**: Track access và changes

### **7. Performance Checklist**

**Pre-Deployment:**

- [ ] maxmemory configured
- [ ] Eviction policy set
- [ ] Persistence enabled (RDB + AOF)
- [ ] Authentication configured
- [ ] Network security configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Slow log enabled

**Ongoing Maintenance:**

- [ ] Monitor memory usage
- [ ] Check slow log regularly
- [ ] Review and optimize queries
- [ ] Monitor replication lag (if using replication)
- [ ] Check cluster health (if using cluster)
- [ ] Regular backups tested
- [ ] Update Redis version
- [ ] Review security settings

### **8. Kết luận**

Redis là một công cụ mạnh mẽ với hiệu năng cao, nhưng cần được cấu hình và sử dụng đúng cách để đạt hiệu quả tối ưu.

**Điểm quan trọng:**

1. ✅ **Memory management**: Quản lý memory hiệu quả là yếu tố quan trọng nhất
2. ✅ **Data structures**: Chọn đúng data structure cho từng use case
3. ✅ **Persistence**: Cấu hình RDB + AOF cho durability
4. ✅ **Replication**: Dùng replication cho high availability
5. ✅ **Cluster**: Dùng cluster cho horizontal scaling
6. ✅ **Security**: Luôn enable authentication và network security
7. ✅ **Monitoring**: Monitor metrics và alerts liên tục
8. ✅ **Best practices**: Áp dụng best practices cho production

**Thứ tự ưu tiên khi optimize:**

1. **Memory optimization**: Chọn data structure phù hợp, set TTL
2. **Query optimization**: Tránh slow commands, dùng pipelining
3. **Configuration tuning**: Tune maxmemory, eviction policy
4. **Replication/Cluster**: Scale reads và writes
5. **Security**: Enable authentication, TLS, ACL
6. **Monitoring**: Setup monitoring và alerting

**Remember:**

- ✅ **Measure before optimize**: Đo đạc trước khi tối ưu
- ✅ **Test in staging**: Test changes trong staging trước
- ✅ **Monitor continuously**: Monitor metrics liên tục
- ✅ **Document everything**: Document configuration và changes
- ✅ **Keep updated**: Update Redis version để nhận security fixes và improvements

## IX. Lua Scripts và Advanced Operations

Lua scripts cho phép thực thi nhiều Redis commands một cách atomic, giảm round trips và đảm bảo tính nhất quán. Hiểu và sử dụng Lua scripts đúng cách là kỹ năng quan trọng để tối ưu Redis.

### **1. Lua Scripts Overview**

**Tại sao dùng Lua Scripts:**

- ✅ **Atomicity**: Tất cả commands trong script chạy atomic
- ✅ **Reduce Round Trips**: Giảm số lần giao tiếp giữa client và server
- ✅ **Complex Logic**: Thực thi logic phức tạp trên server
- ✅ **Performance**: Execute trên server, giảm network overhead

**Lua Script Syntax:**

```lua
-- Basic script
return redis.call('GET', KEYS[1])

-- Multiple operations
local value = redis.call('GET', KEYS[1])
if value then
  return redis.call('INCR', KEYS[1])
else
  return redis.call('SET', KEYS[1], 1)
end
```

### **2. EVAL và EVALSHA**

**EVAL (Evaluate Script):**

```redis
# EVAL script numkeys key1 key2 ... arg1 arg2 ...
EVAL "
  return redis.call('GET', KEYS[1])
" 1 user:1001

# Multiple keys và args
EVAL "
  local name = redis.call('GET', KEYS[1])
  local email = redis.call('GET', KEYS[2])
  return {name, email}
" 2 user:1001:name user:1001:email

# Với arguments
EVAL "
  local key = KEYS[1]
  local field = ARGV[1]
  local value = ARGV[2]
  return redis.call('HSET', key, field, value)
" 1 user:1001 name "John"
```

**EVALSHA (Evaluate Script by SHA):**

```redis
# 1. Load script và get SHA
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# → Returns: "4e6d8fc8bb01276962cce5377fa8048064b38616"

# 2. Execute bằng SHA (nhanh hơn vì không gửi script)
EVALSHA 4e6d8fc8bb01276962cce5377fa8048064b38616 1 user:1001

# → EVALSHA nhanh hơn EVAL (không phải send script mỗi lần)
```

**Script Loading Strategy:**

```javascript
// Application-level: Pre-load scripts
const scripts = {
  increment: {
    script: `
      local current = redis.call('GET', KEYS[1])
      if current then
        return redis.call('INCR', KEYS[1])
      else
        redis.call('SET', KEYS[1], 1)
        return 1
      end
    `,
    sha: null,
  },
};

// Load script on startup
async function loadScripts() {
  for (const [name, script] of Object.entries(scripts)) {
    script.sha = await redis.script("LOAD", script.script);
  }
}

// Use SHA for execution
async function increment(key) {
  return await redis.evalsha(scripts.increment.sha, 1, key);
}
```

### **3. Common Lua Script Patterns**

**Atomic Counter với Conditions:**

```lua
-- Increment counter nếu < max
local current = tonumber(redis.call('GET', KEYS[1]) or 0)
local max = tonumber(ARGV[1])
if current < max then
  return redis.call('INCR', KEYS[1])
else
  return -1  -- Exceeded limit
end

-- Usage:
-- EVAL <script> 1 counter:views 1000
```

**Check and Set (CAS):**

```lua
-- Update chỉ khi value không đổi
local old = redis.call('GET', KEYS[1])
if old == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  return 1  -- Success
else
  return 0  -- Failed (value changed)
end

-- Usage:
-- EVAL <script> 1 key old_value new_value
```

**Distributed Lock với Auto-Release:**

```lua
-- Acquire lock với TTL
local lock_key = KEYS[1]
local lock_value = ARGV[1]
local ttl = tonumber(ARGV[2])

local result = redis.call('SET', lock_key, lock_value, 'NX', 'EX', ttl)
if result then
  return 1  -- Lock acquired
else
  return 0  -- Lock already exists
end

-- Usage:
-- EVAL <script> 1 lock:resource unique_value 30
```

**Release Lock Safely:**

```lua
-- Release lock chỉ khi value match (prevent releasing wrong lock)
local lock_key = KEYS[1]
local lock_value = ARGV[1]

local current = redis.call('GET', lock_key)
if current == lock_value then
  redis.call('DEL', lock_key)
  return 1  -- Released
else
  return 0  -- Value mismatch (lock expired hoặc wrong owner)
end

-- Usage:
-- EVAL <script> 1 lock:resource unique_value
```

**Atomic List Operations:**

```lua
-- Push và trim trong một operation
local list_key = KEYS[1]
local value = ARGV[1]
local max_size = tonumber(ARGV[2])

redis.call('LPUSH', list_key, value)
redis.call('LTRIM', list_key, 0, max_size - 1)
return redis.call('LLEN', list_key)

-- Usage:
-- EVAL <script> 1 recent:items "new_item" 10
-- → Keep only 10 most recent items
```

**Batch Operations:**

```lua
-- Get multiple keys atomically
local results = {}
for i = 1, #KEYS do
  results[i] = redis.call('GET', KEYS[i])
end
return results

-- Usage:
-- EVAL <script> 3 key1 key2 key3
-- → Returns array of values
```

### **4. Lua Script Best Practices**

**Error Handling:**

```lua
-- Handle errors gracefully
local success, result = pcall(function()
  return redis.call('GET', KEYS[1])
end)

if success then
  return result
else
  return {err = result}  -- Return error
end
```

**Performance:**

```lua
-- ✅ Tốt: Sử dụng local variables
local key = KEYS[1]
local value = redis.call('GET', key)

-- ❌ Xấu: Gọi redis.call nhiều lần với cùng key
redis.call('GET', KEYS[1])
redis.call('SET', KEYS[1], 'value')
-- → Nên cache KEYS[1] vào local variable
```

**Script Complexity:**

```lua
-- ⚠️ Lưu ý: Scripts chạy single-threaded
-- → Script phức tạp có thể block Redis

-- ✅ Tốt: Scripts ngắn, nhanh
local value = redis.call('GET', KEYS[1])
return value

-- ⚠️ Cẩn thận: Scripts phức tạp
-- → Có thể block Redis nếu quá lâu
```

**Cluster Considerations:**

```lua
-- Trong Redis Cluster:
-- - Tất cả keys trong script phải cùng slot
-- - Dùng hash tags: {tag}key1, {tag}key2

-- ✅ Tốt: Keys cùng slot (hash tags)
EVAL <script> 2 {user:1001}:name {user:1001}:email

-- ❌ Xấu: Keys khác slots
EVAL <script> 2 user:1001:name user:1002:email
-- → Error: CROSSSLOT
```

### **5. Pub/Sub Advanced Patterns**

**Basic Pub/Sub:**

```redis
# Publisher
PUBLISH channel:updates "message"

# Subscriber
SUBSCRIBE channel:updates
# → Receive messages from channel
```

**Pattern Matching:**

```redis
# Subscribe to multiple channels matching pattern
PSUBSCRIBE channel:*

# Publish to matching channels
PUBLISH channel:updates "message"  # Matches channel:*
PUBLISH channel:news "message"     # Matches channel:*
```

**Pub/Sub Use Cases:**

```javascript
// Real-time notifications
// Publisher
await redis.publish(
  "user:1001:notifications",
  JSON.stringify({
    type: "message",
    content: "You have a new message",
  })
);

// Subscriber (worker process)
const subscriber = redis.duplicate();
await subscriber.connect();
await subscriber.subscribe("user:1001:notifications", (message) => {
  const notification = JSON.parse(message);
  // Send notification to user
});
```

**Limitations:**

- ❌ Messages không persistent (mất nếu không có subscribers)
- ❌ Không đảm bảo delivery (fire-and-forget)
- ❌ Không có message queuing

**Solution: Redis Streams (Better alternative):**

```redis
# Streams: Persistent, reliable message delivery
XADD events:notifications * type "message" content "New message"
XREAD BLOCK 1000 STREAMS events:notifications 0

# → Persistent, có consumer groups, delivery guarantees
```

### **6. Redis Streams Advanced**

**Basic Stream Operations:**

```redis
# Add message
XADD events:user:1001 * action "login" timestamp 1640995200

# Read messages
XREAD STREAMS events:user:1001 0  # From beginning
XREAD BLOCK 1000 STREAMS events:user:1001 $  # New messages

# Range queries
XRANGE events:user:1001 - + COUNT 10  # First 10
XREVRANGE events:user:1001 + - COUNT 10  # Last 10
```

**Consumer Groups:**

```redis
# Create consumer group
XGROUP CREATE events:user:1001 processing-group 0

# Read from group
XREADGROUP GROUP processing-group consumer1 COUNT 10 STREAMS events:user:1001 >

# Process messages, then ACK
XACK events:user:1001 processing-group <message-id>

# Check pending messages
XPENDING events:user:1001 processing-group
```

**Stream Best Practices:**

```javascript
// Worker pattern với consumer groups
async function processEvents(streamKey, groupName, consumerName) {
  while (true) {
    const messages = await redis.xReadGroup(
      groupName,
      consumerName,
      streamKey,
      ">",
      { COUNT: 10, BLOCK: 1000 }
    );

    for (const message of messages) {
      try {
        await processMessage(message);
        // ACK sau khi process thành công
        await redis.xAck(streamKey, groupName, message.id);
      } catch (error) {
        // Handle error, retry hoặc move to dead letter queue
        console.error("Error processing:", error);
      }
    }
  }
}
```

### **7. Transactions (MULTI/EXEC)**

**Basic Transactions:**

```redis
# Start transaction
MULTI

# Queue commands
SET key1 "value1"
SET key2 "value2"
INCR counter:views

# Execute (atomic)
EXEC
# → Tất cả commands chạy atomic hoặc không có gì
```

**Watch (Optimistic Locking):**

```redis
# Watch key trước transaction
WATCH balance:user:1001

MULTI
GET balance:user:1001
SET balance:user:1001 1000
EXEC

# → Nếu balance:user:1001 thay đổi giữa WATCH và EXEC:
# → EXEC returns nil (transaction aborted)
```

**Transaction Limitations:**

- ❌ Không rollback: Nếu lỗi trong transaction, không tự động rollback
- ❌ No nested transactions: Không thể nest MULTI/EXEC
- ❌ Cluster: Keys phải cùng slot (dùng hash tags)

**When to Use:**

```redis
# ✅ Tốt: Atomic operations
MULTI
HSET user:1001 name "John"
HSET user:1001 email "john@example.com"
EXEC

# ✅ Tốt: Optimistic locking
WATCH balance:user:1001
MULTI
GET balance:user:1001
SET balance:user:1001 1000
EXEC

# ❌ Không tốt: Complex logic (dùng Lua script)
# → Lua scripts tốt hơn cho logic phức tạp
```

### **8. Advanced Operations Best Practices**

1. ✅ **Lua Scripts cho atomic operations**: Dùng khi cần logic phức tạp
2. ✅ **EVALSHA thay vì EVAL**: Cache SHA để giảm network overhead
3. ✅ **Scripts ngắn**: Tránh scripts phức tạp block Redis lâu
4. ✅ **Error handling**: Handle errors trong scripts
5. ✅ **Cluster awareness**: Đảm bảo keys cùng slot trong cluster
6. ✅ **Streams thay vì Pub/Sub**: Khi cần persistence và reliability
7. ✅ **Transactions cho simple atomic**: MULTI/EXEC cho operations đơn giản
8. ✅ **Watch cho optimistic locking**: Prevent race conditions

## X. Redis Modules và Advanced Features

Redis Modules cho phép mở rộng Redis với custom data types và commands. Modules cung cấp khả năng mở rộng mạnh mẽ cho các use cases đặc biệt.

### **1. Redis Modules Overview**

**Modules là gì:**

- ✅ **Custom Data Types**: Tạo data types mới (như JSON, Time Series, etc.)
- ✅ **Custom Commands**: Thêm commands mới vào Redis
- ✅ **C Extensions**: Viết bằng C, load vào Redis runtime
- ✅ **High Performance**: Chạy native code, hiệu năng cao

**Popular Modules:**

| Module              | Mô tả                         | Use Case                      |
| ------------------- | ----------------------------- | ----------------------------- |
| **RedisJSON**       | JSON data type                | Store và query JSON           |
| **RediSearch**      | Full-text search              | Search engine trên Redis      |
| **RedisTimeSeries** | Time-series data              | Metrics, monitoring           |
| **RedisGraph**      | Graph database                | Relationship queries          |
| **RedisBloom**      | Probabilistic data structures | Bloom filters, Cuckoo filters |
| **RedisAI**         | Machine Learning              | Run ML models                 |

### **2. RedisJSON**

**Setup:**

```bash
# Load module
redis-server --loadmodule /path/to/redisjson.so

# Hoặc trong redis.conf
loadmodule /path/to/redisjson.so
```

**Basic Operations:**

```redis
# Set JSON
JSON.SET user:1001 $ '{"name":"John","age":30,"email":"john@example.com"}'

# Get JSON
JSON.GET user:1001

# Get specific field
JSON.GET user:1001 $.name
# → "John"

# Update field
JSON.SET user:1001 $.age 31

# Increment numeric field
JSON.NUMINCRBY user:1001 $.age 1
```

**JSON Path:**

```redis
# Nested objects
JSON.SET user:1001 $ '{
  "name":"John",
  "address":{
    "street":"123 Main St",
    "city":"New York"
  }
}'

# Get nested field
JSON.GET user:1001 $.address.city
# → "New York"

# Array operations
JSON.SET user:1001 $.tags '["javascript","redis"]'
JSON.ARRAPPEND user:1001 $.tags "nodejs"
```

**JSON vs Hash:**

```redis
# JSON: Tốt cho nested structures, querying
JSON.SET user:1001 $ '{"name":"John","address":{"city":"NY"}}'
JSON.GET user:1001 $.address.city

# Hash: Tốt cho flat structures, simple operations
HSET user:1001 name "John" city "NY"
HGET user:1001 city

# → Chọn dựa trên use case
```

### **3. RediSearch**

**Setup:**

```bash
# Load module
redis-server --loadmodule /path/to/redisearch.so
```

**Create Index:**

```redis
# Create search index
FT.CREATE products:idx ON HASH PREFIX 1 product: SCHEMA \
  name TEXT WEIGHT 5.0 \
  description TEXT \
  price NUMERIC \
  category TAG

# Index all keys matching "product:*"
```

**Index Documents:**

```redis
# Add documents (as Hashes)
HSET product:1 name "Laptop" description "High performance laptop" price 999 category "electronics"
HSET product:2 name "Mouse" description "Wireless mouse" price 29 category "electronics"
```

**Search:**

```redis
# Simple search
FT.SEARCH products:idx "laptop"

# Search với filters
FT.SEARCH products:idx "laptop" FILTER price 0 500

# Search với aggregations
FT.AGGREGATE products:idx "*" GROUPBY 1 @category REDUCE COUNT 0 AS count
```

**Use Cases:**

- Full-text search trên Redis data
- Product search trong e-commerce
- Content search trong CMS
- Log search và analysis

### **4. RedisTimeSeries**

**Setup:**

```bash
# Load module
redis-server --loadmodule /path/to/redistimeseries.so
```

**Basic Operations:**

```redis
# Create time series
TS.CREATE temperature:sensor1 RETENTION 86400000  # 24 hours

# Add data point
TS.ADD temperature:sensor1 * 25.5  # * = current timestamp

# Query data
TS.RANGE temperature:sensor1 1640995200000 1641081600000

# Aggregations
TS.RANGE temperature:sensor1 1640995200000 1641081600000 AGGREGATION avg 3600000
# → Average temperature per hour
```

**Use Cases:**

- Metrics collection (CPU, memory, network)
- IoT sensor data
- Financial time-series data
- Monitoring và alerting

### **5. RedisBloom**

**Setup:**

```bash
# Load module
redis-server --loadmodule /path/to/redisbloom.so
```

**Bloom Filter:**

```redis
# Create bloom filter
BF.RESERVE users:seen 0.01 1000000
# → Error rate 1%, capacity 1M

# Add elements
BF.ADD users:seen user:1001
BF.ADD users:seen user:1002

# Check membership
BF.EXISTS users:seen user:1001
# → 1 (probably exists)
BF.EXISTS users:seen user:9999
# → 0 (definitely doesn't exist)
```

**Cuckoo Filter:**

```redis
# Create cuckoo filter
CF.RESERVE items:filter 1000000

# Add elements
CF.ADD items:filter item:123
CF.EXISTS items:filter item:123

# Delete element
CF.DEL items:filter item:123
```

**Use Cases:**

- Duplicate detection
- Cache warming (check before querying database)
- Unique visitor tracking
- Rate limiting

### **6. Loading và Managing Modules**

**Load Module:**

```redis
# redis.conf
loadmodule /path/to/redisjson.so
loadmodule /path/to/redisearch.so

# Hoặc command
MODULE LOAD /path/to/redisjson.so
```

**List Modules:**

```redis
# List loaded modules
MODULE LIST

# Output:
# 1) 1) "name"
#    2) "ReJSON"
#    3) "ver"
#    4) "20008"
```

**Unload Module:**

```redis
# Unload module
MODULE UNLOAD ReJSON
```

### **7. Modules Best Practices**

1. ✅ **Choose right module**: Chọn module phù hợp với use case
2. ✅ **Performance**: Modules chạy native code, hiệu năng cao
3. ✅ **Compatibility**: Đảm bảo module compatible với Redis version
4. ✅ **Maintenance**: Keep modules updated
5. ✅ **Testing**: Test modules trong staging trước
6. ✅ **Documentation**: Đọc docs của từng module
7. ✅ **Memory usage**: Modules có thể tốn thêm memory
8. ✅ **Backup compatibility**: Đảm bảo backup tools hỗ trợ modules

### **8. Advanced Features Summary**

**Khi nào dùng gì:**

- ✅ **Lua Scripts**: Atomic operations, complex logic
- ✅ **Pub/Sub**: Simple real-time messaging (no persistence needed)
- ✅ **Streams**: Reliable message queuing, event sourcing
- ✅ **Transactions**: Simple atomic operations
- ✅ **Modules**: Custom data types, special use cases

**Performance Comparison:**

```
Single operation: Fastest
Pipeline: ~10x faster (batch operations)
Lua Script: ~5-10x faster (reduce round trips)
Transaction: ~2-5x faster (batch atomic)
Pub/Sub: Real-time, no persistence
Streams: Persistent, reliable, slower than Pub/Sub
```

**Best Practices:**

1. ✅ **Prefer native commands**: Dùng native commands khi có thể
2. ✅ **Lua scripts cho atomicity**: Khi cần atomic operations
3. ✅ **Streams cho messaging**: Khi cần persistence và reliability
4. ✅ **Modules cho special cases**: Khi cần features đặc biệt
5. ✅ **Test performance**: Benchmark các approaches
6. ✅ **Monitor memory**: Modules có thể tốn memory
7. ✅ **Document usage**: Document khi nào dùng feature nào
