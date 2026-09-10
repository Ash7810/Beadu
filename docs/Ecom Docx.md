# ShreeChoice Playworld - Complete Architectural & E-Commerce Blueprint
## Detailed Technical Documentation for Rebuilding the E-Commerce Platform

Welcome to the definitive rebuilding manual and technical specification for **ShreeChoice Playworld**, a high-performance, mobile-first e-commerce web application specializing in magical toys for growing minds. This document covers every architectural decision, layout structure, utility class, database schema, design token, page view, state manager, and responsive constraint, enabling an engineering team to rebuild or scale the application with absolute fidelity.

---

## 1. System Blueprint & Tech Stack

The application is engineered as a highly responsive, high-performance Client-Side Single Page Application (SPA) designed to load instantly and handle data updates reactively.

*   **Frontend Library:** React 18 (Functional components with hooks and Context API)
*   **Build Tool & Dev Server:** Vite 6
*   **Styling Engine:** Tailwind CSS v4 (with native CSS variables and `@theme` integrations)
*   **Animation System:** Framer Motion 10
*   **Database & Auth Provider:** Supabase (PostgreSQL with Realtime capabilities)
*   **Icons:** Lucide React wrappers compiled inside custom svg components
*   **Core Architectural Pattern:** Client-Side Context Managers orchestrating global state, integrated with Supabase triggers for persistent cloud storage.

---

## 2. Global Styling, Tokens & Foundations

The design language of ShreeChoice Playworld is playful, modern, and highly accessible, combining clean, organic display typography with **Claymorphism**—a design aesthetic that uses soft inner borders, subtle layered shadows, and organic rounded corners to create tactile, toy-like interactive cards.

### 2.1 Typography Scale
*   **Display / Heading Font (`--font-heading`):** `"Fredoka", "Verdana", sans-serif`
    *   Used for brand identity, main banner headings, product titles, section headers, and promotional banners. Fredoka is a friendly, rounded sans-serif typeface that evokes a sense of playfulness.
*   **Body Text (`--font-sans`):** `"Quicksand", "Segoe UI", "Helvetica", "Arial", sans-serif`
    *   Used for product descriptions, body copy, forms, list items, prices, and navigation. Quicksand provides a highly legible, rounded geometry that perfectly pairs with Fredoka.
*   **Monospace Font (`--font-mono`):** `"JetBrains Mono", "Courier New", monospace`
    *   Used for Order IDs, transaction codes, and technical values.

### 2.2 Color Mappings (`@theme`)
All colors are defined as Tailwind theme tokens and mapped directly to custom semantic classes:
*   **`--color-brand-primary` / `bg-brand-primary`:** `#000000` (High contrast, bold structural items and action-oriented controls)
*   **`--color-brand-secondary` / `bg-brand-secondary`:** `#FF6B6B` (Soft coral pink, used for primary highlights, promotional tags, CTA buttons, and delete actions)
*   **`--color-brand-yellow` / `bg-brand-yellow`:** `#F4EBD0` (Warm soft neutral sand, used for overlays, backdrops, and secondary badge fills)
*   **`--color-brand-accent` / `bg-brand-accent`:** `#F59E0B` (Amber, used for active ratings, stars, and discount notifications)
*   **`--color-brand-dark` / `text-brand-dark`:** `#231F20` (Off-black slate, optimized for readable text to prevent pure-black eye strain)
*   **`--color-play-yellow` / `bg-play-yellow`:** `#FFD93D` (Vibrant yellow, used for toy category accents, primary attention items, and interactive states)
*   **`--color-surface`:** `#F9F9F9` (Light neutral backdrop for secondary blocks)
*   **`--color-surface-dark`:** `#F5E6CC` (Deeper backdrop for warm overlays)

### 2.3 Layer & Structural Base Classes
*   **Body Backdrop:** `bg-white text-brand-dark antialiased overflow-x-hidden font-sans`
*   **Responsive Container (`.container-custom`):** `max-w-[1440px] mx-auto px-2 md:px-6`
    *   *Sizing:* Caps width on ultra-wide screens at `1440px` and narrows padding on mobile screens (`8px` or `px-2`) to maximize product visibility and edge-to-edge content blocks.
*   **Soft Shadow (`--shadow-soft`):** `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)`

