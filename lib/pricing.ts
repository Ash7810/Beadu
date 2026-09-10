import { PlacedBead, PricingResult, BraceletConfig, CordType } from "./types";

export const MIN_BEAD_SIZE_MM = 6; // smallest bead in catalog
export const REFERENCE_BEAD_SIZE_MM = 8; // baseline size for visual scaling

export const CORD_PRICES: Record<CordType, number> = {
  elastic: 0,
  leather: 249,
  silver_chain: 699,
  gold_chain: 999,
};

export const KNOT_ALLOWANCE_INCHES = 2.0; // 2.0 inches extra string to tie knot

export function getStrandSpecFromWrist(wristInches: number) {
  const sanitizedWrist = Math.max(4.0, Math.min(12.0, Number(wristInches) || 7.0));
  const knotExtensionInches = KNOT_ALLOWANCE_INCHES;
  const totalCutInches = sanitizedWrist + knotExtensionInches;
  const wristCircumferenceMm = sanitizedWrist * 25.4;

  // Real-life physical bead capacity formula:
  // Cord length required for beads around a wrist = wristCircumference + (π * beadThickness)
  // For reference bead size 8mm: π * 8 ≈ 25.13 mm (approx 1 inch additional cord length for bead thickness)
  const beadThicknessAllowanceMm = Math.PI * REFERENCE_BEAD_SIZE_MM;
  const capacityMm = Math.round(wristCircumferenceMm + beadThicknessAllowanceMm);
  const lengthCm = Math.round((capacityMm / 10) * 10) / 10;

  // Slot capacity is calculated based on physical capacity divided by MIN_BEAD_SIZE_MM (6mm),
  // ensuring slot capacity NEVER limits the physical bead capacity regardless of bead size.
  const totalSlots = Math.max(20, Math.ceil(capacityMm / MIN_BEAD_SIZE_MM));
  const freeSlotLimit = Math.max(12, Math.round(totalSlots * 0.66));

  return {
    wristInches: sanitizedWrist,
    knotExtensionInches,
    totalCutInches,
    lengthCm,
    capacityMm,
    totalSlots,
    freeSlotLimit,
  };
}

export function getUsableStringLength(config: BraceletConfig) {
  const spec = getStrandSpecFromWrist(config.wristInches || 7.0);
  return spec.capacityMm;
}

export function calculateStrandPhysicalCapacity(
  placedBeads: PlacedBead[],
  config: BraceletConfig
) {
  const spec = getStrandSpecFromWrist(config.wristInches || 7.0);
  const capacityMm = config.wristSizeMm || spec.capacityMm;
  const usedMm = placedBeads.reduce((acc, b) => acc + (b.widthMm || b.sizeMm || Math.round(8 * (b.size || 1))), 0);
  const remainingMm = Math.max(0, capacityMm - usedMm);
  const percentUsed = Math.min(100, Math.round((usedMm / capacityMm) * 100));

  return {
    wristInches: spec.wristInches,
    knotExtensionInches: spec.knotExtensionInches,
    totalCutInches: spec.totalCutInches,
    usableLengthCm: spec.lengthCm,
    capacityMm,
    usedMm,
    remainingMm,
    percentUsed,
    totalSlots: spec.totalSlots,
    freeSlotLimit: spec.freeSlotLimit,
    isFull: remainingMm <= 0,
  };
}

/**
 * Rule: the first `freeSlotLimit` non-premium beads are complimentary.
 * Any premium bead is always chargeable, regardless of slot position.
 * Any bead placed beyond the free slot limit is chargeable even if it's
 * a "free tier" category bead.
 * Cord upgrades add a base price.
 */
export function calculateTotal(
  placedBeads: PlacedBead[],
  config: BraceletConfig
): PricingResult {
  const cordBasePrice = (config.cordType && CORD_PRICES[config.cordType]) || 0;
  
  // Sum exact price of every placed bead on the strand
  const beadsTotal = placedBeads.reduce((acc, bead) => acc + (Number(bead.price) || 0), 0);
  const premiumBeadsTotal = placedBeads
    .filter((b) => b.isPremium)
    .reduce((acc, bead) => acc + (Number(bead.price) || 0), 0);

  const grandTotal = cordBasePrice + beadsTotal;

  return {
    total: Math.round(grandTotal * 100) / 100,
    cordBasePrice,
    freeBeadCount: 0,
    chargeableBeadCount: placedBeads.length,
    premiumBeadsTotal: Math.round(premiumBeadsTotal * 100) / 100,
    remainingSlots: Math.max(0, config.totalSlots - placedBeads.length),
  };
}

