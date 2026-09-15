"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBraceletStore } from "@/store/braceletStore";
import { useEcomStore } from "@/store/ecomStore";
import { Product } from "@/lib/ecomData";
import { CustomBraceletPreview } from "@/components/builder/CustomBraceletPreview";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function Checkout({ isOpen, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { placedBeads, pricing, config } = useBraceletStore();
  const { addToCart, addToast } = useEcomStore();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;
  if (!placedBeads || placedBeads.length === 0) return null;

  // Build high-fidelity bespoke custom product object
  const createCustomProduct = (): Product => {
    const timestamp = Date.now();
    return {
      id: `custom-${timestamp}`,
      name: `Custom Artisan Bracelet (${config.wristInches.toFixed(1)}" Wrist)`,
      price: pricing.total,
      originalPrice: Math.round(pricing.total * 1.25),
      rating: 5.0,
      reviewsCount: 1,
      category: "Bracelets",
      material: "Glass Beads",
      image: "/beads/pomelli_photoshoot_image_1_1_0726.png",
      images: ["/beads/pomelli_photoshoot_image_1_1_0726.png"],
      cordType: config.cordType,
      wristInches: config.wristInches,
      customBeads: placedBeads,
      customConfig: config,
      description: `Hand-assembled artisan strand with ${placedBeads.length} curated beads on durable stretch elastic string for ${config.wristInches.toFixed(1)}" wrist.`,
      details: [
        `Wrist Fit: ${config.wristInches.toFixed(1)} inches`,
        "String: Durable Stretch Elastic String (Comfort Fit)",
        `Beads Count: ${placedBeads.length} artisan beads`,
        "Handcrafted in Jaipur Artisan Studio",
        "Signature Gift Box & Insured Packaging included",
      ],
      inStock: true,
      stockQuantity: 99,
    };
  };

  // Silently archive blueprint for studio crafting reference
  const archiveDesignBlueprint = async () => {
    try {
      await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placedBeads,
          customerName: "Store Customer",
          email: "",
          phone: "",
          wristInches: config.wristInches,
          cordType: config.cordType || "elastic",
          address: "",
        }),
      });
    } catch {
      // Non-blocking blueprint archiving
    }
  };

  const handleAddToBag = async () => {
    setSubmitting(true);
    const customProd = createCustomProduct();
    addToCart(customProd, 1);
    addToast(
      "Added to Bag!",
      `Your custom ${config.wristInches}" bracelet was added to your shopping bag.`,
      "success"
    );
    await archiveDesignBlueprint();
    setSubmitting(false);
    onSuccess();
  };

  const handleProceedToCheckout = async () => {
    setSubmitting(true);
    const customProd = createCustomProduct();
    addToCart(customProd, 1);
    await archiveDesignBlueprint();
    setSubmitting(false);
    onSuccess();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar font-sans">
      <div className="bg-background border border-border max-w-lg w-full rounded-3xl p-5 sm:p-7 relative shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          title="Close Dialog"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Artisan Studio</span>
          <h3 className="font-heading text-2xl font-bold text-foreground mt-0.5">
            Complete Your Custom Creation
          </h3>
          <p className="text-xs text-muted-foreground">
            Review your personalized bead sequence before adding to bag or checking out.
          </p>
        </div>

        {/* Design Visual Preview Strip */}
        <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 bg-white rounded-xl p-2 border border-border shadow-xs">
            <CustomBraceletPreview beads={placedBeads} size={80} />
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">
              {config.wristInches.toFixed(1)}&quot; Custom Strand
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {placedBeads.length} beads • Stretch Elastic String
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <span>✓</span>
              <span>Made-to-order in Jaipur Studio</span>
            </p>
          </div>
        </div>

        {/* Beads Summary List */}
        <div className="overflow-y-auto max-h-40 no-scrollbar rounded-2xl border border-border/50 bg-card/60 p-3 space-y-2">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Itemized Beads Used:
          </span>
          <div className="space-y-1.5 divide-y divide-border/20">
            {Object.entries(
              placedBeads.reduce((acc, bead) => {
                const name = bead.name || bead.id;
                if (!acc[name]) {
                  acc[name] = { count: 0, imageUrl: bead.imageUrl, price: bead.price };
                }
                acc[name].count += 1;
                return acc;
              }, {} as Record<string, { count: number; imageUrl: string; price: number }>)
            ).map(([name, item]) => (
              <div key={name} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {item.imageUrl ? (
                    <div className="relative w-6 h-6 rounded-md overflow-hidden bg-muted/20 border border-primary/20 shrink-0">
                      <Image src={item.imageUrl} alt={name} fill sizes="24px" className="object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20 shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate">{name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                    x{item.count}
                  </span>
                  {item.price > 0 && (
                    <span className="text-muted-foreground text-[11px] font-mono">
                      ₹{item.price * item.count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-primary/5 p-3.5 rounded-2xl border border-primary/15 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Handcrafted Valuation
            </span>
            <span className="text-xs text-primary font-semibold">Includes Studio Packaging</span>
          </div>
          <div className="text-right">
            <span className="font-heading text-2xl font-bold text-[#792c14]">
              ₹{pricing.total}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-[#792c14] text-[#792c14] font-bold text-xs hover:bg-[#792c14]/5 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>🛒</span>
            <span>Add to Bag</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToCheckout}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#792c14] text-white font-bold text-xs hover:bg-[#68250f] active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
