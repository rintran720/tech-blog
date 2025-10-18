import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmailSupabase } from "@/lib/supabase-operations";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    // Check session
    const session = await getServerSession(authOptions);

    let dbUser = null;
    if (session?.user?.email) {
      try {
        dbUser = await getUserByEmailSupabase(session.user.email);
      } catch (error) {
        console.error("Error fetching user from database:", error);
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      session: session
        ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
            },
            expires: session.expires,
          }
        : null,
      dbUser: dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: (dbUser as any).role
              ? {
                  id: (dbUser as any).role.id,
                  name: (dbUser as any).role.name,
                  permissions: (dbUser as any).role.permissions,
                }
              : null,
          }
        : null,
      headers: {
        authorization: request.headers.get("authorization"),
        cookie: request.headers.get("cookie") ? "present" : "missing",
      },
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
