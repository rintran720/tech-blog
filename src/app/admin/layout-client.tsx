"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  MessageSquare,
  Tag,
  Users,
  Key,
  Shield,
  Settings,
  Home,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userRole: string | null;
}

const menuItems = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: BarChart3,
    href: "/admin",
    description: "Thống kê tổng quan",
  },
  {
    id: "posts",
    label: "Bài viết",
    icon: FileText,
    href: "/admin/posts",
    description: "Quản lý bài viết",
  },
  {
    id: "comments",
    label: "Bình luận",
    icon: MessageSquare,
    href: "/admin/comments",
    description: "Duyệt bình luận",
  },
  {
    id: "tags",
    label: "Thẻ",
    icon: Tag,
    href: "/admin/tags",
    description: "Quản lý thẻ",
  },
  {
    id: "users",
    label: "Người dùng",
    icon: Users,
    href: "/admin/users",
    description: "Quản lý người dùng",
  },
  {
    id: "permissions",
    label: "Quyền",
    icon: Key,
    href: "/admin/permissions",
    description: "Quản lý quyền",
  },
  {
    id: "roles",
    label: "Vai trò",
    icon: Shield,
    href: "/admin/roles",
    description: "Quản lý vai trò và quyền",
  },
];

export default function AdminLayoutClient({
  children,
  userRole,
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
            <div className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-primary">{userRole}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Về trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-w-64 max-w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <nav className="p-4 h-full overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
