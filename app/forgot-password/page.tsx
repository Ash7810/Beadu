"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";

type ForgotStep = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotStep>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Send OTP via Resend
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("OTP");
        setSuccessMsg(
          data.simulated
            ? "Verification code logged to server console (Simulated Dev Mode)."
            : `A 6-digit verification code was sent to ${cleanEmail}.`
        );
      } else {
        setErrorMsg(data.error || "Failed to send verification code. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanOtp = otp.trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
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
      } else {
        setErrorMsg(data.error || "Invalid or expired verification code.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password & Update in Supabase
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
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
        setStep("SUCCESS");
      } else {
        setErrorMsg(data.error || "Could not reset password. Please request a new code.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-start pt-6 sm:pt-10 md:pt-14 pb-16 px-4 sm:px-6">
        <div className="w-full max-w-md clay-panel bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-soft space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl mx-auto mb-3 font-bold">
              {step === "SUCCESS" ? "✓" : "🔐"}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-normal">
              {step === "EMAIL" && "Forgot Password"}
              {step === "OTP" && "Enter Verification Code"}
              {step === "NEW_PASSWORD" && "Create New Password"}
              {step === "SUCCESS" && "Password Reset Successful"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {step === "EMAIL" && "Enter your email address to receive a secure verification code."}
              {step === "OTP" && `We sent a 6-digit code to ${email}. Code is valid for 10 minutes.`}
              {step === "NEW_PASSWORD" && "Choose a strong password with at least 8 characters."}
              {step === "SUCCESS" && "Your password has been securely updated. You can now sign in."}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-xs font-bold px-4 py-3 rounded-xl border border-red-100 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl border border-emerald-100 animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* ── STEP 1: Enter Email ── */}
          {step === "EMAIL" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Verification Code...
                  </span>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: Enter 6-digit OTP ── */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-center text-2xl font-mono tracking-[0.4em] font-bold"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-primary font-bold hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* ── STEP 3: Set New Password ── */}
          {step === "NEW_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium tracking-widest"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? "Updating Password..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* ── STEP 4: Reset Complete ── */}
          {step === "SUCCESS" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <p className="text-xs text-muted-foreground">
                Your password has been changed. You can now use your new password to sign into your account.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full clay-btn bg-primary text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-primary/90 transition-all"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {/* Back to Login link */}
          <div className="text-center pt-2 border-t border-gray-100">
            <Link href="/login" className="text-xs text-primary font-semibold hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
