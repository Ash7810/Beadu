"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/profile";
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          setErrorMsg("Failed to establish session. Please try logging in again.");
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        // Verify with our custom backend and get role/cookie
        const res = await fetch("/api/auth/oauth-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.session.user.email,
            id: data.session.user.id,
            name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || "",
          }),
        });
        const result = await res.json();

        if (result.success && result.user) {
          // Update zustand store
          useAuthStore.setState({ user: result.user });
          router.push(next);
        } else {
          setErrorMsg("Account sync failed.");
          setTimeout(() => router.push("/login"), 3000);
        }
      } catch (err) {
        setErrorMsg("An unexpected error occurred.");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleAuth();
  }, [router, next]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans text-center px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-6">
        {errorMsg ? "⚠️" : "🔐"}
      </div>
      <h1 className="font-heading text-2xl text-foreground font-bold mb-2">
        {errorMsg ? "Authentication Failed" : "Authenticating..."}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {errorMsg || "Please wait while we securely connect your account."}
      </p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-sm">Authenticating...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