### 2.4 Tactile Claymorphic Utilities
*   **Clay Panels (`.clay-panel`):**
    *   *Tailwind Classes:* `bg-white rounded-[2rem] border border-gray-100 shadow-soft transition-all duration-300`
    *   *Rebuild Guide:* Use on cards, page-containers, checkouts, and details. Corners must be significantly rounded (`32px` or `rounded-[2rem]`) to align with the soft toy aesthetic.
*   **Clay Buttons (`.clay-btn`):**
    *   *Tailwind Classes:* `active:scale-95 transition-transform duration-200`
    *   *Rebuild Guide:* Applied to checkout action buttons and primary actions to trigger immediate physical tactile scale-down on click or tap.
*   **Clay Inputs (`.clay-input`):**
    *   *Tailwind Classes:* `bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:bg-white transition-all text-sm font-medium`
    *   *Rebuild Guide:* Features wide padding, extremely soft borders, and an active ring focus that switches the input backdrop to pure white.

---

## 3. Layout & Global Navigation Architecture

The site structure utilizes a highly adaptive header, a permanent mobile drawer system, and a dedicated mobile-bottom navigation bar to make the mobile-first layout look and feel like a native mobile app.

### 3.1 Header (`Header.tsx`)
A sticky navigation header bridging branding, navigation links, global search, and account controls.
*   **Desktop Sizing:** Height `h-20` (or `pt-24 md:pt-32` top offset for content pages).
*   **Sticky Behavior:** Affixed at the top (`sticky top-0 z-50`) with a backdrop blur and background fill of `bg-white/95 backdrop-blur-md` for legibility.
*   **Interactive Search Box:**
    *   An input field wrapping a search icon with instantaneous, reactively-filtered dropdown overlays (`Search Suggestions`).
    *   Matches query matches in bold and allows keyboard navigation.
*   **Responsive Display Classes:**
    *   Desktop Navigation Links (`/shop`, `/about`, `/support`): Hidden on mobile (`hidden md:flex`).
    *   Search Box: Shrinks to center on mobile, expands on desktop.
    *   Auth Actions / Cart Triggers: Positioned on the right. Cart includes a persistent secondary-colored count bubble (`bg-brand-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold`).

### 3.2 Mobile Bottom Navigation (`BottomNavigation.tsx`)
*   **Display Constraint:** Visible *only* on mobile viewports (`fixed bottom-0 left-0 right-0 z-40 md:hidden`).
*   **Styling:** Height `h-16`, styled with `bg-white/90 backdrop-blur-lg border-t border-slate-100 px-6 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe`.
*   **Aesthetic Principle:** Interactive hover states (`hover:`) are strictly disabled or replaced with mobile active classes (`active:scale-95`) as touch targets are direct, and mouse cursor states do not apply on mobile viewports.
*   **Layout Items:** Equidistantly spaced icons mapping:
    1.  *Home* (re-routes to `/`)
    2.  *Shop* (re-routes to `/shop`)
    3.  *Wishlist* (with count, re-routes to `/wishlist`)
    4.  *Cart* (with reactive item count, re-routes to `/cart`)
    5.  *Account* (routes to profile dashboard `/profile`)

### 3.3 Mobile Side Navigation Drawer (`MobileSidebar.tsx`)
A sliding panel triggered from the mobile menu hamburger button.
*   **Animations:** Powered by Framer Motion's `<AnimatePresence>` translating on the X-axis (`initial={{ x: '-100%' }}` to `animate={{ x: 0 }}`).
*   **Structural Content:** Contains high-level store categories, customer service details, store policies, and social linkages. Optimized touch-target heights (minimum `h-12` per list row).

### 3.4 Toast Notification Engine (`Toast.tsx` / `ToastContext.tsx`)
*   **Layout:** Renders at `fixed bottom-20 md:bottom-6 right-6 z-[100]`. Uses Framer Motion slide-in animations.
*   **Visual Styling:** Curved clay panel (`bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 flex items-center gap-3 max-w-sm animate-fade-in`).
*   **Dismissal:** Automatic timeout at 3000ms or manual close button tap.

---

## 4. Homepage Sections & Spacing Blueprint

The homepage (`HomePage.tsx`) is designed with a rhythmic spacing sequence of alternating backgrounds and bold typography. Below are the precise layouts, sizes, and design specs for each segment.

