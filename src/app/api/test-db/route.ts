import { NextRequest, NextResponse } from "next/server";
import { testDatabaseConnection, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...");

    // Test database connection
    const isConnected = await testDatabaseConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Cannot connect to Supabase database",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testQuery: result,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
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
      },
      { status: 500 }
    );
  }
}
