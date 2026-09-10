"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { useAuthStore } from "@/store/authStore";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateInput = () => {
    // Sanitize
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    setEmail(cleanEmail);
    setPassword(cleanPass);
    if (!isLogin) setName(cleanName);

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return "Please enter a valid email address.";
    }

    // Validate Password
    if (cleanPass.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    // Validate Name on Signup
    if (!isLogin && cleanName.length < 2) {
      return "Please enter your full name.";
    }

    return null; // No errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const validationError = validateInput();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);

    // Artificial delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    let result;
    if (isLogin) {
      result = await login(email.trim().toLowerCase(), password.trim());
    } else {
      result = await signup(email.trim().toLowerCase(), password.trim(), name.trim());
    }

    if (result.success) {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || (email.trim().toLowerCase() === "admin@beadu.in" ? "/admin" : "/");
      router.push(callbackUrl);
    } else {
      setErrorMsg(result.error || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-start pt-4 sm:pt-8 md:pt-10 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-md clay-panel bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-soft">
          <div className="text-center mb-6 sm:mb-8 space-y-1.5 sm:space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-normal">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isLogin
                ? "Enter your details to access your Beadu account."
                : "Join the Beadu family to track orders and save wishlists."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Sharma"
                  className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full clay-input bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium tracking-widest"
              />
            </div>

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs font-bold px-4 py-3 rounded-xl border border-red-100 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full clay-btn bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-4 rounded-2xl shadow-md transition-all active:scale-[0.98] mt-2 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground uppercase tracking-widest font-bold">Or</span>
            </div>
          </div>

          <GoogleLoginButton redirectTo="/" />

          {/* Toggle Login / Signup */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-muted-foreground">
              {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg("");
                }}
                className="text-primary font-bold hover:underline transition-all ml-1"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
}
