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
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Lookup customer name in Supabase if exists
    let customerName = "Valued Customer";
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin
        .from("bracelets")
        .select("customer_name")
        .eq("email", cleanEmail)
        .limit(1)
        .maybeSingle();

      if (data?.customer_name) {
        customerName = data.customer_name;
      }
    } catch {
      // Offline fallback
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
      message: "Verification code sent to your email.",
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
