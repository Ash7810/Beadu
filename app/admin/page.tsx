"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useEcomStore, Order } from "@/store/ecomStore";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";

const STATUS_BADGE: Record<string, string> = {
  "Order Placed": "bg-blue-100 text-blue-800",
  "Order Accepted": "bg-amber-100 text-amber-800",
  "Shipped": "bg-purple-100 text-purple-800",
  "Delivered": "bg-emerald-100 text-emerald-800",
  "Cancelled": "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const { orders, getProductStock } = useEcomStore();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setServerOrders(data.orders);
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

  // Exclude cancelled orders from gross sales revenue
  const validOrders = allOrders.filter((o) => o.status !== "Cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = validOrders.filter((o) => o.status === "Order Placed" || o.status === "Order Accepted").length;
  const shippedOrders = validOrders.filter((o) => o.status === "Shipped").length;
  const lowStockCount = PRODUCTS_CATALOG.filter((p) => getProductStock(p.id) <= 4).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Dashboard Top Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground font-normal">
            E-Commerce Executive Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time platform metrics for www.beadu.in
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <Link
            href="/admin/orders"
            className="bg-primary text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-primary/90"
          >
            Manage Orders ({allOrders.length})
          </Link>
          <Link
            href="/admin/beads"
            className="bg-muted border border-border text-foreground font-bold px-4 py-2 rounded-xl hover:bg-muted/80"
          >
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Total Sales Revenue</span>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-green-700 font-semibold">Excluding Cancelled Orders</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Total Customer Orders</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{allOrders.length}</p>
          <p className="text-[10px] text-amber-700 font-semibold">{pendingOrders} Pending Fulfillment</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Catalog &amp; Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{PRODUCTS_CATALOG.length}</p>
          <p className={`text-[10px] font-semibold ${lowStockCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
            {lowStockCount > 0 ? `${lowStockCount} Low / Out of Stock` : "All items healthy stock"}
          </p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Express Logistics Active</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{shippedOrders}</p>
          <p className="text-[10px] text-primary font-semibold">Live AWB Tracking Enabled</p>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/orders" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Order Fulfillment</h3>
          <p className="text-xs text-muted-foreground mt-1">Review orders, update status, assign tracking AWBs.</p>
        </Link>

        <Link href="/admin/beads" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Inventory CRUD</h3>
          <p className="text-xs text-muted-foreground mt-1">Add/Edit beads, set prices, materials, categories &amp; stock.</p>
        </Link>

        <Link href="/admin/logistics" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Logistics &amp; Dispatch</h3>
          <p className="text-xs text-muted-foreground mt-1">Manifests, AWB dispatches, PIN code coverage tool.</p>
        </Link>

        <Link href="/admin/payments" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Payments Ledger</h3>
          <p className="text-xs text-muted-foreground mt-1">UPI and online transaction logs.</p>
        </Link>
      </div>

      {/* Recent Orders Overview Table */}
      <div className="clay-panel p-6 bg-white space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border/40">
          <h3 className="font-heading text-xl text-foreground">Recent Customer Transactions</h3>
          <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2">Order ID</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Items</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Payment Mode</th>
                <th className="py-3 px-2">Tracking AWB</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {allOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-bold text-foreground font-mono">#{String(order.id).replace(/^ORD-|^#/, "")}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{order.shippingAddress.fullName}</td>
                  <td className="py-3 px-2 text-muted-foreground">{order.items.length} items</td>
                  <td className="py-3 px-2 font-bold text-foreground">₹{order.total}</td>
                  <td className="py-3 px-2 text-muted-foreground">{order.paymentMode}</td>
                  <td className="py-3 px-2 font-mono text-[11px] text-primary">
                    {order.awbNumber && !order.awbNumber.startsWith("DLHV") ? order.awbNumber : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`${STATUS_BADGE[order.status] || "bg-stone-100 text-stone-800"} font-bold px-2.5 py-0.5 rounded-full text-[10px]`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
