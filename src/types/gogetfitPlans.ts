/**
 * GoGetFit Plans - the paid coaching plans members buy (legacy m_package), as
 * served by /api/admin/gogetfit-plans. Not the Free Diet Plan templates.
 */

/** Legacy package_type, verbatim. A Challenge carries a refund reward. */
export const PLAN_TYPES = ["Enrollment", "Challenge"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

/** Legacy coach_level - the same LEVEL 1..5 vocabulary as coaches. */
export const PLAN_LEVELS = ["LEVEL 1", "LEVEL 2", "LEVEL 3", "LEVEL 4", "LEVEL 5"] as const;
export type PlanLevel = (typeof PLAN_LEVELS)[number];

export type PlanStatus = "active" | "archived";

export interface PlanPricing {
  /** Whole rupees, incl. of taxes. */
  basePrice: number;
  /** Refund money of a Challenge. Legacy Enrollment plans hold 0. */
  reward: number | null;
  currency: "INR";
}

export interface PlanContent {
  description: string | null;
  /** Newline-separated lines, as authored. */
  inclusions: string | null;
  whatNext: string | null;
  termsAndConditions: string | null;
  eligibility: string | null;
}

/** A stored image reference (same shape as a coach picture). Never the bytes. */
export interface PlanImage {
  url: string;
  storageKey: string | null;
}

export interface GogetfitPlanRow {
  id: string;
  /** The plan's own 3:1 cover, or null. Managed through its own endpoints. */
  image: PlanImage | null;
  name: string;
  /** String, not PlanType: migrated rows are shown exactly as stored. */
  planType: string;
  coachLevel: string | null;
  durationWeeks: number;
  personsAllowed: number;
  pricing: PlanPricing;
  status: PlanStatus;
  legacyPackageId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GogetfitPlan extends GogetfitPlanRow {
  content: PlanContent;
  deletedAt: string | null;
  legacy: { source: string | null; packageId: number; createdBy: string | null; updatedAt: string | null; updatedBy: string | null } | null;
}

/** What the form writes. Audit, legacy and status fields are never sent from here. */
export interface GogetfitPlanInput {
  name: string;
  planType: PlanType;
  coachLevel: PlanLevel;
  durationWeeks: number;
  personsAllowed: number;
  pricing: { basePrice: number; reward: number | null };
  content: PlanContent;
}
