import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { INITIAL_BEADS } from "@/lib/catalog";
import { calculateTotal } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { placedBeads, customerName, email, phone, wristInches, address, previewImageUrl } = body;

    if (!placedBeads || !Array.isArray(placedBeads) || placedBeads.length === 0) {
      return NextResponse.json(
        { error: "Strand cannot be empty when placing an order." },
        { status: 400 }
      );
    }

    // Defensive input sanitization
    const sanitizedName = String(customerName || "Valued Customer").trim().slice(0, 100);
    const sanitizedEmail = String(email || "").trim().slice(0, 150);
    const sanitizedPhone = String(phone || "").trim().replace(/[^\d+ -]/g, "").slice(0, 20);
    const sanitizedAddress = String(address || "").trim().slice(0, 500);
    const sanitizedCord = "elastic";
    const sanitizedWrist = Math.min(12, Math.max(4, Number(wristInches) || 7.0));

    // Server-side price recalculation to prevent price tampering
    const beadCatalogMap = new Map(INITIAL_BEADS.map((b) => [b.id, b]));
    const verifiedBeads = placedBeads.slice(0, 100).map((b: any, idx: number) => {
      const catalogItem = beadCatalogMap.get(b.id);
      return {
        ...b,
        price: catalogItem ? catalogItem.price : (Number(b.price) || 0),
        isPremium: catalogItem ? catalogItem.isPremium : Boolean(b.isPremium),
        slotIndex: idx,
      };
    });

    const computedPricing = calculateTotal(verifiedBeads, {
      totalSlots: 35,
      freeSlotLimit: 20,
      cordType: "elastic",
      wristInches: sanitizedWrist,
    });
    // Server-verified price in rupees
    const verifiedPrice = computedPricing.total;

    // Guard against javascript: and other dangerous pseudo-schemes in preview images
    const rawPreview = typeof previewImageUrl === "string" ? previewImageUrl.trim() : "";
    const isSafeImageUri = rawPreview && (rawPreview.startsWith("/") || rawPreview.startsWith("https://") || rawPreview.startsWith("http://") || rawPreview.startsWith("data:image/"));
    const sanitizedPreviewUrl = isSafeImageUri ? rawPreview.slice(0, 500000) : null;

    let orderId = `BDU-EVENT-${Date.now().toString(36).toUpperCase()}`;
    let supabaseSaved = false;

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { count } = await supabaseAdmin.from("bracelets").select("id", { count: "exact", head: true });
      if (typeof count === "number") {
        orderId = `BDU-EVENT-${String(count + 1).padStart(3, "0")}`;
      }

      const { error } = await supabaseAdmin.from("bracelets").insert({
        customer_name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        wrist_inches: sanitizedWrist,
        cord_type: sanitizedCord,
        placed_beads: verifiedBeads,
        total_price: Math.round(verifiedPrice * 100),
        address: sanitizedAddress,
        preview_image_url: sanitizedPreviewUrl,
        status: "confirmed",
      });
      supabaseSaved = !error;
    } catch (sbErr) {
      console.warn("Supabase connection notice:", sbErr);
    }

    const orderData = {
      orderId,
      status: "confirmed",
      customerName: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      wristInches: sanitizedWrist,
      cordType: sanitizedCord,
      address: sanitizedAddress,
      totalPrice: verifiedPrice,
      itemCount: verifiedBeads.length,
      placedBeads: verifiedBeads,
      supabaseSaved,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      order: orderData,
      message: "Custom design order created successfully!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create design order", details: String(error) },
      { status: 500 }
    );
  }
}
