import type { RewardTransaction, RewardRule, Badge } from "../../types/rewards";
import { MOCK_USERS } from "../users/data";
import { randomInt, pick, daysAgo } from "../shared/utils";

export const ADMIN_STAFF = [
  "Priya Sharma (Admin)",
  "Karthik Rao (Ops)",
  "Neha Verma (Support)",
  "Rohan Mehta (Admin)",
  "System",
];

const ACTIVITIES: { description: string; points: number }[] = [
  { description: "Completed a workout", points: 10 },
  { description: "Daily login streak", points: 5 },
  { description: "Referred a friend", points: 50 },
  { description: "Submitted a transformation", points: 25 },
  { description: "Logged meals for 7 consecutive days", points: 15 },
  { description: "Hit weekly step goal", points: 8 },
  { description: "Completed a challenge", points: 30 },
  { description: "Completed profile setup", points: 5 },
];

let txCounter = 1;
function makeTransaction(user: (typeof MOCK_USERS)[number]): RewardTransaction {
  const activity = pick(ACTIVITIES);
  return {
    id: `rtx_${txCounter++}`,
    userId: user.id,
    ggfId: user.ggfId,
    userName: `${user.firstName} ${user.lastName}`,
    points: activity.points,
    description: activity.description,
    date: daysAgo(randomInt(0, 240)),
    issuedBy: pick(ADMIN_STAFF),
  };
}

// Only a subset of users have reward activity — mirrors a real leaderboard where not everyone participates.
const ACTIVE_USERS = MOCK_USERS.filter((_, i) => i % 2 === 0).slice(0, 70);

export const MOCK_REWARD_TRANSACTIONS: RewardTransaction[] = ACTIVE_USERS.flatMap((user) =>
  Array.from({ length: randomInt(1, 6) }, () => makeTransaction(user)),
);

export const MOCK_REWARD_RULES: RewardRule[] = [
  { id: "rule_1", name: "Complete a workout", points: 10, description: "Awarded each time a user logs a completed workout session." },
  { id: "rule_2", name: "Daily login streak", points: 5, description: "Awarded for opening the app and logging activity on consecutive days." },
  { id: "rule_3", name: "Refer a friend", points: 50, description: "Awarded when a referred friend completes signup and their first payment." },
  { id: "rule_4", name: "Submit a transformation", points: 25, description: "Awarded when a before/after transformation photo pair is submitted." },
  { id: "rule_5", name: "Log meals for 7 days straight", points: 15, description: "Awarded for uninterrupted food logging across a full week." },
  { id: "rule_6", name: "Hit weekly step goal", points: 8, description: "Awarded when a user's weekly step count meets their target." },
  { id: "rule_7", name: "Complete a challenge", points: 30, description: "Awarded on successful completion of a fitness challenge." },
  { id: "rule_8", name: "Complete profile setup", points: 5, description: "Awarded once for completing all profile fields." },
];

const BADGE_SEED: { name: string; criteria: string; color: string }[] = [
  { name: "First Steps", criteria: "Complete your first workout", color: "#ff7a00" },
  { name: "Streak Starter", criteria: "Maintain a 7-day login streak", color: "#34d399" },
  { name: "Transformation Star", criteria: "Get a transformation post approved", color: "#9085e9" },
  { name: "Referral Champ", criteria: "Refer 5 friends who sign up", color: "#3987e5" },
  { name: "Consistency King", criteria: "Log meals for 30 consecutive days", color: "#fbbf24" },
  { name: "Challenge Crusher", criteria: "Complete 3 fitness challenges", color: "#f87171" },
  { name: "Century Club", criteria: "Earn 100 total reward points", color: "#199e70" },
  { name: "Iron Will", criteria: "Complete 50 workouts", color: "#d55181" },
  { name: "Early Bird", criteria: "Log a workout before 7 AM, 10 times", color: "#60a5fa" },
];

export const MOCK_BADGES: Badge[] = BADGE_SEED.map((b, i) => ({
  id: `badge_${i + 1}`,
  name: b.name,
  criteria: b.criteria,
  color: b.color,
  earnedCount: randomInt(5, 120),
}));
