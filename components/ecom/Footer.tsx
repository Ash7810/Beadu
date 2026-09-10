"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:block bg-muted/40 border-t border-border/60 py-12 px-6 md:px-12 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
        {/* Quick Links Column */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="font-heading text-2xl font-normal text-foreground">Quick Links</h3>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>📍</span> <span>Our Story</span>
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>🏠</span> <span>Home</span>
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>🛍️</span> <span>Shop</span>
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>🛒</span> <span>Cart</span>
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>✔</span> <span>Checkout</span>
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>👤</span> <span>My Account</span>
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>🛡️</span> <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>🔄</span> <span>Return & Exchange Policy</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* About Us Column */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="font-heading text-2xl font-normal text-foreground">About Us</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Beadu – is a handmade jewellery business where each piece is handcrafted with love and care! We believe jewellery is an expression of emotions, transcending mere accessories. Our products are crafted with natural, versatile, and eco-friendly material such as wood, glass, clay. Choose from our diverse range of colors, styles, and themes, or opt for a custom order to create a truly unique piece. We hope you have a great shopping experience with us!! 🥰
          </p>
        </div>

        {/* Say Hello to Beadu Column */}
        <div className="md:col-span-4 space-y-4">
          <h3 className="font-heading text-2xl font-normal text-foreground">Say Hello to Beadu</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We&apos;d love to hear from you — your thoughts, questions, or just a little hello. Every message means the world to us and helps us grow with love.
          </p>

          <div className="flex gap-3 pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center active:scale-[0.96] shadow-md ring-1 ring-black/10"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-brand-dark text-white flex items-center justify-center active:scale-[0.96] shadow-md ring-1 ring-black/10"
              aria-label="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
        <p className="font-medium">Copyright © 2026 Beadu | Powered by Beadu</p>
      </div>
    </footer>
  );
}
