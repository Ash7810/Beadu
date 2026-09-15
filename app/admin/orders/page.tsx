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
  const { orders, updateOrderStatus, updateOrderAWB, syncDelhiveryAutoStatuses, addToast } = useEcomStore();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [manifestingId, setManifestingId] = useState<string | null>(null);

  useEffect(() => {
    syncDelhiveryAutoStatuses();
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setServerOrders(data.orders);
        }
      })
      .catch(() => { });
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
    const cleanSearch = searchQuery.trim().toLowerCase().replace(/^#/, "");
    return allOrders.filter((o) => {
      const matchesStatus = selectedStatus === "All" || o.status === selectedStatus;
      const cleanOrderId = o.id.toLowerCase().replace(/^#|^ord-/, "");
      const matchesSearch =
        !cleanSearch ||
        o.id.toLowerCase().includes(cleanSearch) ||
        cleanOrderId.includes(cleanSearch) ||
        o.shippingAddress.fullName.toLowerCase().includes(cleanSearch) ||
        (o.awbNumber && o.awbNumber.toLowerCase().includes(cleanSearch));
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, selectedStatus, searchQuery]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    // 1. Optimistic state updates
    updateOrderStatus(orderId, newStatus);
    setServerOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    // 2. Persist to server & database via PATCH
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Status Updated", `Order ${orderId} updated to "${newStatus}".`, "success");
      } else {
        addToast("Status Warning", data.error || "Failed to persist to database", "warning");
      }
    } catch {
      addToast("Network Notice", "Status updated locally; server offline fallback active.", "info");
    }
  };

  const handleGenerateAWB = async (order: Order) => {
    setManifestingId(order.id);
    try {
      const res = await fetch("/api/delhivery/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (data.success && data.waybill && !data.simulated) {
        updateOrderAWB(order.id, data.waybill);
        updateOrderStatus(order.id, "Order Accepted");
        setServerOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, awbNumber: data.waybill, delhiveryStatus: "Manifested", status: "Order Accepted", delhiveryError: undefined }
              : o
          )
        );
        addToast("Delhivery AWB Assigned", `Waybill: ${data.waybill} — Order Accepted for Dispatch`, "success");
      } else {
        const errorMsg = data.error || "Failed to manifest shipment with Delhivery.";
        addToast("Delhivery Notice", errorMsg, "warning");
        setServerOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, delhiveryStatus: "Failed", status: o.status === "Cancelled" ? "Cancelled" : "Order Placed", delhiveryError: errorMsg }
              : o
          )
        );
      }
    } catch (err: any) {
      addToast("Network Error", err.message || "Failed to reach Delhivery API", "warning");
    } finally {
      setManifestingId(null);
    }
  };

  const [isBulkManifesting, setIsBulkManifesting] = useState(false);

  const unmanifestedOrders = useMemo(() => {
    return allOrders.filter(
      (o) =>
        o.status !== "Cancelled" &&
        o.status !== "Delivered" &&
        (o.delhiveryStatus === "Failed" ||
          o.delhiveryStatus === "Pending" ||
          !o.awbNumber ||
          o.awbNumber.startsWith("DLHV"))
    );
  }, [allOrders]);

  const handleBulkManifest = async () => {
    if (unmanifestedOrders.length === 0) {
      addToast("Logistics Status", "No pending orders require manifestation.", "info");
      return;
    }
    setIsBulkManifesting(true);
    try {
      const res = await fetch("/api/delhivery/bulk-manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: unmanifestedOrders }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.manifestedCount > 0) {
          addToast(
            "Bulk Manifest Complete",
            `Successfully assigned live Delhivery AWBs to ${data.manifestedCount} order(s).`,
            "success"
          );
          fetch("/api/orders")
            .then((r) => r.json())
            .then((d) => {
              if (d.success && Array.isArray(d.orders)) {
                setServerOrders(d.orders);
              }
            });
        }
        if (data.failedCount > 0) {
          const sampleErr = data.results.find((r: any) => !r.success)?.error || "Insufficient wallet balance";
          addToast(
            "Some Manifestations Pending",
            `${data.failedCount} order(s) still waiting: ${sampleErr}`,
            "warning"
          );
        }
      } else {
        addToast("Bulk Manifest Error", data.error || "Failed to process bulk manifestation", "warning");
      }
    } catch (err: any) {
      addToast("Network Error", err.message || "Failed to connect to manifestation service", "warning");
    } finally {
      setIsBulkManifesting(false);
    }
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

      {/* Courier Balance & Manifestation Alert Banner */}
      {unmanifestedOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900">
                {unmanifestedOrders.length} Order{unmanifestedOrders.length > 1 ? "s" : ""} Awaiting Courier Manifestation
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                Customer checkouts are safely secured. If your Delhivery One prepaid wallet balance was depleted, recharge your wallet and manifest in 1-click.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <a
              href="https://one.delhivery.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-amber-900 hover:bg-amber-50 font-bold text-[11px] transition-colors"
            >
              Recharge Wallet ↗
            </a>
            <button
              onClick={handleBulkManifest}
              disabled={isBulkManifesting}
              className="px-3.5 py-1.5 rounded-xl bg-[#792c14] hover:bg-[#68250f] text-white font-bold text-[11px] shadow-xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isBulkManifesting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Manifesting...</span>
                </>
              ) : (
                <span>Manifest All ({unmanifestedOrders.length})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["All", "Order Placed", "Order Accepted", "Shipped", "Delivered", "Cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${selectedStatus === st
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
            <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-heading text-lg text-foreground">No Orders Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : `No orders with status: ${selectedStatus}`}
            </p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
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
                      <p className="text-xs font-bold text-foreground font-mono">#{String(order.id).replace(/^ORD-|^#/, "")}</p>
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
                    {order.awbNumber && !order.awbNumber.startsWith("DLHV") ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span>✓</span>
                        <span className="font-mono">{order.awbNumber}</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                        title={order.delhiveryError || "Awaiting live courier assignment"}
                      >
                        <span>⏳</span>
                        <span>Pending Manifest</span>
                      </span>
                    )}
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
                                  {item.giftWrap && " • Gift Wrap"}
                                </p>
                              </div>
                              <span className="font-bold text-foreground text-[11px]">₹{item.product.price * item.quantity}</span>
                            </div>
                          );
                        })}

                        {/* Custom beads blueprint — collapsible */}
                        {order.items.some((item) => item.product.id.startsWith("custom") || item.product.category === "Custom Builder") && (
                          <details className="text-[10px] bg-amber-50 border border-amber-200 rounded-xl p-2">
                            <summary className="font-bold text-amber-900 cursor-pointer">Assembly Blueprint</summary>
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
                          <p className="text-[11px] font-semibold text-foreground">Phone: {order.shippingAddress.phone}</p>
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
                        {/* Quick 1-Click Workflow Action */}
                        {order.status === "Order Placed" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Order Accepted")}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <span>✓</span>
                            <span>Accept Order (Start Crafting)</span>
                          </button>
                        )}

                        {order.status === "Order Accepted" && (
                          <button
                            onClick={() => handleGenerateAWB(order)}
                            disabled={manifestingId === order.id}
                            className="w-full bg-[#792c14] hover:bg-[#68250f] text-white font-bold py-2 px-3 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                          >
                            <span>{manifestingId === order.id ? "Manifesting..." : "Manifest & Dispatch (Delhivery)"}</span>
                          </button>
                        )}

                        {order.status === "Shipped" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Delivered")}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-[11px] shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <span>✓</span>
                            <span>Mark as Delivered</span>
                          </button>
                        )}

                        {/* Status update selector */}
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Manual Status Override</label>
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
                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-muted-foreground">Delhivery AWB</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-primary">
                                  {order.awbNumber && !order.awbNumber.startsWith("DLHV") ? order.awbNumber : "Awaiting AWB"}
                                </span>
                                {order.awbNumber && !order.awbNumber.startsWith("DLHV") && (
                                  <a
                                    href={`https://www.delhivery.com/track/package/${order.awbNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                                  >
                                    Track ↗
                                  </a>
                                )}
                              </div>
                            </div>
                            {(!order.awbNumber || order.awbNumber.startsWith("DLHV")) && (
                              <button
                                onClick={() => handleGenerateAWB(order)}
                                disabled={manifestingId === order.id}
                                className="bg-[#792c14] hover:bg-[#68250f] text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                {manifestingId === order.id ? "Manifesting..." : "Manifest"}
                              </button>
                            )}
                          </div>
                          {order.delhiveryError && (
                            <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-normal">
                              {order.delhiveryError}
                            </p>
                          )}
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

        {/* Pagination Controls Bar */}
        {filteredOrders.length > 0 && (
          <div className="px-4 py-3 bg-muted/20 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <span>
                Showing <strong className="text-foreground">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-foreground">{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of{" "}
                <strong className="text-foreground">{filteredOrders.length}</strong> orders
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="clay-input py-0.5 px-1.5 text-[11px] font-bold bg-background rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground text-[10px]">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                          currentPage === p
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-background border border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold text-[11px] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
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
                <p className="text-xs text-muted-foreground font-mono">Order ID: #{String(activeInvoiceOrder.id).replace(/^ORD-|^#/, "")}</p>
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
