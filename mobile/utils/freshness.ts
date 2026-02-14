// src/utils/freshness.ts

/**
 * Freshness represents SELLING CONDITION, not scientific precision.
 * Assumes proper icing / chilled storage after harvest.
 */
export enum FreshnessStatus {
  /** Future harvest - pre-order item */
  PRE_ORDER = "pre_order",

  /** Same-day catch */
  ULTRA_FRESH = "ultra_fresh",

  /** Properly iced, fresh */
  FRESH = "fresh",

  /** Still acceptable quality */
  GOOD = "good",

  /** Quality declining, should be sold today */
  FAIR = "fair",

  /** Too old for sale */
  NOT_FRESH = "not_fresh",

  /** Missing or invalid harvest time */
  UNKNOWN = "unknown",
}

export interface FreshnessResult {
  status: FreshnessStatus;
  label: string;
  color: string;
  hoursElapsed: number;
  harvestDate?: Date; // Add harvest date for reference
  isPreOrder: boolean; // Flag for easy checking
}

/**
 * Badge colors (UI concern)
 */
const COLORS: Record<FreshnessStatus, string> = {
  [FreshnessStatus.PRE_ORDER]: "#64748b",
  [FreshnessStatus.ULTRA_FRESH]: "#10b981", // emerald
  [FreshnessStatus.FRESH]: "#06b6d4", // cyan
  [FreshnessStatus.GOOD]: "#ceac00", // amber
  [FreshnessStatus.FAIR]: "#d97706", // orange
  [FreshnessStatus.NOT_FRESH]: "#dc2626", // red
  [FreshnessStatus.UNKNOWN]: "#6b7280", // gray
};

/**
 * Buyer-facing labels (market language)
 */
const LABELS: Record<FreshnessStatus, string> = {
  [FreshnessStatus.PRE_ORDER]: "Pre-order",
  [FreshnessStatus.ULTRA_FRESH]: "Today’s Catch",
  [FreshnessStatus.FRESH]: "Fresh (Iced)",
  [FreshnessStatus.GOOD]: "Still Fresh",
  [FreshnessStatus.FAIR]: "Consume Soon",
  [FreshnessStatus.NOT_FRESH]: "Not Fresh",
  [FreshnessStatus.UNKNOWN]: "Harvest Time Unknown",
};

/**
 * Selling windows in HOURS
 * These are intentionally coarse and realistic for wet markets.
 */
const THRESHOLDS = {
  ultraFresh: 8, // ≤ 8 hours — just harvested, highest quality
  fresh: 24, // 8–24 hours — safe & fresh (same day)
  good: 48, // 24–48 hours — still acceptable, cook immediately
  fair: 60, // 48–60 hours — LAST CALL, sell today only
} as const;

/**
 * Computes freshness status based on harvest time.
 * Harvest time is assumed to be immutable after posting.
 */
export function computeFreshness(harvestedAt?: string | null): FreshnessResult {
  if (!harvestedAt) {
    return unknownResult();
  }

  const harvestDate = new Date(harvestedAt);
  if (isNaN(harvestDate.getTime())) {
    return unknownResult();
  }

  const now = new Date();
  const hoursElapsed =
    (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60);

  // Check for pre-order (future harvest date)
  if (hoursElapsed < 0) {
    return {
      status: FreshnessStatus.PRE_ORDER,
      label: LABELS[FreshnessStatus.PRE_ORDER],
      color: COLORS[FreshnessStatus.PRE_ORDER],
      hoursElapsed,
      harvestDate,
      isPreOrder: true,
    };
  }

  let status: FreshnessStatus;

  if (hoursElapsed <= THRESHOLDS.ultraFresh) {
    status = FreshnessStatus.ULTRA_FRESH;
  } else if (hoursElapsed <= THRESHOLDS.fresh) {
    status = FreshnessStatus.FRESH;
  } else if (hoursElapsed <= THRESHOLDS.good) {
    status = FreshnessStatus.GOOD;
  } else if (hoursElapsed <= THRESHOLDS.fair) {
    status = FreshnessStatus.FAIR;
  } else {
    status = FreshnessStatus.NOT_FRESH;
  }

  return {
    status,
    label: LABELS[status],
    color: COLORS[status],
    hoursElapsed,
    harvestDate,
    isPreOrder: false,
  };
}

/**
 * Business helpers
 */

export function isSellable(harvestedAt?: string | null): boolean {
  const { status } = computeFreshness(harvestedAt);
  return (
    status !== FreshnessStatus.NOT_FRESH && status !== FreshnessStatus.UNKNOWN
    // Pre-order IS sellable, just not available yet
  );
}

export function needsUrgentSale(harvestedAt?: string | null): boolean {
  const { status } = computeFreshness(harvestedAt);
  return status === FreshnessStatus.FAIR;
}

export function isPreOrder(harvestedAt?: string | null): boolean {
  const { isPreOrder } = computeFreshness(harvestedAt);
  return isPreOrder;
}

export function getDaysUntilHarvest(
  harvestedAt?: string | null,
): number | null {
  if (!harvestedAt) return null;

  const harvestDate = new Date(harvestedAt);
  if (isNaN(harvestDate.getTime())) return null;

  const now = new Date();
  const diffMs = harvestDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}

/**
 * Internal helper
 */
function unknownResult(): FreshnessResult {
  return {
    status: FreshnessStatus.UNKNOWN,
    label: LABELS[FreshnessStatus.UNKNOWN],
    color: COLORS[FreshnessStatus.UNKNOWN],
    hoursElapsed: 0,
    isPreOrder: false,
  };
}
