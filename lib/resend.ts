// Resend Email Delivery Engine for Beadu Atelier
// Handles transactional emails, OTP verification codes, and password resets

export interface SendOtpEmailParams {
  to: string;
  otp: string;
  customerName?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Sends a branded 6-digit OTP email using Resend API
 */
export async function sendPasswordResetOtpEmail({
  to,
  otp,
  customerName,
}: SendOtpEmailParams): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Beadu Atelier <onboarding@resend.dev>";
  const name = customerName || "Valued Customer";

  // If RESEND_API_KEY is not configured yet, provide seamless local development simulation
  if (!apiKey) {
    console.log("───────────────────────────────────────────────────");
    console.log("📧 [RESEND DEV SIMULATION] Password Reset OTP Email");
    console.log(`To: ${to}`);
    console.log(`Customer: ${name}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log("Set RESEND_API_KEY in your .env to send real emails via Resend.");
    console.log("───────────────────────────────────────────────────");
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Beadu Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f5; margin: 0; padding: 20px; color: #2d2623; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px 32px; border: 1px solid #efe8e4; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .logo { text-align: center; font-size: 24px; font-weight: 300; letter-spacing: 0.1em; color: #792c14; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 12px; color: #1f1b19; }
    .text { font-size: 14px; line-height: 1.6; color: #6b5e58; text-align: center; margin-bottom: 24px; }
    .otp-box { background: #fdf5f2; border: 2px dashed #e4b5a6; border-radius: 16px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #792c14; font-family: monospace; }
    .footer { text-align: center; font-size: 12px; color: #9c8e87; margin-top: 32px; line-height: 1.5; }
    .badge { display: inline-block; background: #f5ebe6; color: #792c14; font-size: 11px; font-weight: 600; padding: 4px 12px; rounded-full; border-radius: 9999px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">BEADU ATELIER</div>
    <div style="text-align: center;"><span class="badge">Password Reset Request</span></div>
    <div class="title">Verify Your Identity</div>
    <div class="text">
      Hello ${name},<br>
      We received a request to reset the password for your account at <strong>www.beadu.in</strong>. Enter the verification code below to proceed:
    </div>

    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>

    <div class="text" style="font-size: 12px; margin-bottom: 0;">
      ⏱️ This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.
    </div>

    <div class="footer">
      Handcrafted Luxury • Jaipur Crafts Hub, Rajasthan<br>
      © ${new Date().getFullYear()} Beadu Atelier. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `${otp} is your Beadu verification code`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Resend API returned status ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to connect to Resend email API.",
    };
  }
}
