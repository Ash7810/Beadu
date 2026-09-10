import { NextRequest, NextResponse } from "next/server";
import { checkDelhiveryServiceability, fetchLivePincodeData } from "@/lib/delhivery";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = (searchParams.get("pin") || "").trim().replace(/\D/g, "");

  if (!/^[1-9]\d{5}$/.test(pin)) {
    return NextResponse.json(
      {
        success: false,
        message: "Please enter a valid PIN code.",
      },
      { status: 400 }
    );
  }

  // Check live Delhivery One API if credentials are provided in environment
  const delhiveryToken = process.env.DELHIVERY_API_KEY;
  if (delhiveryToken) {
    try {
      const res = await fetch(`https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`, {
        headers: {
          Authorization: `Token ${delhiveryToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const info = data?.delivery_codes?.[0]?.postal_code;
        if (info) {
          const city = info.district || info.city || "";
          const state = info.state_code || "";
          if (city && state) {
            return NextResponse.json({
              success: true,
              pincode: pin,
              city,
              state,
              serviceable: true,
              courier: "Express Delivery",
              estimatedDays: 2,
              codAvailable: info.cod === "Y",
              source: "delhivery_api",
            });
          }
        }
      }
    } catch {
      // Fallback gracefully
    }
  }

  // Live India Post lookup
  const livePostalData = await fetchLivePincodeData(pin);
  if (livePostalData && livePostalData.city && livePostalData.state) {
    const serviceability = checkDelhiveryServiceability(pin);
    return NextResponse.json({
      success: true,
      pincode: pin,
      city: livePostalData.city,
      state: livePostalData.state,
      district: livePostalData.district,
      serviceable: true,
      courier: serviceability.courierPartner,
      estimatedDays: serviceability.estimatedDays,
      codAvailable: serviceability.codAvailable,
      source: "postal_api",
    });
  }

  // Local fallback engine (instant and reliable)
  const localServiceability = checkDelhiveryServiceability(pin);
  return NextResponse.json({
    success: true,
    pincode: pin,
    city: localServiceability.city,
    state: localServiceability.state,
    serviceable: localServiceability.serviceable,
    courier: localServiceability.courierPartner,
    estimatedDays: localServiceability.estimatedDays,
    codAvailable: localServiceability.codAvailable,
    source: "local_cache",
  });
}
