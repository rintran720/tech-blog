import { NextRequest, NextResponse } from "next/server";
import { testSupabaseConnection } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing Supabase connection...");

    // Test Supabase connection
    const supabaseConnected = await testSupabaseConnection();

    if (!supabaseConnected) {
      return NextResponse.json(
        {
          error: "Supabase connection failed",
          message: "Cannot connect to Supabase database",
          supabase: supabaseConnected,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      supabase: supabaseConnected,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Set"
        : "Not set",
    });
  } catch (error) {
    console.error("❌ Supabase test failed:", error);

    return NextResponse.json(
      {
        error: "Supabase test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "Set"
          : "Not set",
      },
      { status: 500 }
    );
  }
}
