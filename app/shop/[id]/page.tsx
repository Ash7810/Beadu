"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { checkDelhiveryServiceability, ServiceabilityResult } from "@/lib/delhivery";
import { useEcomStore } from "@/store/ecomStore";
import { ReviewSection } from "@/components/ecom/ReviewSection";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const isCustom = id.startsWith("custom");
  const foundProduct = PRODUCTS_CATALOG.find((p) => p.id === id);

  if (!isCustom && !foundProduct) {
    notFound();
  }

  const product = isCustom
    ? {
        id,
        name: "Bespoke Custom Handcrafted Bracelet",
        price: 499,
        originalPrice: 699,
        rating: 5.0,
        reviewsCount: 1,
        category: "Custom Builder" as const,
        material: "Wooden Beads" as const,
        image: "/beads/pomelli_photoshoot_image_1_1_0726.png",
        images: ["/beads/pomelli_photoshoot_image_1_1_0726.png"],
        description: "Custom artisan bracelet created in the Beadu digital customizer studio.",
        details: [
          "Custom bead strand combination",
          "Hand-finished in signature velvet box",
          "Free Express Insured Shipping across India",
        ],
        inStock: true,
      }
    : foundProduct!;

  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [pincode, setPincode] = useState<string>("");
  const [pinResult, setPinResult] = useState<ServiceabilityResult | null>(null);

  const { addToCart, toggleWishlist, isInWishlist, addToast, cart, updateQuantity, getProductStock } = useEcomStore();
  const isFav = isInWishlist(product.id);
  const cartItem = cart.find(c => c.product.id === product.id);
  const currentStock = getProductStock(product.id);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 4;
  const isMaxInCart = cartItem ? cartItem.quantity >= currentStock : false;

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      addToast("Invalid PIN", "Please enter a valid PIN code.", "warning");
      return;
    }
    const res = checkDelhiveryServiceability(pincode);
    setPinResult(res);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 py-6 sm:py-8 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        {/* Breadcrumb Links */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-[300px]">{product.name}</span>
        </div>

        {/* Main Product Layout Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start mb-16">
          {/* Left Column: Image Gallery System */}
          <div className="space-y-4">
            {/* Active Large Image Container with Arrow Navigation - Solid Surfaces */}
            <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-50 shadow-sm group z-0">
              <Image
                key={selectedImage}
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                quality={95}
                className="object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-black/[0.1] pointer-events-none" />

              {/* Wishlist Button - Solid white surface */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-3 sm:top-4 end-3 sm:end-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center text-lg shadow-sm hover:bg-gray-50 active:scale-[0.96] z-10 ring-1 ring-black/[0.08]"
                aria-label="Wishlist"
              >
                <svg
                  className={`w-5 h-5 transition-[color,fill] duration-300 ${
                    isFav ? "text-red-500 fill-red-500" : "text-gray-400 fill-none"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {/* Arrow Navigation - Solid white surfaces */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const currentIdx = product.images.indexOf(selectedImage);
                      const prevIdx = currentIdx <= 0 ? product.images.length - 1 : currentIdx - 1;
                      setSelectedImage(product.images[prevIdx]);
                    }}
                    className="absolute start-3 sm:start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md ring-1 ring-black/[0.08] opacity-90 sm:opacity-0 group-hover:opacity-100 hover:bg-gray-50 active:scale-[0.96] transition-all z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const currentIdx = product.images.indexOf(selectedImage);
                      const nextIdx = currentIdx >= product.images.length - 1 ? 0 : currentIdx + 1;
                      setSelectedImage(product.images[nextIdx]);
                    }}
                    className="absolute end-3 sm:end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md ring-1 ring-black/[0.08] opacity-90 sm:opacity-0 group-hover:opacity-100 hover:bg-gray-50 active:scale-[0.96] transition-all z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/70 px-3 py-1.5 rounded-full">
                    {product.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`rounded-full transition-all duration-300 ${
                          selectedImage === imgUrl
                            ? "w-4 h-1.5 bg-white shadow-xs"
                            : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                        }`}
                        aria-label={`View image ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Image Counter */}
                  <span className="absolute top-3 sm:top-4 start-3 sm:start-4 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10">
                    {product.images.indexOf(selectedImage) + 1} / {product.images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Gallery Strip with Snapping and Padding */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x [scroll-padding-inline:0.5rem]">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 snap-start border-2 ring-1 ring-black/10 transition-[transform,border-color,opacity,box-shadow] duration-150 ease-out active:scale-[0.96] ${
                      selectedImage === imgUrl
                        ? "border-primary ring-2 ring-primary/20 scale-95 shadow-md"
                        : "border-border/40 opacity-70 hover:opacity-100 hover:border-border"
                    }`}
                  >
                    <Image src={imgUrl} alt={`${product.name} view ${idx + 1}`} fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Controls */}
          <div className="flex flex-col space-y-8 sm:space-y-10">
            {/* 1. Header Group */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block mb-3">
                  {product.material}
                </span>
                <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl text-foreground font-normal leading-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-500 text-sm">
                    {"★".repeat(Math.floor(product.rating))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{product.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">({product.reviewsCount} reviews)</span>
              </div>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl sm:text-3xl font-bold text-foreground">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-base sm:text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
                <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full ms-2 shadow-xs border border-green-200">
                  Free Delivery
                </span>
              </div>

              {/* Live Inventory Stock Badge */}
              <div className="pt-2">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Out of Stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>⚡ Only {currentStock} left in stock - order soon!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>✓ In Stock ({currentStock} available)</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Content Group */}
            <div className="space-y-6">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              <div className="clay-panel p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-3xl space-y-3 border border-border/40">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Artisan Details</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  {product.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isCustom && (
                <div className="clay-panel p-4 sm:p-5 bg-primary/5 rounded-2xl sm:rounded-3xl border border-primary/20 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Custom Creation</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This piece was customized in our studio. Edit your strand or design a new one anytime.
                  </p>
                  <Link
                    href="/builder"
                    className="gold-shimmer text-on-primary-container text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm active:scale-[0.96]"
                  >
                    Open Custom Builder →
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Action Group (Desktop in-flow, Mobile uses sticky bottom bar) */}
            <div className="space-y-6 pt-6 border-t border-border/30">
              <div className="hidden md:flex flex-col sm:flex-row items-stretch gap-3">
                {!isCustom ? (
                  <>
                    {/* Primary CTA */}
                    {cartItem ? (
                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                        <div className="flex items-center justify-between bg-white border-2 border-[#7c2d12] h-[3.5rem] rounded-2xl shadow-sm px-1 w-full sm:w-[140px] shrink-0">
                          <button
                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-[#7c2d12] font-bold text-xl hover:bg-orange-50 rounded-xl transition-colors active:scale-[0.96]"
                          >
                            -
                          </button>
                          <span className="font-bold text-[#7c2d12] text-lg text-center select-none min-w-[2ch]">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                            disabled={isMaxInCart}
                            className={`w-10 h-10 flex items-center justify-center text-[#7c2d12] font-bold text-xl hover:bg-orange-50 rounded-xl transition-colors active:scale-[0.96] ${isMaxInCart ? "opacity-30 cursor-not-allowed" : ""}`}
                          >
                            +
                          </button>
                        </div>
                        <Link 
                          href="/cart"
                          className="flex-1 w-full bg-[#7c2d12] hover:bg-[#9a3412] text-white text-sm font-bold uppercase tracking-wider h-[3.5rem] rounded-2xl shadow-md transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] flex items-center justify-center gap-2"
                        >
                          View Bag →
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isOutOfStock) {
                            addToCart(product, 1);
                          }
                        }}
                        disabled={isOutOfStock}
                        className="flex-1 bg-[#7c2d12] hover:bg-[#9a3412] text-white text-sm font-bold uppercase tracking-wider h-[3.5rem] rounded-2xl shadow-md transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                      >
                        {!isOutOfStock ? (
                          <span>🛒 Add to Bag</span>
                        ) : (
                          <span>Out of Stock</span>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <Link
                    href="/builder"
                    className="flex-1 gold-shimmer text-on-primary-container text-sm font-bold uppercase tracking-wider h-[3.5rem] rounded-2xl shadow-md active:scale-[0.96] flex items-center justify-center gap-2"
                  >
                    <span>Resume Editing in Builder →</span>
                  </Link>
                )}
              </div>

              {/* Delivery Check - 16px font-size floor on mobile */}
              <div className="clay-panel p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-3xl space-y-4 border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🚚</span>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Delivery Check</h4>
                  </div>
                  <span className="text-[10px] text-primary/70 font-bold bg-primary/10 px-2 py-1 rounded-md">Live</span>
                </div>

                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter PIN code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="clay-input flex-1 h-[3rem] text-base sm:text-sm px-4 rounded-xl border border-border/40 bg-white"
                  />
                  <button
                    type="submit"
                    className="bg-foreground text-background text-xs font-bold px-5 h-[3rem] rounded-xl shadow-sm hover:bg-foreground/90 active:scale-[0.96] transition-all"
                  >
                    Check
                  </button>
                </form>

                {pinResult && (
                  <div className={`p-3.5 rounded-xl text-sm font-medium transition-all ${pinResult.serviceable ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"}`}>
                    <p className="font-bold flex items-center gap-2">
                      {pinResult.serviceable ? '✓' : '✗'} {pinResult.message}
                    </p>
                    {pinResult.serviceable && (
                      <p className="text-[11px] mt-1.5 opacity-80 uppercase tracking-wider font-semibold">
                        Via {pinResult.courierPartner} • Surface Delivery
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Amazon/Flipkart & Blinkit Minimal Production Review Section */}
        <ReviewSection
          productId={product.id}
          productName={product.name}
        />
      </main>

      {/* Solid Mobile Sticky Action Bar - Above Bottom Navigation */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 md:hidden bg-background border-t border-border px-4 py-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Price</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            {!isCustom ? (
              cartItem ? (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-10 flex items-center justify-between bg-white border border-[#7c2d12] rounded-full px-1 shadow-xs tabular-nums">
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center font-bold text-[#7c2d12] hover:bg-orange-50 rounded-full text-sm active:scale-[0.96]"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs text-[#7c2d12] font-mono">{cartItem.quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      disabled={isMaxInCart}
                      title={isMaxInCart ? `Max stock (${currentStock}) reached` : "Add one more"}
                      className={`w-7 h-7 flex items-center justify-center font-bold text-[#7c2d12] hover:bg-orange-50 rounded-full text-sm active:scale-[0.96] ${
                        isMaxInCart ? "opacity-30 cursor-not-allowed" : ""
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <Link
                    href="/cart"
                    className="h-10 px-4 bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase rounded-full flex items-center justify-center shadow-sm transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]"
                  >
                    Bag →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!isOutOfStock) {
                      addToCart(product, 1);
                    }
                  }}
                  disabled={isOutOfStock}
                  className="h-10 px-6 bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isOutOfStock ? <span>🛒 Add to Bag</span> : <span>Out of Stock</span>}
                </button>
              )
            ) : (
              <Link
                href="/builder"
                className="h-10 px-4 gold-shimmer text-on-primary-container text-xs font-bold uppercase rounded-full shadow-md flex items-center justify-center"
              >
                Custom Builder →
              </Link>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <BottomNavigation />
      <Toast />
    </div>
  );
}
