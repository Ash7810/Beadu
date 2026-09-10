import { create } from "zustand";
import { Bead, PlacedBead, BraceletConfig, PricingResult, CordType, DEFAULT_WRIST_SIZE_MM } from "@/lib/types";
import { calculateTotal, getStrandSpecFromWrist, calculateStrandPhysicalCapacity } from "@/lib/pricing";

type BraceletState = {
  config: BraceletConfig;
  placedBeads: PlacedBead[];
  history: PlacedBead[][];
  historyIndex: number;
  pricing: PricingResult;
  wristSizeMm: number;
  wristSizeLocked: boolean;
  lastError: string | null;

  addBead: (bead: Bead, slotIndex: number) => boolean;
  swapBead: (placedId: string, newBead: Bead) => boolean;
  swapPlacedBeads: (placedIdA: string, placedIdB: string) => void;
  removeBead: (placedId: string) => void;
  clearError: () => void;
  moveBead: (placedId: string, newSlotIndex: number) => void;
  duplicateBead: (placedId: string) => void;
  rotateBead: (placedId: string, rotation: number) => void;
  setWristInches: (wristInches: number) => void;
  setCordType: (cordType: CordType) => void;
  setWristSizeLocked: (locked: boolean) => void;
  startNewCustomer: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadDesign: (beads: PlacedBead[], config?: Partial<BraceletConfig>) => void;
  syncBeadsWithCatalog: (masterBeads: Bead[]) => void;
  shuffleDesign: (availableBeads: Bead[]) => boolean;
};

const DEFAULT_SPEC = getStrandSpecFromWrist(7.0);

const DEFAULT_CONFIG: BraceletConfig = {
  cordType: "elastic",
  wristInches: 7.0,
  totalSlots: DEFAULT_SPEC.totalSlots,
  freeSlotLimit: DEFAULT_SPEC.freeSlotLimit,
  wristSizeMm: DEFAULT_WRIST_SIZE_MM,
  wristSizeLocked: false,
};

function pushHistory(state: BraceletState, next: PlacedBead[], newConfig?: BraceletConfig) {
  const config = newConfig || state.config;
  const trimmed = state.history.slice(0, state.historyIndex + 1);
  const nextHistory = [...trimmed, next];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("beadu_live_bracelet", JSON.stringify({ placedBeads: next, config }));
    } catch {}
  }
  return {
    config,
    placedBeads: next,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
    pricing: calculateTotal(next, config),
  };
}

