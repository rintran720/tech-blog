import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence for server-side usage
  },
});

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("jt_posts")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error);
      return false;
    }

    console.log("✅ Supabase connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test failed:", error);
    return false;
  }
}