### 4.1 Hero Section (`HeroSlider.tsx`)
An interactive, automated hero slider compiling curated banner slides with beautiful overlay copy.
*   **Mobile-First Adaptability:**
    *   *Mobile height:* `min-h-[200px]` with aspect ratio `aspect-[2/1]`.
    *   *Desktop height:* `min-h-[500px]` with aspect ratio `aspect-[3/1]`.
    *   *Mobile padding:* `pt-24 pb-2`.
    *   *Desktop padding:* `md:pt-32 md:pb-32 lg:pt-40 lg:pb-40`.
*   **Animations & Swiping:** Framer Motion swipe threshold `swipeConfidenceThreshold = 500`. Supports full touch gestures for drag scrolling on mobile and automated intervals of 5000ms.
*   **Interactive CTA Button:** Styled using `bg-white text-brand-primary font-bold px-8 py-3 rounded-2xl md:hover:bg-brand-yellow transition-all`. Responsive font scaling: `text-xs md:text-sm`.

### 4.2 Category Marquee Loop (`HomePage.tsx`)
A custom-built, infinite marquee scroll carrying product category bubbles.
*   **Structural Mechanics:**
    *   An horizontal marquee containing 3 duplicate arrays of `categories` to create a seamless looping illusion.
    *   Programmatically scrolled with standard `requestAnimationFrame` translating `scrollLeft` at `0.25px` increments.
    *   *Re-routing Interaction:* On tap/click, navigates directly to `/shop?category=[CategoryName]`.
*   **Interaction Control (Crucial UX):** Hover and touch events dynamically pause and resume the marquee speed:
    *   `onMouseEnter`, `onTouchStart`: sets `isPausedRef.current = true`.
    *   `onMouseLeave`: sets `isPausedRef.current = false`.
    *   `onTouchEnd`: resumes animation after a `2000ms` delay to ensure native tap behaviors do not break.
*   **Mobile vs Desktop Sizing:**
    *   *Mobile Category Bubble:* Width/height `w-14 h-14` with a circular border `rounded-full`.
    *   *Desktop Category Bubble:* Width/height `w-16 h-16` with `rounded-full` backdrop shadow scales.
    *   *Text:* Displayed below, limited to a single line using `line-clamp-1` and sized to `text-[10px] md:text-xs font-bold`.

### 4.3 Today's Best Deals / Featured Product Row (`FeaturedSection.tsx`)
*   **Layout:** Uses a horizontal scroll layout with scroll snaps (`flex gap-3 md:gap-4 overflow-x-auto pb-8 scroll-smooth scrollbar-hide`).
*   **Desktop Scroll Controls:** Contains absolute positioned next/prev chevron buttons visible only on desktop (`hidden md:flex`). Programmatically shifts container position by `350px` on click.
*   **Product Card Sizing in Slider:**
    *   *Mobile Sizing:* Width `w-[140px]`, perfect for vertical hand sweeps.
    *   *Tablet Sizing:* Width `w-[180px]` or `w-[220px]`.
    *   *Desktop Sizing:* Width `w-[260px]`.
    *   Height is dynamic, allowing proportional layouts for content.

### 4.4 Shop By Brand Slider (`ShopByBrand.tsx`)
A looping carousel representing official toy brands.
*   **Card Specifications:**
    *   *Mobile Box Sizing:* `w-44 h-24` (Width `176px`, Height `96px`).
    *   *Tablet Box Sizing:* `w-56 h-32` (Width `224px`, Height `128px`).
    *   *Desktop Box Sizing:* `w-72 h-40` (Width `288px`, Height `160px`).
*   **Styling:** Base styled as `bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center p-6`. Logo images are styled as `object-contain w-full h-full`.
*   **Interaction:** Desktop hover lifts the brand card by 8px (`md:group-hover/card:-translate-y-2`) and transitions its border color to the brand accent.

### 4.5 Shop By Age Circles (`ShopByAge.tsx`)
Colorful circular target buttons designed to sort inventory by child milestones.
*   **Age Groups & Color Coordinates:**
    | Age Range | Metric Label | Color Code Background | Text Color |
    | :--- | :--- | :--- | :--- |
    | 0-12 | Months | `bg-[#E3F2FD]` (Light Blue) | `text-[#1565C0]` |
    | 1-3 | Years | `bg-[#E8F5E9]` (Light Green) | `text-slate-800` |
    | 3-5 | Years | `bg-[#FCE4EC]` (Light Pink) | `text-[#C2185B]` |
    | 5-8 | Years | `bg-[#FFF3E0]` (Light Orange) | `text-[#EF6C00]` |
    | 8-14 | Years | `bg-[#F3E5F5]` (Light Purple) | `text-[#7B1FA2]` |
    | 14+ | Years | `bg-[#ECEFF1]` (Cool Grey) | `text-[#455A64]` |
