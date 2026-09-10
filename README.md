# Beadu (www.beadu.in) — Complete E-Commerce Store & Bracelet Builder

A high-performance, mobile-first E-Commerce web application custom-built for **www.beadu.in** (Indian handmade artisan jewelry, wooden beads, terracotta clay, glass charms, keychains, necklaces, and interactive custom bracelet builder).

---

## 🎨 Visual Identity & Typography

- **Heading Display Font**: `Fredoka` (playful, rounded handwritten typography matching *"Handmade with Love, Crafted with Care"*, *"Quick Links"*, *"About Us"*, *"Say Hello to Beadu"*).
- **Body Font**: `Quicksand` (clean, rounded geometric typography for copy, forms, and navigation).
- **Brand Color Palette**:
  - **Primary Accent**: Antique Gold (`#9e7b16` / `#d4af37`) & Signature Gold Shimmer (`.gold-shimmer`).
  - **Backdrop**: Warm Porcelain Cream (`#faf6f2`) and Ivory Glass (`#f8f4ee`).
  - **Text & Headings**: Espresso Slate (`#1e1b18`) and Soft Muted Stone (`#78716c`).
  - **Hero CTA**: Reddish-brown / Burgundy button (`#7c2d12`, *"See What's New"*).

---

## 🛍️ E-Commerce Architecture & Key Features

### 1. Storefront & Catalog (`/shop`)
- **Jewelry Categories**: Bracelets, Earrings, Keychains, Necklaces, Charms & Trinkets, Custom Builder.
- **Material Filters**: Wooden Beads, Terracotta Clay, Glass Beads, Gemstones & Cat Eye, Hand-Painted Pastels.
- **Filters & Search**: Price range slider, live query search, sorting (Featured, Price Low-High / High-Low, Rating).
- **Layout**: Desktop Sidebar Filter + Mobile Action Sheet Drawer + Floating Back-to-Top Button.

### 2. Product Details & Logistics (`/shop/[id]`)
- Multi-angle thumbnail image gallery carousel.
- Customer rating histogram breakdown (bar charts for 5★ down to 1★).
- **Delhivery Express Live PIN Code Serviceability Check** (`lib/delhivery.ts`).

### 3. Cart & Gift Personalization (`/cart`)
- Item quantity steppers & deletion triggers.
- **Gift Wrapping Option**: Toggle per-item gift wrap (+`₹20`/item).
- **Gift Message Field**: Custom card message input with character limit bounds (max 120 chars) and real-time character countdown.
- **Cost Summary**: Items Subtotal, Gift Wrapping Fee (`₹20` x count), Platform Fee (`₹25`), Free Delhivery Express Shipping, Grand Total.

### 4. Checkout Matrix & Payment Gateway (`/checkout`)
- **Saved Address Radio Selection**: Radio grid with active highlight.
- **"+ Add New Address"**: Inline address creation with PIN validation via Delhivery.
- **SME Pay Payment Gateway Integration** (`lib/smePay.ts`):
  - SME Pay Instant UPI / QR (GPay, PhonePe, Paytm)
  - SME Pay Cards (Visa / Mastercard / RuPay)
  - SME Pay Net Banking
  - Cash on Delivery (COD)

### 5. Profile Terminal & Tracking (`/profile`)
- **Adaptive Layout**: Mobile Icon Grid Menu vs Desktop Sticky Sidebar.
- **My Orders**: Order history with status pills (*Order Placed*, *Order Accepted*, *Shipped*, *Delivered*).
- **Delhivery Live AWB Tracking Modal**: Real-time shipment timeline steps (*Order Placed*, *Order Accepted*, *Picked Up*, *In Transit*, *Out for Delivery*, *Delivered*).
- **Saved Addresses CRUD**: Manage addresses, add new, set default, remove.
- **Authentication**: Secured routes for login (`/login`), profile creation, and forgotten passwords (`/forgot-password`).

### 6. Admin Control Panel (`/admin`)
- **Secure Dashboard**: Centralized hub to manage all store operations.
- **Order Management** (`/admin/orders`): Review and update status of customer orders.
- **Logistics Center** (`/admin/logistics`): Handle shipments, track AWBs via Delhivery integration.
- **Payment Verification** (`/admin/payments`): Review SME Pay transactions, reconciliations, and COD processing.
- **Bead Inventory** (`/admin/beads`): Manage custom bracelet builder components (beads, spacers, charms).
- **Reviews Moderation** (`/admin/reviews`): Approve and moderate customer product reviews.

### 7. Interactive Custom Bracelet Builder (`/builder`)
- Real-time 2D canvas wrist strand visualizer, bead placement, spacer configuration, and direct add-to-cart powered by `react-konva`.

### 8. Additional Pages
- **Wishlist** (`/wishlist`): Users can save their favorite items for later.
- **Static Content**: SEO-friendly pages for About (`/about`), Privacy Policy (`/privacy`), and Returns/Refunds (`/returns`).

---

## 🛠️ Tech Stack & Commands

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Claymorphism utility tokens, Glassmorphism, Framer Motion
- **State Management**: Zustand global store (`store/ecomStore.ts`)
- **Integrations**: 
  - SME Pay payment gateway (`lib/smePay.ts`)
  - Delhivery One logistics (`lib/delhivery.ts`)
  - Supabase database / authentication backend
  - Cloudinary for image delivery
- **Builder Graphics**: Konva & React-Konva (`react-konva`)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Compile optimized production build
npm run build
```

---

## 🛡️ Architectural Safeguards

- **Sticky Hover Safeguard**: Mobile touch targets use `active:scale-95` instead of bare `hover:` classes.
- **Infinite Marquee Safeguard**: 3x array tripling, 1/3 scroll position reset, hover/touch auto-pause handlers.
- **Financial Calculation Safeguard**: Subtotals, gift surcharges, platform fees, and totals are computed reactively in render scope from the singular Zustand `cart` array.
- **Z-Index Scale**: Controlled z-index hierarchy (`z-30` Back-To-Top → `z-40` BottomNav with `pb-safe` → `z-50` Header/Filter Drawer → `z-[100]` Toast & Mobile Sidebar).
- **Graceful Degradation**: Local catalog data fallback prevents blank screens on network dropouts.
