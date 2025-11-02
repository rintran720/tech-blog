import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Tạm thời disable middleware để tránh lỗi với Turbopack
  // Authentication sẽ được xử lý trong trang admin

  const response = NextResponse.next();

  // Override cache-control for HTML pages to allow back/forward cache
  // This fixes Lighthouse warning about cache-control:no-store
  const pathname = request.nextUrl.pathname;

  // Only apply to HTML pages (not API routes or static assets)
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.match(
      /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js)$/
    )
  ) {
    // Override Next.js force-dynamic default no-store header
    // Allow bfcache while still requiring revalidation
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
