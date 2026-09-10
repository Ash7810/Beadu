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
  }, []);

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
  const userOrders = orders.filter((o) =>
    user
      ? o.userId === user.id ||
        (!o.userId && o.shippingAddress?.email?.toLowerCase() === user.email.toLowerCase())
      : false
  );

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

  let trackingDetails = null;
  if (selectedTrackingOrder) {
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
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      orderFilter === filter
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
                                {order.status === "Delivered" ? "Delivered on " : "In Transit • "}
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
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full"
                        >
                          🚚 Live Tracking
                        </button>
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200"
                        >
                          🧾 Tax Invoice
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
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                        newAddr.addressType === "HOME"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-stone-700 border-stone-300"
                      }`}
                    >
                      🏠 Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAddr({ ...newAddr, addressType: "WORK" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                        newAddr.addressType === "WORK"
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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isHome ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
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
                Beadu Artisan Jewellery • Handcrafted with love in India ✨
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
            <div className="clay-panel overflow-hidden text-xs divide-y divide-border/40">
              {/* MY ORDERS */}
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full p-4 font-bold flex justify-between items-center transition-colors text-left ${
                  activeTab === "orders" ? "bg-sky-50/70 text-primary" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary text-base">📦</span>
                  <span className="uppercase tracking-wider">My Orders</span>
                </div>
                <span className="text-slate-400 font-normal text-sm">›</span>
              </button>

              {/* ACCOUNT SETTINGS SECTION */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <span>👤</span>
                  <span>Account Settings</span>
                </div>
                <div className="pl-7 space-y-2">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`block text-left w-full transition-colors ${
                      activeTab === "profile" ? "font-bold text-primary" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`block text-left w-full transition-colors ${
                      activeTab === "addresses" ? "font-bold text-primary" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Manage Addresses
                  </button>
                </div>
              </div>

              {/* PAYMENTS SECTION */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <span>💳</span>
                  <span>Payments</span>
                </div>
                <div className="pl-7 space-y-2">
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`block text-left w-full transition-colors ${
                      activeTab === "payments" ? "font-bold text-primary" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Saved UPI &amp; Cards
                  </button>
                </div>
              </div>

              {/* SUPPORT SECTION */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <span>💬</span>
                  <span>Customer Support</span>
                </div>
                <div className="pl-7 space-y-2">
                  <button
                    onClick={() => setActiveTab("support")}
                    className={`block text-left w-full transition-colors ${
                      activeTab === "support" ? "font-bold text-primary" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Help Desk &amp; Tickets
                  </button>
                </div>
              </div>

              {/* LOGOUT BUTTON */}
              <div className="p-3 bg-stone-50/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-[#792c14] hover:bg-stone-50 font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98] shadow-2xs"
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
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                            newAddr.addressType === "HOME"
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-white text-stone-700 border-stone-300"
                          }`}
                        >
                          🏠 Home
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewAddr({ ...newAddr, addressType: "WORK" })}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                            newAddr.addressType === "WORK"
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
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                isHome ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
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

            {/* 3. MY ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="font-heading text-3xl text-foreground border-b border-border/40 pb-4 mb-6">My Orders</h3>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded border border-slate-200 bg-white p-5 space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="font-bold text-slate-900">{order.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTrackingOrder(order)}
                            className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded"
                          >
                            🚚 Live Tracking
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1 rounded border border-slate-200"
                          >
                            🧾 Tax Invoice
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <CustomBraceletPreview beads={(item.product as any).customBeads} previewImage={item.product.image} size={52} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{item.product.name}</p>
                              <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.product.price}</p>
                            </div>
                            <span className="font-bold text-slate-900">₹{item.product.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Tracking Modal */}
      {selectedTrackingOrder && trackingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedTrackingOrder(null)} />
          <div className="relative bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl space-y-4 z-10 text-xs border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-slate-900">Live Order Tracking ({selectedTrackingOrder.id})</h3>
              <button onClick={() => setSelectedTrackingOrder(null)}>✕</button>
            </div>
            <p className="font-bold text-primary">Estimated Delivery: {trackingDetails.estimatedDeliveryDate}</p>
            <div className="space-y-3">
              {trackingDetails.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="font-bold">{step.completed ? "✓" : "○"}</span>
                  <div>
                    <p className="font-bold">{step.status}</p>
                    <p className="text-[11px] text-slate-500">{step.location} • {step.timestamp}</p>
                  </div>
                </div>
              ))}
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
              <h3 className="font-bold text-sm text-slate-900">Tax Invoice (#{selectedInvoiceOrder.id})</h3>
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
