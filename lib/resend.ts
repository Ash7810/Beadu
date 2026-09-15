import { Resend } from "resend";

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
 * Sends a branded 6-digit OTP verification email for forgot password using the official Resend API
 */
export async function sendPasswordResetOtpEmail({
  to,
  otp,
  customerName,
}: SendOtpEmailParams): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Beadu <orders@beadu.in>";
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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Beadu Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f5; margin: 0; padding: 24px 12px; color: #2d2623;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 1px solid #efe8e4; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="font-size: 26px; font-weight: 300; letter-spacing: 0.15em; color: #792c14; text-transform: uppercase;">
                BEADU
              </div>
              <div style="font-size: 11px; letter-spacing: 0.2em; color: #9c8e87; text-transform: uppercase; margin-top: 2px;">
                Handcrafted Luxury
              </div>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="display: inline-block; background: #fdf5f2; color: #792c14; font-size: 11px; font-weight: 600; padding: 5px 14px; border-radius: 9999px; border: 1px solid #f2ddd6;">
                Password Reset Code
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding-bottom: 16px;">
              <h1 style="font-size: 22px; font-weight: 600; margin: 0; color: #1f1b19;">
                Verify Your Account
              </h1>
            </td>
          </tr>

          <!-- Greeting & Description -->
          <tr>
            <td style="padding-bottom: 24px; font-size: 14px; line-height: 1.6; color: #6b5e58;">
              Hello <strong>${name}</strong>,<br>
              We received a request to reset your password for your Beadu account. Use the 6-digit verification code below to securely reset your password:
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="background: #fdf5f2; border: 2px dashed #e4b5a6; border-radius: 18px; padding: 22px 16px; display: inline-block; width: 85%; max-width: 320px; margin: 0 auto;">
                <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #792c14; font-family: 'Courier New', Courier, monospace; margin-left: 10px;">
                  ${otp}
                </div>
              </div>
            </td>
          </tr>

          <!-- Expiry Notice -->
          <tr>
            <td style="padding-bottom: 20px; font-size: 13px; line-height: 1.5; color: #8a7a73;">
              ⏱️ This code will expire in <strong>10 minutes</strong>.<br>
              For security, please never share this verification code with anyone.
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding: 16px; background: #faf8f7; border-radius: 12px; font-size: 12px; line-height: 1.5; color: #9c8e87; text-align: left;">
              🛡️ <strong>Didn't request this code?</strong><br>
              If you didn't attempt to reset your password, you can safely disregard this email. Your account credentials remain secure.
            </td>
          </tr>

          <!-- Divider & Footer -->
          <tr>
            <td style="padding-top: 28px; border-top: 1px solid #f2ede9; font-size: 11px; color: #a89d97; line-height: 1.6;">
              Beadu Retail • Mumbai, Maharashtra<br>
              Need help? Contact our support at <a href="mailto:beaduuu@gmail.com" style="color: #792c14; text-decoration: none;">beaduuu@gmail.com</a><br>
              © ${new Date().getFullYear()} Beadu. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `${otp} is your Beadu verification code`,
      html: htmlContent,
    });

    if (error) {
      console.error("[Resend send error]:", error);
      return {
        success: false,
        error: error.message || "Failed to send email via Resend.",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to Resend email API.";
    console.error("[Resend exception]:", message);
    return {
      success: false,
      error: message,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Delhivery Wallet Low-Balance & Surge Alert Watchdog
// ─────────────────────────────────────────────────────────────
let lastLowBalanceAlertTime = 0;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes throttle

export async function sendDelhiveryLowBalanceAlert({
  failedOrderId,
  pendingCount = 1,
  errorDetail,
}: {
  failedOrderId?: string;
  pendingCount?: number;
  errorDetail?: string;
}): Promise<EmailSendResult> {
  const now = Date.now();
  if (now - lastLowBalanceAlertTime < ALERT_COOLDOWN_MS) {
    console.log(`[Delhivery Alert Throttled]: Last alert was sent ${Math.round((now - lastLowBalanceAlertTime) / 60000)}m ago.`);
    return { success: true, simulated: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Beadu <orders@beadu.in>";
  const toEmail = process.env.DELHIVERY_SELLER_EMAIL || process.env.ADMIN_ALERT_EMAIL || "beaduuu@gmail.com";

  if (!apiKey) {
    console.log(`[Delhivery Low Balance Alert Simulated]: Alert to ${toEmail} (no RESEND_API_KEY)`);
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Delhivery Wallet Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f5; margin: 0; padding: 24px 12px; color: #2d2623;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background: #ffffff; border-radius: 24px; padding: 36px 28px; border: 1px solid #efe8e4; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <div style="font-size: 26px; font-weight: 300; letter-spacing: 0.15em; color: #792c14; text-transform: uppercase;">BEADU</div>
              <div style="font-size: 11px; letter-spacing: 0.25em; color: #9c8a82; text-transform: uppercase; margin-top: 4px;">Artisan Logistics Watchdog</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 24px; background: #fff5f2; border: 1px solid #fed7cc; border-radius: 16px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #9c2a10; margin: 0 0 8px 0;">⚠️ Delhivery Courier Wallet Depleted</h2>
              <p style="font-size: 13px; color: #6e2714; line-height: 1.5; margin: 0;">
                Order <strong>${failedOrderId || "Recent Order"}</strong> was placed, but Delhivery could not generate a courier manifest because your <strong>Delhivery One prepaid balance</strong> is exhausted.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0; font-size: 13px; color: #524742; line-height: 1.6;">
              <p style="margin: 0 0 12px 0;"><strong>What happened to the order?</strong></p>
              <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #6b5d56;">
                <li>The customer order is <strong>safe and confirmed</strong> on Beadu.</li>
                <li>The shipment has been queued in your <strong>Pending Manifestation Hub</strong>.</li>
                <li>Customer checkout was NOT disrupted.</li>
              </ul>
              <p style="margin: 0 0 8px 0;"><strong>Action Required:</strong></p>
              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #6b5d56;">
                <li>Top up your wallet on the Delhivery One portal (e.g. ₹500 – ₹2,000).</li>
                <li>Open your Beadu Admin Logistics page and click <strong>"⚡ Bulk Manifest All Pending Orders"</strong> to assign waybills in one click.</li>
              </ol>
              <div style="text-align: center; margin: 24px 0 12px 0;">
                <a href="https://one.delhivery.com/" target="_blank" style="background: #792c14; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 14px 28px; border-radius: 12px; display: inline-block;">Recharge Delhivery Wallet →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #efe8e4; padding-top: 16px; text-align: center; font-size: 11px; color: #a89a93;">
              This is an automated operational alert from Beadu Logistics Watchdog.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `⚠️ Action Required: Delhivery Wallet Depleted (${pendingCount} order${pendingCount > 1 ? "s" : ""} queued)`,
      html: htmlContent,
    });

    if (error) {
      console.warn("[Delhivery Alert Email Error]:", error);
      return { success: false, error: error.message };
    }

    lastLowBalanceAlertTime = now;
    console.log(`[Delhivery Alert Email Sent]: Notified ${toEmail} for order ${failedOrderId}`);
    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to dispatch email";
    console.warn("[Delhivery Alert Exception]:", msg);
    return { success: false, error: msg };
  }
}

