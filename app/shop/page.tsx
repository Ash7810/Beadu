"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { PRODUCTS_CATALOG, PRODUCT_CATEGORIES, MATERIAL_FILTERS, Product } from "@/lib/ecomData";
import { useEcomStore } from "@/store/ecomStore";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialQuery = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("All Materials");
  const [maxPrice, setMaxPrice] = useState<number>(1200);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [localSearch, setLocalSearch] = useState<string>(initialQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { cart, addToCart, toggleWishlist, isInWishlist, updateQuantity, getProductRatingInfo, getProductStock } = useEcomStore();

  useEffect(() => {
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    if (query !== null) setLocalSearch(query);
    if (category !== null) setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 500);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS_CATALOG.filter((p) => {
      // Category filter
      if (selectedCategory !== "All" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Material filter
      if (selectedMaterial !== "All Materials" && p.material !== selectedMaterial) {
        return false;
      }
      // Price filter
      if (p.price > maxPrice) {
        return false;
      }
      // Search query
      if (
        localSearch.trim() &&
        !p.name.toLowerCase().includes(localSearch.toLowerCase()) &&
        !p.description.toLowerCase().includes(localSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [selectedCategory, selectedMaterial, maxPrice, localSearch, sortBy]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedMaterial("All Materials");
    setMaxPrice(1200);
    setLocalSearch("");
    setSortBy("featured");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-2 sm:px-6 md:px-10 lg:px-12 pt-3.5 sm:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        {/* Quick Category Pills with Peeking Affordance */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-2.5 sm:pb-3 sm:mb-6 snap-x snap-mandatory px-2 sm:px-0 -mx-2 sm:mx-0 [scroll-padding-inline:0.5rem]">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] min-h-[38px] flex items-center justify-center ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search Input with 16px font-size floor on mobile */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search catalog..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full clay-input py-2 text-base sm:text-xs min-h-[42px] pe-9"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute inset-inline-end-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs rounded-full hover:bg-muted/80 transition-colors"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden px-3.5 min-h-[42px] bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform duration-150 ease-out active:scale-[0.96] shrink-0"
              aria-label="Filter products"
            >
              <span className="text-sm">⚙</span>
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-muted-foreground font-semibold">
              Showing {filteredProducts.length} items
            </span>

            {/* Sort Dropdown with 16px font-size floor on mobile */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="clay-input py-2 px-3 text-base sm:text-xs font-semibold bg-background min-h-[42px]"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Main Grid Split: Sidebar + Products */}
        <div className="flex gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-1/4 clay-panel p-6 sticky top-28 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-border/40">
              <h3 className="font-heading text-lg font-normal text-foreground">Filters</h3>
              <button onClick={clearFilters} className="text-[11px] text-primary font-bold hover:underline">
                Reset All
              </button>
            </div>

            {/* Material Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Material</h4>
              <div className="space-y-1.5">
                {MATERIAL_FILTERS.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === mat}
                      onChange={() => setSelectedMaterial(mat)}
                      className="accent-primary"
                    />
                    <span>{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground">Max Price:</span>
                <span className="text-primary font-bold">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="199"
                max="1200"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </aside>

          {/* Product Grid Container */}
          <div className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <div className="clay-panel p-12 text-center space-y-4 my-8">
                <p className="text-3xl">🔍</p>
                <h3 className="font-heading text-xl text-foreground">No Items Found</h3>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your filters or search term to discover more pieces.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
              >
                {filteredProducts.map((product) => {
                  const isFav = isInWishlist(product.id);
                  const cartItem = cart.find((i) => i.product.id === product.id);
                  const stock = getProductStock(product.id);
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 4;
                  const isMaxInCart = cartItem ? cartItem.quantity >= stock : false;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-md border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between"
                    >
                      {/* Product Image Frame */}
                      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                        />
                        {/* 1px subtle inner depth ring */}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.06] pointer-events-none rounded-t-md" />

                        {/* Stock Badge */}
                        {isOutOfStock ? (
                          <div className="absolute top-2.5 start-2.5 bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                            Out of Stock
                          </div>
                        ) : isLowStock ? (
                          <div className="absolute top-2.5 start-2.5 bg-amber-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow-sm z-10 animate-pulse">
                            Only {stock} left!
                          </div>
                        ) : null}

                        {/* Circular Solid White Wishlist Button (matching mobile card exact size) */}
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md active:scale-[0.96] z-10"
                          aria-label="Wishlist"
                        >
                          <svg
                            className={`w-4 h-4 transition-all duration-300 ${
                              isFav ? "text-red-500 fill-red-500 stroke-red-500 scale-110" : "text-slate-400 fill-none stroke-current"
                            }`}
                            viewBox="0 0 24 24"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>

                      {/* Info & Details (matching mobile card typography, padding & shape) */}
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div className="mb-2">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                              {product.material}
                            </span>
                            {(() => {
                              const ratingInfo = getProductRatingInfo(product.id, product.rating, product.reviewsCount);
                              return (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                                  <span>{ratingInfo.rating}</span>
                                  <span className="text-[8px]">★</span>
                                </span>
                              );
                            })()}
                          </div>
                          <Link href={`/shop/${product.id}`}>
                            <h3 className="text-xs font-extrabold leading-snug min-h-[2.2rem] text-stone-900 line-clamp-2 hover:text-[#792c14] transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                        </div>

                        {/* Subtle Hairline Divider (matching mobile card) */}
                        <div className="border-t border-stone-100 pt-2.5 mt-auto flex items-center justify-between gap-1.5">
                          <div className="flex items-baseline gap-1 min-w-0 tabular-nums">
                            <span className="text-sm font-black text-stone-900 tracking-tight">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs font-medium text-slate-400 line-through ms-0.5">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>

                          {isOutOfStock ? (
                            <button
                              disabled
                              className="px-3 py-1.5 text-[11px] bg-stone-100 text-stone-400 font-bold rounded-full shadow-xs cursor-not-allowed shrink-0"
                            >
                              Sold Out
                            </button>
                          ) : cartItem ? (
                            <div className="w-20 h-8 flex items-center justify-between bg-white border-2 border-[#792c14] rounded-full px-1 shadow-xs shrink-0 select-none tabular-nums">
                              <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center font-bold text-[#792c14] hover:bg-orange-50 rounded-full text-xs active:scale-[0.96] transition-colors duration-150 ease-out"
                              >
                                -
                              </button>
                              <span className="font-bold text-[11px] text-[#792c14] font-mono text-center min-w-[1.5ch]">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                disabled={isMaxInCart}
                                title={isMaxInCart ? `Max stock (${stock}) reached` : "Add one more"}
                                className={`w-5 h-5 flex items-center justify-center font-bold text-[#792c14] hover:bg-orange-50 rounded-full text-xs active:scale-[0.96] transition-colors duration-150 ease-out ${
                                  isMaxInCart ? "opacity-30 cursor-not-allowed" : ""
                                }`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="px-3.5 py-1.5 text-xs bg-[#792c14] hover:bg-[#68250f] text-white font-bold rounded-full shadow-xs active:scale-[0.96] transition-transform duration-150 ease-out shrink-0 flex items-center justify-center"
                            >
                              + Add
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
        </div>
      </main>

      {/* Mobile Filter Drawer Modal - Solid Surfaces, Decoupled Sticky Actions */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-background rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 font-sans border-t border-border">
            {/* Action Sheet Handle & Header (Fixed) */}
            <div className="p-5 pb-3 border-b border-border/60 shrink-0">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
              <div className="flex justify-between items-center">
                <h3 className="font-heading text-xl font-medium text-foreground">Filter Catalog</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-bold"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Material Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Material</h4>
                <div className="space-y-2.5">
                  {MATERIAL_FILTERS.map((mat) => (
                    <label key={mat} className="flex items-center gap-3 text-xs font-medium text-foreground cursor-pointer py-1">
                      <input
                        type="radio"
                        name="mobile-material"
                        checked={selectedMaterial === mat}
                        onChange={() => setSelectedMaterial(mat)}
                        className="accent-primary w-4 h-4"
                      />
                      <span>{mat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Max Price:</span>
                  <span className="text-primary font-bold">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="199"
                  max="1200"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-2"
                />
              </div>
            </div>

            {/* Decoupled Sticky Bottom Actions with Safe-Area Padding */}
            <div className="p-4 border-t border-border bg-background flex gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors active:scale-[0.96]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-md transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] end-4 sm:end-6 md:bottom-8 md:end-8 z-30 w-11 h-11 rounded-full bg-primary text-white font-bold text-lg shadow-xl flex items-center justify-center active:scale-[0.96] border border-primary/20"
          aria-label="Back to Top"
        >
          ↑
        </button>
      )}

      <Footer />
      <BottomNavigation />
      <Toast />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-sm font-sans">Loading Catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
