import { NextRequest, NextResponse } from "next/server";
import { createSMEPayOrder } from "@/lib/smePay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload provided." },
        { status: 400 }
      );
    }
    const { amount, customer_email, customer_name, customer_phone, order_id, callback_url } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid order amount is required." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const finalCallbackUrl = callback_url || `${origin}/order-success`;

    const result = await createSMEPayOrder({
      amount,
      customerEmail: customer_email || "customer@beadu.in",
      customerName: customer_name,
      customerPhone: customer_phone,
      orderId: order_id,
      callbackUrl: finalCallbackUrl,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[SMEPay create-order error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate payment." },
      { status: 500 }
    );
  }
}