export const useBraceletStore = create<BraceletState>((set, get) => ({
  config: DEFAULT_CONFIG,
  placedBeads: [],
  history: [[]],
  historyIndex: 0,
  pricing: calculateTotal([], DEFAULT_CONFIG),
  wristSizeMm: DEFAULT_WRIST_SIZE_MM,
  wristSizeLocked: false,
  lastError: null,

  addBead: (bead, slotIndex) => {
    const state = get();
    const physCap = calculateStrandPhysicalCapacity(state.placedBeads, state.config);
    const widthMm = bead.widthMm || bead.sizeMm || Math.round(8 * (bead.size || 1));

    const filtered = state.placedBeads.filter((b) => b.slotIndex !== slotIndex);
    const usedAfterFilter = filtered.reduce((acc, b) => acc + (b.widthMm || b.sizeMm || Math.round(8 * (b.size || 1))), 0);
    const fits = usedAfterFilter + widthMm <= physCap.capacityMm;

    if (!fits) {
      const remainingMm = Math.max(0, physCap.capacityMm - usedAfterFilter);
      set({ lastError: `Bead won't fit! Remaining space is ${remainingMm}mm, but bead needs ${widthMm}mm.` });
      return false;
    }

    const placed: PlacedBead = {
      ...bead,
      slotIndex,
      rotation: bead.rotation || 0,
      placedId: `${bead.id}-${crypto.randomUUID()}`,
    };
    set({ ...pushHistory(state, [...filtered, placed]), lastError: null });
    return true;
  },

  swapBead: (placedId, newBead) => {
    const state = get();
    const target = state.placedBeads.find((b) => b.placedId === placedId);
    if (!target) return false;

    const physCap = calculateStrandPhysicalCapacity(state.placedBeads, state.config);
    const newWidthMm = newBead.widthMm || newBead.sizeMm || Math.round(8 * (newBead.size || 1));

    // Exclude target bead from capacity calculation
    const remainingBeads = state.placedBeads.filter((b) => b.placedId !== placedId);
    const usedAfterFilter = remainingBeads.reduce((acc, b) => acc + (b.widthMm || b.sizeMm || Math.round(8 * (b.size || 1))), 0);
    const fits = usedAfterFilter + newWidthMm <= physCap.capacityMm;

    if (!fits) {
      const remainingMm = Math.max(0, physCap.capacityMm - usedAfterFilter);
      set({ lastError: `Replacement bead won't fit! Available space is ${remainingMm}mm, but selected bead needs ${newWidthMm}mm.` });
      return false;
    }

    const replacement: PlacedBead = {
      ...newBead,
      slotIndex: target.slotIndex,
      rotation: newBead.rotation || 0,
      placedId: `${newBead.id}-${crypto.randomUUID()}`,
    };

    const next = state.placedBeads.map((b) => (b.placedId === placedId ? replacement : b));
    set({ ...pushHistory(state, next), lastError: null });
    return true;
  },

  clearError: () => set({ lastError: null }),

  removeBead: (placedId) => {
    const state = get();
    const next = state.placedBeads.filter((b) => b.placedId !== placedId);
    set(pushHistory(state, next));
  },

  swapPlacedBeads: (placedIdA, placedIdB) => {
    const state = get();
    const beadA = state.placedBeads.find((b) => b.placedId === placedIdA);
    const beadB = state.placedBeads.find((b) => b.placedId === placedIdB);
    if (!beadA || !beadB) return;

    const slotA = beadA.slotIndex;
    const slotB = beadB.slotIndex;

    const next = state.placedBeads.map((b) => {
      if (b.placedId === placedIdA) return { ...b, slotIndex: slotB };
      if (b.placedId === placedIdB) return { ...b, slotIndex: slotA };
      return b;
    });

    set(pushHistory(state, next));
  },

  moveBead: (placedId, newSlotIndex) => {
    const state = get();
    const current = state.placedBeads.find((b) => b.placedId === placedId);
    if (!current) return;
    const oldSlotIndex = current.slotIndex;
    const occupant = state.placedBeads.find((b) => b.slotIndex === newSlotIndex && b.placedId !== placedId);

    const next = state.placedBeads.map((b) => {
      if (b.placedId === placedId) {
        return { ...b, slotIndex: newSlotIndex };
      }
      if (occupant && b.placedId === occupant.placedId) {
        return { ...b, slotIndex: oldSlotIndex };
      }
      return b;
    });

    set(pushHistory(state, next));
  },

  duplicateBead: (placedId) => {
    const state = get();
    const original = state.placedBeads.find((b) => b.placedId === placedId);
    if (!original) return;
    const physCap = calculateStrandPhysicalCapacity(state.placedBeads, state.config);
    const beadMm = original.widthMm || original.sizeMm || Math.round(8 * (original.size || 1));
    if (physCap.usedMm + beadMm > physCap.capacityMm) return;

    const openSlot = findNextOpenSlot(state.placedBeads, state.config.totalSlots);
    if (openSlot === null) return;
    const clone: PlacedBead = {
      ...original,
      slotIndex: openSlot,
      placedId: `${original.id}-${crypto.randomUUID()}`,
    };
    set(pushHistory(state, [...state.placedBeads, clone]));
  },

  rotateBead: (placedId, rotation) => {
    const state = get();
    // Normalize rotation angle between 0 and 360
    const normalizedDeg = ((rotation % 360) + 360) % 360;
    const next = state.placedBeads.map((b) =>
      b.placedId === placedId ? { ...b, rotation: normalizedDeg } : b
    );
    set(pushHistory(state, next));
  },

  setWristInches: (wristInches: number) => {
    const state = get();
    const spec = getStrandSpecFromWrist(wristInches);
    const newConfig: BraceletConfig = {
      ...state.config,
      wristInches: spec.wristInches,
      totalSlots: spec.totalSlots,
      freeSlotLimit: spec.freeSlotLimit,
      wristSizeMm: spec.capacityMm,
    };
    // Trim beads that exceed the new totalSlots capacity
    const filteredBeads = state.placedBeads.filter((b) => b.slotIndex < spec.totalSlots);
    // Also validate physical fit — drop beads from the end if total width overflows new capacity
    const newCapacityMm = spec.capacityMm;
    const sortedBySlot = [...filteredBeads].sort((a, b) => a.slotIndex - b.slotIndex);
    let usedMm = 0;
    const fittingBeads: typeof filteredBeads = [];
    for (const bead of sortedBySlot) {
      const w = bead.widthMm || bead.sizeMm || Math.round(8 * (bead.size || 1));
      if (usedMm + w <= newCapacityMm) {
        usedMm += w;
        fittingBeads.push(bead);
      }
    }
    // Re-index remaining beads so slotIndices are contiguous and strictly within 0..totalSlots-1
    const reindexedBeads = fittingBeads.map((b, idx) => ({ ...b, slotIndex: idx }));
    set({
      ...pushHistory(state, reindexedBeads, newConfig),
      wristSizeMm: spec.capacityMm,
    });
  },

  setCordType: (cordType: CordType) => {
    const state = get();
    const newConfig: BraceletConfig = {
      ...state.config,
      cordType,
    };
    set({
      ...pushHistory(state, state.placedBeads, newConfig),
    });
  },

  setWristSizeLocked: (locked: boolean) => {
    set((state) => ({
      wristSizeLocked: locked,
      config: { ...state.config, wristSizeLocked: locked },
    }));
  },

  startNewCustomer: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("beadu_live_bracelet");
      } catch {}
    }
    set({
      config: DEFAULT_CONFIG,
      placedBeads: [],
      history: [[]],
      historyIndex: 0,
      wristSizeMm: DEFAULT_WRIST_SIZE_MM,
      wristSizeLocked: false,
      lastError: null,
      pricing: calculateTotal([], DEFAULT_CONFIG),
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex === 0) return;
    const newIndex = state.historyIndex - 1;
    const beads = state.history[newIndex];
    set({
      placedBeads: beads,
      historyIndex: newIndex,
      pricing: calculateTotal(beads, state.config),
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const beads = state.history[newIndex];
    set({
      placedBeads: beads,
      historyIndex: newIndex,
      pricing: calculateTotal(beads, state.config),
    });
  },

  reset: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("beadu_live_bracelet");
      } catch {}
    }
    set({
      config: DEFAULT_CONFIG,
      placedBeads: [],
      history: [[]],
      historyIndex: 0,
      wristSizeMm: DEFAULT_WRIST_SIZE_MM,
      wristSizeLocked: false,
      lastError: null,
      pricing: calculateTotal([], DEFAULT_CONFIG),
    });
  },

  loadDesign: (beads, customConfig) => {
    const state = get();
    const config = { ...state.config, ...customConfig };
    set({
      config,
      placedBeads: beads,
      history: [beads],
      historyIndex: 0,
      pricing: calculateTotal(beads, config),
    });
  },

  syncBeadsWithCatalog: (masterBeads) => {
    const state = get();
    if (!state.placedBeads.length || !masterBeads.length) return;

    const masterMap = new Map<string, Bead>(masterBeads.map((b) => [b.id, b]));
    let changed = false;

    const updatedPlacedBeads = state.placedBeads.map((placed) => {
      const master = masterMap.get(placed.id);
      if (!master) return placed;

      const sizeMm = master.sizeMm || master.widthMm || 8;
      const widthMm = master.widthMm || master.sizeMm || 8;
      const relativeSize = master.size || Number((widthMm / 8).toFixed(2));

      if (
        placed.sizeMm !== sizeMm ||
        placed.widthMm !== widthMm ||
        placed.size !== relativeSize ||
        placed.price !== master.price ||
        placed.rotationAllowed !== master.rotationAllowed ||
        (master.rotation !== undefined && placed.rotation !== master.rotation)
      ) {
        changed = true;
        return {
          ...placed,
          name: master.name,
          price: master.price,
          material: master.material,
          imageUrl: master.imageUrl,
          rotationAllowed: master.rotationAllowed,
          rotation: master.rotation !== undefined ? master.rotation : placed.rotation,
          size: relativeSize,
          sizeMm,
          widthMm,
        };
      }
      return placed;
    });

    if (changed) {
      set({
        ...pushHistory(state, updatedPlacedBeads),
        pricing: calculateTotal(updatedPlacedBeads, state.config),
      });
    }
  },

  shuffleDesign: (availableBeads) => {
    const state = get();
    if (!availableBeads || availableBeads.length === 0) return false;

    const totalSlots = state.config.totalSlots || 16;
    const physCap = calculateStrandPhysicalCapacity([], state.config);
    const newPlaced: PlacedBead[] = [];
    let currentWidthSum = 0;

    for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
      const randomBead = availableBeads[Math.floor(Math.random() * availableBeads.length)];
      const widthMm = randomBead.widthMm || randomBead.sizeMm || Math.round(8 * (randomBead.size || 1));

      if (currentWidthSum + widthMm > physCap.capacityMm) break;

      const placed: PlacedBead = {
        ...randomBead,
        slotIndex,
        rotation: randomBead.rotation || 0,
        placedId: `${randomBead.id}-${crypto.randomUUID()}`,
      };
      newPlaced.push(placed);
      currentWidthSum += widthMm;
    }

    if (newPlaced.length === 0) return false;

    set({ ...pushHistory(state, newPlaced), lastError: null });
    return true;
  },
}));

function findNextOpenSlot(placed: PlacedBead[], totalSlots: number): number | null {
  const taken = new Set(placed.map((b) => b.slotIndex));
  for (let i = 0; i < totalSlots; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}

