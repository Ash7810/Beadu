import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetOtp } from "@/lib/otpStore";
import { createPasswordResetToken } from "@/lib/authServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const verification = verifyPasswordResetOtp(cleanEmail, cleanOtp);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.message || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Generate temporary 15-minute password reset token
    const resetToken = await createPasswordResetToken(cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Code verified successfully.",
      resetToken,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Verification failed." },
      { status: 500 }
    );
  }
}
