"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ecom/Header";
import { Footer } from "@/components/ecom/Footer";
import { BottomNavigation } from "@/components/ecom/BottomNavigation";
import { Toast } from "@/components/ecom/Toast";
import { useEcomStore } from "@/store/ecomStore";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";
import { getStrandSpecFromWrist } from "@/lib/pricing";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useAuthStore } from "@/store/authStore";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    toggleGiftWrap,
    updateGiftMessage,
    getCartSubtotal,
    getGiftWrapTotal,
    getPlatformFee,
    getShippingFee,
    getGrandTotal,
    moveToWishlist,
    addToast,
    getProductStock,
  } = useEcomStore();

  const subtotal = getCartSubtotal();
  const giftWrapFee = getGiftWrapTotal();
  const platformFee = getPlatformFee();
  const shippingFee = getShippingFee();
  const grandTotal = getGrandTotal();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 pt-4 sm:pt-8 md:pt-10 pb-16 flex flex-col items-center justify-start text-center">
          <div className="clay-panel p-6 sm:p-10 max-w-md w-full space-y-5 bg-white">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl sm:text-4xl mx-auto">
              🛒
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground font-normal">Your Shopping Cart is Empty</h1>
            <p className="text-xs text-muted-foreground">
              Explore our handmade beaded jewelry collections or design your own custom bracelet in our studio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/shop"
                className="bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                Browse Jewelry Catalog
              </Link>
              <Link
                href="/builder"
                className="gold-shimmer text-on-primary-container text-xs font-bold py-3 px-6 rounded-2xl shadow-md transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                Open Custom Bracelet Builder
              </Link>
            </div>
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
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Item List & Gift Options */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              const giftFee = item.giftWrap ? 20 * item.quantity : 0;
              const messageLength = item.giftMessage?.length || 0;
              const isCustomItem = item.product.id.startsWith("custom") || item.product.category === "Custom Builder";
              const itemImage = isCustomItem ? "/beads/pomelli_photoshoot_image_1_1_0726.png" : item.product.image;
              const itemMaterial = isCustomItem ? "CUSTOM ARTISAN COMBINATION" : item.product.material;

              return (
                <div
                  key={item.product.id}
                  className="clay-panel p-4 sm:p-6 bg-white space-y-4 shadow-sm ring-1 ring-black/10"
                >
                  <div className="flex gap-4 items-start">
                    {/* Item Image */}
                    {isCustomItem ? (
                      <Link href="/builder" className="shrink-0" title="Edit Design in Customizer Studio">
                        <CustomBraceletPreview beads={(item.product as any).customBeads} size={88} />
                      </Link>
                    ) : (
                      <Link
                        href={`/shop/${item.product.id}`}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-muted/20 border border-border ring-1 ring-black/10 flex-shrink-0 group"
                      >
                        <Image
                          src={itemImage}
                          alt={item.product.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-300"
                        />
                      </Link>
                    )}

                    {/* Details & Controls */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        {isCustomItem ? (
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                try {
                                  const customBeads = (item.product as any).customBeads || [];
                                  const customConfig = (item.product as any).customConfig || getStrandSpecFromWrist(7.0);
                                  localStorage.setItem(
                                    "beadu_live_bracelet",
                                    JSON.stringify({
                                      placedBeads: customBeads,
                                      config: customConfig,
                                    })
                                  );
                                } catch {}
                                router.push("/builder?step=2");
                              }
                            }}
                            className="font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate pr-2 flex items-center gap-1.5 text-left"
                            title="Continue editing design in studio"
                          >
                            <span>{item.product.name}</span>
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
                              Edit Design in Studio 🎨
                            </span>
                          </button>
                        ) : (
                          <Link
                            href={`/shop/${item.product.id}`}
                            className="font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate pr-2"
                          >
                            {item.product.name}
                          </Link>
                        )}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-xs text-muted-foreground hover:text-red-600 transition-colors p-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-[11px] font-bold text-muted-foreground uppercase">
                        {itemMaterial}
                      </p>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">
                            ₹{item.product.price}
                          </span>
                          <button
                            onClick={() => {
                              moveToWishlist(item.product.id);
                              addToast("Moved to Wishlist", `${item.product.name} moved to your wishlist.`, "success");
                            }}
                            className="text-[11px] text-muted-foreground hover:text-primary font-medium underline underline-offset-2 transition-colors"
                          >
                            ♡ Move to Wishlist
                          </button>
                        </div>

                        {/* Quantity Stepper & Stock Limit */}
                        {(() => {
                          const availableStock = getProductStock(item.product.id);
                          const isMaxStock = item.quantity >= availableStock;

                          return (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-3 border border-border rounded-xl px-3 py-1 bg-muted/30">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="text-xs font-bold text-foreground hover:text-primary px-1 transition-transform duration-150 ease-out active:scale-[0.96]"
                                >
                                  −
                                </button>
                                <span className="text-xs font-bold text-foreground">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  disabled={isMaxStock}
                                  title={isMaxStock ? `Max available stock (${availableStock}) reached` : "Add one more"}
                                  className={`text-xs font-bold text-foreground hover:text-primary px-1 transition-transform duration-150 ease-out active:scale-[0.96] ${
                                    isMaxStock ? "opacity-30 cursor-not-allowed" : ""
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                              {isMaxStock && (
                                <span className="text-[10px] text-amber-700 font-semibold">
                                  Max stock reached ({availableStock})
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Gift Personalization Feature Box */}
                  <div className="pt-3 border-t border-border/40 space-y-3 bg-muted/20 p-3 rounded-2xl">
                    <label className="flex items-center justify-between text-xs font-semibold text-foreground cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎁</span>
                        <span>Add Gift Wrapping (+₹20 per item)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.giftWrap}
                        onChange={(e) => toggleGiftWrap(item.product.id, e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>

                    {item.giftWrap && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>Include Custom Gift Card Message:</span>
                          <span className="font-semibold">{120 - messageLength} chars remaining</span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={120}
                          value={item.giftMessage || ""}
                          onChange={(e) => updateGiftMessage(item.product.id, e.target.value)}
                          placeholder="Write a warm gift message for your loved one..."
                          className="clay-input w-full text-xs bg-white resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Financial Summary & Checkout CTA */}
          <div className="lg:col-span-4 clay-panel p-6 bg-white space-y-6 sticky top-28">
            <h3 className="font-heading text-xl text-foreground pb-3 border-b border-border/40">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs font-medium tabular-nums">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal:</span>
                <span className="text-foreground font-bold">₹{subtotal}</span>
              </div>

              {giftWrapFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Gift Wrapping Options:</span>
                  <span className="text-foreground font-bold">₹{giftWrapFee}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Standard Surface Shipping:</span>
                <span className="text-foreground font-bold">₹{shippingFee}</span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Grand Total:</span>
                <span className="text-2xl font-bold text-foreground">₹{grandTotal}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/checkout"
                className="w-full bg-[#7c2d12] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-2xl shadow-lg transition-transform duration-150 ease-out active:scale-[0.96] text-center block"
              >
                {user ? "Proceed to Checkout →" : "Checkout as Guest →"}
              </Link>
              
              {!user && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-white px-2 text-muted-foreground uppercase tracking-widest font-bold">Want to save your details for next time?</span>
                    </div>
                  </div>
                  
                  <GoogleLoginButton label="Continue with Google" redirectTo="/checkout" />
                </>
              )}
              <Link
                href="/shop"
                className="block text-center text-xs text-muted-foreground hover:text-primary font-semibold"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
      <Toast />
    </div>
  );
}
