"use client";

import { useState, useMemo } from "react";
import { useEcomStore } from "@/store/ecomStore";
import { checkDelhiveryServiceability, ServiceabilityResult } from "@/lib/delhivery";

export default function AdminLogisticsPage() {
  const { orders, addToast } = useEcomStore();
  const [testPin, setTestPin] = useState("");
  const [testResult, setTestResult] = useState<ServiceabilityResult | null>(null);
  const [showManifestModal, setShowManifestModal] = useState(false);
  // eslint-disable-next-line react-hooks/purity -- memoized to avoid re-computation on each render
  const manifestRef = useMemo(() => `MANIFEST-EXP-${Date.now().toString().slice(-6)}`, []);

  const handleCheckPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPin) return;
    const res = checkDelhiveryServiceability(testPin);
    setTestResult(res);
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

        <button
          onClick={handleGenerateManifest}
          className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          📄 Generate Pickup Manifest PDF
        </button>
      </div>

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
              className="w-full bg-primary text-white text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              Test Serviceability
            </button>
          </form>

          {testResult && (
            <div className={`p-4 rounded-2xl text-xs space-y-1 ${
              testResult.serviceable ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"
            }`}>
              <p className="font-bold">{testResult.message}</p>
              <p className="text-[11px] opacity-90">Partner: {testResult.courierPartner}</p>
              <p className="text-[11px] opacity-90">Estimated Transit: {testResult.estimatedDays} business days</p>
            </div>
          )}
        </div>

        {/* Active Dispatches Table */}
        <div className="md:col-span-7 clay-panel p-6 bg-white space-y-4 ring-1 ring-black/10">
          <h3 className="font-heading text-xl text-foreground pb-2 border-b border-border/40">
            Active Shipments ({orders.length})
          </h3>

          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">{order.id}</span>
                  <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                    {order.awbNumber}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Recipient: <strong className="text-foreground">{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city}, {order.shippingAddress.zipCode})
                </p>
                <div className="flex justify-between items-center text-[11px] pt-1 text-muted-foreground">
                  <span>Courier: Express Delivery</span>
                  <span className="font-bold text-foreground">Status: {order.status}</span>
                </div>
              </div>
            ))}
          </div>
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
