import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSSRClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const passwordStr = String(password);

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    // Password strength enforcement
    if (passwordStr.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const adminDb = getSupabaseAdmin();

    // Use admin API to create and auto-confirm the user's email
    const { data: createData, error: createError } = await adminDb.auth.admin.createUser({
      email: cleanEmail,
      password: passwordStr,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
      },
    });

    if (createError) {
      return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
    }

    // Now log the user in to establish a secure session
    const supabase = await createSSRClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password),
    });

    if (authError || !authData.user) {
      // In the rare case login fails right after creation
      return NextResponse.json({ success: false, error: "Account created, but automatic login failed." }, { status: 500 });
    }

    const { checkIsAdmin } = await import("@/lib/authServer");
    const isAdmin = await checkIsAdmin(cleanEmail);

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: cleanEmail,
        name: cleanName,
        role: isAdmin ? "ADMIN" : "USER",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Registration failed." }, { status: 500 });
  }
}
