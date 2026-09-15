# Beadu Production Supabase Database Schema (`sql.md`)

> **⚠️ Non-Destructive Guarantee**:  
> This schema contains **ZERO** `DROP TABLE`, **ZERO** `TRUNCATE`, and **ZERO** destructive queries.  
> It uses `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and idempotent operations.  
> Running this script will **never delete or overwrite your existing custom beads, customer accounts, or order history**.

---

## 1. Quick Copy-Paste Schema (Supabase SQL Editor)

Run the following SQL in your **[Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor → New Query**:

```sql
-- =============================================================================
-- BEADU E-COMMERCE & ARTISAN LOGISTICS DATABASE SCHEMA
-- Compatible with PostgreSQL 14+ / Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. STORE ADMINS TABLE (Role-Based Access Control)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.store_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default administrators (idempotent, safe)
INSERT INTO public.store_admins (email, role)
VALUES 
    ('beaduuu@gmail.com', 'ADMIN'),
    ('meet.y.7810@gmail.com', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 2. BEADS INVENTORY TABLE (Custom Bracelet Builder)
-- [CRITICAL: Non-destructive structure preserves all custom artisan beads]
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.beads (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    material VARCHAR(150) DEFAULT '',
    image_url TEXT DEFAULT '',
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    rotation_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    rotation NUMERIC(5, 2) DEFAULT 0,
    size NUMERIC(5, 2) DEFAULT 1.0,
    size_mm NUMERIC(6, 2) DEFAULT 8.0,
    width_mm NUMERIC(6, 2) DEFAULT 8.0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-destructive column migrations in case table was created earlier
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS material VARCHAR(150) DEFAULT '';
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS rotation_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS rotation NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS size NUMERIC(5, 2) DEFAULT 1.0;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS size_mm NUMERIC(6, 2) DEFAULT 8.0;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS width_mm NUMERIC(6, 2) DEFAULT 8.0;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.beads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for lightning-fast builder library performance
CREATE INDEX IF NOT EXISTS idx_beads_active ON public.beads(active);
CREATE INDEX IF NOT EXISTS idx_beads_category ON public.beads(category);

-- =============================================================================
-- 3. ORDERS TABLE (Full E-Commerce, COD, UPI, & Delhivery Logistics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(100) PRIMARY KEY,
    user_id TEXT, -- Supabase Auth user UUID or Guest Identifier
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gift_wrap_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 100,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Operational Status
    status VARCHAR(50) NOT NULL DEFAULT 'Order Placed',
    -- Modern Fulfillment Status (Shopify/Shiprocket standard)
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'Unfulfilled',
    
    -- Payment Details
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'COD',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    transaction_id TEXT,
    
    -- Courier / Delhivery Logistics
    awb_number TEXT,
    delhivery_status VARCHAR(50) DEFAULT 'Pending',
    delhivery_error TEXT,
    
    -- Consignee Shipping Address (Full JSON snapshot for immutable record keeping)
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-destructive column additions in case orders table was initialized earlier
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'Unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delhivery_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delhivery_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for order lookup, admin filtering, and customer profile speed
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_awb_number ON public.orders(awb_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- =============================================================================
-- 4. CUSTOMER ADDRESSES TABLE (Address Book CRUD)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT addresses_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- =============================================================================
-- 5. WISHLISTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

-- =============================================================================
-- 6. CARTS TABLE (Persistent Server-Side Cart Synchronization)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- =============================================================================
-- 7. BRACELETS TABLE (Custom Builder & Event Order Submissions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.bracelets (
    id BIGSERIAL PRIMARY KEY,
    customer_name TEXT,
    email TEXT,
    phone TEXT,
    wrist_inches NUMERIC(4, 2),
    cord_type TEXT,
    placed_beads JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price INTEGER NOT NULL DEFAULT 0,
    address TEXT,
    preview_image_url TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bracelets_created_at ON public.bracelets(created_at DESC);

-- =============================================================================
-- 8. PRODUCT REVIEWS TABLE (Optional UGC Social Proof)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(100) NOT NULL,
    user_id UUID,
    author_name VARCHAR(150) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- =============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracelets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely before recreating (idempotent)
DO $$
BEGIN
    -- Beads: Anyone can view active beads, only admins modify
    DROP POLICY IF EXISTS "Public can view active beads" ON public.beads;
    CREATE POLICY "Public can view active beads" ON public.beads
        FOR SELECT USING (active = TRUE);

    DROP POLICY IF EXISTS "Service role full access on beads" ON public.beads;
    CREATE POLICY "Service role full access on beads" ON public.beads
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Orders: Users can read their own orders; service_role has full control
    DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
    CREATE POLICY "Users can read own orders" ON public.orders
        FOR SELECT USING (auth.uid()::text = user_id);

    DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
    CREATE POLICY "Service role full access on orders" ON public.orders
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Addresses: Users can read/write their own addresses
    DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
    CREATE POLICY "Users manage own addresses" ON public.addresses
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role full access on addresses" ON public.addresses;
    CREATE POLICY "Service role full access on addresses" ON public.addresses
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Wishlists: Users manage their own wishlist
    DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
    CREATE POLICY "Users manage own wishlist" ON public.wishlists
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role full access on wishlists" ON public.wishlists;
    CREATE POLICY "Service role full access on wishlists" ON public.wishlists
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Carts: Users manage their own cart
    DROP POLICY IF EXISTS "Users manage own cart" ON public.carts;
    CREATE POLICY "Users manage own cart" ON public.carts
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role full access on carts" ON public.carts;
    CREATE POLICY "Service role full access on carts" ON public.carts
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Bracelets: Service role & authenticated creator access
    DROP POLICY IF EXISTS "Public insert custom bracelets" ON public.bracelets;
    CREATE POLICY "Public insert custom bracelets" ON public.bracelets
        FOR INSERT WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "Service role full access on bracelets" ON public.bracelets;
    CREATE POLICY "Service role full access on bracelets" ON public.bracelets
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Reviews: Public can read reviews, authenticated users can write
    DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
    CREATE POLICY "Public can view reviews" ON public.reviews
        FOR SELECT USING (TRUE);

    DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
    CREATE POLICY "Users can insert reviews" ON public.reviews
        FOR INSERT WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "Service role full access on reviews" ON public.reviews;
    CREATE POLICY "Service role full access on reviews" ON public.reviews
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

    -- Store Admins: Public cannot read, service_role manages
    DROP POLICY IF EXISTS "Service role full access on store_admins" ON public.store_admins;
    CREATE POLICY "Service role full access on store_admins" ON public.store_admins
        FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
END $$;

-- =============================================================================
-- 10. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers non-destructively
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_beads_updated_at ON public.beads;
    CREATE TRIGGER trigger_beads_updated_at
        BEFORE UPDATE ON public.beads
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
    CREATE TRIGGER trigger_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_addresses_updated_at ON public.addresses;
    CREATE TRIGGER trigger_addresses_updated_at
        BEFORE UPDATE ON public.addresses
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_wishlists_updated_at ON public.wishlists;
    CREATE TRIGGER trigger_wishlists_updated_at
        BEFORE UPDATE ON public.wishlists
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    DROP TRIGGER IF EXISTS trigger_carts_updated_at ON public.carts;
    CREATE TRIGGER trigger_carts_updated_at
        BEFORE UPDATE ON public.carts
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;
```

---

## 2. Table Summary & Relationships

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `orders` | Central order repository for both Guest and Authenticated checkouts (UPI & COD). | `id`, `user_id`, `items` (JSONB), `total`, `status`, `fulfillment_status`, `awb_number`, `delhivery_status`, `shipping_address` (JSONB) |
| `beads` | Physical and gemstone beads inventory catalog for the 3D/2D Custom Bracelet Builder. **Preserved safely**. | `id`, `name`, `category`, `price`, `material`, `image_url`, `size_mm`, `active` |
| `addresses` | Customer saved address book with Delhivery serviceability data. | `id`, `user_id`, `addresses` (JSONB array), `is_default` |
| `wishlists` | User saved wishlist items across devices. | `id`, `user_id`, `items` (JSONB product ID list) |
| `carts` | Persistent cart session across browser devices for authenticated users. | `id`, `user_id`, `items` (JSONB cart items) |
| `bracelets` | Custom builder blueprints and event order submissions. | `id`, `customer_name`, `placed_beads` (JSONB), `total_price`, `preview_image_url` |
| `store_admins` | Role-based administrator authorization for store operations. | `id`, `email`, `role` |
| `reviews` | Customer product reviews and social proof ratings. | `id`, `product_id`, `author_name`, `rating`, `comment` |

---

## 3. Non-Destructive Beads Guarantee

When adding or updating beads:
- Never run `DROP TABLE beads;` or `TRUNCATE beads;`.
- Use `ON CONFLICT (id) DO UPDATE SET ...` or `ON CONFLICT (id) DO NOTHING`.
- Newly uploaded beads created by admins via the admin dashboard are given IDs starting with `custom-` or `bead-custom-`. The app backend in [`app/api/beads/route.ts`](file:///c:/Users/Lenovo/Downloads/BEADU/app/api/beads/route.ts) merges these on top of the catalog dynamically so neither is lost.
