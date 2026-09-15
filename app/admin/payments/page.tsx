"use client";

import { useState, useEffect, useMemo } from "react";
import { useEcomStore, Order } from "@/store/ecomStore";

export default function AdminPaymentsPage() {
  const { orders } = useEcomStore();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.orders)) {
          setServerOrders(d.orders);
        }
      })
      .catch(() => {});
  }, []);

  const allOrders = useMemo(() => {
    const seen = new Set<string>();
    const combined: Order[] = [];
    for (const o of [...serverOrders, ...orders]) {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        combined.push(o);
      }
    }
    return combined;
  }, [serverOrders, orders]);

  const paidOrders = allOrders.filter(
    (o) => o.status !== "Cancelled" && (o.paymentStatus === "Paid" || o.paymentMode !== "COD")
  );
  const totalCollected = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingCodTotal = allOrders
    .filter((o) => o.paymentMode === "COD" && o.status !== "Cancelled" && o.status !== "Delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const upiCount = allOrders.filter((o) => o.paymentMode.includes("UPI") && o.status !== "Cancelled").length;
  const codCount = allOrders.filter((o) => o.paymentMode === "COD" && o.status !== "Cancelled").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground font-normal">
            Payment Gateway Transactions Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time UPI gateway payment authorizations and Cash on Delivery logs
          </p>
        </div>

        <div className="bg-green-100 text-green-800 text-xs font-bold px-4 py-2 rounded-xl">
          Instant Gateway Active ✓
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 tabular-nums">
        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Prepaid Revenue Collected</span>
          <p className="text-2xl font-bold text-foreground">₹{totalCollected.toLocaleString("en-IN")}</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">UPI Online Payments</span>
          <p className="text-2xl font-bold text-primary">{upiCount} Txns</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Pending COD Collection</span>
          <p className="text-2xl font-bold text-amber-700">₹{pendingCodTotal.toLocaleString("en-IN")}</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg Order Value</span>
          <p className="text-2xl font-bold text-foreground">
            ₹{allOrders.length > 0 ? Math.round(totalCollected / Math.max(1, paidOrders.length)).toLocaleString("en-IN") : "0"}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="clay-panel p-6 bg-white space-y-4 ring-1 ring-black/10 tabular-nums">
        <h3 className="font-heading text-xl text-foreground pb-2 border-b border-border/40">
          Payment Authorization Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2">Order ID</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Gateway Mode</th>
                <th className="py-3 px-2">Transaction Ref</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {allOrders.map((order) => {
                const isCod = order.paymentMode === "COD";
                const isCancelled = order.status === "Cancelled";
                const isDelivered = order.status === "Delivered";

                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-bold text-foreground font-mono">#{String(order.id).replace(/^ORD-|^#/, "")}</td>
                    <td className="py-3 px-2 text-foreground font-medium">{order.shippingAddress?.fullName}</td>
                    <td className="py-3 px-2 text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCod ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}>
                        {order.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-primary">{order.transactionId || "—"}</td>
                    <td className="py-3 px-2 font-bold text-foreground">₹{order.total}</td>
                    <td className="py-3 px-2">
                      {isCancelled ? (
                        <span className="bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          Cancelled
                        </span>
                      ) : isCod ? (
                        isDelivered ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            Collected at Delivery ✓
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            Pay on Delivery
                          </span>
                        )
                      ) : (
                        <span className="bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          Captured ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