*   **Structural Sizing:**
    *   *Shape:* `rounded-full aspect-square`
    *   *Layout:* Grid mapping 3 columns on mobile (`grid-cols-3 md:grid-cols-6 gap-4 md:gap-6`).
    *   *Hover Pattern:* Desktop hover initiates a subtle outward scale lift (`md:hover:scale-105 duration-300`).

### 4.6 Compact Promo Banner (`HomePage.tsx`)
An ultra-clean, eye-catching marketing banner carrying a seasonal sale callout.
*   **Mobile-First Constraints:**
    *   *Mobile Min-Height:* `min-h-[150px]`
    *   *Desktop Min-Height:* `min-h-[250px]`
    *   *Mobile Margins:* `my-2`
    *   *Desktop Margins:* `md:my-8`
*   **Layout:** Styled using relative positioning with absolute vector backgrounds. Integrates dynamic cover images (`background-size: cover; background-position: center`) overlayed with a subtle black screen tint (`bg-black/40 z-0`) for white-on-dark contrast.

### 4.7 Customer Reviews Carousels (`CustomerReviews.tsx`)
A trust-building section carrying authentic buyer quotes.
*   **Sizing Card Dimensions:**
    *   *Mobile Width:* `min-w-[260px]`
    *   *Tablet Width:* `min-w-[300px]`
    *   *Desktop Width:* `min-w-[380px]`
*   **Visual Layout:** Individual review cards are styled as `clay-panel p-6 bg-white border border-gray-100 flex flex-col justify-between`. Contains a star rating bar, user meta profile (avatar, name, verified purchase badge), review date, and italic text descriptions.

### 4.8 Unified Contact Form (`ContactForm.tsx`)
A beautiful support terminal styled to encourage customer communication.
*   **Layout & Sizing:**
    *   *Wrapper:* Centered inside `max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100`
    *   *Inputs:* Rounded-xl form elements (`w-full bg-white border border-gray-100 px-5 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary/15 text-sm`)
    *   *Action Button:* Prominent CTA `bg-brand-secondary text-white font-bold py-3.5 rounded-xl uppercase shadow-lg shadow-brand-secondary/20` with clay scaling.

### 4.9 Global Footer (`Footer.tsx`)
The final grounding block of the e-commerce layout.
*   **Structure:** Divided into four standard layout columns:
    1.  *Brand Bio:* ShreeChoice Playworld, store address, quick contact buttons.
    2.  *Quick Shop links:* Direct mappings to primary categories.
    3.  *Support Center:* Routes to FAQs, privacy policies, contact desks.
    4.  *Instagram / Social Stream:* Curated image list representing active community.
*   **Refined Mobile Spacing:** Vertical section gutters are streamlined on mobile viewports to prevent endless scrolls, compressing vertical padding to `py-4`.
*   **Mobile-First Interactive Optimizations:**
    *   All social links, navigation menu sub-items, and contact hooks have had traditional hover animations (`hover:`) prefixed with `md:hover:` to restrict them strictly to medium viewports and larger.
    *   This removes any stuck-cursor states on mobile phone browsers where tap gestures would otherwise lock the hover highlight color after navigation occurs.

---

## 5. Core Page Templates & Interactive State Mechanics

### 5.1 Shop Catalog Page (`ShopPage.tsx`)
The centerpiece product index carrying searching, sorting, and multi-tier filters.

```
+--------------------------------------------------------------+
|                         SHOP HEADER                          |
+--------------------------------------------------------------+
|  [Search Input: "Action Figure"]              [Sort Dropdown]|
+--------------------------------------------------------------+
|  Quick Pills: [Toys] [1-3 Years] [Dolls] [Rating 4+] [x Clear]|
+--------------------------------------------------------------+
|                                                              |
|  +--------------------+   +-------------------------------+  |
|  |  DESKTOP FILTER    |   | PRODUCT GRID (2 Col Mobile,   |  |
|  |  SIDEBAR           |   | 4 Col Desktop)                |  |
|  |                    |   |                               |  |
|  |  Category Checkbox |   | +----------+   +----------+   |  |
|  |  Age group Range   |   | |Product 1 |   |Product 2 |   |  |
|  |  Brand Sorter      |   | +----------+   +----------+   |  |
|  |  Price Slider      |   |                               |  |
|  |                    |   | +----------+   +----------+   |  |
|  |                    |   | |Product 3 |   |Product 4 |   |  |
|  +--------------------+   +-------------------------------+  |
|                                                              |
+--------------------------------------------------------------+
| [ ^ Sticky Back-To-Top Button ]                              |
+--------------------------------------------------------------+
```

