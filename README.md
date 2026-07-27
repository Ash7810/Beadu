# Beadu × Froyo — Bracelet Builder

Indian handmade jewellery customizer built with **Next.js 16**, **Zustand**, **Supabase**, and deployed on **Netlify**.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify |
| Styling | Tailwind CSS v4 |
| Drag & Drop | @dnd-kit |

---

## Quick Start

```bash
cd bracelet-builder
npm install
npm run dev
# → http://localhost:3000
```

---

## Environment Setup

Create `bracelet-builder/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
```

> ⚠️ **Never commit `.env.local` to Git.** Already in `.gitignore`.

---

## Database Setup

Run in **Supabase → SQL Editor**:

```sql
-- Beads catalog
create table if not exists beads (
  id            text primary key,
  name          text not null,
  category      text not null,
  price         integer not null default 0,
  material      text,
  image_url     text,
  is_premium    boolean not null default false,
  rotation_allowed boolean not null default false,
  size          float not null default 1,
  size_mm       float not null default 8,
  width_mm      float not null default 8,
  active        boolean not null default true,
  created_at    timestamptz default now()
);

-- Orders
create table if not exists bracelets (
  id              uuid primary key default gen_random_uuid(),
  customer_name   text,
  email           text,
  phone           text,
  wrist_inches    float not null default 7.0,
  cord_type       text not null default 'elastic',
  placed_beads    jsonb not null default '[]',
  total_price     integer not null default 0,
  status          text not null default 'draft',
  preview_image_url text,
  address         text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update timestamp
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger bracelets_updated_at
  before update on bracelets
  for each row execute procedure update_updated_at();

-- Row Level Security
alter table beads enable row level security;
alter table bracelets enable row level security;

create policy "beads_public_read" on beads for select using (true);
create policy "beads_admin_write" on beads for all using (auth.role() = 'service_role');
create policy "bracelets_insert" on bracelets for insert with check (true);
create policy "bracelets_admin_all" on bracelets for all using (auth.role() = 'service_role');
```

### Seed Bead Catalog

```bash
cd bracelet-builder
npx ts-node --project tsconfig.json scripts/seed-beads.ts
```

---

## Netlify Deployment

1. Push to GitHub
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
3. Configure:

| Setting | Value |
|---|---|
| Base directory | `bracelet-builder` |
| Build command | `npm run build` |
| Publish directory | `bracelet-builder/.next` |

4. Add environment variables in **Site Settings → Environment Variables**

---

## Project Structure

```
bracelet-builder/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── builder/page.tsx         # Bracelet customizer
│   ├── admin/orders/page.tsx    # Admin order dashboard
│   ├── actions/submitOrder.ts   # Server Action — order submission
│   └── globals.css              # Design system & theme
├── components/builder/
│   ├── BraceletCanvas.tsx       # SVG strand renderer
│   ├── BeadLibrary.tsx          # Bead catalog grid
│   ├── CraftingTray.tsx         # Selected beads tray
│   ├── SummaryPanel.tsx         # Order summary
│   └── Checkout.tsx             # Checkout flow
├── lib/
│   ├── catalog.ts               # Static bead catalog
│   ├── types.ts                 # Shared TypeScript types
│   ├── pricing.ts               # Pricing & sizing logic
│   └── supabase.ts              # Supabase client (lazy singleton)
├── store/
│   └── braceletStore.ts         # Zustand state management
├── public/
│   ├── beadu-logo.png           # Brand logo
│   └── beads/                   # Bead images
├── scripts/
│   └── seed-beads.ts            # One-time DB seeder
└── netlify.toml                 # Netlify deployment config
```

---

## Order Lifecycle

`draft` → `confirmed` → `shipped` → `delivered`
