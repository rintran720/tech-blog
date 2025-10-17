"use client";

import { AIChat } from "@/components/ai/ai-chat";
import { ContentRecommendations } from "@/components/ai/content-recommendations";

export function AISection() {
  return (
    <>
      {/* AI Recommendations Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Gợi ý thông minh</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI phân tích sở thích và đề xuất nội dung phù hợp nhất cho bạn
          </p>
        </div>
        <ContentRecommendations
          userInterests={["React", "TypeScript", "Next.js"]}
        />
      </section>

      {/* AI Chat Assistant */}
      <AIChat />
    </>
  );
}
