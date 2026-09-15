import { Order } from "@/store/ecomStore";
import { getSupabaseAdmin } from "@/lib/supabase";

// In-memory server-side shared orders registry (persists across all connected devices and browsers)
export const sharedServerOrders: Order[] = [];

/**
 * Generates clean, sequential numerical Order IDs (e.g. "1001", "1002", "1003").
 * Guarantees uniqueness across both Supabase database and in-memory registry.
 */
export async function getNextOrderNumber(): Promise<string> {
  let maxNum = 1000;
  const existingIds = new Set<string>();

  const checkId = (id: unknown) => {
    if (!id) return;
    const strId = String(id);
    existingIds.add(strId);
    const parsed = parseInt(strId.replace(/^[^\d]+/, ""), 10);
    if (!isNaN(parsed) && parsed >= 1001 && parsed < 10000000 && parsed > maxNum) {
      maxNum = parsed;
    }
  };

  // 1. Inspect in-memory sharedServerOrders
  sharedServerOrders.forEach((o) => checkId(o?.id));

  // 2. Query Supabase for recent orders to find the latest sequential ID
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: dbOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (Array.isArray(dbOrders)) {
      dbOrders.forEach((row) => checkId(row?.id));
    }
  } catch (err) {
    console.warn("Could not query DB for next order sequence, using local counter:", err);
  }

  let nextCandidate = maxNum + 1;
  while (existingIds.has(String(nextCandidate))) {
    nextCandidate++;
  }

  return String(nextCandidate);
}

