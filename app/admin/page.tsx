"use client";

import Link from "next/link";
import { useEcomStore } from "@/store/ecomStore";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";

export default function AdminDashboardPage() {
  const { orders, getProductStock } = useEcomStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Order Placed" || o.status === "Order Accepted").length;
  const shippedOrders = orders.filter((o) => o.status === "Shipped").length;
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
            Manage Orders ({orders.length})
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
          <p className="text-[10px] text-green-700 font-semibold">100% Verified via SME Pay</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Total Customer Orders</span>
            <span className="text-xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{orders.length}</p>
          <p className="text-[10px] text-amber-700 font-semibold">{pendingOrders} Pending Fulfillment</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Catalog & Inventory</span>
            <span className="text-xl">📿</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{PRODUCTS_CATALOG.length}</p>
          <p className={`text-[10px] font-semibold ${lowStockCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
            {lowStockCount > 0 ? `⚠️ ${lowStockCount} Low / Out of Stock` : "✓ All items healthy stock"}
          </p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Express Logistics Active</span>
            <span className="text-xl">🚚</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{shippedOrders}</p>
          <p className="text-[10px] text-primary font-semibold">Live AWB Tracking Enabled</p>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/orders" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="text-2xl mb-2">🧾</div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Order Fulfillment</h3>
          <p className="text-xs text-muted-foreground mt-1">Review orders, update status, assign tracking AWBs.</p>
        </Link>

        <Link href="/admin/beads" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="text-2xl mb-2">🎨</div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Inventory CRUD</h3>
          <p className="text-xs text-muted-foreground mt-1">Add/Edit beads, set prices, materials, categories & stock.</p>
        </Link>

        <Link href="/admin/logistics" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="text-2xl mb-2">🚚</div>
          <h3 className="font-heading text-lg text-foreground group-hover:text-primary">Logistics &amp; Dispatch</h3>
          <p className="text-xs text-muted-foreground mt-1">Manifests, AWB dispatches, PIN code coverage tool.</p>
        </Link>

        <Link href="/admin/payments" className="clay-panel p-5 bg-white shadow-sm group">
          <div className="text-2xl mb-2">💳</div>
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
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-bold text-foreground">{order.id}</td>
                  <td className="py-3 px-2 font-medium text-foreground">{order.shippingAddress.fullName}</td>
                  <td className="py-3 px-2 text-muted-foreground">{order.items.length} items</td>
                  <td className="py-3 px-2 font-bold text-foreground">₹{order.total}</td>
                  <td className="py-3 px-2 text-muted-foreground">{order.paymentMode}</td>
                  <td className="py-3 px-2 font-mono text-[11px] text-primary">{order.awbNumber}</td>
                  <td className="py-3 px-2">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
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
