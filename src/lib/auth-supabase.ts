import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "./supabase";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Safe user operations using Supabase
async function getUserByEmailSafe(email: string) {
  try {
    const { data, error } = await supabase
      .from("jt_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("❌ Error fetching user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error in getUserByEmailSafe:", error);
    return null;
  }
}

async function createUserWithAccountSafe(userData: any, accountData: any) {
  try {
    // Create user first
    const { data: user, error: userError } = await supabase
      .from("jt_users")
      .insert({
        id: crypto.randomUUID(),
        email: userData.email,
        name: userData.name,
        image: userData.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("❌ Error creating user:", userError);
      return null;
    }

    // Create account
    const { data: account, error: accountError } = await supabase
      .from("jt_accounts")
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        refresh_token: accountData.refresh_token,
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
        session_state: accountData.session_state,
      })
      .select()
      .single();

    if (accountError) {
      console.error("❌ Error creating account:", accountError);
      return null;
    }

    return { user, account };
  } catch (error) {
    console.error("❌ Error in createUserWithAccountSafe:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Chỉ lưu vào database khi có account thực sự (không phải guest/anonymous)
      if (account?.provider === "google" && user?.email) {
        try {
          console.log("🔐 User đăng nhập:", {
            email: user.email,
            name: user.name,
            provider: account.provider,
            accountId: account.providerAccountId,
          });

          // Kiểm tra xem user đã tồn tại chưa
          const existingUser = await getUserByEmailSafe(user.email);

          if (!existingUser) {
            // Tạo user mới trong database chỉ khi đăng nhập bằng account
            const result = await createUserWithAccountSafe(
              {
                email: user.email,
                name: user.name || undefined,
                image: user.image || undefined,
              },
              {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            );

            if (result) {
              console.log("✅ Đã tạo user mới trong database:", {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
              });

              console.log("✅ Đã tạo account trong database:", {
                id: result.account.id,
                provider: result.account.provider,
                providerAccountId: result.account.providerAccountId,
              });
            }
          } else {
            console.log("ℹ️ User đã tồn tại trong database:", {
              id: existingUser.id,
              email: existingUser.email,
            });
          }

          return true;
        } catch (error) {
          console.error("❌ Lỗi khi xử lý đăng nhập:", error);
          // Vẫn cho phép đăng nhập ngay cả khi có lỗi database
          return true;
        }
      }

      // Nếu không có account hoặc không phải Google OAuth, không lưu vào database
      console.log("⚠️ Đăng nhập không có account hoặc không phải Google OAuth");
      return true;
    },
    async session({ session }) {
      if (session?.user?.email) {
        // Chỉ lấy thông tin từ database khi user đã đăng nhập bằng account
        const dbUser = await getUserByEmailSafe(session.user.email);
        if (dbUser) {
          session.user.id = dbUser.id;
          console.log("📋 Session được cập nhật với thông tin từ database:", {
            id: dbUser.id,
            email: dbUser.email,
          });
        } else {
          console.log(
            "⚠️ Không tìm thấy user trong database cho session:",
            session.user.email
          );
        }
      }
      return session;
    },
    async jwt({ user, token }) {
      if (user?.email) {
        // Chỉ lấy thông tin từ database khi user đã đăng nhập bằng account
        const dbUser = await getUserByEmailSafe(user.email);
        if (dbUser) {
          token.uid = dbUser.id;
          console.log(
            "🔑 JWT token được cập nhật với user ID từ database:",
            dbUser.id
          );
        } else {
          console.log(
            "⚠️ Không tìm thấy user trong database cho JWT:",
            user.email
          );
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Tránh redirect loop - không redirect đến success page nếu đã ở đó
      if (url.includes("/auth/success")) {
        return url;
      }

      // Nếu đăng nhập thành công và không phải từ success page, redirect đến success
      if (url === baseUrl || url.startsWith(baseUrl)) {
        return `${baseUrl}/auth/success?callbackUrl=${encodeURIComponent(url)}`;
      }
      return url;
    },
  },
};
