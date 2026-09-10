"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Bead } from "@/lib/types";

type Props = {
  beads: Bead[];
  trayBeadIds?: string[];
  onSelectBead: (bead: Bead) => void;
  onAddToTray: (bead: Bead) => void;
  onRemoveFromTrayByBeadId?: (beadId: string) => void;
};

export const BeadItem = memo(function BeadItem({
  bead,
  isSelected,
  isInTray,
  onSelectBead,
  onAddToTray,
  onRemoveFromTrayByBeadId,
}: {
  bead: Bead;
  isSelected?: boolean;
  isInTray?: boolean;
  onSelectBead: (bead: Bead) => void;
  onAddToTray: (bead: Bead) => void;
  onRemoveFromTrayByBeadId?: (beadId: string) => void;
}) {
  const handleToggle = () => {
    if (isInTray) {
      onRemoveFromTrayByBeadId?.(bead.id);
    } else {
      onAddToTray(bead);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={`group relative flex flex-col items-center justify-between p-2 sm:p-3 rounded-2xl border border-border/80 ring-1 ring-black/5 bg-card hover:bg-muted/40 hover:border-primary/50 transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.98] cursor-pointer select-none ${isInTray ? "border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10" : ""
        }`}
    >
      {isSelected ? (
        <span className="absolute left-2 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground shadow-xs">
          Active
        </span>
      ) : isInTray ? (
        <span className="absolute left-2 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
          ✓ In Tray
        </span>
      ) : bead.isPremium || bead.price > 0 ? (
        <span className="absolute left-2 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          Premium
        </span>
      ) : null}

      <div className={`relative w-14 h-14 sm:w-20 sm:h-20 my-1 mt-2 flex items-center justify-center rounded-xl bg-muted/30 p-1.5 ${isSelected ? "ring-2 ring-primary" : ""
        }`}>
        <img
          src={bead.imageUrl}
          alt={bead.name}
          style={bead.rotation ? { transform: `rotate(${bead.rotation}deg)` } : undefined}
          className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-sm pointer-events-none"
        />
      </div>

      <div className="w-full text-center space-y-1 mt-1.5">
        <span className="block text-xs font-semibold text-foreground truncate px-0.5" title={bead.name}>
          {bead.name}
        </span>
        <div className="flex items-center justify-between pt-1.5 border-t border-border/50 gap-1 tabular-nums">
          <span className="text-xs text-primary font-bold">
            {bead.isPremium || bead.price > 0 ? `₹${bead.price}` : "Free"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-transform duration-150 ease-out whitespace-nowrap cursor-pointer active:scale-[0.96] ${isInTray
                ? "bg-emerald-600/15 text-emerald-600 hover:bg-destructive/10 hover:text-destructive"
                : "bg-primary/10 hover:bg-primary/20 text-primary"
              }`}
          >
            {isInTray ? "✓ Added" : "Collect"}
          </button>
        </div>
      </div>
    </div>
  );
});

export function BeadLibrary({
  beads,
  trayBeadIds = [],
  onSelectBead,
  onAddToTray,
  onRemoveFromTrayByBeadId,
}: Props) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeBeadId, setActiveBeadId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

  // Extract unique categories dynamically and keep order fixed
  const categories = useMemo(() => {
    const set = new Set<string>();
    beads.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [beads]);

  // Filter beads cleanly based on search query and selected category
  const filtered = useMemo(() => {
    return beads.filter((b) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.material && b.material.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === "all" || b.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [beads, searchQuery, selectedCategory]);

  // Calculate pagination details
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedBeads = filtered.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-full flex-col gap-3 bg-card p-1 sm:p-2 font-sans select-none min-h-0">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[14px] sm:text-lg font-bold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">category</span>
              Bead Catalog ({beads.length})
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Collect beads to add into your Crafting Tray.</p>
          </div>
          {filtered.length > 0 && (
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50 shrink-0 tabular-nums">
              Showing {filtered.length}
            </span>
          )}
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="space-y-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-base">
              search
            </span>
            <input
              type="text"
              placeholder="Search 90+ beads, metals, stones..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full ps-9 pe-8 py-2 min-h-[40px] bg-background border border-border/80 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 tabular-nums">
            <button
              type="button"
              onClick={() => handleCategorySelect("all")}
              className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground border border-border/40"
              }`}
            >
              All ({beads.length})
            </button>
            {categories.map((cat) => {
              const count = beads.filter((b) => b.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground border border-border/40"
                  }`}
                >
                  {cat.replace("-", " ")} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bead Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto overflow-x-hidden no-scrollbar flex-1 min-h-0 pe-0.5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[12px] text-muted-foreground space-y-2">
            <span className="material-symbols-outlined text-3xl opacity-40">inventory_2</span>
            <p>No beads found matching your search.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          paginatedBeads.map((bead) => (
            <BeadItem
              key={bead.id}
              bead={bead}
              isSelected={activeBeadId === bead.id}
              isInTray={trayBeadIds.includes(bead.id)}
              onSelectBead={(b) => {
                if (trayBeadIds.includes(b.id)) {
                  onRemoveFromTrayByBeadId?.(b.id);
                } else {
                  onAddToTray(b);
                }
              }}
              onAddToTray={onAddToTray}
              onRemoveFromTrayByBeadId={onRemoveFromTrayByBeadId}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs px-1">
          <span className="text-[11px] text-muted-foreground font-medium">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-border/80 bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Prev
            </button>
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-border/80 bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
