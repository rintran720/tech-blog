import { PrismaClient } from "@prisma/client";
import { generateId } from "../src/lib/uuid";

const prisma = new PrismaClient();

const vietnameseProgrammingPosts = [
  {
    title: "ReactJS - Hướng dẫn từ cơ bản đến nâng cao",
    slug: "reactjs-huong-dan-tu-co-ban-den-nang-cao",
    content: `# ReactJS - Hướng dẫn từ cơ bản đến nâng cao

ReactJS là một thư viện JavaScript phổ biến được phát triển bởi Facebook để xây dựng giao diện người dùng. Trong bài viết này, chúng ta sẽ tìm hiểu về ReactJS từ những khái niệm cơ bản nhất.

## Giới thiệu về ReactJS

ReactJS là một thư viện JavaScript mã nguồn mở được sử dụng để xây dựng giao diện người dùng, đặc biệt là cho các ứng dụng web. Nó được phát triển bởi Facebook và được duy trì bởi Facebook và cộng đồng.

## Các tính năng chính của ReactJS

### 1. Virtual DOM
ReactJS sử dụng Virtual DOM để tối ưu hóa việc cập nhật giao diện người dùng. Virtual DOM là một bản sao của DOM thực tế được lưu trữ trong bộ nhớ.

### 2. Component-based Architecture
ReactJS được xây dựng dựa trên kiến trúc component. Mỗi component là một phần độc lập của giao diện người dùng có thể được tái sử dụng.

### 3. JSX
JSX là một cú pháp mở rộng của JavaScript cho phép bạn viết HTML trong JavaScript.

## Cài đặt ReactJS

Để cài đặt ReactJS, bạn có thể sử dụng Create React App:

\`\`\`bash
npx create-react-app my-app
cd my-app
npm start
\`\`\`

## Kết luận

ReactJS là một công cụ mạnh mẽ để xây dựng giao diện người dùng hiện đại. Với kiến trúc component và Virtual DOM, ReactJS giúp việc phát triển ứng dụng web trở nên hiệu quả hơn.`,
    excerpt:
      "Tìm hiểu ReactJS từ cơ bản đến nâng cao với các khái niệm quan trọng như Virtual DOM, Component, JSX và cách cài đặt.",
    category: "Frontend",
    hotScore: 15,
    tagNames: ["React", "JavaScript", "Frontend"],
  },
  {
    title: "Node.js - Xây dựng Backend với JavaScript",
    slug: "nodejs-xay-dung-backend-voi-javascript",
    content: `# Node.js - Xây dựng Backend với JavaScript

Node.js là một runtime JavaScript được xây dựng trên Chrome's V8 JavaScript engine. Nó cho phép bạn chạy JavaScript trên server, không chỉ trên browser.

## Giới thiệu về Node.js

Node.js được phát triển bởi Ryan Dahl vào năm 2009. Nó sử dụng event-driven, non-blocking I/O model, làm cho nó nhẹ và hiệu quả.

## Các tính năng chính

### 1. Non-blocking I/O
Node.js sử dụng non-blocking I/O operations, có nghĩa là nó không chờ đợi một operation hoàn thành trước khi thực hiện operation khác.

### 2. Event-driven Architecture
Node.js sử dụng event-driven architecture với event loop để xử lý các sự kiện.

### 3. NPM (Node Package Manager)
NPM là package manager của Node.js, cho phép bạn cài đặt và quản lý các thư viện JavaScript.

## Cài đặt Node.js

Bạn có thể tải Node.js từ trang web chính thức: https://nodejs.org/

Sau khi cài đặt, kiểm tra phiên bản:

\`\`\`bash
node --version
npm --version
\`\`\`

## Tạo Server đơn giản

\`\`\`javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World!');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

## Kết luận

Node.js đã cách mạng hóa việc phát triển backend bằng JavaScript. Với kiến trúc non-blocking và event-driven, Node.js rất phù hợp cho các ứng dụng real-time.`,
    excerpt:
      "Tìm hiểu Node.js - runtime JavaScript cho server, các tính năng chính và cách xây dựng backend với JavaScript.",
    category: "Backend",
    hotScore: 12,
    tagNames: ["Node.js", "JavaScript", "Backend"],
  },
  {
    title: "Vue.js - Framework JavaScript tiến bộ",
    slug: "vuejs-framework-javascript-tien-bo",
    content: `# Vue.js - Framework JavaScript tiến bộ

Vue.js là một framework JavaScript tiến bộ được sử dụng để xây dựng giao diện người dùng. Nó được thiết kế để dễ học và sử dụng.

## Giới thiệu về Vue.js

Vue.js được tạo ra bởi Evan You vào năm 2014. Nó được thiết kế để dễ học và tích hợp với các dự án hiện có.

## Các tính năng chính

### 1. Reactive Data Binding
Vue.js sử dụng reactive data binding để tự động cập nhật DOM khi dữ liệu thay đổi.

### 2. Component System
Vue.js có hệ thống component mạnh mẽ cho phép bạn tạo các component có thể tái sử dụng.

### 3. Virtual DOM
Giống như React, Vue.js cũng sử dụng Virtual DOM để tối ưu hóa hiệu suất.

## Cài đặt Vue.js

Cách đơn giản nhất là sử dụng CDN:

\`\`\`html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
\`\`\`

Hoặc sử dụng Vue CLI:

\`\`\`bash
npm install -g @vue/cli
vue create my-project
\`\`\`

## Ví dụ đơn giản

\`\`\`html
<div id="app">
  <h1>{{ message }}</h1>
  <button @click="increment">Count: {{ count }}</button>
</div>

<script>
const { createApp } = Vue;

createApp({
  data() {
    return {
      message: 'Hello Vue!',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++;
    }
  }
}).mount('#app');
</script>
\`\`\`

## Kết luận

Vue.js là một framework tuyệt vời cho những người mới bắt đầu với JavaScript frameworks. Nó dễ học và có tài liệu tốt.`,
    excerpt:
      "Tìm hiểu Vue.js - framework JavaScript tiến bộ với reactive data binding, component system và Virtual DOM.",
    category: "Frontend",
    hotScore: 10,
    tagNames: ["Vue.js", "JavaScript", "Frontend"],
  },
  {
    title: "Python Django - Framework Web mạnh mẽ",
    slug: "python-django-framework-web-manh-me",
    content: `# Python Django - Framework Web mạnh mẽ

Django là một framework web Python miễn phí và mã nguồn mở được thiết kế để phát triển nhanh các ứng dụng web phức tạp.

## Giới thiệu về Django

Django được tạo ra bởi Lawrence Journal-World vào năm 2005. Nó tuân theo pattern Model-View-Template (MVT).

## Các tính năng chính

### 1. ORM (Object-Relational Mapping)
Django cung cấp ORM mạnh mẽ cho phép bạn làm việc với database mà không cần viết SQL.

### 2. Admin Interface
Django tự động tạo admin interface để quản lý dữ liệu.

### 3. Security
Django có nhiều tính năng bảo mật tích hợp như CSRF protection, SQL injection prevention.

## Cài đặt Django

\`\`\`bash
pip install django
django-admin startproject myproject
cd myproject
python manage.py runserver
\`\`\`

## Tạo ứng dụng đầu tiên

\`\`\`bash
python manage.py startapp myapp
\`\`\`

## Models

\`\`\`python
from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
\`\`\`

## Views

\`\`\`python
from django.shortcuts import render
from django.http import HttpResponse

def home(request):
    return HttpResponse("Hello, Django!")
\`\`\`

## Kết luận

Django là một framework mạnh mẽ và hoàn chỉnh cho việc phát triển web với Python. Nó có tài liệu tốt và cộng đồng lớn.`,
    excerpt:
      "Tìm hiểu Django - framework web Python mạnh mẽ với ORM, admin interface và các tính năng bảo mật tích hợp.",
    category: "Backend",
    hotScore: 8,
    tagNames: ["Django", "Python", "Backend"],
  },
  {
    title: "JavaScript ES6+ - Những tính năng mới",
    slug: "javascript-es6-nhung-tinh-nang-moi",
    content: `# JavaScript ES6+ - Những tính năng mới

ES6 (ECMAScript 2015) đã mang đến nhiều tính năng mới cho JavaScript, làm cho ngôn ngữ này mạnh mẽ và dễ sử dụng hơn.

## Các tính năng chính của ES6+

### 1. Arrow Functions
Arrow functions cung cấp cú pháp ngắn gọn hơn cho việc viết functions:

\`\`\`javascript
// ES5
function add(a, b) {
  return a + b;
}

// ES6
const add = (a, b) => a + b;
\`\`\`

### 2. Destructuring
Destructuring cho phép bạn trích xuất dữ liệu từ arrays hoặc objects:

\`\`\`javascript
// Array destructuring
const [a, b, c] = [1, 2, 3];

// Object destructuring
const {name, age} = {name: 'John', age: 30};
\`\`\`

### 3. Template Literals
Template literals cho phép bạn nhúng biểu thức trong strings:

\`\`\`javascript
const name = 'John';
const message = \`Hello, \${name}!\`;
\`\`\`

### 4. Classes
ES6 giới thiệu cú pháp class:

\`\`\`javascript
class Person {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return \`Hello, \${this.name}!\`;
  }
}
\`\`\`

### 5. Modules
ES6 modules cho phép bạn import/export code:

\`\`\`javascript
// export
export const add = (a, b) => a + b;

// import
import { add } from './math.js';
\`\`\`

### 6. Promises
Promises giúp xử lý asynchronous operations:

\`\`\`javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    // async operation
    resolve(data);
  });
};
\`\`\`

### 7. Async/Await
Async/await làm cho code asynchronous dễ đọc hơn:

\`\`\`javascript
async function getData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error(error);
  }
}
\`\`\`

## Kết luận

ES6+ đã cách mạng hóa JavaScript, làm cho nó trở thành một ngôn ngữ hiện đại và mạnh mẽ hơn.`,
    excerpt:
      "Tìm hiểu các tính năng mới của JavaScript ES6+ như Arrow Functions, Destructuring, Template Literals, Classes và Modules.",
    category: "JavaScript",
    hotScore: 20,
    tagNames: ["JavaScript", "ES6", "Programming"],
  },
  {
    title: "TypeScript - JavaScript với kiểu dữ liệu",
    slug: "typescript-javascript-voi-kieu-du-lieu",
    content: `# TypeScript - JavaScript với kiểu dữ liệu

TypeScript là một superset của JavaScript được phát triển bởi Microsoft. Nó thêm kiểu dữ liệu tĩnh vào JavaScript.

## Giới thiệu về TypeScript

TypeScript được tạo ra bởi Microsoft vào năm 2012. Nó được thiết kế để phát triển các ứng dụng JavaScript quy mô lớn.

## Lợi ích của TypeScript

### 1. Type Safety
TypeScript cung cấp kiểm tra kiểu dữ liệu tại compile time, giúp phát hiện lỗi sớm.

### 2. Better IDE Support
TypeScript cung cấp IntelliSense tốt hơn và auto-completion trong IDE.

### 3. Refactoring
TypeScript làm cho việc refactoring code an toàn hơn.

## Cài đặt TypeScript

\`\`\`bash
npm install -g typescript
tsc --version
\`\`\`

## Cú pháp cơ bản

### Variables với kiểu dữ liệu

\`\`\`typescript
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;
\`\`\`

### Functions

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

### Interfaces

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John",
  email: "john@example.com"
};
\`\`\`

### Classes

\`\`\`typescript
class Person {
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  public getName(): string {
    return this.name;
  }
}
\`\`\`

### Generics

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("Hello");
\`\`\`

## Compiling TypeScript

\`\`\`bash
tsc app.ts
\`\`\`

Hoặc sử dụng tsconfig.json:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "outDir": "./dist"
  }
}
\`\`\`

## Kết luận

TypeScript là một công cụ tuyệt vời cho việc phát triển JavaScript quy mô lớn. Nó giúp code an toàn hơn và dễ bảo trì hơn.`,
    excerpt:
      "Tìm hiểu TypeScript - superset của JavaScript với kiểu dữ liệu tĩnh, type safety và better IDE support.",
    category: "JavaScript",
    hotScore: 18,
    tagNames: ["TypeScript", "JavaScript", "Programming"],
  },
  {
    title: "MongoDB - Cơ sở dữ liệu NoSQL",
    slug: "mongodb-co-so-du-lieu-nosql",
    content: `# MongoDB - Cơ sở dữ liệu NoSQL

MongoDB là một cơ sở dữ liệu NoSQL document-oriented được thiết kế để lưu trữ dữ liệu dạng JSON-like documents.

## Giới thiệu về MongoDB

MongoDB được phát triển bởi MongoDB Inc. vào năm 2009. Nó được thiết kế để xử lý dữ liệu lớn và có khả năng mở rộng cao.

## Các tính năng chính

### 1. Document-oriented
MongoDB lưu trữ dữ liệu dưới dạng documents (tương tự JSON), không phải tables như SQL.

### 2. Schema-less
MongoDB không yêu cầu schema cố định, cho phép linh hoạt trong việc thay đổi cấu trúc dữ liệu.

### 3. Horizontal Scaling
MongoDB hỗ trợ sharding để phân phối dữ liệu trên nhiều servers.

## Cài đặt MongoDB

### Ubuntu/Debian
\`\`\`bash
sudo apt-get install mongodb
\`\`\`

### macOS
\`\`\`bash
brew install mongodb
\`\`\`

### Windows
Tải từ trang web chính thức: https://www.mongodb.com/try/download/community

## Cú pháp cơ bản

### Kết nối
\`\`\`javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
\`\`\`

### Tạo Database và Collection
\`\`\`javascript
const db = client.db('mydb');
const collection = db.collection('users');
\`\`\`

### Insert Documents
\`\`\`javascript
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const result = await collection.insertOne(user);
\`\`\`

### Find Documents
\`\`\`javascript
// Find all
const users = await collection.find({}).toArray();

// Find with filter
const user = await collection.findOne({ name: 'John Doe' });
\`\`\`

### Update Documents
\`\`\`javascript
const result = await collection.updateOne(
  { name: 'John Doe' },
  { $set: { age: 31 } }
);
\`\`\`

### Delete Documents
\`\`\`javascript
const result = await collection.deleteOne({ name: 'John Doe' });
\`\`\`

## Aggregation Pipeline

\`\`\`javascript
const pipeline = [
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: '$city', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
];

const result = await collection.aggregate(pipeline).toArray();
\`\`\`

## Indexing

\`\`\`javascript
// Create index
await collection.createIndex({ email: 1 });

// Compound index
await collection.createIndex({ name: 1, age: -1 });
\`\`\`

## Kết luận

MongoDB là một cơ sở dữ liệu mạnh mẽ và linh hoạt cho các ứng dụng hiện đại. Nó đặc biệt phù hợp cho các ứng dụng cần xử lý dữ liệu lớn và có khả năng mở rộng cao.`,
    excerpt:
      "Tìm hiểu MongoDB - cơ sở dữ liệu NoSQL document-oriented với schema-less design và horizontal scaling.",
    category: "Database",
    hotScore: 14,
    tagNames: ["MongoDB", "NoSQL", "Database"],
  },
  {
    title: "Docker - Containerization cho Developers",
    slug: "docker-containerization-cho-developers",
    content: `# Docker - Containerization cho Developers

Docker là một platform cho phép bạn đóng gói ứng dụng và dependencies của nó vào trong một container có thể chạy trên bất kỳ môi trường nào.

## Giới thiệu về Docker

Docker được phát triển bởi Docker Inc. vào năm 2013. Nó sử dụng containerization để đảm bảo ứng dụng chạy nhất quán trên mọi môi trường.

## Các khái niệm chính

### 1. Container
Container là một đơn vị đóng gói ứng dụng và tất cả dependencies của nó.

### 2. Image
Image là một template để tạo container. Nó chứa code, runtime, libraries, và settings.

### 3. Dockerfile
Dockerfile là một file text chứa các instructions để build Docker image.

## Cài đặt Docker

### Ubuntu
\`\`\`bash
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo systemctl enable docker
\`\`\`

### macOS
Tải Docker Desktop từ: https://www.docker.com/products/docker-desktop

### Windows
Tải Docker Desktop từ: https://www.docker.com/products/docker-desktop

## Dockerfile cơ bản

\`\`\`dockerfile
# Use official Node.js runtime
FROM node:16

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
\`\`\`

## Docker Commands cơ bản

### Build Image
\`\`\`bash
docker build -t my-app .
\`\`\`

### Run Container
\`\`\`bash
docker run -p 3000:3000 my-app
\`\`\`

### List Images
\`\`\`bash
docker images
\`\`\`

### List Containers
\`\`\`bash
docker ps
docker ps -a
\`\`\`

### Stop Container
\`\`\`bash
docker stop <container-id>
\`\`\`

### Remove Container
\`\`\`bash
docker rm <container-id>
\`\`\`

## Docker Compose

Docker Compose cho phép bạn định nghĩa và chạy multi-container applications:

\`\`\`yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\`

Chạy với Docker Compose:
\`\`\`bash
docker-compose up
docker-compose down
\`\`\`

## Best Practices

### 1. Use .dockerignore
\`\`\`
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
\`\`\`

### 2. Multi-stage Builds
\`\`\`dockerfile
# Build stage
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### 3. Health Checks
\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
\`\`\`

## Kết luận

Docker đã cách mạng hóa cách chúng ta deploy và quản lý ứng dụng. Nó giúp đảm bảo ứng dụng chạy nhất quán trên mọi môi trường và đơn giản hóa quá trình deployment.`,
    excerpt:
      "Tìm hiểu Docker - platform containerization cho phép đóng gói ứng dụng và dependencies vào container có thể chạy trên mọi môi trường.",
    category: "DevOps",
    hotScore: 16,
    tagNames: ["Docker", "DevOps", "Containerization"],
  },
  {
    title: "Git & GitHub - Quản lý mã nguồn hiệu quả",
    slug: "git-github-quan-ly-ma-nguon-hieu-qua",
    content: `# Git & GitHub - Quản lý mã nguồn hiệu quả

Git là một hệ thống quản lý phiên bản phân tán, trong khi GitHub là một platform hosting cho Git repositories.

## Giới thiệu về Git

Git được tạo ra bởi Linus Torvalds vào năm 2005. Nó được thiết kế để quản lý mã nguồn Linux kernel.

## Các khái niệm chính

### 1. Repository
Repository là nơi lưu trữ mã nguồn và lịch sử thay đổi.

### 2. Commit
Commit là một snapshot của mã nguồn tại một thời điểm cụ thể.

### 3. Branch
Branch là một nhánh phát triển độc lập của mã nguồn.

### 4. Merge
Merge là quá trình kết hợp các thay đổi từ branch này sang branch khác.

## Cài đặt Git

### Ubuntu/Debian
\`\`\`bash
sudo apt-get install git
\`\`\`

### macOS
\`\`\`bash
brew install git
\`\`\`

### Windows
Tải từ: https://git-scm.com/download/win

## Git Commands cơ bản

### Khởi tạo Repository
\`\`\`bash
git init
\`\`\`

### Clone Repository
\`\`\`bash
git clone https://github.com/user/repo.git
\`\`\`

### Kiểm tra trạng thái
\`\`\`bash
git status
\`\`\`

### Thêm files
\`\`\`bash
git add .
git add filename.txt
\`\`\`

### Commit
\`\`\`bash
git commit -m "Initial commit"
\`\`\`

### Push
\`\`\`bash
git push origin main
\`\`\`

### Pull
\`\`\`bash
git pull origin main
\`\`\`

## Branching Strategy

### Tạo Branch
\`\`\`bash
git branch feature-branch
git checkout feature-branch
# hoặc
git checkout -b feature-branch
\`\`\`

### Merge Branch
\`\`\`bash
git checkout main
git merge feature-branch
\`\`\`

### Delete Branch
\`\`\`bash
git branch -d feature-branch
\`\`\`

## GitHub Workflow

### 1. Fork Repository
Fork repository từ GitHub để tạo bản copy trong account của bạn.

### 2. Clone Forked Repository
\`\`\`bash
git clone https://github.com/your-username/repo.git
\`\`\`

### 3. Add Upstream Remote
\`\`\`bash
git remote add upstream https://github.com/original-owner/repo.git
\`\`\`

### 4. Create Feature Branch
\`\`\`bash
git checkout -b feature-name
\`\`\`

### 5. Make Changes and Commit
\`\`\`bash
git add .
git commit -m "Add new feature"
\`\`\`

### 6. Push to Fork
\`\`\`bash
git push origin feature-name
\`\`\`

### 7. Create Pull Request
Tạo Pull Request trên GitHub để đề xuất thay đổi.

## Git Hooks

Git hooks là scripts tự động chạy khi có sự kiện Git xảy ra:

\`\`\`bash
# Pre-commit hook
#!/bin/sh
npm test
\`\`\`

## .gitignore

File .gitignore loại trừ files và folders khỏi Git:

\`\`\`
node_modules/
.env
*.log
dist/
build/
\`\`\`

## Best Practices

### 1. Commit Messages
- Sử dụng imperative mood
- Giới hạn dòng đầu tiên 50 ký tự
- Thêm chi tiết ở dòng tiếp theo

### 2. Branch Naming
- feature/feature-name
- bugfix/bug-description
- hotfix/urgent-fix

### 3. Regular Commits
- Commit thường xuyên với messages rõ ràng
- Mỗi commit nên là một logical unit

## Kết luận

Git và GitHub là những công cụ thiết yếu cho mọi developer. Chúng giúp quản lý mã nguồn hiệu quả và cộng tác trong team.`,
    excerpt:
      "Tìm hiểu Git và GitHub - hệ thống quản lý phiên bản phân tán và platform hosting cho Git repositories.",
    category: "Tools",
    hotScore: 13,
    tagNames: ["Git", "GitHub", "Version Control"],
  },
  {
    title: "RESTful API - Thiết kế API chuẩn",
    slug: "restful-api-thiet-ke-api-chuan",
    content: `# RESTful API - Thiết kế API chuẩn

REST (Representational State Transfer) là một architectural style cho việc thiết kế web services. RESTful API là API tuân theo các nguyên tắc REST.

## Giới thiệu về REST

REST được định nghĩa bởi Roy Fielding vào năm 2000. Nó sử dụng HTTP methods để thực hiện các operations trên resources.

## Các nguyên tắc REST

### 1. Stateless
Mỗi request phải chứa tất cả thông tin cần thiết để server hiểu và xử lý.

### 2. Client-Server Architecture
Client và server tách biệt, cho phép phát triển độc lập.

### 3. Cacheable
Responses phải được đánh dấu là cacheable hoặc non-cacheable.

### 4. Uniform Interface
API phải có interface nhất quán và dễ hiểu.

## HTTP Methods

### GET
Lấy dữ liệu từ server:
\`\`\`
GET /api/users
GET /api/users/123
\`\`\`

### POST
Tạo resource mới:
\`\`\`
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

### PUT
Cập nhật toàn bộ resource:
\`\`\`
PUT /api/users/123
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
\`\`\`

### PATCH
Cập nhật một phần resource:
\`\`\`
PATCH /api/users/123
Content-Type: application/json

{
  "email": "newemail@example.com"
}
\`\`\`

### DELETE
Xóa resource:
\`\`\`
DELETE /api/users/123
\`\`\`

## HTTP Status Codes

### 2xx Success
- 200 OK: Request thành công
- 201 Created: Resource được tạo thành công
- 204 No Content: Request thành công nhưng không có content

### 4xx Client Error
- 400 Bad Request: Request không hợp lệ
- 401 Unauthorized: Chưa xác thực
- 403 Forbidden: Không có quyền truy cập
- 404 Not Found: Resource không tồn tại

### 5xx Server Error
- 500 Internal Server Error: Lỗi server
- 502 Bad Gateway: Gateway lỗi
- 503 Service Unavailable: Service không khả dụng

## API Design Best Practices

### 1. URL Structure
\`\`\`
GET    /api/v1/users          # Lấy danh sách users
GET    /api/v1/users/123      # Lấy user cụ thể
POST   /api/v1/users          # Tạo user mới
PUT    /api/v1/users/123      # Cập nhật user
DELETE /api/v1/users/123      # Xóa user
\`\`\`

### 2. Query Parameters
\`\`\`
GET /api/v1/users?page=1&limit=10&sort=name
GET /api/v1/users?search=john&status=active
\`\`\`

### 3. Response Format
\`\`\`json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully"
}
\`\`\`

### 4. Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
\`\`\`

## Authentication & Authorization

### JWT Token
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### API Key
\`\`\`
X-API-Key: your-api-key-here
\`\`\`

## Rate Limiting

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
\`\`\`

## API Documentation

### OpenAPI/Swagger
\`\`\`yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
\`\`\`

## Testing APIs

### Unit Tests
\`\`\`javascript
const request = require('supertest');
const app = require('../app');

test('GET /api/users should return users', async () => {
  const response = await request(app)
    .get('/api/users')
    .expect(200);
    
  expect(response.body.success).toBe(true);
});
\`\`\`

## Kết luận

RESTful API là một cách tiếp cận chuẩn và hiệu quả để thiết kế web services. Việc tuân theo các nguyên tắc REST giúp API dễ sử dụng và bảo trì.`,
    excerpt:
      "Tìm hiểu RESTful API - architectural style cho web services với HTTP methods, status codes và best practices.",
    category: "Backend",
    hotScore: 11,
    tagNames: ["REST", "API", "Backend"],
  },
];

