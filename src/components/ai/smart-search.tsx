"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Lightbulb } from "lucide-react";
import { getAllPosts, getTagColor, BlogPost } from "@/lib/blog-data";
import Link from "next/link";

interface SearchResult {
  post: BlogPost;
  score: number;
  matchedContent: string;
}

const SEARCH_SUGGESTIONS = [
  "Next.js 15 features",
  "React performance optimization",
  "TypeScript best practices",
  "Docker containerization",
  "GraphQL vs REST",
  "JavaScript ES6+",
  "CSS Grid và Flexbox",
  "Node.js backend development",
];

export function SmartSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const blogPosts = getAllPosts();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      // Simulate AI-powered search with semantic matching
      const searchResults = await performSemanticSearch(query, blogPosts);
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const performSemanticSearch = async (
    searchQuery: string,
    posts: BlogPost[]
  ): Promise<SearchResult[]> => {
    // Simple semantic search implementation
    const queryWords = searchQuery.toLowerCase().split(" ");
    const results: SearchResult[] = [];

    posts.forEach((post) => {
      let score = 0;
      let matchedContent = "";

      // Check title match
      const titleWords = post.title.toLowerCase().split(" ");
      const titleMatches = queryWords.filter((word) =>
        titleWords.some(
          (titleWord) => titleWord.includes(word) || word.includes(titleWord)
        )
      );
      score += titleMatches.length * 3;

      // Check description match
      const descWords = post.description.toLowerCase().split(" ");
      const descMatches = queryWords.filter((word) =>
        descWords.some(
          (descWord) => descWord.includes(word) || word.includes(descWord)
        )
      );
      score += descMatches.length * 2;

      // Check tags match
      const tagMatches = queryWords.filter((word) =>
        post.tags.some(
          (tag: string) =>
            tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase())
        )
      );
      score += tagMatches.length * 2;

      // Check category match
      const categoryMatch = queryWords.some(
        (word) =>
          post.category.toLowerCase().includes(word) ||
          word.includes(post.category.toLowerCase())
      );
      if (categoryMatch) score += 2;

      // Check content match (first 500 characters)
      const contentWords = post.content
        .toLowerCase()
        .substring(0, 500)
        .split(" ");
      const contentMatches = queryWords.filter((word) =>
        contentWords.some(
          (contentWord) =>
            contentWord.includes(word) || word.includes(contentWord)
        )
      );
      score += contentMatches.length;

      if (score > 0) {
        // Find the best matching content snippet
        const contentLower = post.content.toLowerCase();
        const queryLower = searchQuery.toLowerCase();

        let bestMatch = "";
        let bestIndex = -1;

        // Look for exact phrase match
        const exactIndex = contentLower.indexOf(queryLower);
        if (exactIndex !== -1) {
          bestIndex = exactIndex;
          bestMatch = post.content.substring(
            Math.max(0, exactIndex - 50),
            exactIndex + queryLower.length + 50
          );
        } else {
          // Look for individual word matches
          queryWords.forEach((word) => {
            const wordIndex = contentLower.indexOf(word);
            if (
              wordIndex !== -1 &&
              (bestIndex === -1 || wordIndex < bestIndex)
            ) {
              bestIndex = wordIndex;
              bestMatch = post.content.substring(
                Math.max(0, wordIndex - 50),
                wordIndex + word.length + 50
              );
            }
          });
        }

        if (bestMatch) {
          matchedContent = bestMatch.trim();
        } else {
          matchedContent = post.description;
        }

        results.push({
          post,
          score,
          matchedContent:
            matchedContent.length > 200
              ? matchedContent.substring(0, 200) + "..."
              : matchedContent,
        });
      }
    });

    // Sort by score and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, 6);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm kiếm thông minh: 'React hooks', 'Docker best practices', 'TypeScript tips'..."
              className="pl-10 pr-4"
            />

            {showSuggestions && query.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-10 mt-1">
                {SEARCH_SUGGESTIONS.filter((suggestion) =>
                  suggestion.toLowerCase().includes(query.toLowerCase())
                )
                  .slice(0, 5)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm flex items-center gap-2"
                    >
                      <Lightbulb className="h-3 w-3 text-primary" />
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-6"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tìm...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Tìm kiếm AI</span>
              </div>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Tìm thấy {results.length} kết quả phù hợp</span>
            </div>

            <div className="grid gap-4">
              {results.map((result) => (
                <Card
                  key={result.post.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {result.post.category}
                          </Badge>
                          {result.post.featured && (
                            <Badge className="bg-primary">Featured</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            Độ phù hợp: {Math.round((result.score / 10) * 100)}%
                          </Badge>
                        </div>

                        <CardTitle className="text-lg hover:text-primary transition-colors">
                          <Link href={`/blog/${result.post.slug}`}>
                            {result.post.title}
                          </Link>
                        </CardTitle>

                        <CardDescription className="mt-2">
                          {result.post.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <strong>Nội dung liên quan:</strong>{" "}
                          {result.matchedContent}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {result.post.tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            className={`text-xs ${getTagColor(tag)}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {result.post.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{result.post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-muted-foreground mb-4">
              Thử với từ khóa khác hoặc sử dụng các gợi ý bên dưới
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SEARCH_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
