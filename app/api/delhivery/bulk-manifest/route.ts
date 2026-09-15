import { NextRequest, NextResponse } from "next/server";
import { createDelhiveryShipment } from "@/lib/delhivery";
import { sharedServerOrders } from "@/lib/serverOrders";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Order } from "@/store/ecomStore";
import { getAuthenticatedAdmin } from "@/lib/authServer";

/**
 * POST /api/delhivery/bulk-manifest
 * Manifests all pending / unmanifested orders with Delhivery One in batch.
 * Designed for enterprise logistics workflows when wallet balance is replenished or orders surge.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await getAuthenticatedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authorization required to run bulk manifestation." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const clientOrders: Order[] = Array.isArray(body?.orders) ? body.orders : [];

    // Find orders eligible for manifestation:
    // 1. Explicitly passed in body, OR
    // 2. Orders in sharedServerOrders that have failed or mock 'DLHV' AWBs
    let candidateOrders: Order[] = [];

    if (clientOrders.length > 0) {
      candidateOrders = clientOrders;
    } else {
      candidateOrders = sharedServerOrders.filter(
        (o) =>
          o.delhiveryStatus === "Failed" ||
          o.delhiveryStatus === "Pending" ||
          !o.awbNumber ||
          o.awbNumber.startsWith("DLHV")
      );
    }

    if (candidateOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All orders are already manifested with official Delhivery AWBs.",
        manifestedCount: 0,
        failedCount: 0,
        results: [],
      });
    }

    const results: Array<{
      orderId: string;
      success: boolean;
      waybill?: string;
      error?: string;
      pickupLocation?: string;
    }> = [];

    let manifestedCount = 0;
    let failedCount = 0;

    for (const order of candidateOrders) {
      try {
        const shipmentRes = await createDelhiveryShipment({
          id: order.id,
          total: order.total,
          paymentMode: order.paymentMode || "Prepaid",
          items: order.items,
          shippingAddress: {
            fullName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zipCode: order.shippingAddress.zipCode,
            addressType: order.shippingAddress.addressType,
          },
        });

        if (shipmentRes.success && shipmentRes.waybill && !shipmentRes.simulated) {
          manifestedCount++;

          // Update in-memory registry (Manifested from admin -> Order Accepted)
          const existing = sharedServerOrders.find((o) => o.id === order.id);
          if (existing) {
            existing.awbNumber = shipmentRes.waybill;
            existing.delhiveryStatus = "Manifested";
            existing.delhiveryError = undefined;
            existing.status = "Order Accepted";
            existing.fulfillmentStatus = "Manifested";
          }

          // Update Supabase if available
          try {
            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
              .from("orders")
              .update({
                awb_number: shipmentRes.waybill,
                status: "Order Accepted",
                fulfillment_status: "Manifested",
                delhivery_status: "Manifested",
                delhivery_error: null,
              })
              .eq("id", order.id);
          } catch {}

          results.push({
            orderId: order.id,
            success: true,
            waybill: shipmentRes.waybill,
            pickupLocation: shipmentRes.pickupLocation,
          });
        } else {
          failedCount++;
          const err = shipmentRes.error || "Manifestation rejected by Delhivery.";

          // Update in-memory registry
          const existing = sharedServerOrders.find((o) => o.id === order.id);
          if (existing) {
            existing.delhiveryStatus = "Failed";
            existing.delhiveryError = err;
            if (existing.status !== "Cancelled") {
              existing.status = "Order Placed";
              existing.fulfillmentStatus = "Unfulfilled";
            }
          }

          // Update Supabase if available
          try {
            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
              .from("orders")
              .update({
                status: "Order Placed",
                fulfillment_status: "Unfulfilled",
                delhivery_status: "Failed",
                delhivery_error: err,
              })
              .eq("id", order.id);
          } catch {}

          results.push({
            orderId: order.id,
            success: false,
            error: err,
          });
        }
      } catch (err: any) {
        failedCount++;
        results.push({
          orderId: order.id,
          success: false,
          error: err?.message || "Connection error during manifestation.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: candidateOrders.length,
      manifestedCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    console.error("[Bulk Manifest Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute bulk manifestation process." },
      { status: 500 }
    );
  }
}
