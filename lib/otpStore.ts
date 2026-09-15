// Central OTP Storage & Rate-Limiting Engine for Password Resets

interface StoredOtp {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

export interface VerifyOtpResult {
  valid: boolean;
  message?: string;
  attemptsLeft?: number;
  maxAttemptsExceeded?: boolean;
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

export function verifyPasswordResetOtp(email: string, submittedOtp: string): VerifyOtpResult {
  const cleanEmail = email.trim().toLowerCase();
  const record = otpMap.get(cleanEmail);

  if (!record) {
    return {
      valid: false,
      message: "No verification code was found or it has expired. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    otpMap.delete(cleanEmail);
    return {
      valid: false,
      message: "This verification code has expired (10 min limit). Please request a new one.",
    };
  }

  if (record.attempts >= 5) {
    otpMap.delete(cleanEmail);
    return {
      valid: false,
      message: "Maximum 5 attempts reached. This code is locked for your security.",
      attemptsLeft: 0,
      maxAttemptsExceeded: true,
    };
  }

  if (record.otp !== submittedOtp.trim()) {
    record.attempts += 1;
    const remaining = Math.max(0, 5 - record.attempts);

    if (remaining === 0) {
      otpMap.delete(cleanEmail);
      return {
        valid: false,
        message: "Maximum 5 attempts reached. Code has been invalidated for security.",
        attemptsLeft: 0,
        maxAttemptsExceeded: true,
      };
    }

    return {
      valid: false,
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      attemptsLeft: remaining,
      maxAttemptsExceeded: false,
    };
  }

  // OTP verified successfully, clean up
  otpMap.delete(cleanEmail);
  return { valid: true };
}
