// Core data model — every bead in the catalog and every bead placed on a bracelet
// shares this shape. Keep this file as the single source of truth: reuse it in
// the Prisma schema, the API responses, and the frontend store.

export type BeadCategory =
  | "gold"
  | "silver"
  | "crystal"
  | "pearl"
  | "letter"
  | "zodiac"
  | "birthstone"
  | "heart"
  | "premium-charm"
  | "charm"
  | "wood"
  | "acrylic"
  | "glass"
  | "stone"
  | "accent"
  | "ceramic"
  | "custom";

export type Bead = {
  id: string;
  name: string;
  category: BeadCategory;
  price: number;
  material: string;
  imageUrl: string;
  isPremium: boolean;
  rotationAllowed: boolean;
  rotation?: number;
  size: number; // relative width, used for slot spacing math
  sizeMm: number; // physical bead diameter in mm (e.g. 6mm, 8mm, 10mm, 12mm)
  widthMm: number; // physical bead width in mm
  active: boolean;
};

export type PlacedBead = Bead & {
  slotIndex: number;
  rotation: number; // degrees, only meaningful if rotationAllowed
  placedId: string; // unique per placement (not per catalog item) — lets the
  // same bead be placed twice without id collisions
};

export const DEFAULT_WRIST_SIZE_MM = 203;

export type CordType = "elastic" | "leather" | "gold_chain" | "silver_chain";

export type BraceletConfig = {
  totalSlots: number;
  freeSlotLimit: number;
  cordType: CordType;
  wristInches: number;
  wristSizeMm?: number;
  wristSizeLocked?: boolean;
};

export type PricingResult = {
  total: number;
  cordBasePrice: number;
  freeBeadCount: number;
  chargeableBeadCount: number;
  premiumBeadsTotal: number;
  remainingSlots: number;
};

export type DesignSubmission = {
  designId?: string;
  placedBeads: PlacedBead[];
  customerName: string;
  email: string;
  phone: string;
  wristInches: number;
  cordType?: CordType;
  address?: string;
  totalPrice?: number;
  previewImageUrl?: string;
};

export type PresetDesign = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  tag: string;
  description: string;
  wristInches: number;
  cordType?: CordType;
  beadIds: string[];
  image: string;
};

