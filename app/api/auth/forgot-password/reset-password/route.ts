import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetToken } from "@/lib/authServer";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, resetToken, newPassword } = body;

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(newPassword).trim();

    if (cleanPass.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Verify token validity
    const tokenResult = await verifyPasswordResetToken(resetToken);
    if (!tokenResult.valid || tokenResult.email?.toLowerCase() !== cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Password reset session has expired or is invalid. Please request a new code." },
        { status: 401 }
      );
    }

    // Update in Supabase Auth if user exists in Supabase
    try {
      const supabaseAdmin = getSupabaseAdmin();
      // List user by email to find auth user ID
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

      if (targetUser) {
        await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password: cleanPass,
        });
      }
    } catch (sbErr) {
      console.warn("Supabase auth update notice:", sbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. You can now sign in with your new password.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
