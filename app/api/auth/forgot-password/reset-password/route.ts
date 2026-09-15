import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetToken, checkIsAdmin } from "@/lib/authServer";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSSRClient } from "@/lib/supabaseServer";

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

    // Verify token validity and expiration
    const tokenResult = await verifyPasswordResetToken(resetToken);
    if (!tokenResult.valid || tokenResult.email?.toLowerCase() !== cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Password reset session has expired or is invalid. Please request a new code." },
        { status: 401 }
      );
    }

    // Update in Supabase Auth
    try {
      const supabaseAdmin = getSupabaseAdmin();
      // Direct email lookup via DB — avoids loading all users into memory
      const { data: userData, error: lookupError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      let targetUserId: string | undefined;
      if (!lookupError && userData?.id) {
        targetUserId = userData.id;
      } else {
        // Fallback to auth.admin.listUsers (SDK limitation: no getUserByEmail)
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        targetUserId = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail)?.id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: "No account found matching this email address." },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: cleanPass,
      });

      if (updateError) {
        console.error("Supabase updateUserById error:", updateError);
        return NextResponse.json(
          { success: false, error: updateError.message || "Failed to update password." },
          { status: 500 }
        );
      }
    } catch (sbErr: any) {
      console.error("Supabase auth update exception:", sbErr);
      return NextResponse.json(
        { success: false, error: sbErr?.message || "Failed to update password in authentication system." },
        { status: 500 }
      );
    }

    // ── Direct Sign-In ──
    // Automatically authenticate the user and establish secure SSR session cookies
    let loggedInUser = null;
    try {
      const ssrClient = await createSSRClient();
      const { data: authData, error: signInError } = await ssrClient.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (!signInError && authData?.user) {
        const isAdmin = await checkIsAdmin(cleanEmail);
        const role = isAdmin ? "ADMIN" : "USER";
        const name =
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          cleanEmail.split("@")[0];

        loggedInUser = {
          id: authData.user.id,
          email: cleanEmail,
          name,
          role,
        };
      }
    } catch (loginErr) {
      console.warn("[direct login after reset warning]:", loginErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successful! Authenticating...",
      user: loggedInUser,
    });
  } catch (error: any) {
    console.error("[reset-password error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
