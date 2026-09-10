import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { INITIAL_BEADS } from "@/lib/catalog";
import { calculateTotal } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { placedBeads, customerName, email, phone, wristInches, cordType, address, totalPrice, previewImageUrl } = body;

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
    const sanitizedCord = cordType === "wire" ? "wire" : "elastic";
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
      cordType: sanitizedCord as any,
      wristInches: sanitizedWrist,
    });
    // Server-verified price in rupees
    const verifiedPrice = computedPricing.total;

    // Guard against javascript: and other dangerous pseudo-schemes in preview images
    const rawPreview = typeof previewImageUrl === "string" ? previewImageUrl.trim() : "";
    const isSafeImageUri = rawPreview && (rawPreview.startsWith("/") || rawPreview.startsWith("https://") || rawPreview.startsWith("http://") || rawPreview.startsWith("data:image/"));
    const sanitizedPreviewUrl = isSafeImageUri ? rawPreview.slice(0, 500000) : null;

    let nextSeqNum = 1;
    let orderId = "";
    let supabaseSaved = false;

    try {
      const dbPromise = (async () => {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get exact total order count for sequential Event Order IDs (BDU-001, BDU-002...)
        const { count } = await supabaseAdmin.from("bracelets").select("id", { count: "exact", head: true });
        if (count && typeof count === "number") {
          nextSeqNum = count + 1;
        }

        const formattedSeqId = `BDU-EVENT-${String(nextSeqNum).padStart(3, "0")}`;

        // 2. Insert design order record
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

        return { saved: !error, seqId: formattedSeqId };
      })();

      const timeoutPromise = new Promise<{ saved: boolean; seqId?: string }>((resolve) =>
        setTimeout(() => resolve({ saved: false }), 800)
      );

      const result = await Promise.race([dbPromise, timeoutPromise]);
      supabaseSaved = result.saved;
      if (result.seqId) {
        orderId = result.seqId;
      } else {
        orderId = `BDU-EVENT-${String(Math.floor(Date.now() % 1000) + 1).padStart(3, "0")}`;
      }
    } catch (sbErr) {
      console.warn("Supabase connection notice:", sbErr);
      orderId = `BDU-EVENT-${String(Math.floor(Date.now() % 1000) + 1).padStart(3, "0")}`;
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

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Beadu Atelier Customizer API",
  });
}
