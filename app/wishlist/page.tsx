"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { PRODUCTS_CATALOG } from "@/lib/ecomData";
import { useEcomStore } from "@/store/ecomStore";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, cart, updateQuantity, getProductStock } = useEcomStore();

  const savedProducts = PRODUCTS_CATALOG.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-2 sm:px-6 md:px-10 lg:px-12 pt-3.5 sm:pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        <div className="mb-4 sm:mb-6 px-1 sm:px-0">
          <h1 className="font-heading text-2xl sm:text-4xl text-foreground font-normal">
            Your Wishlist ({savedProducts.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Handcrafted pieces saved for later.
          </p>
        </div>

        {savedProducts.length === 0 ? (
          <div className="clay-panel p-12 text-center max-w-md mx-auto my-12 space-y-4 bg-white">
            <div className="text-4xl">♥</div>
            <h2 className="font-heading text-xl text-foreground">Your Wishlist is Empty</h2>
            <p className="text-xs text-muted-foreground">
              Save your favorite handmade bracelets, wooden strands, and clay jewelry by tapping the heart icon.
            </p>
            <Link
              href="/shop"
              className="bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold px-6 py-3 rounded-full inline-block shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              Explore Jewelry Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {savedProducts.map((product) => {
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
                    <Link href={`/shop/${product.id}`} className="absolute inset-0 z-0 block">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                      {/* 1px subtle inner depth ring */}
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.06] pointer-events-none rounded-t-md" />
                    </Link>

                    {/* Stock Badge */}
                    {isOutOfStock ? (
                      <div className="absolute top-2.5 start-2.5 bg-stone-900/90 text-white text-[10px] px-2 py-0.5 rounded shadow-sm font-bold z-10">
                        Out of Stock
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute top-2.5 start-2.5 bg-amber-600 text-white text-[9px] px-2 py-0.5 rounded shadow-sm font-extrabold z-10 animate-pulse">
                        Only {stock} left!
                      </div>
                    ) : null}

                    {/* Circular Solid White Wishlist Button (matching mobile card exact size) */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md active:scale-[0.96] z-10"
                      aria-label="Remove from Wishlist"
                    >
                      <svg
                        className="w-4 h-4 text-red-500 fill-red-500 stroke-red-500 scale-110 transition-all duration-300"
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate mb-1">
                        {product.material}
                      </span>
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
      </main>

      <Footer />
      <BottomNavigation />
      <Toast />
    </div>
  );
}
