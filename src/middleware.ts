import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Tạm thời disable middleware để tránh lỗi với Turbopack
  // Authentication sẽ được xử lý trong trang admin
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
