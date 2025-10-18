import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-supabase";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLayoutClient from "./layout-client";

// Force dynamic rendering to prevent build-time database calls
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=" + encodeURIComponent("/admin"));
  }

  // Get user role from database using Supabase
  const { data: user, error } = await supabase
    .from("jt_users")
    .select(
      `
      id,
      email,
      name,
      jt_roles (
        id,
        name,
        slug
      )
    `
    )
    .eq("email", session.user.email)
    .single();

  if (error) {
    console.error("❌ Error fetching user role:", error);
  }

  const userRole = (user?.jt_roles as any)?.name || null;
  const hasAdminAccess =
    userRole === "admin" ||
    userRole === "Admin" ||
    userRole === "Super Admin" ||
    userRole === "super-admin";

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="h-16 w-16 text-muted-foreground mx-auto">🔒</div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-muted-foreground mb-4">
            Bạn cần có quyền admin hoặc super-admin để truy cập trang này.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Vai trò hiện tại:{" "}
            <span className="font-medium">{userRole || "Không có"}</span>
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            🏠 Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return <AdminLayoutClient userRole={userRole}>{children}</AdminLayoutClient>;
}
