import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { INITIAL_BEADS } from "@/lib/catalog";
import { Bead } from "@/lib/types";

// Auto-load .env.local
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join("=").trim();
        }
      }
    });
  }
} catch {}

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
// Strip trailing /rest/v1/ or trailing slash if user pasted endpoint URL directly
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const supabaseUrl = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

console.log(`📡 Connecting to Supabase URL: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log(`⏳ Seeding ${INITIAL_BEADS.length} beads into Supabase 'beads' table...`);

  const rows = INITIAL_BEADS.map((b: Bead) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    price: b.price,
    material: b.material,
    image_url: b.imageUrl,
    is_premium: b.isPremium,
    rotation_allowed: b.rotationAllowed,
    rotation: b.rotation || 0,
    size: b.size,
    size_mm: b.sizeMm,
    width_mm: b.widthMm,
    active: b.active,
  }));

  const { data, error } = await supabase.from("beads").upsert(rows, { onConflict: "id" }).select();

  if (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully seeded ${data?.length || rows.length} beads to Supabase!`);
}

seed().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
