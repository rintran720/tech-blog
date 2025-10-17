import { PrismaClient } from "@prisma/client";
import { generateSlug } from "../src/lib/utils";

const prisma = new PrismaClient();

const additionalPosts = [
  {
    title: "Next.js 15 - Tính năng mới và cải tiến",
    content: `# Next.js 15 - Tính năng mới và cải tiến

Next.js 15 mang đến nhiều cải tiến đáng kể cho framework React phổ biến nhất hiện nay.

## Turbopack Production Ready
Turbopack giờ đã sẵn sàng cho production với hiệu suất build nhanh hơn đáng kể.

## React 19 Support
Hỗ trợ đầy đủ React 19 với các tính năng mới như Server Components và Actions.

## Improved Caching
Hệ thống caching được cải thiện giúp ứng dụng chạy nhanh hơn.

## Better Developer Experience
Developer tools được nâng cấp với hot reload nhanh hơn và debugging tốt hơn.`,
    excerpt:
      "Khám phá Next.js 15 với Turbopack production-ready và React 19 support.",
    category: "Frontend",
    hotScore: 18,
    tags: ["Next.js", "React", "Frontend"],
  },
  {
    title: "GraphQL vs REST API - So sánh chi tiết",
    content: `# GraphQL vs REST API - So sánh chi tiết

GraphQL và REST là hai cách tiếp cận khác nhau để xây dựng API.

## REST API
- Stateless architecture
- Multiple endpoints
- Fixed data structure
- HTTP methods (GET, POST, PUT, DELETE)

## GraphQL
- Single endpoint
- Flexible queries
- Type-safe
- Real-time subscriptions

## Khi nào dùng REST?
- Simple CRUD operations
- Caching requirements
- Existing HTTP infrastructure

## Khi nào dùng GraphQL?
- Complex data relationships
- Mobile applications
- Real-time features
- Multiple client types`,
    excerpt: "So sánh GraphQL và REST API để chọn giải pháp phù hợp cho dự án.",
    category: "Backend",
    hotScore: 15,
    tags: ["GraphQL", "REST", "API"],
  },
  {
    title: "Microservices Architecture - Kiến trúc hiện đại",
    content: `# Microservices Architecture - Kiến trúc hiện đại

Microservices là một kiến trúc phát triển phần mềm trong đó ứng dụng được chia thành các dịch vụ nhỏ, độc lập.

## Ưu điểm
- Scalability
- Technology diversity
- Fault isolation
- Independent deployment

## Nhược điểm
- Complexity
- Network latency
- Data consistency
- Testing challenges

## Best Practices
- Domain-driven design
- API-first approach
- Containerization
- Monitoring and logging

## Tools
- Docker
- Kubernetes
- Service mesh
- API Gateway`,
    excerpt: "Tìm hiểu kiến trúc microservices và cách triển khai hiệu quả.",
    category: "Architecture",
    hotScore: 20,
    tags: ["Microservices", "Architecture", "DevOps"],
  },
  {
    title: "WebSocket - Real-time Communication",
    content: `# WebSocket - Real-time Communication

WebSocket là một giao thức truyền thông hai chiều qua TCP, cho phép real-time communication.

## Ưu điểm
- Low latency
- Full-duplex communication
- Persistent connection
- Efficient for real-time apps

## Use Cases
- Chat applications
- Live notifications
- Gaming
- Trading platforms
- Collaborative tools

## Implementation
\`\`\`javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = function() {
  console.log('Connected');
};

ws.onmessage = function(event) {
  console.log('Message:', event.data);
};

ws.send('Hello Server');
\`\`\`

## Libraries
- Socket.io
- ws (Node.js)
- SignalR (.NET)
- Phoenix (Elixir)`,
    excerpt:
      "Khám phá WebSocket cho real-time communication trong web applications.",
    category: "Backend",
    hotScore: 12,
    tags: ["WebSocket", "Real-time", "Backend"],
  },
  {
    title: "Redis - In-Memory Data Store",
    content: `# Redis - In-Memory Data Store

Redis là một in-memory data structure store được sử dụng như database, cache, và message broker.

## Data Types
- Strings
- Lists
- Sets
- Sorted Sets
- Hashes
- Bitmaps

## Use Cases
- Caching
- Session storage
- Real-time analytics
- Message queues
- Leaderboards

## Performance
- Sub-millisecond latency
- High throughput
- Memory efficiency
- Persistence options

## Commands
\`\`\`bash
SET key value
GET key
LPUSH list item
SADD set member
HSET hash field value
\`\`\`

## Clustering
- Redis Cluster
- Sentinel
- Replication`,
    excerpt:
      "Tìm hiểu Redis - in-memory data store cho caching và real-time applications.",
    category: "Database",
    hotScore: 16,
    tags: ["Redis", "Cache", "Database"],
  },
  {
    title: "Kubernetes - Container Orchestration",
    content: `# Kubernetes - Container Orchestration

Kubernetes là một platform mã nguồn mở để tự động hóa việc deploy, scale và quản lý containerized applications.

## Core Concepts
- Pods
- Services
- Deployments
- ConfigMaps
- Secrets
- Volumes

## Architecture
- Master nodes
- Worker nodes
- etcd
- API Server
- Scheduler
- Controller Manager

## Commands
\`\`\`bash
kubectl get pods
kubectl apply -f deployment.yaml
kubectl scale deployment app --replicas=3
kubectl logs pod-name
\`\`\`

## Benefits
- Automatic scaling
- Self-healing
- Rolling updates
- Resource management
- Service discovery`,
    excerpt:
      "Học Kubernetes để orchestrate containers và quản lý microservices.",
    category: "DevOps",
    hotScore: 19,
    tags: ["Kubernetes", "DevOps", "Containers"],
  },
  {
    title: "AWS Services - Cloud Computing Platform",
    content: `# AWS Services - Cloud Computing Platform

Amazon Web Services cung cấp một bộ dịch vụ cloud computing toàn diện.

## Compute Services
- EC2 (Elastic Compute Cloud)
- Lambda (Serverless)
- ECS (Container Service)
- EKS (Kubernetes Service)

## Storage Services
- S3 (Simple Storage Service)
- EBS (Elastic Block Store)
- EFS (Elastic File System)
- Glacier (Archive Storage)

## Database Services
- RDS (Relational Database)
- DynamoDB (NoSQL)
- ElastiCache (In-Memory)
- Redshift (Data Warehouse)

## Networking
- VPC (Virtual Private Cloud)
- CloudFront (CDN)
- Route 53 (DNS)
- API Gateway

## Security
- IAM (Identity and Access Management)
- Cognito (Authentication)
- KMS (Key Management)
- WAF (Web Application Firewall)`,
    excerpt: "Khám phá các dịch vụ AWS cho cloud computing và infrastructure.",
    category: "Cloud",
    hotScore: 17,
    tags: ["AWS", "Cloud", "DevOps"],
  },
  {
    title: "Machine Learning với Python",
    content: `# Machine Learning với Python

Python là ngôn ngữ phổ biến nhất cho Machine Learning với nhiều thư viện mạnh mẽ.

## Libraries
- NumPy (Numerical computing)
- Pandas (Data manipulation)
- Scikit-learn (ML algorithms)
- TensorFlow (Deep learning)
- PyTorch (Deep learning)

## Workflow
1. Data collection
2. Data preprocessing
3. Feature engineering
4. Model training
5. Model evaluation
6. Deployment

## Algorithms
- Linear Regression
- Decision Trees
- Random Forest
- SVM
- Neural Networks

## Example
\`\`\`python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier()
model.fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
\`\`\``,
    excerpt: "Học Machine Learning với Python và các thư viện phổ biến.",
    category: "AI/ML",
    hotScore: 14,
    tags: ["Machine Learning", "Python", "AI"],
  },
  {
    title: "CI/CD Pipeline với GitHub Actions",
    content: `# CI/CD Pipeline với GitHub Actions

GitHub Actions giúp tự động hóa workflow từ code đến production.

## Workflow Components
- Triggers (push, pull request)
- Jobs (build, test, deploy)
- Steps (individual tasks)
- Actions (reusable components)

## Example Workflow
\`\`\`yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: echo "Deploying..."
\`\`\`

## Benefits
- Automated testing
- Continuous deployment
- Quality assurance
- Faster delivery`,
    excerpt: "Tự động hóa CI/CD pipeline với GitHub Actions cho dự án.",
    category: "DevOps",
    hotScore: 13,
    tags: ["CI/CD", "GitHub Actions", "DevOps"],
  },
  {
    title: "Elasticsearch - Search Engine",
    content: `# Elasticsearch - Search Engine

Elasticsearch là một search engine phân tán, real-time dựa trên Apache Lucene.

## Features
- Full-text search
- Real-time analytics
- Scalability
- RESTful API
- Schema-free

## Use Cases
- Log analysis
- E-commerce search
- Application monitoring
- Business intelligence
- Security analytics

## Basic Operations
\`\`\`bash
# Index document
PUT /products/1
{
  "name": "Laptop",
  "price": 1000,
  "category": "Electronics"
}

# Search
GET /products/_search
{
  "query": {
    "match": {
      "name": "laptop"
    }
  }
}
\`\`\`

## Elastic Stack
- Elasticsearch (Search engine)
- Kibana (Visualization)
- Logstash (Data processing)
- Beats (Data shippers)`,
    excerpt: "Tìm hiểu Elasticsearch cho search và analytics trong ứng dụng.",
    category: "Database",
    hotScore: 11,
    tags: ["Elasticsearch", "Search", "Analytics"],
  },
  {
    title: "Web Security - Bảo mật Web",
    content: `# Web Security - Bảo mật Web

Bảo mật web là yếu tố quan trọng trong phát triển ứng dụng hiện đại.

## Common Vulnerabilities
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Authentication bypass
- Session hijacking

## Security Headers
\`\`\`javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
\`\`\`

## Authentication
- JWT tokens
- OAuth 2.0
- Multi-factor authentication
- Password hashing
- Session management

## Best Practices
- Input validation
- Output encoding
- HTTPS only
- Regular updates
- Security testing

## Tools
- OWASP ZAP
- Burp Suite
- SSL Labs
- Security headers`,
    excerpt: "Học web security để bảo vệ ứng dụng khỏi các lỗ hổng phổ biến.",
    category: "Security",
    hotScore: 16,
    tags: ["Security", "Web Security", "Authentication"],
  },
  {
    title: "Progressive Web Apps (PWA)",
    content: `# Progressive Web Apps (PWA)

PWA là ứng dụng web có thể hoạt động như native app trên mobile devices.

## Features
- Offline functionality
- Push notifications
- App-like experience
- Fast loading
- Responsive design

## Core Technologies
- Service Workers
- Web App Manifest
- HTTPS
- Responsive design
- App shell architecture

## Service Worker
\`\`\`javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
\`\`\`

## Manifest
\`\`\`json
{
  "name": "My PWA",
  "short_name": "PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}
\`\`\`

## Benefits
- Better user experience
- Lower development cost
- Cross-platform compatibility
- Easy updates`,
    excerpt: "Xây dựng Progressive Web Apps cho trải nghiệm native app.",
    category: "Frontend",
    hotScore: 15,
    tags: ["PWA", "Service Workers", "Mobile"],
  },
  {
    title: "Serverless Architecture",
    content: `# Serverless Architecture

Serverless là mô hình cloud computing nơi cloud provider quản lý server infrastructure.

## Benefits
- No server management
- Auto-scaling
- Pay-per-use
- Faster deployment
- Reduced operational overhead

## Use Cases
- API endpoints
- Data processing
- Scheduled tasks
- Event-driven applications
- Microservices

## Platforms
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Vercel Functions
- Netlify Functions

## Example
\`\`\`javascript
exports.handler = async (event) => {
  const { name } = JSON.parse(event.body);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: \`Hello \${name}!\`
    })
  };
};
\`\`\`

## Considerations
- Cold start latency
- Vendor lock-in
- Debugging challenges
- Limited execution time`,
    excerpt: "Khám phá serverless architecture cho ứng dụng hiện đại.",
    category: "Architecture",
    hotScore: 18,
    tags: ["Serverless", "Lambda", "Cloud"],
  },
  {
    title: "Blockchain Development",
    content: `# Blockchain Development

Blockchain là công nghệ phân tán cho phép lưu trữ dữ liệu một cách an toàn và minh bạch.

## Key Concepts
- Distributed ledger
- Cryptography
- Consensus mechanisms
- Smart contracts
- Decentralization

## Blockchain Types
- Public (Bitcoin, Ethereum)
- Private (Enterprise solutions)
- Consortium (Multiple organizations)
- Hybrid (Combined approach)

## Smart Contracts
\`\`\`solidity
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
\`\`\`

## Use Cases
- Cryptocurrency
- Supply chain
- Identity management
- Voting systems
- Digital assets

## Development Tools
- Truffle
- Hardhat
- Remix
- MetaMask
- Web3.js`,
    excerpt:
      "Học blockchain development và smart contracts cho ứng dụng phi tập trung.",
    category: "Blockchain",
    hotScore: 12,
    tags: ["Blockchain", "Smart Contracts", "Web3"],
  },
  {
    title: "Data Visualization với D3.js",
    content: `# Data Visualization với D3.js

D3.js là thư viện JavaScript mạnh mẽ cho data visualization và manipulation.

## Core Concepts
- Data binding
- DOM manipulation
- Scales
- Axes
- Transitions
- Animations

## Basic Example
\`\`\`javascript
const data = [10, 20, 30, 40, 50];

const svg = d3.select("body")
  .append("svg")
  .attr("width", 400)
  .attr("height", 200);

svg.selectAll("rect")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", (d, i) => i * 50)
  .attr("y", d => 200 - d)
  .attr("width", 40)
  .attr("height", d => d)
  .attr("fill", "steelblue");
\`\`\`

## Chart Types
- Bar charts
- Line charts
- Pie charts
- Scatter plots
- Heatmaps
- Tree maps

## Advanced Features
- Interactive charts
- Real-time updates
- Custom animations
- Responsive design
- Export capabilities

## Libraries
- Chart.js
- Plotly.js
- Highcharts
- Observable Plot`,
    excerpt:
      "Tạo data visualization đẹp mắt với D3.js và các thư viện liên quan.",
    category: "Frontend",
    hotScore: 10,
    tags: ["D3.js", "Data Visualization", "Charts"],
  },
  {
    title: "Mobile App Development với React Native",
    content: `# Mobile App Development với React Native

React Native cho phép phát triển mobile apps bằng JavaScript và React.

## Advantages
- Cross-platform development
- Code reuse
- Hot reload
- Native performance
- Large community

## Getting Started
\`\`\`bash
npx react-native init MyApp
cd MyApp
npx react-native run-android
npx react-native run-ios
\`\`\`

## Components
- View
- Text
- Image
- ScrollView
- FlatList
- TouchableOpacity

## Navigation
\`\`\`javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
\`\`\`

## State Management
- Redux
- Context API
- MobX
- Zustand

## Performance
- FlatList optimization
- Image optimization
- Memory management
- Bundle size optimization`,
    excerpt: "Phát triển mobile apps với React Native cho iOS và Android.",
    category: "Mobile",
    hotScore: 17,
    tags: ["React Native", "Mobile", "Cross-platform"],
  },
  {
    title: "Testing Strategies cho Web Applications",
    content: `# Testing Strategies cho Web Applications

Testing là phần quan trọng trong phát triển phần mềm để đảm bảo chất lượng.

## Testing Types
- Unit testing
- Integration testing
- End-to-end testing
- Performance testing
- Security testing

## Unit Testing
\`\`\`javascript
// Jest example
describe('Calculator', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(add(1, 2)).toBe(3);
  });
});
\`\`\`

## Integration Testing
\`\`\`javascript
// Testing API endpoints
test('GET /api/users', async () => {
  const response = await request(app)
    .get('/api/users')
    .expect(200);
    
  expect(response.body).toHaveProperty('users');
});
\`\`\`

## E2E Testing
\`\`\`javascript
// Cypress example
describe('User Login', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('password');
    cy.get('[data-cy=submit]').click();
    cy.url().should('include', '/dashboard');
  });
});
\`\`\`

## Testing Tools
- Jest (Unit testing)
- Cypress (E2E testing)
- Playwright (E2E testing)
- React Testing Library
- Supertest (API testing)`,
    excerpt: "Học testing strategies và tools để đảm bảo chất lượng ứng dụng.",
    category: "Testing",
    hotScore: 14,
    tags: ["Testing", "Jest", "Cypress"],
  },
  {
    title: "Performance Optimization cho Web Apps",
    content: `# Performance Optimization cho Web Apps

Tối ưu hiệu suất là yếu tố quan trọng để cải thiện trải nghiệm người dùng.

## Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction
- Caching strategies

## Backend Optimization
- Database query optimization
- Caching (Redis, Memcached)
- CDN usage
- Compression (Gzip, Brotli)
- Connection pooling

## React Optimization
\`\`\`javascript
// Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Code splitting
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./Dashboard'))
  }
];
\`\`\`

## Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Time to Interactive (TTI)

## Tools
- Lighthouse
- WebPageTest
- Chrome DevTools
- Bundle Analyzer
- Performance Monitor`,
    excerpt:
      "Tối ưu hiệu suất web applications để cải thiện trải nghiệm người dùng.",
    category: "Performance",
    hotScore: 16,
    tags: ["Performance", "Optimization", "Web Vitals"],
  },
  {
    title: "DevOps Culture và Practices",
    content: `# DevOps Culture và Practices

DevOps là văn hóa và tập hợp các practices kết hợp development và operations.

## Core Principles
- Collaboration
- Automation
- Continuous integration
- Continuous deployment
- Monitoring
- Feedback loops

## DevOps Practices
- Infrastructure as Code
- Configuration management
- Automated testing
- Continuous deployment
- Monitoring and logging
- Incident response

## Tools Ecosystem
- Version Control: Git, GitHub
- CI/CD: Jenkins, GitHub Actions, GitLab CI
- Containerization: Docker, Kubernetes
- Monitoring: Prometheus, Grafana
- Logging: ELK Stack, Fluentd

## Culture Shift
- Breaking silos
- Shared responsibility
- Fail fast, learn faster
- Continuous improvement
- Customer focus

## Benefits
- Faster delivery
- Higher quality
- Better collaboration
- Reduced risk
- Improved customer satisfaction

## Implementation
- Start small
- Automate gradually
- Measure everything
- Learn from failures
- Share knowledge`,
    excerpt:
      "Xây dựng DevOps culture và practices để cải thiện quy trình phát triển.",
    category: "DevOps",
    hotScore: 13,
    tags: ["DevOps", "Culture", "Automation"],
  },
];

