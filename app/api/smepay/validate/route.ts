import { NextRequest, NextResponse } from "next/server";
import { validateSMEPayOrder } from "@/lib/smePay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { verified: false, error: "Invalid JSON payload provided." },
        { status: 400 }
      );
    }
    const { slug, amount } = body;

    if (!slug) {
      return NextResponse.json(
        { verified: false, error: "Order slug is required for payment verification." },
        { status: 400 }
      );
    }

    const result = await validateSMEPayOrder({
      orderSlug: slug,
      amount: Number(amount) || 0,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[SMEPay validate error]:", error);
    return NextResponse.json(
      { verified: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