*   **Responsive Adaptive Grid:**
    *   On mobile, filters collapse into a floating persistent bottom button or action pill bar. The grid displays exactly 2 columns to maximize tap targets.
    *   On desktop, matches a split layout: `w-1/4` (Desktop sidebar filter) + `w-3/4` (4-column Product Grid).
*   **Mobile Filters Drawer (`MobileFilterDrawer.tsx`):**
    *   Triggered from a bottom floating filter badge.
    *   Features a premium central "pull-up" visual bar/handle to mirror iOS action sheets.
    *   Full-page modal using Framer Motion transition sweeps.
*   **Sync State & URL Parameters:** All active state changes (Selected Category, Selected Brand, Search Query, Min/Max Price) are instantly updated inside React state, synchronized with URL search params (`?category=...&brand=...`) allowing direct sharing of filtered lists, and triggered with Supabase queries.
*   **"Back to Top" Button:** Visible on scrolls past `600px` (`fixed bottom-20 right-6 z-30`). Styled as a circular pill with standard shadow structures.

### 5.2 Product Detail Page (`ProductPage.tsx`)
A deep-dive viewport representing individual inventory cards.
*   **Adaptive Layout:** Displays as a single stacked screen on mobile devices (`flex-col`), and splits into two balanced horizontal columns (`md:flex-row md:gap-12`) on desktops.
*   **Image Gallery System:**
    *   *Active Panel:* Renders the primary large detail view.
    *   *Carousel Strip:* Located directly beneath the active photo, displays multi-angle product shots. Mobile users can directly horizontal swipe these indicators.
*   **Reviews Histogram:** Represents user rating distributions inside a highly visual percentage bar breakdown, rendering dynamic color bars indicating five-star downwards ratios.

### 5.3 Cart Page & Gift Management (`CartPage.tsx`)
A flexible user workspace handling item revisions and specialized checkouts.
*   **Quantity Selector:** Responsive layout blocks. Mobile view collapses vertical list items into simple horizontal flex blocks to prevent edge overflows.
*   **Dynamic Gift Personalization (Specialized Feature):**
    *   Allows purchasers to specify items as custom gift packets.
    *   *Gift Option Selectors:* Users can toggle "Gift Wrap" and/or "Add Gift Message" on an item-by-item basis.
    *   *Financial Matrix:* Adding Gift Wrapping appends a flat `₹20` (INR) fee per item to the total breakdown, calculated instantly.
    *   *Character Constraint:* Text fields for "Gift Message" are capped via character bounds and dynamically render a character countdown for users.

### 5.4 Checkout Page (`CheckoutPage.tsx`)
*   **Address Selection Matrix (For Logged-In Users):**
    *   Pulls saved shipping profiles from the user's account database.
    *   Matches a clean visual radio-grid. Selectable cards highlighted with a bold blue ring (`border-brand-primary bg-blue-50 ring-1`).
    *   Integrates an instant "+ Use New Address" option that expands a responsive, inline billing form.
*   **Form Validations:** Real-time checking on form submit, triggering custom validation warnings for zip codes, phone formatting, and email presence before calling DB orders.
*   **Financial Breakdown Summary:** Includes:
    1.  *Subtotal:* Aggregated item totals.
    2.  *Gift Wrap:* Dynamic sum of wrapping configurations (`₹20` x count).
    3.  *Platform Fee:* Standard flat transaction markup of `₹25`.
    4.  *Shipping:* Displays "Free shipping" to drive higher checkouts.
    5.  *Grand Total:* Dynamic mathematical sum computed reactively.

### 5.5 Profile Dashboard & Mobile Hub (`ProfilePage.tsx`)
An unified, feature-rich account terminal.

*   **Adaptive Layout Split:**
    *   *Mobile View:* Displays a clean, icon-driven **grid dashboard** (`Grid Menu`) with large tap targets (`MobileGridItem` / `MobileListItem`) that load specific views.
    *   *Desktop View:* Transforms into a professional split layout matching a sticky vertical sidebar navigation (`SidebarLink`) and a wider detail pane.
