import { NextRequest, NextResponse } from "next/server";
import { getStockRegistry } from "@/lib/stockServer";

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

    const { getAuthenticatedAdmin } = await import("@/lib/authServer");
    const { isAdmin } = await getAuthenticatedAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication required to update stock." },
        { status: 403 }
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


