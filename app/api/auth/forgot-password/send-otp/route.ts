import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetOtpEmail } from "@/lib/resend";
import { storePasswordResetOtp } from "@/lib/otpStore";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address format." },
        { status: 400 }
      );
    }

    // Verify if account exists in Supabase Auth
    let customerName = "Valued Customer";
    try {
      const supabaseAdmin = getSupabaseAdmin();
      // Direct email lookup via DB — avoids loading all users into memory
      const { data: dbUser } = await supabaseAdmin
        .from("users")
        .select("id, raw_user_meta_data")
        .eq("email", cleanEmail)
        .maybeSingle();

      let meta: Record<string, string> | null = null;
      if (dbUser?.id) {
        meta = dbUser.raw_user_meta_data;
      } else {
        // Fallback: SDK has no getUserByEmail, so scan admin list
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (!found) {
          return NextResponse.json(
            { success: false, error: "No account found with this email address. Please verify your email or sign up." },
            { status: 404 }
          );
        }
        meta = found.user_metadata;
      }

      if (meta) {
        customerName = meta.full_name || meta.name || customerName;
      }
    } catch (lookupErr) {
      console.warn("[send-otp user lookup notice]:", lookupErr);
      // Fallback: Proceed if Supabase is temporarily unreachable
    }

    // Generate secure 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store in OTP registry with 60s cooldown check
    const storeResult = storePasswordResetOtp(cleanEmail, otp);
    if (!storeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${storeResult.cooldown}s before requesting another verification code.`,
          cooldown: storeResult.cooldown,
        },
        { status: 429 }
      );
    }

    // Send email using Resend
    const sendResult = await sendPasswordResetOtpEmail({
      to: cleanEmail,
      otp,
      customerName,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || "Could not send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      simulated: sendResult.simulated,
    });
  } catch (error: any) {
    console.error("[send-otp error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
