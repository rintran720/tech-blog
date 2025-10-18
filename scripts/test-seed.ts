import { supabase } from "../src/lib/supabase";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");

  try {
    const { data, error } = await supabase
      .from("jt_permissions")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }

    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function checkExistingData() {
  console.log("🔍 Checking existing data...");

  try {
    // Check permissions
    const { data: permissions, error: permError } = await supabase
      .from("jt_permissions")
      .select("id")
      .limit(1);

    if (permError) {
      console.error("❌ Failed to check permissions:", permError);
      return false;
    }

    // Check roles
    const { data: roles, error: roleError } = await supabase
      .from("jt_roles")
      .select("id")
      .limit(1);

    if (roleError) {
      console.error("❌ Failed to check roles:", roleError);
      return false;
    }

    // Check users
    const { data: users, error: userError } = await supabase
      .from("jt_users")
      .select("id")
      .limit(1);

    if (userError) {
      console.error("❌ Failed to check users:", userError);
      return false;
    }

    // Check tags
    const { data: tags, error: tagError } = await supabase
      .from("jt_tags")
      .select("id")
      .limit(1);

    if (tagError) {
      console.error("❌ Failed to check tags:", tagError);
      return false;
    }

    // Check posts
    const { data: posts, error: postError } = await supabase
      .from("jt_posts")
      .select("id")
      .limit(1);

    if (postError) {
      console.error("❌ Failed to check posts:", postError);
      return false;
    }

    console.log("📊 Existing data summary:");
    console.log(`   - Permissions: ${permissions?.length || 0} found`);
    console.log(`   - Roles: ${roles?.length || 0} found`);
    console.log(`   - Users: ${users?.length || 0} found`);
    console.log(`   - Tags: ${tags?.length || 0} found`);
    console.log(`   - Posts: ${posts?.length || 0} found`);

    return true;
  } catch (error) {
    console.error("❌ Failed to check existing data:", error);
    return false;
  }
}

async function main() {
  try {
    console.log("🧪 Testing seed scripts...");
    console.log("=====================================");

    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.log("\n❌ Cannot proceed without database connection");
      process.exit(1);
    }

    await checkExistingData();

    console.log("\n=====================================");
    console.log("✅ Database test completed!");
    console.log("\n📋 Next steps:");
    console.log("   1. Run 'npm run seed' to seed the database");
    console.log("   2. Or run individual seed scripts:");
    console.log("      - npm run seed:roles");
    console.log("      - npm run seed:admin");
    console.log("      - npm run seed:posts");
    console.log("   3. Check the admin dashboard at /admin");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testDatabaseConnection, checkExistingData };
