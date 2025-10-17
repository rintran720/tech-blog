"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function AdminLink() {
  const { data: session, status } = useSession();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (status === "loading" || !session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Kiểm tra quyền admin bằng cách gọi API với permission check
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          setHasAdminAccess(true);
        } else if (response.status === 401) {
          // Unauthorized - không có quyền admin
          setHasAdminAccess(false);
        } else {
          setHasAdminAccess(false);
        }
      } catch {
        setHasAdminAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [session, status]);

  // Không hiển thị gì khi đang loading hoặc không có session
  if (loading || !session?.user) {
    return null;
  }

  // Chỉ hiển thị nút Admin khi user có quyền truy cập
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="text-sm font-medium hover:text-primary transition-colors"
    >
      Admin
    </Link>
  );
}
