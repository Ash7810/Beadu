"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useEcomStore } from "@/store/ecomStore";
import { useAuthStore } from "@/store/authStore";
import { MobileSidebar } from "./MobileSidebar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { getCartItemCount, syncUserSession } = useEcomStore();
  const { user } = useAuthStore();
  const cartCount = getCartItemCount();

   
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    syncUserSession(user?.id || null);
  }, [user?.id, syncUserSession]);

  return (
    <>
      <header className="w-full z-50 sticky top-0 bg-white shadow-sm text-foreground py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center relative">
          
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              {/* Using the standard beadu-logo.png which contains the colored circles from the screenshot */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/beadu-logo.png"
                alt="BEADU"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-foreground hover:opacity-70 transition-transform duration-150 ease-out active:scale-[0.96]"
            aria-label="Open Navigation Drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Right: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-gray-700">
            <Link href="/" className="hover:text-primary transition-colors duration-150 active:scale-[0.96] inline-block">
              Home
            </Link>
            <Link
              href="/builder"
              className="text-primary hover:text-primary/90 font-bold bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] inline-flex items-center gap-1 shadow-xs"
            >
              <span>✨ Customize</span>
            </Link>
            <Link href="/shop" className="hover:text-primary transition-colors duration-150 active:scale-[0.96] inline-block">
              Shop
            </Link>
            <Link href="/cart" className="hover:text-primary transition-colors duration-150 flex items-center gap-1.5 active:scale-[0.96]">
              <span>Cart</span>
              {mounted && cartCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-1 ring-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/checkout" className="hover:text-primary transition-colors duration-150 active:scale-[0.96] inline-block">
              Checkout
            </Link>
            <Link href={user ? "/profile" : "/login"} className="hover:text-primary transition-colors duration-150 active:scale-[0.96] inline-block">
              {user ? "My account" : "Sign In"}
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-destructive font-bold hover:text-destructive/80 transition-colors duration-150 active:scale-[0.96] inline-block ml-2">
                Admin Panel
              </Link>
            )}
          </nav>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