async function seedAdditionalPosts() {
  console.log("🌱 Bắt đầu seed additional posts...");

  try {
    // Tìm author
    const author = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
    });

    if (!author) {
      console.error("❌ Không tìm thấy author");
      return;
    }

    console.log(`👤 Sử dụng author: ${author.name}`);

    // Tạo tags nếu chưa có
    const allTags = [...new Set(additionalPosts.flatMap((post) => post.tags))];
    const existingTags = await prisma.tag.findMany({
      where: { name: { in: allTags } },
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTags = allTags.filter(
      (tagName) => !existingTagNames.includes(tagName)
    );

    if (newTags.length > 0) {
      console.log(`🏷️  Tạo ${newTags.length} tags mới...`);
      for (const tagName of newTags) {
        await prisma.tag.create({
          data: {
            name: tagName,
            slug: generateSlug(tagName),
            color: `#${Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, "0")}`,
          },
        });
      }
    }

    const allTagsFromDb = await prisma.tag.findMany();
    console.log(`🏷️  Tìm thấy ${allTagsFromDb.length} tags`);

    // Tạo posts
    for (const postData of additionalPosts) {
      console.log(`📝 Tạo post: ${postData.title}`);

      const slug = generateSlug(postData.title);

      const post = await prisma.post.create({
        data: {
          title: postData.title,
          slug,
          content: postData.content,
          excerpt: postData.excerpt,
          published: true,
          featured: Math.random() > 0.7,
          category: postData.category,
          hotScore: postData.hotScore,
          authorId: author.id,
        },
      });

      // Gắn tags
      const tagsToAttach = allTagsFromDb.filter((tag) =>
        postData.tags.includes(tag.name)
      );

      for (const tag of tagsToAttach) {
        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });
      }

      console.log(`✅ Đã tạo post: ${postData.title} (ID: ${post.id})`);
    }

    console.log("🎉 Hoàn thành seed additional posts!");
    console.log(`📊 Đã tạo ${additionalPosts.length} bài viết`);
  } catch (error) {
    console.error("❌ Lỗi khi seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdditionalPosts();