async function seedVietnamesePosts() {
  try {
    console.log("🌱 Bắt đầu seed Vietnamese programming posts...");

    // Lấy user đầu tiên làm author
    const author = await prisma.user.findFirst();
    if (!author) {
      console.log("❌ Không tìm thấy user nào trong database");
      return;
    }

    console.log(`👤 Sử dụng author: ${author.name || author.email}`);

    // Tạo tags nếu chưa có
    const tagNames = [
      "React",
      "JavaScript",
      "Frontend",
      "Node.js",
      "Backend",
      "Vue.js",
      "Django",
      "Python",
      "ES6",
      "TypeScript",
      "Programming",
      "MongoDB",
      "NoSQL",
      "Database",
      "Docker",
      "DevOps",
      "Containerization",
      "Git",
      "GitHub",
      "Version Control",
      "Tools",
      "REST",
      "API",
    ];

    const existingTags = await prisma.tag.findMany({
      where: {
        name: {
          in: tagNames,
        },
      },
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = tagNames.filter(
      (name) => !existingTagNames.includes(name)
    );

    if (newTagNames.length > 0) {
      console.log(`🏷️  Tạo ${newTagNames.length} tags mới...`);
      for (const tagName of newTagNames) {
        await prisma.tag.create({
          data: {
            id: generateId(),
            name: tagName,
            slug: tagName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim(),
            color: getRandomColor(),
          },
        });
      }
    }

    // Lấy tất cả tags
    const allTags = await prisma.tag.findMany({
      where: {
        name: {
          in: tagNames,
        },
      },
    });

    console.log(`🏷️  Tìm thấy ${allTags.length} tags`);

    // Tạo posts
    for (const postData of vietnameseProgrammingPosts) {
      console.log(`📝 Tạo post: ${postData.title}`);

      // Tìm tags cho post này
      const postTags = allTags.filter((tag) =>
        postData.tagNames.includes(tag.name)
      );

      const post = await prisma.post.create({
        data: {
          id: generateId(),
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          excerpt: postData.excerpt,
          published: true,
          featured: Math.random() > 0.7, // 30% chance to be featured
          category: postData.category,
          hotScore: postData.hotScore,
          authorId: author.id,
          tags: {
            create: postTags.map((tag) => ({
              id: generateId(),
              tagId: tag.id,
            })),
          },
        },
      });

      console.log(`✅ Đã tạo post: ${post.title} (ID: ${post.id})`);
    }

    console.log("🎉 Hoàn thành seed Vietnamese programming posts!");
    console.log(`📊 Đã tạo ${vietnameseProgrammingPosts.length} bài viết`);
  } catch (error) {
    console.error("❌ Lỗi khi seed posts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function getRandomColor(): string {
  const colors = [
    "#EF7A43",
    "#3776AB",
    "#61DAFB",
    "#4FC08D",
    "#E34C26",
    "#F7DF1E",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Chạy seed
seedVietnamesePosts();
