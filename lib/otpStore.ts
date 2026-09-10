// Central OTP Storage & Rate-Limiting Engine for Password Resets

interface StoredOtp {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// Use globalThis to persist OTP cache across Next.js dev server hot-reloads and route worker modules
const globalForOtp = globalThis as unknown as {
  __beaduOtpMap?: Map<string, StoredOtp>;
};

export const otpMap =
  globalForOtp.__beaduOtpMap ||
  (globalForOtp.__beaduOtpMap = new Map<string, StoredOtp>());

export function storePasswordResetOtp(email: string, otp: string): { success: boolean; cooldown?: number } {
  const cleanEmail = email.trim().toLowerCase();
  const existing = otpMap.get(cleanEmail);

  const now = Date.now();
  // 60-second cooldown between requests to prevent spam
  if (existing && now - existing.lastSentAt < 60 * 1000) {
    const remainingSeconds = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
    return { success: false, cooldown: remainingSeconds };
  }

  otpMap.set(cleanEmail, {
    otp,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    lastSentAt: now,
  });

  return { success: true };
}

export function verifyPasswordResetOtp(email: string, submittedOtp: string): { valid: boolean; message?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpMap.get(cleanEmail);

  if (!record) {
    return { valid: false, message: "No verification code requested for this email." };
  }

  if (Date.now() > record.expiresAt) {
    otpMap.delete(cleanEmail);
    return { valid: false, message: "Verification code has expired. Please request a new one." };
  }

  if (record.attempts >= 5) {
    otpMap.delete(cleanEmail);
    return { valid: false, message: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.otp !== submittedOtp.trim()) {
    record.attempts += 1;
    return { valid: false, message: `Incorrect verification code. (${5 - record.attempts} attempts remaining)` };
  }

  // OTP verified successfully, clear it
  otpMap.delete(cleanEmail);
  return { valid: true };
}
