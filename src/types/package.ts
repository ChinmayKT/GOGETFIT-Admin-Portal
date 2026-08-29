export type PlanType = "Enrollment" | "Challenge";
export type PlanLevel = 1 | 2 | 3 | 4 | 5;

export interface Package {
  id: string;
  planName: string;
  planType: PlanType;
  planLevel: PlanLevel;
  durationWeeks: number;
  personsAllowed: number;
  basePrice: number;
  /** Only meaningful when planType === "Challenge"; null for Enrollment plans. */
  rewardRefundMoney: number | null;
  description: string;
  inclusions: string;
  whatNext: string;
  termsAndConditions: string;
  eligibility: string;
  createdAt: string;
  updatedAt: string;
}
