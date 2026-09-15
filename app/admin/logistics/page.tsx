"use client";

import { useState, useMemo, useEffect } from "react";
import { useEcomStore, Order } from "@/store/ecomStore";
import { checkDelhiveryServiceability, ServiceabilityResult } from "@/lib/delhivery";

export default function AdminLogisticsPage() {
  const { orders, addToast, updateOrderAWB, updateOrderStatus } = useEcomStore();
  const [serverOrders, setServerOrders] = useState<Order[]>([]);
  const [testPin, setTestPin] = useState("");
  const [testResult, setTestResult] = useState<(ServiceabilityResult & { source?: string }) | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [isBulkManifesting, setIsBulkManifesting] = useState(false);
  const [manifestingId, setManifestingId] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/purity -- memoized to avoid re-computation on each render
  const manifestRef = useMemo(() => `MANIFEST-EXP-${Date.now().toString().slice(-6)}`, []);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending Manifest" | "Manifested" | "Delivered">("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const isManifested = Boolean(o.awbNumber && !o.awbNumber.startsWith("DLHV"));
      if (statusFilter === "Pending Manifest") {
        if (isManifested || o.status === "Cancelled" || o.status === "Delivered") return false;
      } else if (statusFilter === "Manifested") {
        if (!isManifested) return false;
      } else if (statusFilter === "Delivered") {
        if (o.status !== "Delivered") return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().replace(/^#/, "");
      const cleanOrderId = o.id.toLowerCase().replace(/^#|^ord-/, "");
      return (
        o.id.toLowerCase().includes(q) ||
        cleanOrderId.includes(q) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
        o.shippingAddress?.city?.toLowerCase().includes(q) ||
        o.shippingAddress?.zipCode?.includes(q) ||
        (o.awbNumber && o.awbNumber.toLowerCase().includes(q))
      );
    });
  }, [allOrders, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const handleBulkManifest = async () => {
    if (unmanifestedOrders.length === 0) {
      addToast("Logistics Status", "All shipments are already manifested with official Delhivery AWBs.", "info");
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
            `Assigned live Delhivery AWBs to ${data.manifestedCount} order(s).`,
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

  const handleSingleManifest = async (order: Order) => {
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
        addToast("Delhivery Manifested", `Waybill: ${data.waybill} — Order Accepted for Dispatch`, "success");
        setServerOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, awbNumber: data.waybill, delhiveryStatus: "Manifested", status: "Order Accepted", delhiveryError: undefined }
              : o
          )
        );
      } else {
        const err = data.error || "Delhivery did not accept shipment.";
        addToast("Manifest Notice", err, "warning");
        setServerOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, delhiveryStatus: "Failed", status: o.status === "Cancelled" ? "Cancelled" : "Order Placed", delhiveryError: err }
              : o
          )
        );
      }
    } catch (err: any) {
      addToast("Network Error", err?.message || "Failed to reach Delhivery API", "warning");
    } finally {
      setManifestingId(null);
    }
  };

  const handleCheckPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPin || testPin.trim().length !== 6) return;
    setCheckingPin(true);
    try {
      const res = await fetch(`/api/delhivery/pincode?pin=${encodeURIComponent(testPin.trim())}`);
      const data = await res.json();
      if (data.success) {
        setTestResult({
          pincode: testPin.trim(),
          serviceable: data.serviceable,
          city: data.city,
          state: data.state,
          estimatedDays: data.estimatedDays || 2,
          codAvailable: data.codAvailable ?? false,
          courierPartner: data.source === "delhivery_api" ? "Delhivery Express (Live API Verified)" : data.courier,
          message: data.serviceable
            ? `Serviceable: Delivery to ${data.city}, ${data.state}`
            : "Pincode is not currently serviceable.",
          source: data.source,
        });
      } else {
        setTestResult({
          pincode: testPin.trim(),
          serviceable: false,
          city: "",
          state: "",
          estimatedDays: 0,
          codAvailable: false,
          courierPartner: "Delhivery Express",
          message: data.message || "Invalid or unserviceable PIN code.",
        });
      }
    } catch {
      const fallback = checkDelhiveryServiceability(testPin);
      setTestResult(fallback);
    } finally {
      setCheckingPin(false);
    }
  };

  const handleGenerateManifest = () => {
    setShowManifestModal(true);
    addToast("Manifest Generated", "Pickup manifest PDF created for dispatch hub.", "success");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground font-normal">
            Express Logistics Operations Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage express logistics, generate manifests, inspect PIN coverage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unmanifestedOrders.length > 0 && (
            <button
              onClick={handleBulkManifest}
              disabled={isBulkManifesting}
              className="bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isBulkManifesting ? "Manifesting..." : `Bulk Manifest All (${unmanifestedOrders.length})`}
            </button>
          )}
          <button
            onClick={handleGenerateManifest}
            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Generate Pickup Manifest PDF
          </button>
        </div>
      </div>

      {/* Courier Balance Watchdog Banner */}
      {unmanifestedOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-amber-900">
                {unmanifestedOrders.length} Shipment{unmanifestedOrders.length > 1 ? "s" : ""} Queued for Courier Manifestation
              </p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                If your Delhivery One wallet balance runs low, customer orders remain 100% confirmed in queue. Recharge your Delhivery wallet and click Bulk Manifest to push all orders live.
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
              Recharge Delhivery Wallet ↗
            </a>
            <button
              onClick={handleBulkManifest}
              disabled={isBulkManifesting}
              className="px-3.5 py-1.5 rounded-xl bg-[#792c14] hover:bg-[#68250f] text-white font-bold text-[11px] shadow-xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isBulkManifesting ? "Processing..." : `Manifest All (${unmanifestedOrders.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Grid Split: Serviceability Tool + Logistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* PIN Code Inspector Tool */}
        <div className="md:col-span-5 clay-panel p-6 bg-white space-y-4 ring-1 ring-black/10">
          <h3 className="font-heading text-xl text-foreground pb-2 border-b border-border/40">
            Pincode Serviceability Lookup
          </h3>

          <form onSubmit={handleCheckPin} className="space-y-3">
            <input
              type="text"
              placeholder="Enter PIN Code"
              maxLength={6}
              value={testPin}
              onChange={(e) => setTestPin(e.target.value)}
              className="clay-input w-full text-xs"
            />
            <button
              type="submit"
              disabled={checkingPin}
              className="w-full bg-primary text-white text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-50"
            >
              {checkingPin ? "Checking Delhivery API..." : "Test Serviceability"}
            </button>
          </form>

          {testResult && (
            <div className={`p-4 rounded-2xl text-xs space-y-1.5 ${testResult.serviceable ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"
              }`}>
              <div className="flex items-center justify-between">
                <p className="font-bold">{testResult.message}</p>
                {testResult.source === "delhivery_api" && (
                  <span className="text-[9px] bg-green-200 text-green-950 font-bold px-2 py-0.5 rounded-full">
                    LIVE API
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90">Partner: {testResult.courierPartner}</p>
              <p className="text-[11px] opacity-90">Estimated Transit: {testResult.estimatedDays} business days</p>
              <p className="text-[11px] opacity-90">
                Cash on Delivery (COD): <strong className="font-semibold">{testResult.codAvailable ? "Available" : "Prepaid Only"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Active Dispatches Table */}
        <div className="md:col-span-7 clay-panel p-6 bg-white space-y-4 ring-1 ring-black/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-border/40">
            <div>
              <h3 className="font-heading text-xl text-foreground">
                Active Shipments ({filteredOrders.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Live carrier dispatches, manifests, and transit waybills
              </p>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Search ID, name, PIN, AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input w-full py-1.5 px-2.5 pl-7 text-[11px] bg-background"
              />
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {(["All", "Pending Manifest", "Manifested", "Delivered"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-foreground text-background shadow-2xs"
                    : "bg-muted/40 border border-border/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {paginatedOrders.length === 0 ? (
              <div className="p-8 text-center space-y-1.5 border border-dashed border-border/60 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-foreground">No Shipments Found</p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery ? `No results for "${searchQuery}"` : `No shipments matching "${statusFilter}"`}
                </p>
              </div>
            ) : (
              paginatedOrders.map((order) => {
                const isManifested = Boolean(order.awbNumber && !order.awbNumber.startsWith("DLHV"));
                return (
                  <div key={order.id} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground font-mono">#{String(order.id).replace(/^ORD-|^#/, "")}</span>
                        <span className="text-[11px] text-muted-foreground">• ₹{order.total}</span>
                      </div>
                      {isManifested ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                          ✓ {order.awbNumber}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pending Manifest
                          </span>
                          <button
                            onClick={() => handleSingleManifest(order)}
                            disabled={manifestingId === order.id}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#792c14] text-white hover:bg-[#68250f] disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {manifestingId === order.id ? "..." : "Manifest"}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      Recipient: <strong className="text-foreground">{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city}, {order.shippingAddress.zipCode})
                    </p>
                    <div className="flex justify-between items-center text-[11px] pt-1 text-muted-foreground">
                      <span>Payment: <strong>{order.paymentMode}</strong></span>
                      <span className="font-bold text-foreground">Status: {order.status}</span>
                    </div>
                    {order.delhiveryError && !isManifested && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        ⚠️ {order.delhiveryError}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  Showing <strong>{(page - 1) * pageSize + 1}</strong> - <strong>{Math.min(page * pageSize, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong>
                </span>
                <span>•</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="clay-input py-0.5 px-1.5 text-[10px] font-bold bg-background rounded-md"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold text-[10px] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  ← Prev
                </button>
                <span className="px-2 font-bold text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground hover:bg-muted font-bold text-[10px] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Pickup Manifest Modal */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManifestModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 z-10 font-sans animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h2 className="font-heading text-2xl text-foreground">Dispatch Pickup Manifest</h2>
                <p className="text-xs text-muted-foreground">Jaipur Dispatch Hub (PIN: 302001)</p>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 text-xs space-y-1">
              <p className="font-bold text-foreground">Manifest Ref: {manifestRef}</p>
              <p className="text-muted-foreground">Courier Executive: Express Logistics Unit</p>
              <p className="text-muted-foreground">Total Enclosures: {orders.length} Packages</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground">Package Dispatch Roster</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {orders.map((o, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-muted/20 border border-border/40">
                    <div>
                      <p className="font-bold text-foreground">{o.id} ({o.shippingAddress.fullName})</p>
                      <p className="text-[10px] text-muted-foreground">{o.shippingAddress.city} - {o.shippingAddress.zipCode}</p>
                    </div>
                    <span className="font-mono text-[11px] text-primary font-bold">{o.awbNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="flex-1 bg-primary text-white text-xs font-bold py-3 rounded-xl shadow-md"
              >
                🖨️ Print Manifest Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
