"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { DesignSubmission } from "@/lib/types";

export async function submitOrder(data: DesignSubmission) {
  const generatedId = `BDU-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const sanitizedName = String(data.customerName || "Valued Customer").trim().slice(0, 100);
  const sanitizedEmail = String(data.email || "").trim().slice(0, 150);
  const sanitizedPhone = String(data.phone || "").trim().replace(/[^\d+ -]/g, "").slice(0, 20);
  const sanitizedAddress = String(data.address || "").trim().slice(0, 500);
  const sanitizedCord = data.cordType ?? "elastic";
  const sanitizedWrist = Math.min(12, Math.max(4, Number(data.wristInches) || 7.0));
  const sanitizedPrice = Math.min(1000000, Math.max(0, Number(data.totalPrice) || 0));
  const rawPreview = typeof data.previewImageUrl === "string" ? data.previewImageUrl.trim() : "";
  const isSafeImageUri = rawPreview && (rawPreview.startsWith("/") || rawPreview.startsWith("https://") || rawPreview.startsWith("http://") || rawPreview.startsWith("data:image/"));
  const sanitizedPreviewUrl = isSafeImageUri ? rawPreview.slice(0, 500000) : null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error, data: row } = await supabaseAdmin
      .from("bracelets")
      .insert({
        customer_name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        wrist_inches: sanitizedWrist,
        cord_type: sanitizedCord,
        placed_beads: Array.isArray(data.placedBeads) ? data.placedBeads.slice(0, 100) : [],
        total_price: Math.round(sanitizedPrice * 100), // in paise
        address: sanitizedAddress,
        preview_image_url: sanitizedPreviewUrl,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      console.warn("Supabase order insert notice:", error.message);
      return { success: true, orderId: generatedId, fallback: true };
    }

    return {
      success: true,
      orderId: row.id ? `#${row.id.slice(0, 8).toUpperCase()}` : generatedId,
      order: row,
    };
  } catch (err) {
    console.warn("Supabase not configured or unreachable, using local fallback ID:", err);
    return { success: true, orderId: generatedId, fallback: true };
  }
}