*   **Profile Sections Specifications:**
    1.  *My Orders:* Dynamic statuses showing colorful status pills. Includes a custom tracking modal or detailed list with individual invoice summaries.
    2.  *Addresses (CRUD Profile):* Direct management interface for addresses. Supports editing, creating new entries, or changing default billing profiles.
    3.  *Saved Payments:* Mock interface detailing cards and UPI IDs.
    4.  *Support:* Tap-to-call, Whatsapp linkages, and direct geo-location linkages.

---

## 6. Database Architecture & Schema Spec (Supabase)

The relational database layer is structured to support instant queries, automated user profiles, and order state triggers.

### 6.1 Database Entity Relationship Map
Below are the exact fields, data types, and primary/foreign keys used across key tables.

#### Table: `products`
Holds the central catalog and stock balances.
*   `id` (int8, Primary Key)
*   `name` (text, Required)
*   `price` (numeric, Required)
*   `original_price` (numeric, Optional)
*   `image_url` (text, Required)
*   `images` (text[], Required array of slide views)
*   `description` (text, Required)
*   `category` (text, Required)
*   `age_group` (text, Required)
*   `brand` (text, Required)
*   `tags` (text[], Filter tags)
*   `rating` (numeric, Float range 0-5)
*   `reviews` (int8, Review count)
*   `in_stock` (boolean, True if balance > 0)
*   `stock_quantity` (int8, Current stock level)
*   `colors` (text[], Optional design tags)

#### Table: `orders`
Manages purchases and status workflows.
*   `id` (uuid, Primary Key, Auto-gen)
*   `user_id` (uuid, Foreign Key referencing `auth.users`, Nullable for Guest)
*   `customer_email` (text, Required for transactional mails)
*   `created_at` (timestamptz, Auto-now)
*   `items` (jsonb, Stores serialized array of purchased `CartItem` elements)
*   `total` (numeric, Required checkout cost)
*   `status` (text, Enforced to match states: `'Order Placed'`, `'Order Accepted'`, `'Shipped'`, `'Delivered'`, `'Cancelled'`)
*   `shipping_address` (jsonb, Serialized snapshot of `ShippingInfo` to prevent archival decoupling)
*   `tracking_number` (text, Nullable shipping tracker)

#### Table: `addresses`
Coordinates saved locations for registered accounts.
*   `id` (uuid, Primary Key, Auto-gen)
*   `user_id` (uuid, Foreign Key referencing `auth.users`, Required)
*   `full_name` (text, Required)
*   `street` (text, Required)
*   `city` (text, Required)
*   `state` (text, Required)
*   `zip_code` (text, Required)
*   `country` (text, Default `'India'`)
*   `phone` (text, Required contact)
*   `is_default` (boolean, Fallback check)
*   `created_at` (timestamptz, Auto-now)

---

## 7. Developer Rebuilding & Setup Manual

To recreate the application locally or deploy it to production, follow this sequence of commands and environmental mappings:

### 7.1 Required Environment Variables (`.env.example`)
Create a `.env` file in the root folder and provide the following keys:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
```

### 7.2 Core Commands & Scripts
Compile, preview, or optimize the application using standard npm commands:
*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Run Development Server (Vite):**
    ```bash
    npm run dev
    ```
*   **Compile Production Build:**
    ```bash
    npm run build
    ```
*   **Verify TypeScript Integrity:**
    ```bash
    npm run lint
    ```

### 7.3 Layout and Border Radius Cheat Sheet for Subcomponents
For rebuilding individual custom card layouts, adhere strictly to these spacing mathematical formulas to maintain proportion:
*   **Inner elements nested in cards:**
    *   *Formula:* `Inner Border Radius = Outer Border Radius - Margin/Padding`
    *   *Example:* If a parent `.clay-panel` has `rounded-[2rem]` (32px) and contains an image container padded by `16px`, the image container MUST be styled with `rounded-[1rem]` (16px) corners to ensure concentric curved layouts.
*   **Interactive Targets Touch Guidelines:** Always maintain a minimum horizontal and vertical tap clearance of `44px` on mobile viewports for all checkout inputs, quantity steppers, and menu controls.

This comprehensive technical spec provides all spacing, structural, logic, and database details to rebuild, scale, or maintain **ShreeChoice Playworld** flawlessly. Feel free to use it as the source of truth for future engineering tasks.
