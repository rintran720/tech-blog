import { NextRequest, NextResponse } from "next/server";
import { testDatabaseConnection, prisma } from "@/lib/prisma";
import { testSupabaseConnection } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connections...");

    // Test Prisma connection
    const prismaConnected = await testDatabaseConnection();

    // Test Supabase connection
    const supabaseConnected = await testSupabaseConnection();

    if (!prismaConnected && !supabaseConnected) {
      return NextResponse.json(
        {
          error: "All database connections failed",
          message: "Cannot connect to any database",
          prisma: prismaConnected,
          supabase: supabaseConnected,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Test a simple query with the working connection
    let testQuery = null;
    if (prismaConnected) {
      try {
        testQuery = await prisma.$queryRaw`SELECT 1 as test`;
      } catch (error) {
        console.error("Prisma query failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database connection(s) successful",
      prisma: prismaConnected,
      supabase: supabaseConnected,
      testQuery,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Set"
        : "Not set",
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);

    return NextResponse.json(
      {
        error: "Database test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "Set"
          : "Not set",
      },
      { status: 500 }
    );
  }
}
