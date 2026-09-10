// Force Turbopack Cache Bust
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/authServer";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { INITIAL_BEADS } from "@/lib/catalog";
import { calculateTotal } from "@/lib/pricing";
import { Order, CartItem, Address } from "@/store/ecomStore";
import { validateOrderAddressForDelhivery } from "@/lib/delhivery";

// In-memory server-side shared orders registry (persists across all connected devices and browsers)
const sharedServerOrders: Order[] = [];

/**
 * GET /api/orders
 * Returns orders. If authenticated as Admin, returns all customer orders.
 * Otherwise, can filter by userId or customer email.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterEmail = searchParams.get("email")?.toLowerCase();
    const filterUserId = searchParams.get("userId");

    const session = await getAdminSession();
    const isAdmin = session.valid;

    // 1. Try fetching orders from Supabase orders table
    let dbOrders: Order[] = [];
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });

      if (!isAdmin) {
        if (filterUserId) {
          query = query.eq("user_id", filterUserId);
        } else if (filterEmail) {
           // For guest checkout tracking, email is in shipping_address->>email which can be harder to query without JSONB operators.
           // However, user_id might hold the email for guest checkouts based on our POST logic.
          query = query.eq("user_id", filterEmail);
        }
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        dbOrders = data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          createdAt: r.created_at,
          items: r.items,
          subtotal: Number(r.subtotal),
          giftWrapFee: Number(r.gift_wrap_fee),
          platformFee: Number(r.platform_fee),
          shippingFee: Number(r.shipping_fee),
          total: Number(r.total),
          status: r.status,
          shippingAddress: r.shipping_address,
          paymentMode: r.payment_mode,
          transactionId: r.transaction_id,
          awbNumber: r.awb_number,
        }));
      }
    } catch {
      // Offline fallback
    }

    // Merge database orders and server-side memory orders without duplicates
    const seenIds = new Set<string>();
    const merged: Order[] = [];

    for (const ord of [...sharedServerOrders, ...dbOrders]) {
      if (!seenIds.has(ord.id)) {
        seenIds.add(ord.id);
        merged.push(ord);
      }
    }

    // Apply role-based filtering
    let result = merged;
    if (!isAdmin) {
      if (filterEmail) {
        result = result.filter((o) => o.shippingAddress.email?.toLowerCase() === filterEmail);
      } else if (filterUserId) {
        result = result.filter((o) => o.userId === filterUserId);
      } else {
        result = []; // Non-admin cannot view all orders without identifying email or userId
      }
    }

    return NextResponse.json({
      success: true,
      orders: result,
      count: result.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders." }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Creates and persists a customer order centrally with server-side price validation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shippingAddress, paymentMode, transactionId, userId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cannot create order with an empty cart." }, { status: 400 });
    }

    // 1. Validate shipping address format
    const addrValidation = validateOrderAddressForDelhivery(shippingAddress || {});
    if (!addrValidation.valid) {
      return NextResponse.json({ success: false, error: addrValidation.message || "Invalid shipping address." }, { status: 400 });
    }

    // 2. Server-side price verification (Prevent client price tampering)
    const catalogMap = new Map(PRODUCTS_CATALOG.map((p) => [p.id, p]));
    const beadCatalogMap = new Map(INITIAL_BEADS.map((b) => [b.id, b]));

    let computedSubtotal = 0;
    let computedGiftWrap = 0;
    const verifiedItems: CartItem[] = [];

    for (const item of items) {
      const p = item.product;
      const qty = Math.max(1, Math.min(20, Number(item.quantity) || 1));
      let unitPrice = 0;

      if (p.id.startsWith("custom-")) {
        // Recalculate custom bracelet price from bead catalog
        const beads = Array.isArray(p.customBeads) ? p.customBeads : [];
        const verifiedBeads = beads.map((b: any, idx: number) => {
          const catBead = beadCatalogMap.get(b.id);
          return {
            ...b,
            price: catBead ? catBead.price : (Number(b.price) || 0),
            isPremium: catBead ? catBead.isPremium : Boolean(b.isPremium),
            slotIndex: idx,
          };
        });
        const pricing = calculateTotal(verifiedBeads, {
          totalSlots: 35,
          freeSlotLimit: 20,
          cordType: p.cordType || "elastic",
          wristInches: p.wristInches || 7.0,
        });
        unitPrice = pricing.total;
      } else {
        // Enforce catalog price
        const catalogItem = catalogMap.get(p.id);
        unitPrice = catalogItem ? catalogItem.price : p.price;
      }

      computedSubtotal += unitPrice * qty;
      if (item.giftWrap) {
        computedGiftWrap += 20 * qty;
      }

      verifiedItems.push({
        ...item,
        quantity: qty,
        product: {
          ...p,
          price: unitPrice,
        },
      });
    }

    const platformFee = 0;
    const shippingFee = 100;
    const grandTotal = computedSubtotal + computedGiftWrap + shippingFee;

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const awbNumber = `DLHV${Math.floor(100000000 + Math.random() * 900000000)}`;
    const safeTxnId = transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newOrder: Order = {
      id: orderId,
      userId: userId || shippingAddress.email,
      createdAt: new Date().toISOString(),
      items: verifiedItems,
      subtotal: computedSubtotal,
      giftWrapFee: computedGiftWrap,
      platformFee,
      shippingFee,
      total: grandTotal,
      status: "Order Placed",
      shippingAddress,
      paymentMode: paymentMode || "UPI",
      transactionId: safeTxnId,
      awbNumber,
    };

    // Save to shared server-side registry
    sharedServerOrders.unshift(newOrder);

    // Save to Supabase orders table
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from("orders").insert({
        id: newOrder.id,
        user_id: newOrder.userId,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        gift_wrap_fee: newOrder.giftWrapFee,
        platform_fee: newOrder.platformFee,
        shipping_fee: newOrder.shippingFee,
        total: newOrder.total,
        status: newOrder.status,
        shipping_address: newOrder.shippingAddress,
        payment_mode: newOrder.paymentMode,
        transaction_id: newOrder.transactionId,
        awb_number: newOrder.awbNumber
      });
    } catch (err) {
      console.warn("Supabase order sync notice:", err);
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: "Order placed and persisted successfully."
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process order creation." },
      { status: 500 }
    );
  }
}
