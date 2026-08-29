import type { Package, PlanLevel, PlanType } from "../../types/package";
import { PLAN_NAMES } from "../shared/reference";
import { randomInt, daysAgo } from "../shared/utils";

interface PackageSeed {
  planName: string;
  planType: PlanType;
  planLevel: PlanLevel;
}

const PACKAGE_SEEDS: PackageSeed[] = [
  { planName: PLAN_NAMES[0], planType: "Enrollment", planLevel: 1 },
  { planName: PLAN_NAMES[1], planType: "Enrollment", planLevel: 2 },
  { planName: PLAN_NAMES[2], planType: "Enrollment", planLevel: 1 },
  { planName: PLAN_NAMES[3], planType: "Enrollment", planLevel: 3 },
  { planName: PLAN_NAMES[4], planType: "Enrollment", planLevel: 4 },
  { planName: PLAN_NAMES[5], planType: "Enrollment", planLevel: 2 },
  { planName: PLAN_NAMES[6], planType: "Enrollment", planLevel: 5 },
  { planName: PLAN_NAMES[7], planType: "Enrollment", planLevel: 3 },
  { planName: "Beginner Fitness — 4 Week", planType: "Enrollment", planLevel: 1 },
  { planName: "Elite Coaching — 6 Month", planType: "Enrollment", planLevel: 5 },
  { planName: PLAN_NAMES[8], planType: "Challenge", planLevel: 3 },
  { planName: "30 Day Fat Loss Challenge", planType: "Challenge", planLevel: 1 },
  { planName: "60 Day Muscle Building Challenge", planType: "Challenge", planLevel: 2 },
  { planName: "100 Day Transformation Challenge", planType: "Challenge", planLevel: 4 },
  { planName: "21 Day Kickstart Challenge", planType: "Challenge", planLevel: 1 },
  { planName: "Summer Shred Challenge", planType: "Challenge", planLevel: 3 },
  { planName: "Elite Athlete Challenge", planType: "Challenge", planLevel: 5 },
  { planName: "New Year Reset Challenge", planType: "Challenge", planLevel: 2 },
];

function makePackage(seed: PackageSeed, index: number): Package {
  const isChallenge = seed.planType === "Challenge";
  const durationWeeks = isChallenge ? [3, 4, 6, 8, 12, 14][index % 6] : [4, 8, 12, 16, 24, 26][index % 6];
  const basePrice = (seed.planLevel * 1500 + randomInt(0, 20) * 100) + (isChallenge ? 0 : 2000);
  const createdAt = daysAgo(randomInt(20, 400));

  return {
    id: `package_${index + 1}`,
    planName: seed.planName,
    planType: seed.planType,
    planLevel: seed.planLevel,
    durationWeeks,
    personsAllowed: isChallenge ? randomInt(1, 4) : 1,
    basePrice,
    rewardRefundMoney: isChallenge ? randomInt(500, 5000) : null,
    description: `${seed.planName} is a Level ${seed.planLevel} ${seed.planType.toLowerCase()} plan designed to help members hit measurable fitness goals over ${durationWeeks} weeks.`,
    inclusions: isChallenge
      ? "Weekly check-ins, progress tracking, community leaderboard access, and a dedicated coach."
      : "Personalized workout plan, diet plan, weekly coach check-ins, and progress tracking.",
    whatNext: isChallenge
      ? "Complete your onboarding form and submit your first progress photo within 48 hours of enrollment."
      : "Your assigned coach will reach out within 24 hours to schedule your onboarding call.",
    termsAndConditions: "Non-transferable. Refunds subject to GoGetFit's cancellation policy. Results vary by individual adherence.",
    eligibility: "Open to users aged 16 and above who have completed the GoGetFit health questionnaire.",
    createdAt,
    updatedAt: createdAt,
  };
}

export const MOCK_PACKAGES: Package[] = PACKAGE_SEEDS.map((seed, i) => makePackage(seed, i));
