// Force Turbopack Cache Bust - Addresses
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSSRClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const supabaseClient = await createSSRClient();
    const { data: authData } = await supabaseClient.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("addresses")
      .select("addresses")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, addresses: data?.addresses || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { addresses } = await req.json();

    if (!addresses) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabaseClient = await createSSRClient();
    const { data: authData } = await supabaseClient.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("addresses")
      .upsert({
        user_id: userId,
        addresses,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) {
      console.warn("Addresses Upsert Error", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

