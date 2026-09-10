"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEcomStore } from "@/store/ecomStore";
import { useAuthStore } from "@/store/authStore";

export function BottomNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const { wishlist, getCartItemCount } = useEcomStore();
  const { user } = useAuthStore();
  const cartCount = getCartItemCount();

   
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: (active: boolean) => (
        <svg className="w-5 h-5 transition-transform duration-150 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Shop",
      href: "/shop",
      icon: (active: boolean) => (
        <svg className="w-5 h-5 transition-transform duration-150 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: "Wishlist",
      href: "/wishlist",
      badge: mounted && wishlist.length > 0 ? wishlist.length : null,
      icon: (active: boolean) => (
        <svg className="w-5 h-5 transition-transform duration-150 ease-out" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: "Cart",
      href: "/cart",
      badge: mounted && cartCount > 0 ? cartCount : null,
      icon: (active: boolean) => (
        <svg className="w-5 h-5 transition-transform duration-150 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Account",
      href: user ? "/profile" : "/login",
      icon: (active: boolean) => (
        <svg className="w-5 h-5 transition-transform duration-150 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden h-[calc(4rem+env(safe-area-inset-bottom,0px))] bg-background border-t border-border px-3 flex justify-between items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-[transform,color] duration-150 ease-out active:scale-[0.96] ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative flex items-center justify-center">
              {item.icon(isActive)}
              {item.badge && (
                <span className="absolute -top-1.5 -end-2.5 bg-primary text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center ring-1 ring-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-sans tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
