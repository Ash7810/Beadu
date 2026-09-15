"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { useEcomStore, Order } from "@/store/ecomStore";
import { useAuthStore } from "@/store/authStore";
import { generateDelhiveryTracking, checkDelhiveryServiceability, validateOrderAddressForDelhivery } from "@/lib/delhivery";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "payments" | "support">("profile");
  const [mobileSubView, setMobileSubView] = useState<null | "edit-profile" | "orders" | "addresses" | "payments" | "support">(null);

  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<"All" | "Delivered" | "In Transit">("All");

  const { orders, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress, addToast, syncDelhiveryAutoStatuses, wishlist } = useEcomStore();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && ["profile", "orders", "addresses", "payments", "support"].includes(tabParam)) {
        setActiveTab(tabParam as any);
        setMobileSubView(tabParam === "orders" ? "orders" : tabParam === "addresses" ? "addresses" : null);
      }
    }
  }, []);

  // Fetch orders from server when user is authenticated
  useEffect(() => {
    if (user?.id) {
      const emailQuery = user.email ? `&email=${encodeURIComponent(user.email)}` : "";
      fetch(`/api/orders?userId=${encodeURIComponent(user.id)}${emailQuery}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            useEcomStore.setState((s) => {
              const serverMap = new Map<string, Order>(data.orders.map((o: Order) => [o.id, o]));
              const updated: Order[] = s.orders.map((o) => serverMap.get(o.id) || o);
              for (const sOrd of (data.orders as Order[])) {
                if (!s.orders.some((o) => o.id === sOrd.id)) {
                  updated.unshift(sOrd);
                }
              }
              return { orders: updated };
            });
          }
        })
        .catch(() => {});
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [mounted, user, router]);

  const handleLogout = () => {
    logout();
    addToast("Signed Out", "You have been logged out successfully.", "info");
    router.push("/login");
  };

  useEffect(() => {
    syncDelhiveryAutoStatuses();
  }, [syncDelhiveryAutoStatuses]);

  // Filter addresses strictly for the authenticated user
  const userAddresses = addresses.filter((a) => (user ? a.userId === user.id : false));

  // Filter orders strictly for the authenticated user
  const userOrders = orders.filter((o) => {
    if (!user) return false;
    if (o.userId && o.userId === user.id) return true;
    if (user.email && o.userId && o.userId.toLowerCase() === user.email.toLowerCase()) return true;
    if (user.email && o.shippingAddress?.email && o.shippingAddress.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  // Profile Data State
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").trim().split(" ");
      const firstName = nameParts[0] || "Valued";
      const lastName = nameParts.slice(1).join(" ") || "Member";
      setProfileData((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: user.email || prev.email,
        phone: prev.phone || "",
      }));
    }
  }, [user]);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Address State
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [isProfilePinResolving, setIsProfilePinResolving] = useState(false);
  const [newAddr, setNewAddr] = useState<{
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
    isDefault: false,
  });

  // Support inquiry state
  const [supportOrderRef, setSupportOrderRef] = useState<string>("");
  const [supportMessage, setSupportMessage] = useState<string>("");
  const [supportTickets, setSupportTickets] = useState<
    Array<{ id: string; orderId: string; date: string; message: string; status: string }>
  >([]);

  // Payment methods state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentUpi, setNewPaymentUpi] = useState("");
  const [savedUpiList, setSavedUpiList] = useState<
    Array<{ id: string; provider: string; vpa: string; isDefault: boolean }>
  >([]);

  const handleProfileZipChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setNewAddr((prev) => ({ ...prev, zipCode: clean }));

    if (clean.length === 6) {
      // 1. Instant local resolution so fields fill immediately without delay
      const localCheck = checkDelhiveryServiceability(clean);
      if (localCheck.serviceable && localCheck.city && localCheck.state) {
        setNewAddr((prev) => ({
          ...prev,
          city: localCheck.city,
          state: localCheck.state,
        }));
      }

      // 2. Fetch live Delhivery / Postal API for precision district & city names
      setIsProfilePinResolving(true);
      try {
        const res = await fetch(`/api/delhivery/pincode?pin=${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.city && data.state) {
            setNewAddr((prev) => ({
              ...prev,
              city: data.city,
              state: data.state,
            }));
          }
        }
      } catch {
        // Fallback local resolution already active
      } finally {
        setIsProfilePinResolving(false);
      }
    }
  };

  const handleStartEditAddress = (addr: any) => {
    setEditingAddrId(addr.id);
    setNewAddr({
      fullName: addr.fullName,
      email: addr.email || user?.email || "",
      street: addr.street,
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      phone: addr.phone,
      addressType: addr.addressType || "HOME",
      isDefault: addr.isDefault || false,
    });
    setShowAddAddr(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure email is populated from user profile if not entered in form
    const addrToValidate = {
      ...newAddr,
      email: newAddr.email || user?.email || "",
    };

    const validation = validateOrderAddressForDelhivery(addrToValidate);
    if (!validation.valid) {
      addToast("Address Incomplete", validation.message || "Please fill in all required address fields.", "warning");
      return;
    }

    const pinCheck = checkDelhiveryServiceability(newAddr.zipCode);
    if (!pinCheck.serviceable) {
      addToast("Delivery Unavailable", pinCheck.message, "warning");
      return;
    }

    if (editingAddrId) {
      updateAddress(editingAddrId, { ...addrToValidate, userId: user?.id });
      addToast("Address Updated", "Shipping address updated successfully.", "success");
    } else {
      addAddress({ ...addrToValidate, userId: user?.id, isDefault: userAddresses.length === 0 || newAddr.isDefault });
      addToast("Address Saved", "New address added to your address book.", "success");
    }

    setEditingAddrId(null);
    setShowAddAddr(false);
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: supportOrderRef || "General Inquiry",
      date: new Date().toLocaleDateString("en-IN"),
      message: supportMessage,
      status: "In Progress",
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    setSupportMessage("");
    setSupportOrderRef("");
    addToast("Ticket Raised", "Our support team will respond within 2 hours.", "success");
  };

  const [liveTrackingData, setLiveTrackingData] = useState<any>(null);
  const [isFetchingLiveTracking, setIsFetchingLiveTracking] = useState(false);

  const fetchRealTimeTracking = async (order: Order) => {
    if (!order.awbNumber || order.awbNumber.startsWith("DLHV")) {
      setLiveTrackingData(null);
      return;
    }
    setIsFetchingLiveTracking(true);
    try {
      const res = await fetch(`/api/delhivery/track?awb=${encodeURIComponent(order.awbNumber)}&orderId=${encodeURIComponent(order.id)}`);
      const data = await res.json();
      if (data.success && data.tracking) {
        setLiveTrackingData(data.tracking);
      }
    } catch {
      // Keep existing tracking details fallback
    } finally {
      setIsFetchingLiveTracking(false);
    }
  };

  useEffect(() => {
    if (selectedTrackingOrder) {
      fetchRealTimeTracking(selectedTrackingOrder);
    } else {
      setLiveTrackingData(null);
    }
  }, [selectedTrackingOrder]);

  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast("Copied!", `${label} copied to clipboard.`, "info");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "Cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        useEcomStore.setState((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o)),
        }));
        addToast("Order Cancelled", "Your order has been cancelled.", "info");
      } else {
        addToast("Cancellation Failed", data.error || "Unable to cancel.", "warning");
      }
    } catch {
      addToast("Network Error", "Could not process order cancellation.", "warning");
    }
  };

  let trackingDetails = liveTrackingData;
  if (selectedTrackingOrder && !trackingDetails) {
    trackingDetails = generateDelhiveryTracking(
      selectedTrackingOrder.id,
      selectedTrackingOrder.createdAt,
      selectedTrackingOrder.awbNumber,
      selectedTrackingOrder.status
    );
  }

  // Filtered orders list for search & pills
  const filteredOrders = userOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(orderSearchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (orderFilter === "Delivered") return o.status === "Delivered";
    if (orderFilter === "In Transit") return o.status !== "Delivered" && o.status !== "Cancelled";
    return true;
  });

  if (mounted && !user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-start pt-6 sm:pt-10 pb-12 px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4 shadow-2xs">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-stone-900">Please Sign In</h2>
          <p className="text-xs text-stone-500 max-w-xs mt-1.5 mb-5">
            You need to be signed in to view your profile and order history.
          </p>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-[#792c14] text-white font-bold text-xs shadow-xs hover:bg-[#68250f] transition-colors"
          >
            Sign In to Account
          </Link>
        </main>
        <BottomNavigation />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      {/* ========================================================================= */}
      {/* MOBILE APP LAYOUT VIEW (Visible on Mobile / Small Screens) */}
      {/* ========================================================================= */}
      <div className="block md:hidden flex-1 pb-24 bg-background">
        {/* MOBILE SUB-VIEW: EDIT PROFILE */}
        {mobileSubView === "edit-profile" ? (
          <div className="bg-white min-h-screen">
            {/* Top Bar */}
            <div className="bg-white border-b border-stone-200/80 p-4 flex items-center gap-3 sticky top-0 z-10">
              <button onClick={() => setMobileSubView(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">
                ←
              </button>
              <h2 className="font-extrabold text-sm text-stone-900">Personal Information</h2>
            </div>

            {/* Avatar Header */}
            <div className="bg-[#792c14]/5 p-6 text-center flex items-center justify-center border-b border-stone-200/60">
              <div className="w-16 h-16 rounded-full border-2 border-[#792c14] ring-2 ring-[#792c14]/20 shadow-sm bg-white text-[#792c14] font-heading flex items-center justify-center text-3xl font-bold transition-all">
                {profileData.firstName.charAt(0) || "U"}
              </div>
            </div>

            {/* Profile Form Fields */}
            <div className="p-5 space-y-5 text-xs">
              <div className="space-y-1">
                <label className="text-stone-500 font-bold block text-[11px] uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#792c14] focus:ring-1 focus:ring-[#792c14] outline-none font-bold text-sm text-stone-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-500 font-bold block text-[11px] uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#792c14] focus:ring-1 focus:ring-[#792c14] outline-none font-bold text-sm text-stone-900 bg-white"
                />
              </div>

              <button
                onClick={() => {
                  updateProfile(`${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim() || "Member");
                  setMobileSubView(null);
                  addToast("Profile Updated", "Personal information saved successfully.", "success");
                }}
                className="w-full py-3.5 bg-[#792c14] hover:bg-[#68250f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                Save Changes
              </button>

              <div className="pt-4 space-y-5 border-t border-slate-100">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Mobile Number</span>
                    <span className="font-bold text-slate-900 text-xs">{profileData.phone}</span>
                  </div>
                  <button
                    onClick={() => addToast("Verification Sent", "OTP sent to registered phone.", "info")}
                    className="text-primary font-bold text-xs hover:underline"
                  >
                    Update
                  </button>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Email ID</span>
                    <span className="font-bold text-slate-900 text-xs">{user?.email || profileData.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : mobileSubView === "orders" ? (
          /* MOBILE SUB-VIEW: MY ORDERS LIST */
          <div className="bg-white min-h-screen">
            {/* Top Header Bar */}
            <div className="p-4 bg-white border-b border-stone-200/80 flex items-center gap-3 sticky top-0 z-10">
              <button onClick={() => setMobileSubView(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">
                ←
              </button>
              <h2 className="font-extrabold text-sm text-stone-900">My Orders</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Search & Filters */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Search your order..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2">
                {(["All", "Delivered", "In Transit"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setOrderFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${orderFilter === filter
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Orders Roster */}
              <div className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <p>No orders found matching your search.</p>
                    <Link href="/shop" className="text-primary font-bold hover:underline block">
                      Shop Jewellery Collections →
                    </Link>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="py-4 space-y-3">
                      {order.items.map((item, idx) => {
                        const isCustom = item.product.id.startsWith("custom") || item.product.category === "Custom Builder";
                        return (
                          <div key={idx} className="flex items-center gap-3 group">
                            {isCustom ? (
                              <CustomBraceletPreview beads={(item.product as any).customBeads} previewImage={item.product.image} size={64} />
                            ) : (
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <Image src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-cover" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-900">
                                {order.status === "Delivered"
                                  ? "Delivered on "
                                  : order.status === "Shipped"
                                  ? "In Transit • "
                                  : "Order Placed • "}
                                <span className="font-normal text-slate-600">
                                  {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                </span>
                              </p>
                              <p className="text-xs text-slate-600 truncate mt-0.5">{item.product.name}</p>
                            </div>

                            <button
                              onClick={() => setSelectedTrackingOrder(order)}
                              className="text-slate-400 text-lg font-bold group-hover:text-primary transition-colors pr-1"
                            >
                              ›
                            </button>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 text-[10px] font-bold pt-1">
                        <button
                          onClick={() => setSelectedTrackingOrder(order)}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                          <span>Live Tracking</span>
                        </button>
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Tax Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : mobileSubView === "addresses" ? (
          /* MOBILE SUB-VIEW: SAVED ADDRESSES */
          <div className="bg-white min-h-screen">
            <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileSubView(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">
                  ←
                </button>
                <h2 className="font-extrabold text-sm text-stone-900">Manage Addresses</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddrId(null);
                  setNewAddr({
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
                  setShowAddAddr(!showAddAddr);
                }}
                className="text-xs font-bold text-[#7c2d12] hover:text-[#9a3412] hover:underline transition-colors"
              >
                {showAddAddr ? "✕ Cancel" : "+ Add New"}
              </button>
            </div>

            <div className="p-4 space-y-4">

              {showAddAddr && (
                <form onSubmit={handleSaveAddress} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAddr({ ...newAddr, addressType: "HOME" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${newAddr.addressType === "HOME"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-stone-700 border-stone-300"
                        }`}
                    >
                      🏠 Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAddr({ ...newAddr, addressType: "WORK" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${newAddr.addressType === "WORK"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-stone-700 border-stone-300"
                        }`}
                    >
                      🏢 Work
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Name *"
                    required
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    maxLength={10}
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Address *"
                    required
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={newAddr.landmark}
                    onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 px-0.5">PIN Code *</label>
                    <input
                      type="text"
                      placeholder="PIN Code *"
                      required
                      maxLength={6}
                      value={newAddr.zipCode}
                      onChange={(e) => handleProfileZipChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="cursor-not-allowed">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 px-0.5">City *</label>
                      <input
                        type="text"
                        placeholder="City *"
                        required
                        readOnly
                        tabIndex={-1}
                        onFocus={(e) => e.target.blur()}
                        value={newAddr.city}
                        className="w-full p-2.5 bg-slate-100/80 border border-slate-300 rounded-lg text-xs text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none"
                      />
                    </div>
                    <div className="cursor-not-allowed">
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 px-0.5">State *</label>
                      <input
                        type="text"
                        placeholder="State *"
                        required
                        readOnly
                        tabIndex={-1}
                        onFocus={(e) => e.target.blur()}
                        value={newAddr.state}
                        className="w-full p-2.5 bg-slate-100/80 border border-slate-300 rounded-lg text-xs text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="mMakeDefault"
                      checked={newAddr.isDefault}
                      onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="mMakeDefault" className="text-xs text-stone-700 cursor-pointer select-none">
                      Make this default address
                    </label>
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded-lg text-xs shadow-xs active:scale-[0.96]">
                    {editingAddrId ? "Update Address" : "Save Address"}
                  </button>
                </form>
              )}

              <div className="divide-y divide-slate-100">
                {userAddresses.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    No saved delivery addresses yet. Tap &quot;+ Add New&quot; above to add one.
                  </div>
                ) : (
                  userAddresses.map((addr) => {
                    const isHome = addr.addressType !== "WORK";
                    return (
                      <div key={addr.id} className="py-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isHome ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                              }`}>
                              {isHome ? "🏠 Home" : "🏢 Work"}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleStartEditAddress(addr)} className="text-primary font-bold text-[11px] hover:underline">
                              Edit
                            </button>
                            <button onClick={() => removeAddress(addr.id)} className="text-stone-400 hover:text-red-600 text-[11px]">
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900">
                          {addr.fullName} <span className="font-normal text-slate-600 ml-2">{addr.phone}</span>
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          {addr.street}
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-stone-500">📍 Landmark: {addr.landmark}</p>
                        )}
                        <p className="text-slate-700 font-medium">
                          {addr.city}, {addr.state} - <strong className="text-slate-900">{addr.zipCode}</strong>
                        </p>

                        {!addr.isDefault && (
                          <div className="pt-1">
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[10px] text-stone-600 border border-stone-300 rounded px-2.5 py-1 hover:bg-stone-50 font-bold"
                            >
                              Set as Default
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : mobileSubView === "payments" ? (
          /* MOBILE SUB-VIEW: SAVED PAYMENTS & UPI */
          <div className="bg-white min-h-screen">
            <div className="p-4 bg-white border-b border-stone-200/80 flex items-center gap-3 sticky top-0 z-10">
              <button onClick={() => setMobileSubView(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">
                ←
              </button>
              <h2 className="font-extrabold text-sm text-stone-900">Saved Payments &amp; UPI</h2>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="w-full py-3 px-4 border border-slate-200 text-primary font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <span>+</span>
                <span>{showAddPayment ? "Cancel" : "LINK NEW UPI ID"}</span>
              </button>

              {showAddPayment && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <input
                    type="text"
                    placeholder="Enter UPI VPA (e.g. name@upi)"
                    value={newPaymentUpi}
                    onChange={(e) => setNewPaymentUpi(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded"
                  />
                  <button
                    onClick={() => {
                      if (newPaymentUpi.trim()) {
                        setSavedUpiList((prev) => [
                          ...prev,
                          { id: `upi-${Date.now()}`, provider: "Saved UPI", vpa: newPaymentUpi, isDefault: false },
                        ]);
                        addToast("UPI Linked", `VPA ${newPaymentUpi} saved to account.`, "success");
                        setNewPaymentUpi("");
                        setShowAddPayment(false);
                      }
                    }}
                    className="w-full py-2.5 bg-primary text-white font-bold rounded"
                  >
                    Save VPA
                  </button>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {savedUpiList.map((upi) => (
                  <div key={upi.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{upi.provider}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{upi.vpa}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSavedUpiList((prev) => prev.filter((u) => u.id !== upi.id));
                        addToast("UPI Removed", "VPA deleted from account.", "info");
                      }}
                      className="text-red-500 font-semibold hover:underline text-[11px]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : mobileSubView === "support" ? (
          /* MOBILE SUB-VIEW: HELP DESK & TICKETS */
          <div className="bg-white min-h-screen">
            <div className="p-4 bg-white border-b border-stone-200/80 flex items-center gap-3 sticky top-0 z-10">
              <button onClick={() => setMobileSubView(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 text-sm font-bold">
                ←
              </button>
              <h2 className="font-extrabold text-sm text-stone-900">Help Desk &amp; Tickets</h2>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <form onSubmit={handleAddTicket} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Raise Support Ticket</h4>
                <textarea
                  rows={3}
                  placeholder="Describe your inquiry..."
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded resize-none"
                />
                <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded">
                  Submit Ticket
                </button>
              </form>

              <div className="divide-y divide-slate-100">
                {supportTickets.map((t) => (
                  <div key={t.id} className="py-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{t.id}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{t.message}</p>
                    <p className="text-[10px] text-slate-400">Submitted: {t.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MOBILE MAIN DASHBOARD MENU (Beadu Artisan UI/UX) */
          <div className="p-4 space-y-4">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-13 h-13 rounded-full bg-[#792c14] text-white font-extrabold flex items-center justify-center text-base shadow-sm ring-4 ring-[#792c14]/10 shrink-0">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">Welcome back,</span>
                  <h2 className="font-extrabold text-sm sm:text-base text-stone-900 truncate leading-tight">
                    {user?.name || "Member"}
                  </h2>
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">{user?.email || profileData.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileSubView("edit-profile")}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Quick Stat Shortcuts */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMobileSubView("orders")}
                className="bg-white rounded-xl border border-stone-200/80 p-3 text-center hover:bg-stone-50 transition-all active:scale-[0.97] shadow-xs"
              >
                <span className="block text-base font-extrabold text-[#792c14]">{userOrders.length}</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Orders</span>
              </button>
              <Link
                href="/wishlist"
                className="bg-white rounded-xl border border-stone-200/80 p-3 text-center hover:bg-stone-50 transition-all active:scale-[0.97] shadow-xs block"
              >
                <span className="block text-base font-extrabold text-[#792c14]">{wishlist.length}</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Wishlist</span>
              </Link>
              <button
                onClick={() => setMobileSubView("addresses")}
                className="bg-white rounded-xl border border-stone-200/80 p-3 text-center hover:bg-stone-50 transition-all active:scale-[0.97] shadow-xs"
              >
                <span className="block text-base font-extrabold text-[#792c14]">{userAddresses.length}</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Addresses</span>
              </button>
            </div>

            {/* Account Settings Section */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 mb-2">
                Account Settings
              </h3>
              <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
                <button
                  onClick={() => setMobileSubView("edit-profile")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#792c14] flex items-center justify-center shrink-0 border border-amber-100/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-stone-800 block">Edit Profile</span>
                      <span className="text-[10px] text-stone-400 block truncate">Personal info, email &amp; phone</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setMobileSubView("addresses")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-stone-800 block">Saved Addresses</span>
                      <span className="text-[10px] text-stone-400 block truncate">{userAddresses.length} delivery address{userAddresses.length === 1 ? "" : "es"} saved</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setMobileSubView("payments")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-stone-800 block">Saved Credit / Debit &amp; UPI</span>
                      <span className="text-[10px] text-stone-400 block truncate">Google Pay, PhonePe, Cards linked</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* My Activity Section */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 mb-2">
                My Activity
              </h3>
              <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
                <button
                  onClick={() => setMobileSubView("orders")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#792c14] flex items-center justify-center shrink-0 border border-orange-100/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 block">My Orders</span>
                        <span className="bg-[#792c14]/10 text-[#792c14] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {orders.length}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 block truncate">Track live shipments, invoices &amp; returns</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setMobileSubView("support")}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-stone-800 block">Help Desk &amp; Tickets</span>
                      <span className="text-[10px] text-stone-400 block truncate">24/7 artisan order assistance &amp; tickets</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Logout and Footer */}
            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 font-bold text-xs hover:text-[#792c14] hover:bg-stone-50 transition-colors active:scale-[0.98]"
              >
                Log Out
              </button>
              <p className="text-[10px] text-stone-400 font-medium">
                Beadu Artisan Jewellery • Handcrafted with love in India
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP E-COMMERCE DASHBOARD VIEW (Visible on Medium / Large Screens) */}
      {/* ========================================================================= */}
      <main className="hidden md:block flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="md:col-span-3 space-y-4">
            {/* Top User Greeting Card */}
            <div className="clay-panel p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#792c14] text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-xs ring-4 ring-[#792c14]/10">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-muted-foreground font-medium block uppercase tracking-wider">Hello,</span>
                <h2 className="font-heading text-2xl text-foreground truncate mt-0.5">{user?.name || "Member"}</h2>
              </div>
            </div>

            {/* Structured Navigation Panel */}
            <div className="clay-panel overflow-hidden p-2.5 text-xs space-y-3">
              {/* ORDERS */}
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Orders
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer group ${
                    activeTab === "orders"
                      ? "bg-[#792c14] text-white font-bold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "orders" ? "bg-white/20 text-white" : "bg-orange-50 text-[#792c14]"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="truncate">My Orders</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === "orders"
                        ? "bg-white/20 text-white"
                        : "bg-[#792c14]/10 text-[#792c14]"
                    }`}>
                      {userOrders.length}
                    </span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === "orders" ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* ACCOUNT SETTINGS */}
              <div className="pt-2 border-t border-stone-100 space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Account Settings
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer group ${
                    activeTab === "profile"
                      ? "bg-[#792c14] text-white font-bold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "profile" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="truncate">Profile Information</span>
                  </div>
                  <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === "profile" ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer group ${
                    activeTab === "addresses"
                      ? "bg-[#792c14] text-white font-bold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "addresses" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="truncate">Manage Addresses</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {userAddresses.length > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeTab === "addresses"
                          ? "bg-white/20 text-white"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {userAddresses.length}
                      </span>
                    )}
                    <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === "addresses" ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* PAYMENTS & SUPPORT */}
              <div className="pt-2 border-t border-stone-100 space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Payments &amp; Support
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer group ${
                    activeTab === "payments"
                      ? "bg-[#792c14] text-white font-bold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "payments" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="truncate">Saved UPI &amp; Cards</span>
                  </div>
                  <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === "payments" ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer group ${
                    activeTab === "support"
                      ? "bg-[#792c14] text-white font-bold shadow-xs"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "support" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="truncate">Help Desk &amp; Tickets</span>
                  </div>
                  <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === "support" ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* LOGOUT BUTTON */}
              <div className="pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-100 text-stone-600 hover:text-[#792c14] font-semibold text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <section className="md:col-span-9 clay-panel p-8 min-h-[520px]">
            {/* 1. PROFILE INFORMATION TAB */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-border/40 pb-4 mb-6">
                    <h3 className="font-heading text-3xl text-foreground">Personal Information</h3>
                    <button
                      onClick={() => setIsEditingEmail(!isEditingEmail)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isEditingEmail ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        updateProfile(`${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim() || "Member");
                        addToast("Profile Updated", "Personal information saved successfully.", "success");
                      }}
                      className="px-6 py-2.5 bg-[#7c2d12] hover:bg-[#9a3412] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-base text-slate-900">Email Address</h3>
                  </div>
                  <div className="max-w-md">
                    <input
                      type="email"
                      value={user?.email || profileData.email}
                      readOnly
                      className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-base text-slate-900">Mobile Number</h3>
                    <button
                      onClick={() => setIsEditingPhone(!isEditingPhone)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isEditingPhone ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  <div className="max-w-md">
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. MANAGE ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                  <h3 className="font-heading text-3xl text-foreground">Manage Addresses</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddrId(null);
                      setNewAddr({
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
                      setShowAddAddr(!showAddAddr);
                    }}
                    className="text-xs font-bold text-[#7c2d12] hover:text-[#9a3412] hover:underline flex items-center gap-1.5 transition-colors"
                  >
                    {showAddAddr ? "✕ Cancel" : "+ Add New Address"}
                  </button>
                </div>

                {showAddAddr && (
                  <form onSubmit={handleSaveAddress} className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4 text-xs animate-in fade-in">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        {editingAddrId ? "Edit Address Details" : "Add New Delivery Address"}
                      </h4>
                    </div>

                    {/* Address Type Buttons */}
                    <div className="space-y-1">
                      <label className="block font-bold text-stone-700 text-[11px]">Address Type</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewAddr({ ...newAddr, addressType: "HOME" })}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${newAddr.addressType === "HOME"
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-white text-stone-700 border-stone-300"
                            }`}
                        >
                          🏠 Home
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewAddr({ ...newAddr, addressType: "WORK" })}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${newAddr.addressType === "WORK"
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-white text-stone-700 border-stone-300"
                            }`}
                        >
                          🏢 Work / Office
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-bold text-[11px] mb-1">Name *</label>
                        <input
                          type="text"
                          placeholder="Name"
                          required
                          value={newAddr.fullName}
                          onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-bold text-[11px] mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          required
                          maxLength={10}
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold text-[11px] mb-1">Address *</label>
                      <input
                        type="text"
                        placeholder="House / Flat no., Street address"
                        required
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold text-[11px] mb-1">Landmark (Optional)</label>
                      <input
                        type="text"
                        placeholder="Landmark"
                        value={newAddr.landmark}
                        onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-700 font-bold text-[11px] mb-1">PIN Code *</label>
                        <input
                          type="text"
                          placeholder="PIN Code"
                          required
                          maxLength={6}
                          value={newAddr.zipCode}
                          onChange={(e) => handleProfileZipChange(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                        />
                      </div>
                      <div className="cursor-not-allowed">
                        <label className="block text-stone-700 font-bold text-[11px] mb-1">City *</label>
                        <input
                          type="text"
                          placeholder="City"
                          required
                          readOnly
                          tabIndex={-1}
                          onFocus={(e) => e.target.blur()}
                          value={newAddr.city}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100/80 text-xs text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none"
                        />
                      </div>
                      <div className="cursor-not-allowed">
                        <label className="block text-stone-700 font-bold text-[11px] mb-1">State *</label>
                        <input
                          type="text"
                          placeholder="State"
                          required
                          readOnly
                          tabIndex={-1}
                          onFocus={(e) => e.target.blur()}
                          value={newAddr.state}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100/80 text-xs text-stone-700 pointer-events-none select-none caret-transparent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="dMakeDefault"
                        checked={newAddr.isDefault}
                        onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="dMakeDefault" className="text-xs text-stone-700 cursor-pointer select-none">
                        Set as primary default address
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button type="submit" className="gold-shimmer text-white font-bold px-6 py-2.5 rounded-full shadow-sm active:scale-[0.96]">
                        {editingAddrId ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAddr(false);
                          setEditingAddrId(null);
                        }}
                        className="px-4 py-2 border border-stone-300 rounded-full text-stone-600 font-bold text-xs hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {userAddresses.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs space-y-2">
                      <p>No saved delivery addresses yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddrId(null);
                          setNewAddr({
                            fullName: user?.name || "",
                            email: user?.email || "",
                            street: "",
                            landmark: "",
                            city: "",
                            state: "",
                            zipCode: "",
                            phone: "",
                            addressType: "HOME",
                            isDefault: true,
                          });
                          setShowAddAddr(true);
                        }}
                        className="font-bold text-[#7c2d12] hover:underline inline-block"
                      >
                        + Add your first address
                      </button>
                    </div>
                  ) : (
                    userAddresses.map((addr) => {
                      const isHome = addr.addressType !== "WORK";
                      return (
                        <div key={addr.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-2 relative text-xs hover:shadow-xs transition-shadow">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isHome ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                                }`}>
                                {isHome ? "🏠 Home" : "🏢 Work"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                                  Default Address
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleStartEditAddress(addr)} className="text-primary font-bold hover:underline text-[11px]">
                                Edit
                              </button>
                              <button onClick={() => removeAddress(addr.id)} className="text-stone-400 hover:text-red-600 text-[11px]">
                                Delete
                              </button>
                            </div>
                          </div>

                          <p className="font-bold text-slate-900 text-sm">
                            {addr.fullName} <span className="font-normal text-slate-600 ml-2 text-xs">📞 +91 {addr.phone}</span>
                          </p>
                          <p className="text-slate-600 leading-relaxed">
                            {addr.street}
                          </p>
                          {addr.landmark && (
                            <p className="text-[11px] text-stone-500 font-medium">📍 Landmark: {addr.landmark}</p>
                          )}
                          <p className="text-slate-700 font-medium">
                            {addr.city}, {addr.state} - <strong className="text-slate-900">{addr.zipCode}</strong>
                          </p>

                          {!addr.isDefault && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                              <button
                                onClick={() => setDefaultAddress(addr.id)}
                                className="text-[11px] text-stone-700 border border-slate-300 rounded px-3 py-1 hover:bg-slate-50 font-bold transition-colors"
                              >
                                Set as Default
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. MY ORDERS TAB (LAPTOP / DESKTOP VIEW) */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in">
                {/* Header with Title, Count, and Search/Filter Bar */}
                <div className="border-b border-border/40 pb-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading text-3xl text-foreground font-normal">My Orders</h3>
                      <span className="bg-[#792c14]/10 text-[#792c14] font-bold text-xs px-3 py-1 rounded-full">
                        {userOrders.length} {userOrders.length === 1 ? "order" : "orders"}
                      </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="Search by Order ID or item..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 focus:border-[#792c14] focus:ring-1 focus:ring-[#792c14] outline-none text-xs bg-white"
                      />
                      <svg
                        className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    {(["All", "In Transit", "Delivered"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setOrderFilter(filter)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          orderFilter === filter
                            ? "bg-[#792c14] text-white shadow-xs"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#792c14]/10 text-[#792c14] flex items-center justify-center mx-auto">
                      <svg className="w-7 h-7 text-[#792c14]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h4 className="font-heading text-lg text-stone-800">
                      {orderSearchQuery ? "No matching orders found" : "You haven't placed any orders yet"}
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      {orderSearchQuery
                        ? "Try adjusting your search query or clear the filter to see all your orders."
                        : "Discover our handcrafted artisan bracelets, personalized beads, and custom jewelry collections."}
                    </p>
                    <Link
                      href="/shop"
                      className="inline-block px-6 py-2.5 rounded-full bg-[#792c14] text-white font-bold text-xs hover:bg-[#68250f] transition-all shadow-md active:scale-95 mt-2"
                    >
                      Start Shopping →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-sm transition-all overflow-hidden text-xs"
                        >
                          {/* Order Header */}
                          <div className="px-5 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-sm text-stone-900 tracking-wide">
                                #{String(order.id).replace(/^ORD-|^#/, "")}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(order.id, "Order ID")}
                                title="Copy Order ID"
                                className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <span className="text-stone-300">•</span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
                                order.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : order.status === "Shipped"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : order.status === "Order Accepted"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : order.status === "Cancelled"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  order.status === "Delivered"
                                    ? "bg-emerald-500"
                                    : order.status === "Shipped"
                                    ? "bg-purple-500"
                                    : order.status === "Order Accepted"
                                    ? "bg-amber-500"
                                    : order.status === "Cancelled"
                                    ? "bg-rose-500"
                                    : "bg-blue-500"
                                }`} />
                                <span>{order.status}</span>
                              </span>
                            </div>
                          </div>

                          {/* Items Section */}
                          <div className="px-5 py-4 divide-y divide-stone-100">
                            {order.items.map((item, idx) => {
                              const isCustom =
                                item.product.id.startsWith("custom") || item.product.category === "Custom Builder";
                              return (
                                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    {isCustom ? (
                                      <CustomBraceletPreview
                                        beads={(item.product as any).customBeads}
                                        previewImage={item.product.image}
                                        size={56}
                                      />
                                    ) : (
                                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                        <Image
                                          src={item.product.image}
                                          alt={item.product.name}
                                          fill
                                          sizes="56px"
                                          className="object-cover"
                                        />
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <h4 className="font-bold text-stone-900 truncate">{item.product.name}</h4>
                                      <p className="text-[11px] text-stone-500 mt-0.5">
                                        Qty: <span className="font-semibold text-stone-700">{item.quantity}</span> × ₹{item.product.price}
                                      </p>
                                      {item.giftWrap && (
                                        <span className="inline-block mt-1 text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200/50">
                                          Gift Wrapped (+₹20)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-extrabold text-sm text-stone-900">
                                      ₹{item.product.price * item.quantity}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Footer & Actions */}
                          <div className="px-5 py-3.5 bg-stone-50/50 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              {order.shippingAddress && (
                                <p className="text-[11px] text-stone-600 truncate">
                                  <span className="font-semibold text-stone-800">Ship to:</span>{" "}
                                  {order.shippingAddress.fullName} ({order.shippingAddress.city}, {order.shippingAddress.state})
                                </p>
                              )}
                              {order.awbNumber && !order.awbNumber.startsWith("DLHV") ? (
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] text-stone-500 font-mono">
                                    Tracking ID: <strong className="text-stone-900">{order.awbNumber}</strong>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(order.awbNumber || "", "Tracking ID")}
                                    className="text-stone-400 hover:text-stone-700 text-[10px] underline cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-amber-800/90 flex items-center gap-1.5 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                  <span>Tracking details assigned upon dispatch</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right mr-1">
                                <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">Total</span>
                                <span className="font-extrabold text-base text-[#792c14]">₹{order.total}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedTrackingOrder(order)}
                                className="px-3.5 py-2 rounded-xl bg-[#792c14] hover:bg-[#68250f] text-white font-semibold text-xs transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                                <span>Track</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Invoice</span>
                              </button>

                              {order.status === "Order Placed" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 font-semibold text-xs transition-colors shadow-2xs active:scale-95 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. PAYMENTS TAB */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <h3 className="font-heading text-3xl text-foreground border-b border-border/40 pb-4 mb-6">Saved UPI &amp; Cards</h3>
                <div className="space-y-3 text-xs">
                  {savedUpiList.map((upi) => (
                    <div key={upi.id} className="p-4 rounded border border-slate-200 bg-white flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{upi.provider}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{upi.vpa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. SUPPORT TAB */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <h3 className="font-heading text-3xl text-foreground border-b border-border/40 pb-4 mb-6">Help Desk &amp; Tickets</h3>
                <form onSubmit={handleAddTicket} className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 text-xs">
                  <textarea
                    rows={3}
                    placeholder="Describe inquiry..."
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded resize-none"
                  />
                  <button type="submit" className="gold-shimmer text-white font-bold px-6 py-2.5 rounded-full shadow-sm active:scale-[0.96]">
                    Submit Ticket
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Live Order Tracking Modal */}
      {selectedTrackingOrder && trackingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTrackingOrder(null)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 z-10 text-xs border border-stone-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-xl text-stone-900">Shipment Tracker</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    selectedTrackingOrder.status === "Delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedTrackingOrder.status === "Shipped"
                      ? "bg-purple-100 text-purple-800"
                      : selectedTrackingOrder.status === "Order Accepted"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {selectedTrackingOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">Order ID: #{String(selectedTrackingOrder.id).replace(/^ORD-|^#/, "")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchRealTimeTracking(selectedTrackingOrder)}
                  disabled={isFetchingLiveTracking}
                  title="Refresh tracking status"
                  className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className={isFetchingLiveTracking ? "animate-spin" : ""}>🔄</span>
                  <span>{isFetchingLiveTracking ? "Checking..." : "Refresh"}</span>
                </button>
                <button
                  onClick={() => setSelectedTrackingOrder(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Courier & AWB Banner */}
            {selectedTrackingOrder.awbNumber && !selectedTrackingOrder.awbNumber.startsWith("DLHV") ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Tracking Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs font-bold text-emerald-950">{selectedTrackingOrder.awbNumber}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedTrackingOrder.awbNumber || "", "Tracking Number")}
                      className="text-emerald-700 hover:underline text-[10px] font-semibold cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-300/70 text-emerald-900 font-semibold text-[11px] shrink-0 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Express Courier Verified</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    {selectedTrackingOrder.status === "Order Accepted"
                      ? "Order Accepted — Preparing for Courier Handover"
                      : "Order Placed — Order Confirmed & Queued"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Live tracking updates will activate as soon as the package is handed over to the courier partner.
                </p>
              </div>
            )}

            {/* Estimated Delivery Note */}
            <div className="flex items-center justify-between text-[11px] px-1 text-stone-600">
              <span>Expected Delivery:</span>
              <strong className="text-[#792c14] font-bold">{trackingDetails.estimatedDeliveryDate}</strong>
            </div>

            {/* Tracking Steps Timeline */}
            <div className="space-y-4 pt-2 border-t border-stone-100">
              {trackingDetails.steps.map((step: any, idx: number) => {
                const isLast = idx === trackingDetails.steps.length - 1;
                return (
                  <div key={idx} className="flex items-start gap-3.5 relative">
                    {/* Connecting Vertical Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-0.5 -translate-x-1/2 ${
                          step.completed ? "bg-emerald-500" : "bg-stone-200"
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-colors ${
                        step.completed
                          ? "bg-emerald-600 text-white shadow-2xs ring-4 ring-emerald-100"
                          : "bg-stone-100 text-stone-400 border border-stone-300"
                      }`}
                    >
                      {step.completed ? "✓" : idx + 1}
                    </div>

                    {/* Step Info */}
                    <div className="space-y-0.5 flex-1 min-w-0 pb-3">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`font-bold text-xs ${step.completed ? "text-stone-900" : "text-stone-400"}`}>
                          {step.status}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        {step.description}
                      </p>
                      {step.location && (
                        <p className="text-[10px] text-stone-400 font-medium">
                          📍 {step.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedInvoiceOrder(null)} />
          <div className="relative bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl space-y-4 z-10 text-xs border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-slate-900">Tax Invoice (#{String(selectedInvoiceOrder.id).replace(/^ORD-|^#/, "")})</h3>
              <button onClick={() => setSelectedInvoiceOrder(null)}>✕</button>
            </div>
            <p className="font-bold text-slate-900">Total Paid: ₹{selectedInvoiceOrder.total}</p>
            <button onClick={() => window.print()} className="bg-primary text-white font-bold px-4 py-2 rounded">
              🖨️ Print PDF
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNavigation />
    </div>
  );
}
