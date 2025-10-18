import { supabase } from "../src/lib/supabase";

async function assignAdminRole() {
  try {
    console.log("🔧 Assigning admin role to existing user...");

    // Replace with your actual email
    const userEmail = "your-email@gmail.com"; // CHANGE THIS TO YOUR EMAIL

    // 1. First, create Super Admin role if it doesn't exist
    const { data: existingRole, error: checkError } = await supabase
      .from("jt_roles")
      .select("*")
      .eq("name", "Super Admin")
      .single();

    let superAdminRole = existingRole;

    if (checkError && checkError.code === "PGRST116") {
      // Role doesn't exist, create it
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
        console.error("❌ Error creating Super Admin role:", createError);
        return;
      }

      superAdminRole = newRole;
      console.log("✅ Created Super Admin role");
    } else if (existingRole) {
      console.log("✅ Super Admin role already exists");
    }

    // 2. Find the user by email
    const { data: user, error: userError } = await supabase
      .from("jt_users")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (userError) {
      console.error("❌ Error finding user:", userError);
      console.log(
        "💡 Make sure you've logged in at least once to create the user record"
      );
      return;
    }

    console.log("✅ Found user:", user.email);

    // 3. Update user with Super Admin role
    const { data: updatedUser, error: updateError } = await supabase
      .from("jt_users")
      .update({
        roleId: superAdminRole.id,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user role:", updateError);
      return;
    }

    console.log(
      "🎉 Successfully assigned Super Admin role to:",
      updatedUser.email
    );
    console.log("🔑 Role ID:", superAdminRole.id);
    console.log("💡 You can now access the admin panel at /admin");
  } catch (error) {
    console.error("❌ Error in assignAdminRole:", error);
  }
}

// Instructions
console.log("📝 Instructions:");
console.log("1. Replace 'your-email@gmail.com' with your actual email");
console.log("2. Make sure you've logged in at least once");
console.log("3. Run: npm run db:assign-admin");
console.log("");

// Run the script
assignAdminRole();
