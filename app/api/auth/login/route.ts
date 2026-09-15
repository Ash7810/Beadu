import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabaseServer";

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

    // 1. Authenticate using the SSR Client (this automatically handles setting browser cookies)
    const supabase = await createSSRClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Invalid credentials." },
        { status: 401 }
      );
    }

    // 2. Check if this email is registered as an admin using unified checkIsAdmin
    const { checkIsAdmin } = await import("@/lib/authServer");
    const isAdmin = await checkIsAdmin(cleanEmail);
    const role = isAdmin ? "ADMIN" : "USER";
    const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || cleanEmail.split("@")[0];

    // Supabase already set the secure HTTP-only cookies for us via the SSR client!
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: cleanEmail,
        name,
        role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
