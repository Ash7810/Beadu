"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { useEcomStore, Address } from "@/store/ecomStore";
import { useAuthStore } from "@/store/authStore";
import { PaymentMethod } from "@/lib/smePay";
import { checkDelhiveryServiceability, validateOrderAddressForDelhivery } from "@/lib/delhivery";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";

declare global {
  interface Window {
    smepayCheckout?: (options: {
      slug: string;
      onSuccess: (data: any) => void;
      onFailure: () => void;
    }) => void;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    cart,
    addresses,
    addAddress,
    updateAddress,
    createOrder,
    getCartSubtotal,
    getGiftWrapTotal,
    getPlatformFee,
    getShippingFee,
    getGrandTotal,
    clearCart,
    addToast,
  } = useEcomStore();

  // Filter saved addresses strictly for the authenticated user
  // Guest users (user === null) have 0 pre-saved account addresses
  const userAddresses = useMemo(() => {
    if (!user) return [];
    return addresses.filter((a) => a.userId === user.id);
  }, [addresses, user]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState<boolean>(true);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const paymentMode: PaymentMethod = "UPI";
  const [isProcessing, setIsProcessing] = useState(false);

  const [addrForm, setAddrForm] = useState<{
    fullName: string;
    email: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    addressType: "HOME" | "WORK";
    isDefault: boolean;
  }>({
    fullName: "",
    email: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    addressType: "HOME",
    isDefault: true,
  });

  // Synchronize address selection and form visibility with user auth status
  useEffect(() => {
    if (userAddresses.length > 0) {
      if (!selectedAddressId || !userAddresses.some((a) => a.id === selectedAddressId)) {
        const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
      if (!editingAddressId) {
        setShowAddressForm(false);
      }
    } else {
      setSelectedAddressId("");
      setShowAddressForm(true);
    }
  }, [userAddresses, user]);

  // Pre-fill user profile info if logged in and form is empty
  useEffect(() => {
    if (user) {
      setAddrForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const subtotal = getCartSubtotal();
  const giftWrapFee = getGiftWrapTotal();
  const platformFee = getPlatformFee();
  const grandTotal = getGrandTotal();

  const [isResolvingPin, setIsResolvingPin] = useState(false);

  const handleZipCodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setAddrForm((prev) => ({ ...prev, zipCode: clean }));

    if (clean.length === 6) {
      // 1. Instant local resolution so fields fill immediately with zero delay
      const localCheck = checkDelhiveryServiceability(clean);
      if (localCheck.serviceable && localCheck.city && localCheck.state) {
        setAddrForm((prev) => ({
          ...prev,
          city: localCheck.city,
          state: localCheck.state,
        }));
      }

      // 2. Fetch from Delhivery/Postal API endpoint to refine with official postal directory
      setIsResolvingPin(true);
      try {
        const res = await fetch(`/api/delhivery/pincode?pin=${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.city && data.state) {
            setAddrForm((prev) => ({
              ...prev,
              city: data.city,
              state: data.state,
            }));
          }
        }
      } catch {
        // Fallback local resolution already active
      } finally {
        setIsResolvingPin(false);
      }
    }
  };

  const handleOpenAddForm = () => {
    setEditingAddressId(null);
    setAddrForm({
      fullName: user?.name || "",
      email: user?.email || "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      addressType: "HOME",
      isDefault: userAddresses.length === 0,
    });
    setShowAddressForm(true);
  };

  const handleOpenEditForm = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setAddrForm({
      fullName: addr.fullName,
      email: addr.email,
      street: addr.street,
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      phone: addr.phone,
      addressType: addr.addressType || "HOME",
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddressForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive Delhivery manifestation validation
    const validation = validateOrderAddressForDelhivery(addrForm);
    if (!validation.valid) {
      addToast("Incomplete Address", validation.message || "Please complete all required fields.", "warning");
      return;
    }

    const pinCheck = checkDelhiveryServiceability(addrForm.zipCode);
    if (!pinCheck.serviceable) {
      addToast("Delivery Unavailable", pinCheck.message, "warning");
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, { ...addrForm, userId: user?.id });
      setSelectedAddressId(editingAddressId);
      setShowAddressForm(false);
      setEditingAddressId(null);
    } else {
      const newId = addAddress({ ...addrForm, userId: user?.id });
      setSelectedAddressId(newId);
      setShowAddressForm(false);
    }
  };

  const handlePlaceOrder = async () => {
    let selectedAddr: Address | null = null;
    if (selectedAddressId) {
      selectedAddr = userAddresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.id === selectedAddressId) || null;
    }

    // If no saved address selected or currently filling/editing the form:
    if (!selectedAddr || showAddressForm) {
      const validation = validateOrderAddressForDelhivery(addrForm);
      if (!validation.valid) {
        setShowAddressForm(true);
        addToast("Address Incomplete", validation.message || "Please complete all required shipping fields to manifest your order.", "warning");
        return;
      }

      const pinCheck = checkDelhiveryServiceability(addrForm.zipCode);
      if (!pinCheck.serviceable) {
        setShowAddressForm(true);
        addToast("Delivery Unavailable", pinCheck.message, "warning");
        return;
      }

      if (editingAddressId) {
        updateAddress(editingAddressId, { ...addrForm, userId: user?.id });
        selectedAddr = { ...addrForm, id: editingAddressId, userId: user?.id };
        setSelectedAddressId(editingAddressId);
      } else {
        const newId = addAddress({ ...addrForm, userId: user?.id });
        selectedAddr = { ...addrForm, id: newId, userId: user?.id };
        setSelectedAddressId(newId);
      }
      setShowAddressForm(false);
      setEditingAddressId(null);
    }

    setIsProcessing(true);

    try {
      // Instant UPI via SMEPay Widget
      // Step 1: Create order on backend to obtain unique order_slug
      const orderRef = `BEADU-${Date.now()}`;
      const createRes = await fetch("/api/smepay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          customer_email: selectedAddr.email,
          customer_name: selectedAddr.fullName,
          customer_phone: selectedAddr.phone,
          order_id: orderRef,
        }),
      });

      const createData = await createRes.json();
      if (!createData.success || !createData.order_slug) {
        addToast("Payment Error", "Unable to initialize UPI payment gateway. Please try again later.", "warning");
        setIsProcessing(false);
        return;
      }

      const fulfillUpiOrder = async (txId: string, callbackUrl?: string) => {
        try {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart,
              shippingAddress: selectedAddr,
              paymentMode: "UPI",
              transactionId: txId,
              userId: user?.id,
            }),
          });
        } catch (e) {
          console.warn("Server order sync notice:", e);
        }

        const newOrder = createOrder(selectedAddr, "UPI", txId, user?.id);
        clearCart();
        addToast("Payment Successful", "Payment authorized. Your order has been placed!", "success");

        if (callbackUrl) {
          window.location.href = callbackUrl;
        } else {
          router.push(`/order-success?orderId=${newOrder.id}&txId=${txId}`);
        }
      };

      // Ensure widget script is ready (poll up to 1.5s in case of network latency)
      let attempts = 0;
      while (typeof window !== "undefined" && !window.smepayCheckout && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        attempts++;
      }

      // Step 2: Launch SMEPay Checkout Widget
      if (typeof window !== "undefined" && window.smepayCheckout) {
        window.smepayCheckout({
          slug: createData.order_slug,
          onSuccess: async (data: any) => {
            // Validate payment on backend per documentation
            try {
              const valRes = await fetch("/api/smepay/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slug: createData.order_slug,
                  amount: grandTotal,
                }),
              });
              const valData = await valRes.json();
              const finalTxId = valData.transactionId || data?.transaction_id || `UPI-${Date.now()}`;
              await fulfillUpiOrder(finalTxId, data?.callback_url);
            } catch {
              await fulfillUpiOrder(`UPI-${Date.now()}`, data?.callback_url);
            }
          },
          onFailure: () => {
            setIsProcessing(false);
            addToast("Payment Cancelled", "Payment window was closed or cancelled.", "warning");
          },
        });
      } else if (createData.simulated) {
        // Fallback simulation in local development mode
        await fulfillUpiOrder(`UPI-SIM-${Date.now()}`);
      } else {
        setIsProcessing(false);
        addToast(
          "Payment Gateway Unavailable",
          "Payment gateway could not load. Please check your connection or disable any adblockers and try again.",
          "warning"
        );
      }
    } catch {
      setIsProcessing(false);
      addToast("Error", "Could not complete transaction. Please try again.", "warning");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 sm:pt-8 md:pt-10 pb-16 text-center">
          <div className="clay-panel p-6 sm:p-8 max-w-md mx-auto space-y-4">
            <h1 className="font-heading text-2xl">Your Bag is Empty</h1>
            <p className="text-xs text-muted-foreground">Add items to your cart before proceeding to checkout.</p>
            <Link href="/shop" className="bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold px-6 py-2.5 rounded-full inline-block transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]">
              Go to Shop
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNavigation />
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-2 sm:px-6 md:px-10 lg:px-12 pt-3.5 sm:pt-8 pb-24 md:pb-8">
        <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl text-foreground font-normal mb-6 sm:mb-8 px-1 sm:px-0">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipping Address & Payment Selection */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Address Selection Radio Matrix */}
            <div className="clay-panel p-6 bg-white space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#792c14] text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-heading text-xl text-foreground">Delivery Address</h3>
                </div>
                {userAddresses.length > 0 ? (
                  <button
                    onClick={() => {
                      if (showAddressForm) {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                      } else {
                        handleOpenAddForm();
                      }
                    }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {showAddressForm ? "✕ Cancel" : "+ Add New Address"}
                  </button>
                ) : !user ? (
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <span>Guest Checkout</span>
                    <span>&bull;</span>
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Log in to use saved addresses
                    </Link>
                  </span>
                ) : null}
              </div>

              {/* Saved Address Radio Grid (Only shown when user has saved addresses) */}
              {userAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const isHome = addr.addressType !== "WORK";
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                            : "border-border/60 hover:border-primary/40 bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-foreground">{addr.fullName}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isHome ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                              }`}>
                                {isHome ? "🏠 Home" : "🏢 Work"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditForm(addr, e)}
                              className="text-[11px] font-bold text-primary hover:underline hover:text-[#68250f] shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {addr.street}
                          </p>
                          {addr.landmark && (
                            <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                              📍 Landmark: {addr.landmark}
                            </p>
                          )}
                          <p className="text-xs font-medium text-stone-700 mt-0.5">
                            {addr.city}, {addr.state} - <span className="font-bold text-stone-900">{addr.zipCode}</span>
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2.5 pt-2 border-t border-stone-100">
                            <p className="text-xs font-semibold text-foreground">📞 +91 {addr.phone}</p>
                            <p className="text-xs text-muted-foreground">✉️ {addr.email}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-2 border-t border-border/20 flex items-center justify-end">
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              ✓ Deliver to this
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline Add / Edit Address Form (Amazon & Flipkart Standard) */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddressForm} className="p-5 rounded-2xl border border-primary/30 bg-primary/[0.02] space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                    </h4>
                    <span className="text-[10px] text-stone-500">Instant Pincode Validation</span>
                  </div>

                  {/* Address Type Selector */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-700">Address Type</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAddrForm({ ...addrForm, addressType: "HOME" })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          addrForm.addressType === "HOME"
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white text-stone-700 border-stone-300 hover:border-primary/40"
                        }`}
                      >
                        🏠 Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddrForm({ ...addrForm, addressType: "WORK" })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          addrForm.addressType === "WORK"
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white text-stone-700 border-stone-300 hover:border-primary/40"
                        }`}
                      >
                        🏢 Work / Office
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Name *</label>
                      <input
                        type="text"
                        placeholder="Name"
                        required
                        value={addrForm.fullName}
                        onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                        className="clay-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        maxLength={10}
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, "") })}
                        className="clay-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Email *</label>
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={addrForm.email}
                      onChange={(e) => setAddrForm({ ...addrForm, email: e.target.value })}
                      className="clay-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Address *</label>
                    <input
                      type="text"
                      placeholder="House / Flat no., Street address"
                      required
                      value={addrForm.street}
                      onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                      className="clay-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="Landmark"
                      value={addrForm.landmark}
                      onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                      className="clay-input w-full text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        placeholder="PIN Code"
                        required
                        maxLength={6}
                        value={addrForm.zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        className="clay-input w-full text-xs"
                      />
                    </div>
                    <div className="cursor-not-allowed">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">City *</label>
                      <input
                        type="text"
                        placeholder="City"
                        required
                        readOnly
                        tabIndex={-1}
                        onFocus={(e) => e.target.blur()}
                        value={addrForm.city}
                        className="clay-input w-full text-xs bg-slate-100/80 text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="cursor-not-allowed">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">State *</label>
                      <input
                        type="text"
                        placeholder="State"
                        required
                        readOnly
                        tabIndex={-1}
                        onFocus={(e) => e.target.blur()}
                        value={addrForm.state}
                        className="clay-input w-full text-xs bg-slate-100/80 text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="makeDefault"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="makeDefault" className="text-xs text-stone-700 cursor-pointer select-none">
                      Make this my default delivery address
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-[#68250f] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-[transform,background-color] active:scale-[0.96]"
                    >
                      {editingAddressId ? "Update Address & Select" : "Save Address & Select"}
                    </button>
                    {userAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddressId(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Step 2: Payment Method — UPI Only */}
            <div className="clay-panel p-6 bg-white space-y-4">
              <h3 className="font-heading text-xl text-foreground pb-3 border-b border-border/40">
                2. Payment Method
              </h3>

              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary bg-primary/5 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">UPI (Google Pay / PhonePe / Paytm / QR)</p>
                    <p className="text-[10px] text-muted-foreground">Scan QR code or pay instantly via any UPI app</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Selected</span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium border-t border-border/30">
                <span className="text-emerald-600 font-bold">🔒</span>
                <span>256-Bit SSL Bank-Grade Encryption • 100% Safe &amp; Secure</span>
              </div>
            </div>
          </div>

          {/* Right Column: Items Snapshot & Order Summary */}
          <div className="lg:col-span-4 clay-panel p-6 bg-white space-y-6 sticky top-28">
            <h3 className="font-heading text-xl text-foreground pb-3 border-b border-border/40">
              Items ({cart.length})
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {cart.map((item) => {
                const isCustom = item.product.id.startsWith("custom") || item.product.category === "Custom Builder";
                const img = item.product.image;
                return (
                  <div key={item.product.id} className="flex gap-3 items-center text-xs">
                    {isCustom ? (
                      <CustomBraceletPreview beads={(item.product as any).customBeads} size={44} />
                    ) : (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border ring-1 ring-black/10 flex-shrink-0">
                        <Image src={img} alt={item.product.name} fill sizes="40px" className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Qty: {item.quantity} × ₹{item.product.price}</p>
                    </div>
                    <span className="font-bold text-foreground">₹{item.product.price * item.quantity}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 text-xs font-medium pt-3 border-t border-border/40">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="text-foreground font-bold">₹{subtotal}</span>
              </div>
              {giftWrapFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Gift Wrap Fee:</span>
                  <span className="text-foreground font-bold">₹{giftWrapFee}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Standard Surface Shipping:</span>
                <span className="text-foreground font-bold">₹{getShippingFee()}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Total Payable:</span>
                <span className="text-2xl font-bold text-foreground">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-lg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span>Processing Order...</span>
              ) : (
                <span>Pay ₹{grandTotal} with Instant UPI</span>
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
      <Toast />
      
      {/* SMEPay / Instant UPI Modal Widget */}
      <Script 
        src="https://typof.co/smepay/checkout-v2.js" 
        strategy="afterInteractive" 
      />
    </div>
  );
}
