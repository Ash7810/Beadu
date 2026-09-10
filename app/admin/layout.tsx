"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

   
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
      </div>
    );
  }

  // RBAC INVISIBLE PROTECTION
  // If no user, or user is not an admin, pretend this route doesn't exist.
  if (!user || user.role !== 'ADMIN') {
    notFound();
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* Admin Top Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
            <span className="text-border select-none">|</span>
            <span className="font-display text-lg text-primary font-light">Beadu Admin</span>
          </div>

          {/* Nav Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-0.5 rounded-full border border-border/80 text-xs font-medium">
            <a
              href="/admin"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              Dashboard
            </a>
            <a
              href="/admin/orders"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              Orders
            </a>
            <a
              href="/admin/beads"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              Products &amp; Beads
            </a>
            <a
              href="/admin/logistics"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              🚚 Logistics &amp; Express Tracking
            </a>
            <a
              href="/admin/payments"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              💳 Payment Terminal
            </a>
            <a
              href="/admin/reviews"
              className="px-3 py-1.5 rounded-full transition-all hover:bg-card hover:text-foreground text-muted-foreground"
            >
              ⭐ Reviews
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground mr-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                A
              </span>
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive border border-border/80 hover:border-destructive/40 rounded-full transition-all"
              title="Lock admin dashboard"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Admin Nav Strip */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2 bg-muted/30 border-t border-border/40 text-[11px] font-medium">
          <a href="/admin" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            Overview
          </a>
          <a href="/admin/orders" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            Orders
          </a>
          <a href="/admin/beads" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            Products
          </a>
          <a href="/admin/logistics" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            🚚 Logistics
          </a>
          <a href="/admin/payments" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            💳 Payments
          </a>
          <a href="/admin/reviews" className="px-2.5 py-1 rounded-full bg-card border border-border shrink-0 text-foreground">
            ⭐ Reviews
          </a>
        </div>
      </div>

      {/* Page Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
