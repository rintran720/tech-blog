import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const { message, blogPosts } = await request.json();

    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Tạo context từ blog posts
    const blogContext = blogPosts
      .map(
        (post: {
          title: string;
          content: string;
          category: string;
          tags: string[];
        }) =>
          `Tiêu đề: ${post.title}\nNội dung: ${post.content.substring(
            0,
            500
          )}...\nChủ đề: ${post.category}\nTags: ${post.tags.join(", ")}`
      )
      .join("\n\n");

    const systemPrompt = `Bạn là một AI assistant chuyên về công nghệ và lập trình. Bạn có kiến thức sâu về:

- Frontend: React, Next.js, Vue.js, Angular, TypeScript, JavaScript
- Backend: Node.js, Python, Java, C#, Go, Rust
- DevOps: Docker, Kubernetes, CI/CD, AWS, Azure, GCP
- Database: SQL, NoSQL, PostgreSQL, MongoDB, Redis
- Mobile: React Native, Flutter, Swift, Kotlin
- AI/ML: Machine Learning, Deep Learning, TensorFlow, PyTorch

Bạn có thể tham khảo nội dung blog sau để trả lời câu hỏi:

${blogContext}

Hướng dẫn trả lời:
1. Trả lời bằng tiếng Việt, dễ hiểu
2. Cung cấp ví dụ code khi cần thiết
3. Đề xuất bài viết liên quan từ blog nếu phù hợp
4. Nếu không biết, hãy thành thật và đề xuất tìm hiểu thêm
5. Giữ câu trả lời ngắn gọn nhưng đầy đủ thông tin

Hãy trả lời câu hỏi: ${message}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "Xin lỗi, tôi không thể trả lời câu hỏi này.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
