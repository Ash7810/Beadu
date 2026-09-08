# Beadu (www.beadu.in) — Complete E-Commerce Store & Custom Bracelet Builder

A high-performance, mobile-first E-Commerce web application custom-built for **www.beadu.in** (Indian handmade artisan jewelry, wooden beads, terracotta clay, glass charms, keychains, necklaces, and interactive custom bracelet builder).

---

## 🎨 Visual Identity & Typography

- **Heading Display Font**: `Fredoka` (playful, rounded handwritten typography matching *"Handmade with Love, Crafted with Care"*, *"Quick Links"*, *"About Us"*, *"Say Hello to Beadu"*).
- **Body Font**: `Quicksand` (clean, rounded geometric typography for copy, forms, and navigation).
- **Brand Palette**: Antique Gold (`#9e7b16`, `#d4af37`), Gold Shimmer (`.gold-shimmer`), Warm Porcelain Cream (`#faf6f2`), Terracotta Coral, and Glassmorphism cards (`.glass-card`).

---

## 🛍️ Key Features

1. **Jewelry Storefront & Catalog (`/shop`)**:
   - Categories: Bracelets, Earrings, Keychains, Necklaces, Charms & Trinkets, Custom Builder.
   - Material Filters: Wooden Beads, Terracotta Clay, Glass Beads, Gemstones & Cat Eye, Hand-Painted Pastels.
   - Filters: Price range slider, live query search, sorting (Featured, Price Low-High / High-Low, Rating).
   - Desktop Sidebar Filter + Mobile Action Sheet Drawer + Floating Back-to-Top Button.
2. **Product Details & Logistics (`/shop/[id]`)**:
   - Multi-angle thumbnail image gallery carousel.
   - Ratings histogram breakdown bar chart (5★ down to 1★).
   - **Delhivery Express Live PIN Code Serviceability Check** (`lib/delhivery.ts`).
3. **Cart & Gift Personalization (`/cart`)**:
   - Quantity steppers & item removal triggers.
   - **Gift Wrapping Option**: Toggle per-item gift wrap (+`₹20`/item).
   - **Gift Message Field**: Custom card message input with character limit bounds (max 120 chars) and real-time character countdown.
   - **Cost Summary**: Items Subtotal, Gift Wrapping Fee (`₹20` x count), Platform Fee (`₹25`), Free Shipping, Grand Total.
4. **Checkout Matrix & Payment Gateway (`/checkout`)**:
   - **Saved Address Radio Selection**: Radio grid with active highlight.
   - **"+ Add New Address"**: Inline address creation with PIN validation via Delhivery.
   - **SME Pay Payment Gateway Integration** (`lib/smePay.ts`): SME Pay Instant UPI / QR, Cards, Net Banking, and Cash on Delivery (COD).
5. **Profile Terminal & Tracking (`/profile`)**:
   - **Adaptive Layout**: Mobile Icon Grid Menu vs Desktop Sticky Sidebar.
   - **My Orders**: Order history with status pills (*Order Placed*, *Order Accepted*, *Shipped*, *Delivered*).
   - **Delhivery Live AWB Tracking Modal**: Real-time shipment timeline steps.
   - **Saved Addresses CRUD**: Manage addresses, add new, set default, remove.
6. **Custom Bracelet Builder (`/builder`)**:
   - Real-time 2D canvas wrist strand visualizer, bead placement, spacer configuration, and direct add-to-cart.

---

## 🛠️ Quick Start

```bash
cd bracelet-builder
npm install
npm run dev
# → http://localhost:3000
```

To verify production build:
```bash
cd bracelet-builder
npm run build
```

---

## 📁 Project Directory Structure

```
bracelet-builder/
├── app/
│   ├── page.tsx                 # Beadu E-Commerce Home Page
│   ├── shop/                    # Jewelry Catalog & Filter Drawer
│   ├── shop/[id]/               # Detail View & Delhivery PIN Check
│   ├── cart/                    # Cart & Gift Wrapping (+₹20)
│   ├── checkout/                # Checkout & SME Pay Gateway
│   ├── profile/                 # Profile, Orders & Live AWB Tracking
│   ├── wishlist/                # Saved Wishlist Grid
│   ├── builder/page.tsx         # Interactive Bracelet Customizer
│   ├── admin/orders/page.tsx    # Admin Order Dashboard
│   └── globals.css              # Design tokens, Fredoka & Quicksand fonts
├── components/ecom/
│   ├── Header.tsx               # Sticky header with instant search & counters
│   ├── HeroSection.tsx          # Wavy frame hero with see what's new button
│   ├── CategoryMarquee.tsx      # Infinite marquee carrying jewelry categories
│   ├── FeaturedSection.tsx      # Best sellers product slider with arrow controls
│   ├── MaterialShowcase.tsx     # Sustainable wood, clay, gemstone showcase
│   ├── CustomerReviews.tsx      # Verified buyer review cards
│   ├── ContactForm.tsx          # Support & inquiry form
│   ├── Footer.tsx               # Exact beadu.in footer layout & copyright
│   ├── BottomNavigation.tsx     # Mobile bottom bar with touch active scales
│   ├── MobileSidebar.tsx        # Mobile drawer navigation
│   └── Toast.tsx                # Notification toast system
├── lib/
│   ├── ecomData.ts              # Product catalog & review data models
│   ├── smePay.ts                # SME Pay payment gateway helper
│   └── delhivery.ts            # Delhivery One logistics & AWB tracking helper
├── store/
│   ├── ecomStore.ts             # Global Zustand store for cart, wishlist, orders
│   └── braceletStore.ts         # Customizer Zustand store
└── netlify.toml                 # Netlify deployment config
```

---

## 🛡️ Architectural Safeguards

- **Mobile Touch Safeguard**: `active:scale-95` on mobile touch targets; hover states scoped to `md:hover:`.
- **Infinite Marquee Safeguard**: 3x array tripling, 1/3 scroll position reset, auto-pause handlers.
- **Financial Calculation Safeguard**: Subtotals, gift surcharges, platform fees, and totals are computed reactively in render scope from the singular Zustand `cart` array.
- **Z-Index Hierarchy**: `z-30` Back-To-Top → `z-40` BottomNav (`pb-safe`) → `z-50` Header/Filter Sheet → `z-[100]` Toast & Sidebar.
- **Graceful Degradation**: Local catalog data fallback prevents blank screens on network dropouts.
