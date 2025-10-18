import { supabase } from "../src/lib/supabase";

async function resetDatabase() {
  console.log("🗑️ Resetting database...");

  try {
    // Delete in reverse order of dependencies
    console.log("Deleting post tags...");
    await supabase
      .from("jt_post_tags")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting comments...");
    await supabase
      .from("jt_comments")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting posts...");
    await supabase
      .from("jt_posts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting accounts...");
    await supabase
      .from("jt_accounts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting users...");
    await supabase
      .from("jt_users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting role permissions...");
    await supabase
      .from("jt_role_permissions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting roles...");
    await supabase
      .from("jt_roles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting permissions...");
    await supabase
      .from("jt_permissions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Deleting tags...");
    await supabase
      .from("jt_tags")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("✅ Database reset completed!");
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("⚠️  WARNING: This will delete ALL data from the database!");
    console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await resetDatabase();
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { resetDatabase };
