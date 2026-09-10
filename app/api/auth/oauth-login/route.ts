import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, SESSION_COOKIE_NAME } from "@/lib/authServer";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, id, name } = body;

    if (!email || !id) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const fallbackName = cleanEmail.split("@")[0];
    const finalName = name && String(name).trim() ? String(name).trim() : fallbackName;
    const supabase = getSupabaseAdmin();

    // Check if this email is an admin
    const { data: adminData } = await supabase
      .from("store_admins")
      .select("email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (adminData) {
      // Generate cryptographically signed session token for admin
      const sessionToken = await createAdminSessionToken(cleanEmail);
      const isProduction = process.env.NODE_ENV === "production";
      const response = NextResponse.json({
        success: true,
        user: {
          id: id,
          email: cleanEmail,
          name: finalName,
          role: "ADMIN",
        },
      });

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

    // Standard user
    return NextResponse.json({
      success: true,
      user: {
        id: id,
        email: cleanEmail,
        name: finalName,
        role: "USER",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
