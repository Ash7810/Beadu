import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Check if client sent refresh token in headers or body to properly set session
    const refreshToken = req.headers.get("x-refresh-token") || "";

    const supabase = await createSSRClient();

    let user;

    if (refreshToken) {
      // Set the session using both tokens, this will automatically set the secure cookies via SSR client
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });
      if (error || !data.user) {
        return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
      }
      user = data.user;
    } else {
      // Securely verify the token
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (authError || !data.user) {
        return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
      }
      user = data.user;
    }

    if (!user.email) {
      return NextResponse.json({ success: false, error: "User email not found" }, { status: 400 });
    }

    const cleanEmail = String(user.email).trim().toLowerCase();
    const name = user.user_metadata?.full_name || user.user_metadata?.name || cleanEmail.split("@")[0];

    // Check if this email is an admin using unified checkIsAdmin
    const { checkIsAdmin } = await import("@/lib/authServer");
    const isAdmin = await checkIsAdmin(cleanEmail);
    const role = isAdmin ? "ADMIN" : "USER";

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: cleanEmail,
        name: name,
        role,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
