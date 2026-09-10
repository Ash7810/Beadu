"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { SectionBeads } from "./SectionBeads";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { useEcomStore } from "@/store/ecomStore";

export function FeaturedSection() {
  const { cart, addToCart, toggleWishlist, isInWishlist, updateQuantity, getProductRatingInfo, getProductStock } = useEcomStore();
  const [mounted, setMounted] = useState(false);

   
  useEffect(() => {
    setMounted(true);
  }, []);

  const featuredProducts = PRODUCTS_CATALOG.filter((p) => p.isBestSeller || p.isNewArrival).slice(0, 3);

  return (
    <section className="relative py-16 bg-white font-sans text-center overflow-hidden">
      <SectionBeads variant="b" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-10 font-bold tracking-wide">
          Discover What&apos;s Blooming at Beadu
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 justify-items-center">
          {featuredProducts.map((product) => {
            const isFav = mounted && isInWishlist(product.id);
            const cartItem = cart.find((item) => item.product.id === product.id);
            const stock = getProductStock(product.id);
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= 4;
            const isMaxInCart = cartItem ? cartItem.quantity >= stock : false;

            return (
              <div
                key={product.id}
                className="w-full max-w-xs bg-white rounded-md border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between text-left"
              >
                {/* Product Image Panel */}
                <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
                  <Link href={`/shop/${product.id}`} className="absolute inset-0 z-0 block">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.06] pointer-events-none rounded-t-md" />
                  </Link>

                  {/* Stock Badge / Sale Badge */}
                  {isOutOfStock ? (
                    <div className="absolute top-2.5 start-2.5 bg-stone-900/90 text-white text-[10px] px-2 py-0.5 rounded shadow-sm font-bold z-10">
                      Out of Stock
                    </div>
                  ) : isLowStock ? (
                    <div className="absolute top-2.5 start-2.5 bg-amber-600 text-white text-[9px] px-2 py-0.5 rounded shadow-sm font-extrabold z-10 animate-pulse">
                      Only {stock} left!
                    </div>
                  ) : product.originalPrice ? (
                    <div className="absolute top-2.5 start-2.5 bg-white text-stone-900 text-[10px] px-2.5 py-0.5 rounded-full shadow-sm font-bold z-10 border border-stone-100">
                      Sale!
                    </div>
                  ) : null}

                  {/* Circular Solid White Wishlist Button (matching mobile card exact size) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md active:scale-[0.96] z-10"
                    aria-label="Toggle Wishlist"
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

                {/* Content & Details (matching mobile card typography, padding & shape) */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        {product.material || product.category}
                      </span>
                      {mounted && (() => {
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
                          className="w-5 h-5 flex items-center justify-center font-bold text-[#792c14] hover:bg-orange-50 rounded-full text-xs active:scale-[0.96] transition-colors"
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
                          className={`w-5 h-5 flex items-center justify-center font-bold text-[#792c14] hover:bg-orange-50 rounded-full text-xs active:scale-[0.96] transition-colors ${
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
      </div>
    </section>
  );
}
