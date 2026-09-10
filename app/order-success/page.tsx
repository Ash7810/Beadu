"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { useEcomStore, Order } from "@/store/ecomStore";
import { useAuthStore } from "@/store/authStore";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { orders } = useEcomStore();
  const { user } = useAuthStore();

  const orderId = searchParams.get("orderId") || searchParams.get("order_id");
  const txId = searchParams.get("txId") || searchParams.get("transactionId");
  const slug = searchParams.get("slug");

  const [order, setOrder] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (orderId) {
      const found = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
      if (found) {
        setOrder(found);
        return;
      }
    }

    // Fallback: Show the most recent order if available
    if (orders.length > 0) {
      setOrder(orders[0]);
    }
  }, [mounted, orderId, orders]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 pb-20">
        {/* Celebratory Banner */}
        <div className="clay-panel p-8 sm:p-10 text-center mb-8 relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 mb-5 ring-8 ring-emerald-500/5 shadow-inner">
            <svg
              className="w-10 h-10 animate-[bounce_1s_ease-out]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7c2d12] mb-1">
            Payment Confirmed & Verified
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground font-bold mb-3">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your handcrafted artisan creation has been received. Our atelier craftsmen are preparing your pieces for express insured dispatch.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-muted/30 px-5 py-2.5 rounded-full border border-border/50 text-xs">
            <span className="text-muted-foreground">Order Reference:</span>
            <span className="font-mono font-bold text-foreground">{order?.id || orderId || "BDU-CONFIRMED"}</span>
            {txId && (
              <>
                <span className="text-border">|</span>
                <span className="text-muted-foreground">Txn:</span>
                <span className="font-mono text-muted-foreground">{txId.slice(0, 16)}...</span>
              </>
            )}
          </div>
        </div>

        {/* Order Details Card */}
        {order ? (
          <div className="space-y-6">
            <div className="clay-panel p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">Order Summary</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    {order.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">Paid via {order.paymentMode}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-border/40">
                {order.items.map((item, index) => {
                  const isCustom = item.product.id?.startsWith("custom-") || "customBeads" in item.product;
                  const img = item.product.images?.[0] || item.product.image || "/beads/pomelli_photoshoot_image_1_1_0726.png";

                  return (
                    <div key={`${item.product.id}-${index}`} className="py-4 flex gap-4 items-center">
                      {isCustom ? (
                        <div className="flex-shrink-0">
                          <CustomBraceletPreview beads={(item.product as any).customBeads || []} size={56} />
                        </div>
                      ) : (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border ring-1 ring-black/5 flex-shrink-0">
                          <Image src={img} alt={item.product.name} fill sizes="56px" className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.product.price}
                        </p>
                        {item.giftWrap && (
                          <span className="inline-block text-[10px] text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded mt-1">
                            Gift Wrapped
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Breakdown */}
              <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{order.subtotal}</span>
                </div>
                {order.giftWrapFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gift Wrap Fee:</span>
                    <span className="font-semibold text-foreground">₹{order.giftWrapFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Surface Shipping:</span>
                  <span className="font-semibold text-foreground">₹{order.shippingFee || 100}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-border text-foreground font-bold">
                  <span className="text-sm">Total Amount Paid:</span>
                  <span className="text-xl font-heading text-[#7c2d12]">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Tracking Card */}
            <div className="clay-panel p-6 sm:p-8 space-y-4">
              <h2 className="font-heading text-base font-bold text-foreground">Shipping & Express Delivery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery Address
                  </p>
                  <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                    <span className="font-mono font-bold text-foreground">{order.shippingAddress.zipCode}</span>
                  </p>
                  <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Express Shipment Tracking
                  </p>
                  <p className="font-semibold text-foreground">Standard Express Courier</p>
                  <p className="text-muted-foreground">
                    AWB Tracking: <span className="font-mono font-bold text-foreground">{order.awbNumber}</span>
                  </p>
                  <p className="text-emerald-700 font-semibold pt-1">
                    Estimated Delivery: 3 - 5 Business Days
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="clay-panel p-8 text-center text-xs text-muted-foreground">
            Loading your order details...
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link
              href="/profile"
              className="bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full text-center shadow-md transition-all active:scale-[0.97]"
            >
              View Orders in Profile
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3 border border-border/60 bg-white p-5 rounded-3xl shadow-sm max-w-sm w-full">
              <p className="text-xs font-bold text-center text-foreground">
                Save your details and track your bracelet delivery with one tap:
              </p>
              <GoogleLoginButton redirectTo="/profile" />
            </div>
          )}
          <Link
            href="/shop"
            className="border border-border hover:bg-muted text-foreground text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full text-center transition-all active:scale-[0.97]"
          >
            Continue Shopping
          </Link>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
      <Toast />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs">Loading order confirmation...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
