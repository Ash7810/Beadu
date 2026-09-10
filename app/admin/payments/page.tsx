"use client";

import { useEcomStore } from "@/store/ecomStore";

export default function AdminPaymentsPage() {
  const { orders } = useEcomStore();

  const totalCollected = orders.reduce((sum, o) => sum + o.total, 0);
  const upiCount = orders.filter((o) => o.paymentMode.includes("UPI")).length;
  const cardCount = orders.filter((o) => 
    o.paymentMode.includes("CARD") || 
    o.paymentMode.includes("Card") || 
    o.paymentMode.includes("NETBANKING") || 
    o.paymentMode.includes("Net Banking") ||
    o.paymentMode.includes("NetBanking")
  ).length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground font-normal">
            Payment Gateway Transactions Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time UPI gateway payment authorizations and settlement logs
          </p>
        </div>

        <div className="bg-green-100 text-green-800 text-xs font-bold px-4 py-2 rounded-xl">
          Instant Gateway Active ✓
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 tabular-nums">
        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Gateway Revenue</span>
          <p className="text-2xl font-bold text-foreground">₹{totalCollected.toLocaleString("en-IN")}</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">UPI Payments</span>
          <p className="text-2xl font-bold text-primary">{upiCount} Txns</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Card &amp; NetBanking</span>
          <p className="text-2xl font-bold text-foreground">{cardCount} Txns</p>
        </div>

        <div className="clay-panel p-5 bg-white space-y-1 ring-1 ring-black/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg Order Value</span>
          <p className="text-2xl font-bold text-foreground">
            ₹{orders.length > 0 ? Math.round(totalCollected / orders.length).toLocaleString("en-IN") : "0"}
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
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2 font-bold text-foreground">{order.id}</td>
                  <td className="py-3 px-2 text-foreground font-medium">{order.shippingAddress.fullName}</td>
                  <td className="py-3 px-2 text-muted-foreground">{order.paymentMode}</td>
                  <td className="py-3 px-2 font-mono text-[11px] text-primary">{order.transactionId}</td>
                  <td className="py-3 px-2 font-bold text-foreground">₹{order.total}</td>
                  <td className="py-3 px-2">
                    <span className="bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      Authorized ✓
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
