import { PRODUCTS_CATALOG } from "@/lib/ecomData";

// Central stock registry initialized with official catalog stock counts
const centralProductStock: Record<string, number> = {};

export function getStockRegistry(): Record<string, number> {
  if (Object.keys(centralProductStock).length === 0) {
    for (const p of PRODUCTS_CATALOG) {
      centralProductStock[p.id] = p.stockQuantity ?? 10;
    }
  }
  return centralProductStock;
}

/**
 * Validates stock availability prior to order placement to prevent overselling.
 */
export function checkStockAvailability(items: Array<{ product: { id: string; name?: string }; quantity: number }>): {
  available: boolean;
  errors: string[];
} {
  const stock = getStockRegistry();
  const errors: string[] = [];

  for (const item of items) {
    const pId = item.product?.id;
    const qty = Number(item.quantity) || 1;
    if (pId && !pId.startsWith("custom-")) {
      const cur = stock[pId] !== undefined ? stock[pId] : 10;
      const itemName = item.product?.name || `Product (${pId})`;
      if (cur <= 0) {
        errors.push(`"${itemName}" is currently out of stock.`);
      } else if (qty > cur) {
        errors.push(`Only ${cur} unit(s) of "${itemName}" available (you requested ${qty}).`);
      }
    }
  }

  return {
    available: errors.length === 0,
    errors,
  };
}

function adjustStockItems(items: Array<{ product: { id: string }; quantity: number }>, multiplier: number) {
  const stock = getStockRegistry();
  for (const item of items) {
    const pId = item.product?.id;
    const qty = Number(item.quantity) || 1;
    if (pId && !pId.startsWith("custom-")) {
      const cur = stock[pId] !== undefined ? stock[pId] : 10;
      stock[pId] = Math.max(0, cur + qty * multiplier);
    }
  }
}

export function deductStockItems(items: Array<{ product: { id: string }; quantity: number }>) {
  adjustStockItems(items, -1);
}

export function restoreStockItems(items: Array<{ product: { id: string }; quantity: number }>) {
  adjustStockItems(items, 1);
}
