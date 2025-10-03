"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Mail, Calendar, Edit } from "lucide-react";
import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Blog Công Nghệ</span>
              </Link>
              <AuthButton />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Blog Công Nghệ</span>
              </Link>
              <AuthButton />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Chưa đăng nhập</CardTitle>
              <CardDescription>
                Bạn cần đăng nhập để xem hồ sơ cá nhân
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/auth/signin">Đăng nhập</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Blog Công Nghệ</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link
                href="/blog"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang chủ
            </Link>
          </Button>

          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="text-lg">
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {session.user.name}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <Mail className="mr-2 h-4 w-4" />
                    {session.user.email}
                  </CardDescription>
                  <div className="flex items-center mt-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      Thành viên của Blog Công Nghệ
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Bài viết đã đọc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  +4 từ tuần trước
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sở thích</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  React, TypeScript, Next.js...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Thời gian đọc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12h</div>
                <p className="text-xs text-muted-foreground">
                  Tổng cộng tháng này
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Sở thích công nghệ</CardTitle>
              <CardDescription>
                Các chủ đề bạn quan tâm để nhận gợi ý phù hợp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">AI/ML</Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  + Thêm sở thích
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                Lịch sử đọc và tương tác của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Đã đọc bài viết &ldquo;Hướng dẫn Next.js 15 với
                      TypeScript&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground">2 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-muted rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Tìm kiếm với AI về &ldquo;React hooks best
                      practices&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground">Hôm qua</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-muted rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Đăng nhập lần đầu vào blog</p>
                    <p className="text-xs text-muted-foreground">
                      3 ngày trước
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
