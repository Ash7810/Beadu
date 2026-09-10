import { NextRequest, NextResponse } from "next/server";
import { createDelhiveryShipment } from "@/lib/delhivery";

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Delhivery create-shipment error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shipment manifest with courier partner." },
      { status: 500 }
    );
  }
}
