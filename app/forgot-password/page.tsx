"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { useAuthStore } from "@/store/authStore";

type ForgotStep = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

// Floating bouncing dots component for modern loading states
function FloatingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ml-2 align-middle ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.32s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.16s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
    </span>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotStep>("EMAIL");
  const [email, setEmail] = useState("");
  
  // Modern 6-box OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Passwords & Tokens
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Stateful tracking
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // 5 Attempts tracking & Lockout state
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Authenticated user state for direct sign in
  const [authenticatedUser, setAuthenticatedUser] = useState<{ name: string; email: string } | null>(null);

  // Trigger shake animation on error
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === "OTP" && !isLockedOut) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step, isLockedOut]);

  // Handle segmented OTP changes
  const handleOtpChange = (index: number, val: string) => {
    if (isLockedOut) return;
    setErrorMsg("");

    // Handle paste of complete 6-digit code
    const digitsOnly = val.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      const pasted = digitsOnly.slice(0, 6).split("");
      const nextDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setOtpDigits(nextDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();

      // If all 6 digits are filled via paste, auto-verify
      if (pasted.length === 6) {
        verifyOtpCode(nextDigits.join(""));
      }
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto submit
    if (singleDigit && index === 5) {
      const fullCode = updated.join("");
      if (fullCode.length === 6) {
        verifyOtpCode(fullCode);
      }
    }
  };

  // Handle Backspace and Arrow navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Step 1: Send OTP via Resend ──
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (resendCooldown > 0 && step === "OTP") return;

    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      triggerShake();
      return;
    }

    setIsLoading(true);
    setLoadingText("Sending verification code");

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("OTP");
        setResendCooldown(60);
        setIsLockedOut(false);
        setAttemptsRemaining(5);
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccessMsg(
          data.simulated
            ? "Verification code logged to server console (Simulated Dev Mode)."
            : `A 6-digit code was sent to ${cleanEmail}.`
        );
      } else {
        if (data.cooldown) {
          setResendCooldown(data.cooldown);
        }
        setErrorMsg(data.error || "Failed to send code. Please try again.");
        triggerShake();
      }
    } catch {
      setErrorMsg("Network error. Could not connect to server.");
      triggerShake();
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  // ── Step 2: Verify OTP ──
  const verifyOtpCode = async (codeToVerify: string) => {
    if (isLockedOut) return;
    setErrorMsg("");
    setSuccessMsg("");

    const cleanOtp = codeToVerify.trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      triggerShake();
      return;
    }

    setIsLoading(true);
    setLoadingText("Verifying code");

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      });
      const data = await res.json();

      if (data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setStep("NEW_PASSWORD");
        setSuccessMsg("Code verified! Set your new password.");
      } else {
        triggerShake();
        if (typeof data.attemptsLeft === "number") {
          setAttemptsRemaining(data.attemptsLeft);
        }
        if (data.maxAttemptsExceeded || data.attemptsLeft === 0) {
          setIsLockedOut(true);
          setErrorMsg(
            data.error || "Maximum 5 attempts reached. This code is locked for your security."
          );
        } else {
          setErrorMsg(data.error || "Invalid verification code.");
        }
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      triggerShake();
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const handleManualVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpCode(otpDigits.join(""));
  };

  // ── Step 3: Set New Password & Directly Authenticate ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      triggerShake();
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      triggerShake();
      return;
    }

    setIsLoading(true);
    setLoadingText("Updating & Authenticating");

    try {
      const res = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Direct Sign-In: update authStore directly
        if (data.user) {
          useAuthStore.setState({ user: data.user });
          setAuthenticatedUser({
            name: data.user.name || "Customer",
            email: data.user.email,
          });
        }
        setStep("SUCCESS");

        // Smooth direct redirect to home/storefront after 1.5 seconds
        setTimeout(() => {
          router.push("/");
        }, 1600);
      } else {
        setErrorMsg(data.error || "Could not reset password. Please request a new code.");
        triggerShake();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      triggerShake();
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-start pt-6 sm:pt-10 md:pt-14 pb-16 px-4 sm:px-6">
        <div
          className={`w-full max-w-md clay-panel bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-soft space-y-6 transition-all duration-300 ${
            isShaking ? "animate-shake ring-2 ring-red-200" : ""
          }`}
        >
          {/* Progress Indicator */}
          {step !== "SUCCESS" && (
            <div className="flex items-center justify-center gap-2 pb-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "EMAIL"
                    ? "w-8 bg-brand-secondary"
                    : "w-3 bg-brand-secondary/30"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "OTP"
                    ? "w-8 bg-brand-secondary"
                    : step === "NEW_PASSWORD"
                    ? "w-3 bg-brand-secondary/30"
                    : "w-3 bg-gray-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "NEW_PASSWORD" ? "w-8 bg-brand-secondary" : "w-3 bg-gray-200"
                }`}
              />
            </div>
          )}

          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 font-bold transition-transform duration-300 ${
                step === "SUCCESS"
                  ? "bg-emerald-100 text-emerald-600 scale-110"
                  : isLockedOut
                  ? "bg-red-100 text-red-600"
                  : "bg-brand-secondary/10 text-brand-secondary"
              }`}
            >
              {step === "SUCCESS"
                ? "✓"
                : isLockedOut
                ? "🔒"
                : step === "OTP"
                ? "✉️"
                : "🔐"}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-medium">
              {step === "EMAIL" && "Reset Password"}
              {step === "OTP" && (isLockedOut ? "Verification Locked" : "Enter Verification Code")}
              {step === "NEW_PASSWORD" && "Create New Password"}
              {step === "SUCCESS" && "You're All Set!"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {step === "EMAIL" &&
                "Enter your registered email address to receive a secure 6-digit OTP code."}
              {step === "OTP" &&
                !isLockedOut &&
                `We sent a 6-digit code to ${email}. Valid for 10 minutes.`}
              {step === "OTP" &&
                isLockedOut &&
                "You reached the maximum attempts. Please generate a new verification code."}
              {step === "NEW_PASSWORD" &&
                "Choose a strong password with at least 8 characters to secure your account."}
              {step === "SUCCESS" &&
                `Welcome back${
                  authenticatedUser?.name ? `, ${authenticatedUser.name}` : ""
                }! Signing you directly into your account...`}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold px-4 py-3 rounded-2xl border border-red-100 animate-in fade-in flex items-start gap-2.5">
              <span className="font-bold text-sm leading-none mt-0.5">⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {successMsg && step !== "SUCCESS" && (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-2xl border border-emerald-100 animate-in fade-in flex items-start gap-2.5">
              <span className="font-bold text-sm leading-none mt-0.5">✓</span>
              <span className="flex-1">{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1: Enter Email ── */}
          {step === "EMAIL" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition-all text-sm font-medium"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-75 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    {loadingText || "Sending Code"}
                    <FloatingDots />
                  </span>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: Modern Segmented 6-Digit OTP ── */}
          {step === "OTP" && (
            <form onSubmit={handleManualVerifyOtp} className="space-y-5">
              {/* Attempt status banner */}
              {attemptsRemaining !== null && !isLockedOut && attemptsRemaining < 5 && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 py-1.5 px-3 rounded-full border border-amber-200/60 font-medium">
                  <span>⚠️</span>
                  <span>
                    {attemptsRemaining} of 5 attempts remaining
                  </span>
                </div>
              )}

              {/* Segmented Inputs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setErrorMsg("");
                      setSuccessMsg("");
                      setIsLockedOut(false);
                    }}
                    className="text-xs text-brand-secondary font-semibold hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      disabled={isLoading || isLockedOut}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 sm:w-13 h-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-2xl border transition-all shadow-xs outline-none ${
                        isLockedOut
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : digit
                          ? "bg-brand-secondary/5 border-brand-secondary text-brand-secondary ring-1 ring-brand-secondary/20"
                          : "bg-gray-50 border-gray-200 text-foreground focus:bg-white focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Action & Lockout Support */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
                <span>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading || resendCooldown > 0}
                  className="text-brand-secondary font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              {/* Action Button */}
              {isLockedOut ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full clay-btn bg-brand-primary text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer text-sm"
                >
                  {resendCooldown > 0
                    ? `Request New Code in ${resendCooldown}s`
                    : "Request Fresh Code"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || otpDigits.join("").length !== 6}
                  className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      {loadingText || "Verifying"}
                      <FloatingDots />
                    </span>
                  ) : (
                    "Verify Code"
                  )}
                </button>
              )}
            </form>
          )}

          {/* ── STEP 3: Set New Password ── */}
          {step === "NEW_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition-all text-sm font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer select-none"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-75 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    {loadingText || "Authenticating"}
                    <FloatingDots />
                  </span>
                ) : (
                  "Reset Password & Sign In"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success & Direct Sign-In Animation ── */}
          {step === "SUCCESS" && (
            <div className="space-y-5 text-center py-3">
              <div className="w-18 h-18 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-soft animate-in zoom-in-50 duration-300">
                ✓
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">
                  Authenticated Successfully!
                </h2>
                <p className="text-xs text-muted-foreground flex items-center justify-center">
                  <span>Redirecting to your account</span>
                  <FloatingDots className="text-brand-secondary" />
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full clay-btn bg-brand-secondary text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-brand-secondary/90 transition-all cursor-pointer text-sm"
                >
                  Continue Shopping Now →
                </button>
              </div>
            </div>
          )}

          {/* Back to Login link */}
          {step !== "SUCCESS" && (
            <div className="text-center pt-2 border-t border-gray-100">
              <Link
                href="/login"
                className="text-xs text-brand-secondary font-semibold hover:underline"
              >
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
