import { seedPermissions, seedRoles } from "./seed-roles-permissions";
import {
  createAdminUser,
  createGoogleAccountForAdmin,
} from "./seed-admin-user";
import { seedTags, seedSamplePosts } from "./seed-posts-tags";

async function main() {
  try {
    console.log("🌱 Starting database seeding...");
    console.log("=====================================");

    // Step 1: Seed permissions and roles
    console.log("\n📋 Step 1: Seeding permissions and roles");
    await seedPermissions();
    await seedRoles();

    // Step 2: Create admin user
    console.log("\n👤 Step 2: Creating admin user");
    const adminUser = await createAdminUser();
    await createGoogleAccountForAdmin(adminUser);

    // Step 3: Seed tags and sample posts
    console.log("\n📝 Step 3: Seeding tags and sample posts");
    const tags = await seedTags();
    await seedSamplePosts(tags);

    console.log("\n=====================================");
    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- ✅ Permissions and roles created");
    console.log("- ✅ Admin user created");
    console.log("- ✅ Sample tags and posts created");
    console.log("\n🔑 Admin credentials:");
    console.log(`   Email: ${process.env.ADMIN_EMAIL || "admin@example.com"}`);
    console.log("   Password: Use Google OAuth to sign in");
    console.log("\n🚀 You can now:");
    console.log("   1. Sign in with the admin email using Google OAuth");
    console.log("   2. Access the admin dashboard");
    console.log("   3. Manage users, posts, and content");
  } catch (error) {
    console.error("\n❌ Database seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as seedDatabase };
