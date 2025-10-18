import { supabase } from "../src/lib/supabase";

async function createAdminUser() {
  try {
    console.log("🔧 Creating admin user and roles...");

    // 1. Create Super Admin role
    const { data: superAdminRole, error: roleError } = await supabase
      .from("jt_roles")
      .insert({
        id: crypto.randomUUID(),
        name: "Super Admin",
        slug: "super-admin",
        description: "Full access to all features",
        permissions: JSON.stringify([
          "posts:create",
          "posts:read",
          "posts:update",
          "posts:delete",
          "users:create",
          "users:read",
          "users:update",
          "users:delete",
          "comments:create",
          "comments:read",
          "comments:update",
          "comments:delete",
          "tags:create",
          "tags:read",
          "tags:update",
          "tags:delete",
          "roles:create",
          "roles:read",
          "roles:update",
          "roles:delete",
          "permissions:create",
          "permissions:read",
          "permissions:update",
          "permissions:delete",
        ]),
        isActive: true,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (roleError) {
      console.error("❌ Error creating Super Admin role:", roleError);
      return;
    }

    console.log("✅ Created Super Admin role:", superAdminRole);

    // 2. Create Admin role
    const { data: adminRole, error: adminRoleError } = await supabase
      .from("jt_roles")
      .insert({
        id: crypto.randomUUID(),
        name: "Admin",
        slug: "admin",
        description: "Admin access to most features",
        permissions: JSON.stringify([
          "posts:create",
          "posts:read",
          "posts:update",
          "posts:delete",
          "users:read",
          "users:update",
          "comments:create",
          "comments:read",
          "comments:update",
          "comments:delete",
          "tags:create",
          "tags:read",
          "tags:update",
          "tags:delete",
        ]),
        isActive: true,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (adminRoleError) {
      console.error("❌ Error creating Admin role:", adminRoleError);
      return;
    }

    console.log("✅ Created Admin role:", adminRole);

    // 3. Create test admin user (you'll need to replace with your actual email)
    const adminEmail = "admin@example.com"; // Replace with your email
    const adminName = "Admin User";

    const { data: adminUser, error: userError } = await supabase
      .from("jt_users")
      .insert({
        id: crypto.randomUUID(),
        email: adminEmail,
        name: adminName,
        image: null,
        roleId: superAdminRole.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("❌ Error creating admin user:", userError);
      return;
    }

    console.log("✅ Created admin user:", adminUser);

    // 4. Create account for the admin user (for NextAuth)
    const { data: account, error: accountError } = await supabase
      .from("jt_accounts")
      .insert({
        id: crypto.randomUUID(),
        userId: adminUser.id,
        type: "oauth",
        provider: "google",
        providerAccountId: "admin-" + Date.now(),
        refresh_token: null,
        access_token: null,
        expires_at: null,
        token_type: null,
        scope: null,
        id_token: null,
        session_state: null,
      })
      .select()
      .single();

    if (accountError) {
      console.error("❌ Error creating account:", accountError);
      return;
    }

    console.log("✅ Created account:", account);

    console.log("🎉 Admin setup completed successfully!");
    console.log("📧 Admin email:", adminEmail);
    console.log("🔑 Role: Super Admin");
    console.log("💡 You can now login with this email to access admin panel");
  } catch (error) {
    console.error("❌ Error in createAdminUser:", error);
  }
}

// Run the script
createAdminUser();
