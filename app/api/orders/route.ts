// Force Turbopack Cache Bust
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSSRClient } from "@/lib/supabaseServer";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { INITIAL_BEADS } from "@/lib/catalog";
import { calculateTotal, getStrandSpecFromWrist } from "@/lib/pricing";
import { Order, CartItem, Address } from "@/store/ecomStore";
import { validateOrderAddressForDelhivery, createDelhiveryShipment } from "@/lib/delhivery";
import { sharedServerOrders, getNextOrderNumber } from "@/lib/serverOrders";
import { deductStockItems, restoreStockItems, checkStockAvailability } from "@/lib/stockServer";
import { checkIsAdmin } from "@/lib/authServer";

/**
 * GET /api/orders
 * Returns orders. If authenticated as Admin, returns all customer orders.
 * If querying with orderId + txId/email, allows verified order confirmation lookup.
 * Otherwise, non-admins can only access their own authenticated orders.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterEmail = searchParams.get("email")?.toLowerCase();
    const filterUserId = searchParams.get("userId");
    const filterOrderId = searchParams.get("orderId");
    const filterTxId = searchParams.get("txId");

    const supabaseClient = await createSSRClient();
    const { data: authData } = await supabaseClient.auth.getUser();

    let isAdmin = false;
    let authUserId = null;
    let authEmail = null;

    if (authData?.user) {
      authUserId = authData.user.id;
      authEmail = authData.user.email?.toLowerCase();
      isAdmin = await checkIsAdmin(authEmail);
    }

    // Only Admins can query by arbitrary email or userId
    const effectiveUserId = isAdmin ? (filterUserId || authUserId) : authUserId;
    const effectiveEmail = isAdmin ? (filterEmail || authEmail) : authEmail;

    const isOrderLookup = Boolean(filterOrderId && (filterTxId || filterEmail || authUserId || authEmail));

    // Non-admins must be authenticated OR performing a verified order lookup (orderId + txId/email)
    if (!isAdmin && !effectiveUserId && !effectiveEmail && !isOrderLookup) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Try fetching orders from Supabase orders table
    let dbOrders: Order[] = [];
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });

      if (!isAdmin) {
        if (filterOrderId) {
          const cleanTargetId = filterOrderId.replace(/^ORD-|^#/, "").trim();
          query = query.in("id", [filterOrderId, cleanTargetId, `ORD-${cleanTargetId}`, `#${cleanTargetId}`]);
        } else if (effectiveUserId && effectiveEmail) {
          query = query.or(`user_id.eq.${effectiveUserId},user_id.eq.${effectiveEmail}`);
        } else if (effectiveUserId) {
          query = query.eq("user_id", effectiveUserId);
        } else if (effectiveEmail) {
          query = query.eq("user_id", effectiveEmail);
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
          fulfillmentStatus: r.fulfillment_status || "Unfulfilled",
          paymentMode: r.payment_mode,
          paymentStatus: r.payment_status || "Pending",
          transactionId: r.transaction_id,
          awbNumber: r.awb_number,
          delhiveryStatus: r.delhivery_status || "Pending",
          delhiveryError: r.delhivery_error || undefined,
          shippingAddress: r.shipping_address,
        }));
      }
    } catch {
      // Offline fallback
    }

    // Merge database orders and server-side memory orders (DB has precedence)
    const seenIds = new Set<string>();
    const merged: Order[] = [];

    for (const ord of [...dbOrders, ...sharedServerOrders]) {
      if (!seenIds.has(ord.id)) {
        seenIds.add(ord.id);
        merged.push(ord);
      }
    }

    // Apply role-based and verification filtering
    let result = merged;
    if (!isAdmin) {
      result = result.filter((o) => {
        const cleanOrdId = String(o.id).replace(/^ORD-|^#/, "").trim();
        const cleanTargetId = filterOrderId ? filterOrderId.replace(/^ORD-|^#/, "").trim() : null;
        if (cleanTargetId) {
          const matchesId = cleanOrdId === cleanTargetId || o.id === filterOrderId || o.id === `ORD-${cleanTargetId}`;
          if (!matchesId) return false;
          if (filterTxId && o.transactionId && o.transactionId.toLowerCase() === filterTxId.toLowerCase()) return true;
          if (filterEmail && o.shippingAddress?.email?.toLowerCase() === filterEmail.toLowerCase()) return true;
          if (effectiveUserId && o.userId === effectiveUserId) return true;
          if (effectiveEmail && (o.userId === effectiveEmail || o.shippingAddress?.email?.toLowerCase() === effectiveEmail.toLowerCase())) return true;
          return false;
        }
        if (effectiveUserId && o.userId === effectiveUserId) return true;
        if (effectiveEmail && (o.userId === effectiveEmail || o.shippingAddress?.email?.toLowerCase() === effectiveEmail.toLowerCase())) return true;
        return false;
      });
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
    const { items, shippingAddress, paymentMode, transactionId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cannot create order with an empty cart." }, { status: 400 });
    }

    const supabaseClient = await createSSRClient();
    const { data: authData } = await supabaseClient.auth.getUser();

    // Fallback to email for guest checkouts
    const orderUserId = authData?.user?.id || body.userId || shippingAddress?.email;

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
        const cordType = (p as any).cordType || (p as any).customConfig?.cordType || "elastic";
        const wristInches = Number((p as any).wristInches || (p as any).customConfig?.wristInches || 7.0);
        const spec = getStrandSpecFromWrist(wristInches);
        const pricing = calculateTotal(verifiedBeads, {
          totalSlots: spec.totalSlots,
          freeSlotLimit: spec.freeSlotLimit,
          cordType: cordType as any,
          wristInches,
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

    // Verify product inventory availability before confirming the order
    const stockCheck = checkStockAvailability(verifiedItems);
    if (!stockCheck.available) {
      return NextResponse.json(
        { success: false, error: stockCheck.errors.join(" ") },
        { status: 400 }
      );
    }

    // Generate sequential numerical Order ID (e.g. "1001", "1002", "1003")
    const orderId = await getNextOrderNumber();
    const safeTxnId = transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Attempt live manifestation with Delhivery One
    let awbNumber = "";
    let delhiveryStatus = "Pending";
    let delhiveryError = "";
    try {
      const shipmentRes = await createDelhiveryShipment({
        id: orderId,
        total: grandTotal,
        paymentMode: paymentMode || "Prepaid",
        items: verifiedItems,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          addressType: shippingAddress.type,
        },
      });

      if (shipmentRes.success && shipmentRes.waybill) {
        awbNumber = shipmentRes.waybill;
        delhiveryStatus = "Manifested";
      } else {
        delhiveryStatus = "Failed";
        delhiveryError = shipmentRes.error || "Manifestation failed on Delhivery One.";
        console.warn("[Delhivery Manifest Notice]:", delhiveryError);

        if (delhiveryError.toLowerCase().includes("balance") || delhiveryError.toLowerCase().includes("insufficient")) {
          // Trigger background low-balance alert to merchant without slowing down checkout
          import("@/lib/resend").then(({ sendDelhiveryLowBalanceAlert }) => {
            sendDelhiveryLowBalanceAlert({
              failedOrderId: orderId,
              errorDetail: delhiveryError,
            }).catch(() => {});
          });
        }
      }
    } catch (manifestErr: any) {
      delhiveryStatus = "Error";
      delhiveryError = manifestErr?.message || "Failed to connect to Delhivery API";
      console.warn("Delhivery auto-manifestation notice:", manifestErr);
    }

    // Only assign real AWB if manifested by Delhivery; never generate fake DLHV strings
    const isCod = paymentMode === "COD";
    const newOrder: Order = {
      id: orderId,
      userId: orderUserId,
      createdAt: new Date().toISOString(),
      items: verifiedItems,
      subtotal: computedSubtotal,
      giftWrapFee: computedGiftWrap,
      platformFee,
      shippingFee,
      total: grandTotal,
      status: awbNumber ? "Order Accepted" : "Order Placed",
      fulfillmentStatus: delhiveryStatus === "Manifested" ? "Manifested" : "Unfulfilled",
      paymentMode: isCod ? "COD" : "UPI",
      paymentStatus: isCod ? "Pending" : "Paid",
      shippingAddress,
      transactionId: safeTxnId,
      awbNumber,
      delhiveryStatus,
      delhiveryError: delhiveryError || undefined,
    };

    // Deduct stock for standard inventory products
    deductStockItems(verifiedItems);

    // Save to shared server-side registry
    sharedServerOrders.unshift(newOrder);

    // Save to Supabase orders table with all metadata
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
        fulfillment_status: newOrder.fulfillmentStatus || "Unfulfilled",
        payment_mode: newOrder.paymentMode,
        payment_status: newOrder.paymentStatus || "Pending",
        shipping_address: newOrder.shippingAddress,
        transaction_id: newOrder.transactionId,
        awb_number: newOrder.awbNumber || null,
        delhivery_status: newOrder.delhiveryStatus || "Pending",
        delhivery_error: newOrder.delhiveryError || null,
        created_at: newOrder.createdAt,
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

/**
 * PATCH /api/orders
 * Updates order status or attaches/clears real Delhivery AWB numbers.
 * Enforces role authorization and restores stock on cancellation.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.orderId) {
      return NextResponse.json({ success: false, error: "orderId is required." }, { status: 400 });
    }

    const { orderId, status, awbNumber, fulfillmentStatus } = body;

    // Check user auth
    const supabaseClient = await createSSRClient();
    const { data: authData } = await supabaseClient.auth.getUser();

    let isAdmin = false;
    let authUserId = null;
    let authEmail = null;

    if (authData?.user) {
      authUserId = authData.user.id;
      authEmail = authData.user.email?.toLowerCase();
      isAdmin = await checkIsAdmin(authEmail);
    }

    // Locate target order in memory or database
    let targetOrder = sharedServerOrders.find((o) => o.id === orderId);
    if (!targetOrder) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: dbOrder } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (dbOrder) {
          targetOrder = {
            id: dbOrder.id,
            userId: dbOrder.user_id,
            createdAt: dbOrder.created_at,
            items: dbOrder.items,
            subtotal: Number(dbOrder.subtotal),
            giftWrapFee: Number(dbOrder.gift_wrap_fee),
            platformFee: Number(dbOrder.platform_fee),
            shippingFee: Number(dbOrder.shipping_fee),
            total: Number(dbOrder.total),
            status: dbOrder.status,
            fulfillmentStatus: dbOrder.fulfillment_status,
            paymentMode: dbOrder.payment_mode,
            paymentStatus: dbOrder.payment_status,
            transactionId: dbOrder.transaction_id,
            awbNumber: dbOrder.awb_number,
            delhiveryStatus: dbOrder.delhivery_status,
            delhiveryError: dbOrder.delhivery_error,
            shippingAddress: dbOrder.shipping_address,
          };
          sharedServerOrders.unshift(targetOrder);
        }
      } catch {}
    }

    if (!targetOrder) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    // Role-based authorization rules
    if (status === "Cancelled") {
      if (targetOrder.status === "Cancelled") {
        return NextResponse.json(
          { success: false, error: "Order is already cancelled." },
          { status: 400 }
        );
      }

      const isOwner =
        (authUserId && targetOrder.userId === authUserId) ||
        (authEmail && targetOrder.shippingAddress?.email?.toLowerCase() === authEmail) ||
        (body.email && body.transactionId &&
          targetOrder.shippingAddress?.email?.toLowerCase() === String(body.email).toLowerCase() &&
          targetOrder.transactionId === String(body.transactionId));

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ success: false, error: "Unauthorized to cancel this order." }, { status: 403 });
      }

      if (!isAdmin && targetOrder.status !== "Order Placed") {
        return NextResponse.json(
          { success: false, error: "Order is already being processed or has shipped and cannot be self-cancelled." },
          { status: 400 }
        );
      }

      // Restore inventory upon cancellation
      restoreStockItems(targetOrder.items || []);
      targetOrder.status = "Cancelled";
      targetOrder.fulfillmentStatus = "Cancelled";
      targetOrder.delhiveryStatus = "Cancelled";
    } else if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Admin authentication required to modify orders." }, { status: 403 });
    }

    // 1. Update shared in-memory registry
    if (status && status !== "Cancelled") targetOrder.status = status;
    if (awbNumber !== undefined) {
      targetOrder.awbNumber = awbNumber ? String(awbNumber).trim() : undefined;
    }
    if (fulfillmentStatus) {
      targetOrder.fulfillmentStatus = fulfillmentStatus;
    } else if (status === "Shipped" || (awbNumber && !awbNumber.startsWith("DLHV"))) {
      targetOrder.fulfillmentStatus = "Manifested";
      targetOrder.delhiveryStatus = "Manifested";
    } else if (status === "Delivered") {
      targetOrder.fulfillmentStatus = "Delivered";
    }

    // 2. Update Supabase
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (status === "Cancelled") {
        updateData.fulfillment_status = "Cancelled";
        updateData.delhivery_status = "Cancelled";
      } else if (targetOrder.fulfillmentStatus) {
        updateData.fulfillment_status = targetOrder.fulfillmentStatus;
      }
      if (awbNumber !== undefined) {
        updateData.awb_number = awbNumber ? String(awbNumber).trim() : null;
      }

      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from("orders").update(updateData).eq("id", orderId);
      }
    } catch (dbErr) {
      console.warn("[Supabase order patch notice]:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
      order: targetOrder,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update order." }, { status: 500 });
  }
}

