import type { GogetfitPlan } from "../../types/gogetfitPlans";
import { daysAgo } from "../shared/utils";

const SOLO_DESC =
  "Healthy isn't a goal, it's a way of living. We at GOGETFIT do not only focus on losing weight, we establish and encourage healthier lifestyle changes. We take into consideration several aspects of your life, such as your schedule, lifestyle, preferences, current health state, dieting history, current eating habits and goals to create a more personalized and tailor-made diet and workout plan.";

const COUPLES_DESC =
  "Couple who trains together stays together. Motivate each other and become the best version of yourselves. With this plan you can transform your lives together and build a stronger emotional connect. Kickstart your fitness journey with your partner with GOGETFIT today!";

const FAMILY_DESC =
  "Grow fit with your family, because a healthier family is a happy family. Here's a plan that can help ensure your and your family's wellbeing and fitness. Take a step towards a more wholesome and active life with GOGETFIT today!";

/** Default content for a brand-new plan — every plan owns its own copy from here on, editable independently per plan. */
export const DEFAULT_INCLUDES = [
  "A personalised diet plan (based on lifestyle, preferences, and goals)",
  "A personalised workout plan (based on your goals and current level of training)",
  "Daily/Weekly check-ins (to track your progress and adjust your diet/workout as needed)",
  "WhatsApp group support",
  "24/7 access to your coach via call, WhatsApp, or email",
  "An active customer support team to answer all your queries",
];

export const DEFAULT_NEXT_STEPS = [
  "Once enrolled, go to 'My Bookings' and click 'Start My Journey'.",
  "You'll be directed to an elaborate questionnaire — take your time answering carefully.",
  "Your coach analyses your lifestyle, preferences, and goals to prepare the best plan for you.",
  "A designated coach contacts you within 24 hours at your preferred time and shares your personalized plan, explains it, answers your queries, and sets expectations and weekly tasks.",
  "Your coach checks in daily/weekly (as you prefer) and adjusts the plan as needed — repeating throughout your plan. Then, you GOGETFIT.",
];

export const DEFAULT_TERMS = [
  "Money refund is only valid for genuine cases (within 15 days of enrolment).",
  "You can opt for a change of coach within 15 days of enrolment. Coach change is only provided within the same tier as the enrolled coach.",
  "Plans selected under challenging a coach are non-refundable. You can opt for a change of coach within the same tier within 15 days of challenging.",
  "Cancelling a package enrolled under a coach: 10% of the price will be deducted.",
  "Cancelling a package (challenge) selected under challenging a coach: non-refundable.",
];

export const DEFAULT_ELIGIBILITY = "You must be at least 18 years old to enrol under a coach on GOGETFIT.";

/** Seeded from the GOGETFIT website's lib/data.ts PLANS array (localhost:3000/plans) — each plan
 * now owns its own copy of includes/nextSteps/terms/eligibility rather than a shared global block. */
export const MOCK_GOGETFIT_PLANS: GogetfitPlan[] = [
  { id: "12-week", name: "12 Weeks GOGETFIT Plan", tier: "Solo", duration: "12 Weeks", durationWeeks: 12, price: 4999, people: 1, description: SOLO_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(300), updatedAt: daysAgo(40) },
  { id: "24-week", name: "24 Weeks GOGETFIT Plan", tier: "Solo", duration: "24 Weeks", durationWeeks: 24, price: 8999, people: 1, description: SOLO_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(300), updatedAt: daysAgo(40) },
  { id: "52-week", name: "52 Weeks GOGETFIT Plan", tier: "Solo", duration: "52 Weeks", durationWeeks: 52, price: 16999, people: 1, description: SOLO_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(300), updatedAt: daysAgo(40) },
  { id: "12-week-couples", name: "12 Weeks Couples GOGETFIT Plan", tier: "Couples", duration: "12 Weeks", durationWeeks: 12, price: 8999, people: 2, description: COUPLES_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(280), updatedAt: daysAgo(35) },
  { id: "24-week-couples", name: "24 Weeks Couples GOGETFIT Plan", tier: "Couples", duration: "24 Weeks", durationWeeks: 24, price: 16999, people: 2, description: COUPLES_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(280), updatedAt: daysAgo(35) },
  { id: "52-week-couples", name: "52 Weeks Couples GOGETFIT Plan", tier: "Couples", duration: "52 Weeks", durationWeeks: 52, price: 32999, people: 2, description: COUPLES_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(280), updatedAt: daysAgo(35) },
  { id: "24-week-family", name: "24 Weeks Family GOGETFIT Plan", tier: "Family", duration: "24 Weeks", durationWeeks: 24, price: 29999, people: 4, description: FAMILY_DESC, includes: [...DEFAULT_INCLUDES], nextSteps: [...DEFAULT_NEXT_STEPS], terms: [...DEFAULT_TERMS], eligibility: DEFAULT_ELIGIBILITY, createdAt: daysAgo(250), updatedAt: daysAgo(20) },
];
