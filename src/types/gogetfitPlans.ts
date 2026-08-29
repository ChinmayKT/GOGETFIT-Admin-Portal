export type PlanTier = "Solo" | "Couples" | "Family";

export interface GogetfitPlan {
  id: string;
  name: string;
  tier: PlanTier;
  duration: string;
  durationWeeks: number;
  price: number;
  people: number;
  description: string;
  includes: string[];
  nextSteps: string[];
  terms: string[];
  eligibility: string;
  createdAt: string;
  updatedAt: string;
}

export const TIER_PEOPLE: Record<PlanTier, number> = {
  Solo: 1,
  Couples: 2,
  Family: 4,
};
