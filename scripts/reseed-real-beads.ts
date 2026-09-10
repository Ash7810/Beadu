import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  console.error("Missing Supabase env vars. Make sure .env.local is present.");
  process.exit(1);
}

const supabase = createClient(url, key);

const REAL_BEADS = [
  { id: "bead-batch-a-001", name: "Artisan Jade Green Sphere", category: "crystal", price: 0, material: "Natural Green Jade", image_url: "/beads/batch_a_clean/bead_001.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-002", name: "Frosted Ice Blue Cylinder", category: "crystal", price: 0, material: "Hand-Blown Glass", image_url: "/beads/batch_a_clean/bead_002.png", is_premium: false, rotation_allowed: false, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-003", name: "Terrazzo Mosaic Globe", category: "crystal", price: 0, material: "Artisan Terrazzo Glass", image_url: "/beads/batch_a_clean/bead_003.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-004", name: "Gilded Terracotta Sun Disc", category: "gold", price: 250, material: "Hand-Molded Terracotta & Gold Leaf", image_url: "/beads/batch_a_clean/bead_004.png", is_premium: true, rotation_allowed: true, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-005", name: "Rose Quartz Heart Charm", category: "heart", price: 350, material: "Natural Rose Quartz", image_url: "/beads/batch_a_clean/bead_005.png", is_premium: true, rotation_allowed: true, size: 1.5, size_mm: 12, width_mm: 12, active: true },
  { id: "bead-batch-a-006", name: "Polished Indian Rosewood", category: "wood", price: 0, material: "Sustainably Sourced Rosewood", image_url: "/beads/batch_a_clean/bead_006.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-007", name: "Baroque Freshwater Pearl", category: "pearl", price: 0, material: "Natural Freshwater Pearl", image_url: "/beads/batch_a_clean/bead_007.png", is_premium: false, rotation_allowed: false, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-008", name: "Matte Obsidian Black Sphere", category: "crystal", price: 0, material: "Natural Black Obsidian", image_url: "/beads/batch_a_clean/bead_008.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-009", name: "Hand-Engraved Brass Emblem", category: "letter", price: 0, material: "Recycled Brass", image_url: "/beads/batch_a_clean/bead_009.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-010", name: "Ocean Blue Swirl Glass", category: "crystal", price: 0, material: "Artisanal Blown Glass", image_url: "/beads/batch_a_clean/bead_010.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-011", name: "Artisan Kundan Solstice Sun", category: "premium-charm", price: 450, material: "Solid Brass & Kundan Glass", image_url: "/beads/batch_a_clean/bead_011.png", is_premium: true, rotation_allowed: true, size: 1.5, size_mm: 12, width_mm: 12, active: true },
  { id: "bead-batch-a-012", name: "Raw Amethyst Gemstone", category: "crystal", price: 300, material: "Natural Indian Amethyst", image_url: "/beads/batch_a_clean/bead_012.png", is_premium: true, rotation_allowed: true, size: 1.13, size_mm: 9, width_mm: 9, active: true },
  { id: "bead-batch-a-013", name: "Golden Brass Spacer Bead", category: "gold", price: 0, material: "Polished Brass", image_url: "/beads/batch_a_clean/bead_013.png", is_premium: false, rotation_allowed: false, size: 0.75, size_mm: 6, width_mm: 6, active: true },
  { id: "bead-batch-a-014", name: "Midnight Lapis Lazuli", category: "crystal", price: 400, material: "Natural Lapis Lazuli", image_url: "/beads/batch_a_clean/bead_014.png", is_premium: true, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-015", name: "Emerald Cut Gemstone", category: "birthstone", price: 550, material: "Natural Emerald Gem", image_url: "/beads/batch_a_clean/bead_015.png", is_premium: true, rotation_allowed: true, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-016", name: "Amber Honey Crystal", category: "crystal", price: 0, material: "Fired Baltic Amber", image_url: "/beads/batch_a_clean/bead_016.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-017", name: "Carved Wooden Mandala Disc", category: "zodiac", price: 0, material: "Hand-Carved Walnut Wood", image_url: "/beads/batch_a_clean/bead_017.png", is_premium: false, rotation_allowed: true, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-018", name: "Copper Engraved Bar", category: "premium-charm", price: 350, material: "Recycled Copper", image_url: "/beads/batch_a_clean/bead_018.png", is_premium: true, rotation_allowed: true, size: 1.5, size_mm: 12, width_mm: 12, active: true },
  { id: "bead-batch-a-019", name: "Turquoise Pebble Charm", category: "crystal", price: 0, material: "Natural Turquoise", image_url: "/beads/batch_a_clean/bead_019.png", is_premium: false, rotation_allowed: true, size: 1.13, size_mm: 9, width_mm: 9, active: true },
  { id: "bead-batch-a-020", name: "Ruby Oval Pendant", category: "birthstone", price: 650, material: "Gold-Plated Natural Ruby", image_url: "/beads/batch_a_clean/bead_020.png", is_premium: true, rotation_allowed: true, size: 1.5, size_mm: 12, width_mm: 12, active: true },
  { id: "bead-batch-a-021", name: "Silver Hammered Sphere", category: "silver", price: 0, material: "925 Sterling Silver", image_url: "/beads/batch_a_clean/bead_021.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-022", name: "Faceted Sapphire Gem", category: "birthstone", price: 600, material: "Natural Sapphire Stone", image_url: "/beads/batch_a_clean/bead_022.png", is_premium: true, rotation_allowed: true, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-023", name: "Artisan Ceramic Speckle", category: "ceramic", price: 0, material: "Glazed Stoneware Clay", image_url: "/beads/batch_a_clean/bead_023.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-024", name: "Zodiac Celestial Sun", category: "zodiac", price: 0, material: "Hand-Carved Brass Disc", image_url: "/beads/batch_a_clean/bead_024.png", is_premium: false, rotation_allowed: true, size: 1.13, size_mm: 9, width_mm: 9, active: true },
  { id: "bead-batch-a-025", name: "Golden Heart Spacer", category: "heart", price: 200, material: "18K Gold Plated Brass", image_url: "/beads/batch_a_clean/bead_025.png", is_premium: true, rotation_allowed: true, size: 1.25, size_mm: 10, width_mm: 10, active: true },
  { id: "bead-batch-a-026", name: "Smoky Quartz Crystal", category: "crystal", price: 0, material: "Natural Smoky Quartz", image_url: "/beads/batch_a_clean/bead_026.png", is_premium: false, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
  { id: "bead-batch-a-027", name: "White Opal Sphere", category: "pearl", price: 300, material: "Ethically Mined Opal", image_url: "/beads/batch_a_clean/bead_027.png", is_premium: true, rotation_allowed: false, size: 1, size_mm: 8, width_mm: 8, active: true },
];

async function main() {
  console.log("Connecting to Supabase:", url);

  // Step 1: Delete ALL existing beads
  console.log("Step 1: Clearing all existing beads from DB...");
  const { error: deleteError } = await supabase
    .from("beads")
    .delete()
    .not("id", "is", null);

  if (deleteError) {
    console.error("Delete error:", deleteError.message);
    process.exit(1);
  }
  console.log("✓ All existing beads deleted.");

  // Step 2: Insert the 27 real photoshoot beads
  console.log("Step 2: Seeding 27 real photoshoot beads...");
  const { error: insertError, data } = await supabase
    .from("beads")
    .insert(REAL_BEADS)
    .select();

  if (insertError) {
    console.error("Insert error:", insertError.message);
    process.exit(1);
  }

  console.log(`✓ Seeded ${data?.length ?? REAL_BEADS.length} real beads to Supabase.`);
  console.log("Done! DB now contains only real photoshoot beads.");
}

main().catch(console.error);
