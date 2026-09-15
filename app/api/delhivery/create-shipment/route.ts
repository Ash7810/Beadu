import { NextRequest, NextResponse } from "next/server";
import { createDelhiveryShipment } from "@/lib/delhivery";
import { sharedServerOrders } from "@/lib/serverOrders";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedAdmin } from "@/lib/authServer";

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await getAuthenticatedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authorization required to manifest shipments." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.order) {
      return NextResponse.json(
        { success: false, error: "Order payload is required for shipment creation." },
        { status: 400 }
      );
    }

    const { order } = body;
    if (!order.shippingAddress || !order.shippingAddress.zipCode || !order.shippingAddress.fullName) {
      return NextResponse.json(
        { success: false, error: "Consignee name and pincode are required for manifestation." },
        { status: 400 }
      );
    }

    const result = await createDelhiveryShipment(order);

    if (result.success && result.waybill && !result.simulated) {
      const waybill = result.waybill;

      // 1. Update shared in-memory orders (Manifested from admin -> Order Accepted)
      const existing = sharedServerOrders.find((o) => o.id === order.id);
      if (existing) {
        existing.awbNumber = waybill;
        existing.delhiveryStatus = "Manifested";
        existing.delhiveryError = undefined;
        existing.status = "Order Accepted";
        existing.fulfillmentStatus = "Manifested";
      }

      // 2. Update Supabase
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin
          .from("orders")
          .update({
            awb_number: waybill,
            status: "Order Accepted",
            fulfillment_status: "Manifested",
            delhivery_status: "Manifested",
            delhivery_error: null,
          })
          .eq("id", order.id);
      } catch (err) {
        console.warn("Supabase single manifest update error:", err);
      }
    } else if (!result.success) {
      const errMsg = result.error || "Manifestation failed";
      const existing = sharedServerOrders.find((o) => o.id === order.id);
      if (existing) {
        existing.delhiveryStatus = "Failed";
        existing.delhiveryError = errMsg;
        if (existing.status !== "Cancelled") {
          existing.status = "Order Placed";
          existing.fulfillmentStatus = "Unfulfilled";
        }
      }

      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin
          .from("orders")
          .update({
            status: "Order Placed",
            fulfillment_status: "Unfulfilled",
            delhivery_status: "Failed",
            delhivery_error: errMsg,
          })
          .eq("id", order.id);
      } catch (err) {
        console.warn("Supabase failed manifest notice update error:", err);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Delhivery create-shipment error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipment manifest with courier partner." },
      { status: 500 }
    );
  }
}
