import { NextResponse } from "next/server";
import { INITIAL_BEADS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * GET /api/beads
 * Serves the live bead catalog.
 * If admin has added custom beads via Supabase, those are merged on top.
 * Falls back to catalog.ts if DB is unavailable.
 */
export async function GET() {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const { data } = await getSupabaseAdmin()
      .from("beads")
      .select("*")
      .eq("active", true);

    if (data && data.length > 0) {
      const dbMap = new Map(data.map((r: any) => [r.id, {
        id: r.id,
        name: r.name,
        category: r.category,
        price: r.price,
        material: r.material || "",
        imageUrl: r.image_url || "",
        isPremium: r.is_premium,
        rotationAllowed: r.rotation_allowed,
        rotation: r.rotation || 0,
        size: r.size || (r.width_mm ? Number((r.width_mm / 8).toFixed(2)) : 1),
        sizeMm: r.size_mm || 8,
        widthMm: r.width_mm || 8,
        active: r.active,
      }]));

      // 1. Maintain exact order of INITIAL_BEADS, overriding with DB values if present
      const updatedCatalog = INITIAL_BEADS.map((b) => {
        const dbItem = dbMap.get(b.id);
        if (!dbItem) return b;
        return {
          ...dbItem,
          rotation: dbItem.rotation !== undefined && dbItem.rotation !== 0 ? dbItem.rotation : (b.rotation || 0),
        };
      });

      // 2. Only append newly created custom admin beads starting with 'custom-' or 'bead-custom'
      const initialIds = new Set(INITIAL_BEADS.map((b) => b.id));
      const customOnly = data
        .filter((r: any) => !initialIds.has(r.id) && (r.id.startsWith("custom-") || r.id.startsWith("bead-custom")))
        .map((r: any) => dbMap.get(r.id)!);

      return NextResponse.json([...updatedCatalog, ...customOnly]);
    }
  } catch (_) {
    // DB error / offline fallback
  }

  return NextResponse.json(INITIAL_BEADS);
}

/**
 * POST /api/beads
 * Admin creates or updates beads in the Supabase catalog.
 */
export async function POST(req: Request) {
  try {
    const { getAuthenticatedAdmin } = await import("@/lib/authServer");
    const { isAdmin } = await getAuthenticatedAdmin();

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Admin authorization required." }, { status: 403 });
    }

    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const adminDb = getSupabaseAdmin();

    const body = await req.json();
    const { id, name, category, price, material, imageUrl, isPremium, rotationAllowed, rotation, size, sizeMm, widthMm, active } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Bead id and name are required." }, { status: 400 });
    }

    const row = {
      id: String(id),
      name: String(name),
      category: String(category || "acrylic"),
      price: Number(price) || 0,
      material: String(material || ""),
      image_url: String(imageUrl || ""),
      is_premium: Boolean(isPremium),
      rotation_allowed: Boolean(rotationAllowed),
      rotation: Number(rotation) || 0,
      size: Number(size) || 1.0,
      size_mm: Number(sizeMm) || 8.0,
      width_mm: Number(widthMm) || 8.0,
      active: active !== undefined ? Boolean(active) : true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminDb
      .from("beads")
      .upsert(row, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bead: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to save bead." }, { status: 500 });
  }
}

