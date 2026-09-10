import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { getAdminSession } from "@/lib/authServer";

// In-memory central stock registry initialized with official catalog stock counts
const centralProductStock: Record<string, number> = {};

function getStockRegistry(): Record<string, number> {
  if (Object.keys(centralProductStock).length === 0) {
    for (const p of PRODUCTS_CATALOG) {
      centralProductStock[p.id] = p.stockQuantity ?? 10;
    }
  }
  return centralProductStock;
}

/**
 * GET /api/stock
 * Returns the live server inventory levels for all products
 */
export async function GET() {
  const stock = getStockRegistry();
  return NextResponse.json({
    success: true,
    stock,
  });
}

/**
 * POST /api/stock
 * Updates or deducts product inventory.
 * If called with { productId, quantity }, requires admin session.
 * If called with { deduct: [{ productId, quantity }] }, deducts stock atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stock = getStockRegistry();

    // 1. Bulk deduction (used during order placement)
    if (Array.isArray(body.deduct)) {
      for (const item of body.deduct) {
        const pId = String(item.productId);
        const qty = Number(item.quantity) || 1;
        if (pId && !pId.startsWith("custom-")) {
          const cur = stock[pId] !== undefined ? stock[pId] : 10;
          stock[pId] = Math.max(0, cur - qty);
        }
      }
      return NextResponse.json({ success: true, stock });
    }

    // 2. Admin direct update
    const session = await getAdminSession();
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication required to update stock." },
        { status: 401 }
      );
    }

    const { productId, quantity } = body;
    if (!productId || typeof quantity !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid productId or quantity." },
        { status: 400 }
      );
    }

    const cleanQty = Math.max(0, parseInt(String(quantity)) || 0);
    stock[productId] = cleanQty;

    return NextResponse.json({
      success: true,
      stock,
      message: `Stock for ${productId} updated to ${cleanQty}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update stock." },
      { status: 500 }
    );
  }
}
