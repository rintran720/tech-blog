import { supabase } from "../src/lib/supabase";

async function quickAssignAdmin() {
  try {
    console.log("🚀 Quick assign admin role...");

    // Replace with your actual email
    const userEmail = "your-email@gmail.com"; // CHANGE THIS TO YOUR EMAIL

    console.log("📧 Assigning admin role to:", userEmail);

    // 1. Create Super Admin role if it doesn't exist
    let { data: superAdminRole, error: roleError } = await supabase
      .from("jt_roles")
      .select("*")
      .eq("name", "Super Admin")
      .single();

    if (roleError && roleError.code === "PGRST116") {
      // Create the role
      const { data: newRole, error: createError } = await supabase
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

      if (createError) {
        console.error("❌ Error creating role:", createError);
        return;
      }

      superAdminRole = newRole;
      console.log("✅ Created Super Admin role");
    } else if (superAdminRole) {
      console.log("✅ Super Admin role already exists");
    }

    // 2. Update user with Super Admin role
    const { data: updatedUser, error: updateError } = await supabase
      .from("jt_users")
      .update({
        roleId: superAdminRole.id,
        updatedAt: new Date().toISOString(),
      })
      .eq("email", userEmail)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        console.error("❌ User not found:", userEmail);
        console.log("💡 Please login at least once to create user record");
        return;
      } else {
        console.error("❌ Error updating user:", updateError);
        return;
      }
    }

    console.log("🎉 Successfully assigned Super Admin role!");
    console.log("👤 User:", updatedUser.email);
    console.log("🔑 Role:", superAdminRole.name);
    console.log("💡 You can now access /admin");
  } catch (error) {
    console.error("❌ Error in quickAssignAdmin:", error);
  }
}

// Instructions
console.log("📝 Instructions:");
console.log("1. Replace 'your-email@gmail.com' with your actual email");
console.log("2. Make sure you've logged in at least once");
console.log("3. Run: npm run db:quick-admin");
console.log("");

// Run the script
quickAssignAdmin();
