import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, SESSION_COOKIE_NAME } from "@/lib/authServer";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    const supabase = getSupabaseAdmin();

    // 1. Check if this email is registered as an admin
    const { data: adminData } = await supabase
      .from("store_admins")
      .select("email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (adminData) {
      // 2. Authenticate the admin using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { success: false, error: "Incorrect password for administrator account." },
          { status: 401 }
        );
      }

      // Generate cryptographically signed session token
      const sessionToken = await createAdminSessionToken(cleanEmail);

      const isProduction = process.env.NODE_ENV === "production";
      const response = NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: cleanEmail,
          name: cleanEmail.split("@")[0],
          role: "ADMIN",
        },
      });

      // Set HTTP-Only, Secure, SameSite session cookie
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // If not an admin, return a specific error code so the client can fallback to local user auth
    return NextResponse.json(
      { success: false, error: "Not an admin account." },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
