import { NextRequest, NextResponse } from "next/server";
import { fetchLiveDelhiveryTrackingAPI, generateDelhiveryTracking } from "@/lib/delhivery";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const awb = (searchParams.get("awb") || "").trim();
  const orderId = (searchParams.get("orderId") || "").trim();

  if (!awb) {
    return NextResponse.json(
      { success: false, error: "AWB / Waybill number is required." },
      { status: 400 }
    );
  }

  // Sanitize AWB against injection
  if (!/^[a-zA-Z0-9_-]{5,40}$/.test(awb)) {
    return NextResponse.json(
      { success: false, error: "Invalid AWB format." },
      { status: 400 }
    );
  }

  try {
    // 1. Try real-time tracking from Delhivery API
    const liveTracking = await fetchLiveDelhiveryTrackingAPI(awb);
    if (liveTracking) {
      return NextResponse.json({
        success: true,
        source: "live_delhivery",
        tracking: liveTracking,
      });
    }

    // 2. Fallback to progression engine if waybill is newly generated or not yet indexed by Delhivery
    const fallbackTracking = generateDelhiveryTracking(orderId || awb, undefined, awb);
    return NextResponse.json({
      success: true,
      source: "progression_engine",
      tracking: fallbackTracking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tracking data." },
      { status: 500 }
    );
  }
}
