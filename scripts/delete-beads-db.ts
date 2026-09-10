import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  console.error("Missing Supabase env vars. Make sure .env.local is present.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Connecting to Supabase:", url);

  // Delete ALL rows from the beads table (removes all artificially seeded beads)
  const { error, count } = await supabase
    .from("beads")
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (error) {
    console.error("Error deleting beads:", error.message);
    process.exit(1);
  }

  console.log(`✓ Deleted ${count} bead(s) from Supabase DB.`);
  console.log("DB is now clean. Beads are now served from catalog.ts only.");
}

main().catch(console.error);
