import { supabase } from "../src/lib/supabase";
import { generateId } from "../src/lib/uuid";

async function createAdminUser() {
  console.log("🌱 Creating admin user...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminName = process.env.ADMIN_NAME || "Super Admin";

  // Check if admin user already exists
  const { data: existingUser } = await supabase
    .from("jt_users")
    .select("id, email")
    .eq("email", adminEmail)
    .single();

  if (existingUser) {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);

    // Check if user has Super Admin role
    const { data: userWithRole } = await supabase
      .from("jt_users")
      .select(
        `
        id,
        email,
        jt_roles!jt_users_roleId_fkey (
          id,
          name,
          slug
        )
      `
      )
      .eq("id", existingUser.id)
      .single();

    if (
      userWithRole &&
      (userWithRole as any).jt_roles?.slug === "super-admin"
    ) {
      console.log("✅ Admin user already has Super Admin role");
      return existingUser;
    } else {
      // Assign Super Admin role
      const { data: superAdminRole } = await supabase
        .from("jt_roles")
        .select("id")
        .eq("slug", "super-admin")
        .single();

      if (superAdminRole) {
        const { error } = await supabase
          .from("jt_users")
          .update({
            roleId: superAdminRole.id,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", existingUser.id);

        if (error) {
          console.error("❌ Failed to assign Super Admin role:", error);
        } else {
          console.log("✅ Assigned Super Admin role to existing user");
        }
      }
      return existingUser;
    }
  }

  // Get Super Admin role
  const { data: superAdminRole } = await supabase
    .from("jt_roles")
    .select("id")
    .eq("slug", "super-admin")
    .single();

  if (!superAdminRole) {
    console.error(
      "❌ Super Admin role not found. Please run roles seeding first."
    );
    return null;
  }

  // Create admin user
  const userId = generateId();
  const { error: userError } = await supabase.from("jt_users").insert({
    id: userId,
    email: adminEmail,
    name: adminName,
    image: null,
    roleId: superAdminRole.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (userError) {
    console.error("❌ Failed to create admin user:", userError);
    return null;
  }

  console.log(`✅ Created admin user: ${adminEmail}`);
  return { id: userId, email: adminEmail };
}

async function createGoogleAccountForAdmin(adminUser: any) {
  if (!adminUser) return;

  console.log("🌱 Creating Google account for admin...");

  const adminEmail = adminUser.email;

  // Check if Google account already exists
  const { data: existingAccount } = await supabase
    .from("jt_accounts")
    .select("id")
    .eq("provider", "google")
    .eq("providerAccountId", adminEmail)
    .single();

  if (existingAccount) {
    console.log(`ℹ️ Google account already exists for: ${adminEmail}`);
    return;
  }

  // Create Google account
  const accountId = generateId();
  const { error: accountError } = await supabase.from("jt_accounts").insert({
    id: accountId,
    userId: adminUser.id,
    type: "oauth",
    provider: "google",
    providerAccountId: adminEmail,
    refresh_token: null,
    access_token: null,
    expires_at: null,
    token_type: "Bearer",
    scope: "openid email profile",
    id_token: null,
    session_state: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (accountError) {
    console.error("❌ Failed to create Google account:", accountError);
  } else {
    console.log(`✅ Created Google account for: ${adminEmail}`);
  }
}

async function main() {
  try {
    console.log("🚀 Starting admin user seeding...");

    const adminUser = await createAdminUser();
    await createGoogleAccountForAdmin(adminUser);

    console.log("✅ Admin user seeding completed!");
    console.log(
      `📧 Admin email: ${process.env.ADMIN_EMAIL || "admin@example.com"}`
    );
    console.log("🔑 You can now sign in with this email using Google OAuth");
  } catch (error) {
    console.error("❌ Admin user seeding failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createAdminUser, createGoogleAccountForAdmin };
