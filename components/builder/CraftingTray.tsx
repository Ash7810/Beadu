"use client";

import Image from "next/image";
import { Bead } from "@/lib/types";

function TrayBeadItem({
  bead,
  isSelected,
  isSwapMode,
  onTapBead,
}: {
  bead: Bead;
  isSelected: boolean;
  isSwapMode: boolean;
  onTapBead: (bead: Bead) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTapBead(bead)}
      className={`group relative flex flex-col items-center justify-between p-1.5 rounded-xl transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96] ring-1 ring-black/5 cursor-pointer select-none shrink-0 w-[72px] h-[88px] sm:w-[84px] sm:h-24 border ${
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : isSwapMode
          ? "bg-amber-500/5 border-amber-500/40 hover:border-amber-500"
          : "bg-card border-border/80 shadow-xs hover:border-primary/60 hover:bg-muted/30"
      }`}
      title={isSwapMode ? `Swap with ${bead.name}` : `${bead.name} • ${bead.material}`}
    >
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-muted/20 p-0.5">
        <Image
          src={bead.imageUrl}
          alt={bead.name}
          fill
          sizes="(max-width: 640px) 40px, 48px"
          style={bead.rotation ? { transform: `rotate(${bead.rotation}deg)` } : undefined}
          className="object-contain drop-shadow-xs pointer-events-none p-1"
        />
      </div>

      <div className="w-full text-center space-y-px">
        <span className="block font-medium text-foreground truncate w-full leading-tight px-0.5 text-[10px] sm:text-[11px]" title={bead.name}>
          {bead.name.split(" ").slice(0, 2).join(" ")}
        </span>
        <span className="block text-[10px] text-primary font-semibold">
          {bead.isPremium || bead.price > 0 ? `₹${bead.price}` : "Free"}
        </span>
      </div>
    </button>
  );
}

type Props = {
  trayBeads: Bead[];
  selectedBeadId?: string | null;
  isSwapMode?: boolean;
  onTapBead: (bead: Bead) => void;
  onClearTray: () => void;
};

export function CraftingTray({
  trayBeads,
  selectedBeadId,
  isSwapMode = false,
  onTapBead,
  onClearTray,
}: Props) {
  return (
    <div className={`w-full bg-card border rounded-2xl shadow-sm font-sans select-none transition-all ${
      isSwapMode ? "border-amber-500/80 bg-amber-500/5" : "border-border/80"
    }`}>
      {/* Header Bar — compact on mobile */}
      <div className="flex justify-between items-center px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`material-symbols-outlined text-base shrink-0 ${isSwapMode ? "text-amber-500" : "text-primary"}`}>
            {isSwapMode ? "swap_horiz" : "palette"}
          </span>
          <span className="text-[12px] font-semibold text-foreground truncate">
            {isSwapMode ? "Pick Replacement" : "Crafting Tray"}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
            isSwapMode ? "bg-amber-500/20 text-amber-600" : "bg-primary/10 text-primary"
          }`}>
            {isSwapMode ? "Swap" : `${trayBeads.length}`}
          </span>
        </div>

        {!isSwapMode && trayBeads.length > 0 && (
          <button
            type="button"
            onClick={onClearTray}
            className="text-[11px] text-muted-foreground hover:text-destructive font-medium transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-muted/50"
            title="Clear all beads from tray"
          >
            Clear
          </button>
        )}
      </div>

      {/* Scrollable Bead Row */}
      {trayBeads.length === 0 ? (
        <div className="mx-3 mb-3 py-3 rounded-xl border border-dashed border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground bg-muted/20">
          <span className="material-symbols-outlined text-primary text-sm">add_shopping_cart</span>
          <span>Go to Step 1 to pick beads</span>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto touch-pan-x no-scrollbar pb-2.5 px-2.5 scroll-smooth">
          {trayBeads.map((bead, idx) => (
            <TrayBeadItem
              key={`tray-item-${idx}`}
              bead={bead}
              isSelected={selectedBeadId === bead.id}
              isSwapMode={isSwapMode}
              onTapBead={onTapBead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
