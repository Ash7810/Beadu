"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useEcomStore, Order } from "@/store/ecomStore";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";

const STATUS_COLORS: Record<string, string> = {
  "Order Placed": "bg-blue-100 text-blue-800 border-blue-200",
  "Order Accepted": "bg-amber-100 text-amber-800 border-amber-200",
  "Shipped": "bg-purple-100 text-purple-800 border-purple-200",
  "Delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Cancelled": "bg-red-100 text-red-800 border-red-200",
};

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updateOrderAWB, syncDelhiveryAutoStatuses } = useEcomStore();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    syncDelhiveryAutoStatuses();
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setServerOrders(data.orders);
        }
      })
      .catch(() => {});
  }, [syncDelhiveryAutoStatuses]);

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

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const matchesStatus = selectedStatus === "All" || o.status === selectedStatus;
      const matchesSearch =
        !searchQuery.trim() ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.awbNumber && o.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, selectedStatus, searchQuery]);

  const handleUpdateStatus = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleGenerateAWB = (orderId: string) => {
    const newAwb = `DLHV${Math.floor(100000000 + Math.random() * 900000000)}`;
    updateOrderAWB(orderId, newAwb);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allOrders.length };
    for (const o of allOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [allOrders]);

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground font-normal">
            Orders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orders.length} total orders • {filteredOrders.length} shown
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search order ID, customer, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input w-full py-2 px-3 pl-8 text-xs bg-background"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["All", "Order Placed", "Order Accepted", "Shipped", "Delivered", "Cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
              selectedStatus === st
                ? "bg-foreground text-background shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {st} {statusCounts[st] ? `(${statusCounts[st]})` : "(0)"}
          </button>
        ))}
      </div>

      {/* Orders List — Compact Rows */}
      <div className="clay-panel bg-white overflow-hidden ring-1 ring-black/10">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/40 border-b border-border/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          <div className="col-span-2">Order</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Items</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">AWB</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-2xl">📦</p>
            <h3 className="font-heading text-lg text-foreground">No Orders Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : `No orders with status: ${selectedStatus}`}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const firstItemName = order.items[0]?.product.name || "—";

            return (
              <div key={order.id} className={`border-b border-border/30 last:border-b-0 transition-colors ${isExpanded ? "bg-muted/10" : "hover:bg-muted/5"}`}>
                {/* Compact Row */}
                <div
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-4 py-3 items-center cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {/* Order ID + Date */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <svg className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <p className="text-xs font-bold text-foreground">{order.id}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="md:col-span-2 hidden md:block">
                    <p className="text-xs font-semibold text-foreground truncate">{order.shippingAddress.fullName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  </div>

                  {/* Items Summary */}
                  <div className="md:col-span-2 hidden md:block">
                    <p className="text-xs text-foreground truncate">{firstItemName}</p>
                    <p className="text-[10px] text-muted-foreground">{itemCount} item{itemCount > 1 ? "s" : ""}</p>
                  </div>

                  {/* Total */}
                  <div className="md:col-span-1 hidden md:block">
                    <p className="text-xs font-bold text-foreground">₹{order.total}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="md:col-span-2">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* AWB */}
                  <div className="md:col-span-2 hidden md:block">
                    <p className="text-[11px] font-mono text-primary font-bold truncate">{order.awbNumber}</p>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 hidden md:flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveInvoiceOrder(order)}
                      className="text-[10px] font-bold text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      Invoice
                    </button>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Items ({order.items.length})
                        </h4>
                        {order.items.map((item, idx) => {
                          const isCustom = item.product.id.startsWith("custom") || item.product.category === "Custom Builder";
                          const customBeads = (item.product as any).customBeads || [];
                          const img = item.product.image;
                          return (
                            <div key={idx} className="flex gap-2.5 items-center p-2 rounded-xl bg-muted/20 border border-border/30 text-xs">
                              {isCustom ? (
                                <CustomBraceletPreview beads={customBeads} previewImage={img} size={40} />
                              ) : (
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden border flex-shrink-0">
                                  <Image src={img} alt={item.product.name} fill sizes="36px" className="object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate text-[11px]">{item.product.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {item.quantity} × ₹{item.product.price}
                                  {item.giftWrap && " • 🎁 Gift Wrap"}
                                </p>
                              </div>
                              <span className="font-bold text-foreground text-[11px]">₹{item.product.price * item.quantity}</span>
                            </div>
                          );
                        })}

                        {/* Custom beads blueprint — collapsible */}
                        {order.items.some((item) => item.product.id.startsWith("custom") || item.product.category === "Custom Builder") && (
                          <details className="text-[10px] bg-amber-50 border border-amber-200 rounded-xl p-2">
                            <summary className="font-bold text-amber-900 cursor-pointer">🔨 Assembly Blueprint</summary>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {order.items
                                .filter((item) => item.product.id.startsWith("custom") || item.product.category === "Custom Builder")
                                .flatMap((item) => (item.product as any).customBeads || [])
                                .map((b: any, bIdx: number) => (
                                  <span key={bIdx} className="bg-white border border-amber-200 text-foreground px-1.5 py-0.5 rounded font-mono">
                                    #{bIdx + 1}: {b.name} ({b.widthMm || b.sizeMm || 8}mm)
                                  </span>
                                ))}
                            </div>
                          </details>
                        )}
                      </div>

                      {/* Shipping & Payment */}
                      <div className="space-y-3 text-xs">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Shipping</h4>
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                          <p className="font-bold text-foreground">{order.shippingAddress.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                          </p>
                          <p className="text-[11px] font-semibold text-foreground">📞 {order.shippingAddress.phone}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-1 text-[11px]">
                          <p className="text-muted-foreground">Payment: <strong className="text-foreground">{order.paymentMode}</strong></p>
                          <p className="text-muted-foreground">Ref: <strong className="text-foreground font-mono">{order.transactionId}</strong></p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="space-y-3 text-xs">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Controls</h4>

                        {/* Status update */}
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Update Status</label>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order["status"])}
                            className="clay-input w-full py-1.5 px-2.5 text-xs font-bold bg-background"
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Order Accepted">Order Accepted</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* AWB */}
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 flex justify-between items-center">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-muted-foreground">AWB</span>
                            <span className="font-mono text-[11px] font-bold text-primary">{order.awbNumber}</span>
                          </div>
                          <button
                            onClick={() => handleGenerateAWB(order.id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Re-generate
                          </button>
                        </div>

                        {/* Summary */}
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-1 text-[11px]">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Gift + Platform Fee</span>
                            <span>₹{order.giftWrapFee + order.platformFee}</span>
                          </div>
                          <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/30">
                            <span>Grand Total</span>
                            <span>₹{order.total}</span>
                          </div>
                        </div>

                        {/* Invoice Button */}
                        <button
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-2 rounded-xl border border-border text-[11px]"
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Printable Invoice Modal */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveInvoiceOrder(null)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 z-10 font-sans animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h2 className="font-heading text-2xl text-foreground">Tax Invoice Summary</h2>
                <p className="text-xs text-muted-foreground">Order ID: {activeInvoiceOrder.id}</p>
              </div>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-foreground">Billed To: {activeInvoiceOrder.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">
                {activeInvoiceOrder.shippingAddress.street}, {activeInvoiceOrder.shippingAddress.city},{" "}
                {activeInvoiceOrder.shippingAddress.state} - {activeInvoiceOrder.shippingAddress.zipCode}
              </p>
              <p className="text-muted-foreground">Payment Gateway: {activeInvoiceOrder.paymentMode} ({activeInvoiceOrder.transactionId})</p>
              <p className="text-muted-foreground">Courier: Express Delivery (AWB: {activeInvoiceOrder.awbNumber})</p>
            </div>

            <div className="space-y-2 border-t border-b border-border py-4 text-xs">
              {activeInvoiceOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between font-medium">
                  <span>{item.product.name} (x{item.quantity})</span>
                  <span>₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs font-bold">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>₹{activeInvoiceOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Gift Wrap &amp; Fees:</span>
                <span>₹{activeInvoiceOrder.giftWrapFee + activeInvoiceOrder.platformFee}</span>
              </div>
              <div className="flex justify-between text-foreground text-sm pt-2 border-t border-border">
                <span>Total Paid:</span>
                <span>₹{activeInvoiceOrder.total}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              className="w-full bg-primary text-white text-xs font-bold py-3 rounded-2xl shadow-md"
            >
              Print Invoice Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
