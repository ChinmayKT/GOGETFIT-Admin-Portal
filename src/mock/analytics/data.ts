/**
 * Aggregation layer for the Analytics workspace (`operations/analytics`).
 *
 * Every function here is read-only: it imports already-exported arrays/functions from other
 * phases' mock modules and derives an analytics-shaped aggregate from them. Nothing in this
 * file mutates another module's store or its `data.ts`/`repository.ts` source.
 */
import type { AnalyticsCategoryValue, AnalyticsSeriesPoint } from "../../types/analytics";
import { MOCK_USERS } from "../users/data";
import { MOCK_COACHES } from "../coaches/data";
import { MOCK_CLIENTS } from "../users/clientsData";
import { MOCK_PACKAGES } from "../commerce/packageData";
import { MOCK_CHALLENGES } from "../challenges/data";
import { MOCK_PARTICIPANTS } from "../challenges/participantsData";
import { deriveChallengeStatus } from "../challenges/status";
import { MOCK_REWARD_TRANSACTIONS, MOCK_BADGES } from "../rewards/data";
import { MOCK_ORDERS } from "../orders/data";
import { MOCK_FOOD_LOG } from "../nutrition/logData";
import { randomInt } from "../shared/utils";

// ---------------------------------------------------------------------------
// Shared date helpers
// ---------------------------------------------------------------------------

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function sameMonth(a: Date, b: Date): boolean {
  return monthKey(a) === monthKey(b);
}

/** Last `count` calendar months (oldest first), ending with the current month. */
function trailingMonths(count: number): { key: string; label: string; date: Date }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), date: d };
  });
}

function daysWithinLast(iso: string, days: number): boolean {
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs >= 0 && diffMs <= days * 86400000;
}

// ---------------------------------------------------------------------------
// 1. Users
// ---------------------------------------------------------------------------

export function usersKpis() {
  const total = MOCK_USERS.length;
  const now = new Date();
  const newThisMonth = MOCK_USERS.filter((u) => sameMonth(new Date(u.joinedAt), now)).length;
  const active = MOCK_USERS.filter((u) => u.status === "Active").length;
  const inactive = MOCK_USERS.filter((u) => u.status === "Inactive").length;

  return {
    totalUsers: total,
    newThisMonth,
    activeRate: total ? (active / total) * 100 : 0,
    churnRate: total ? (inactive / total) * 100 : 0,
  };
}

/**
 * Deeper drill-down than the dashboard's `userGrowthSeries()`: computed from real
 * `joinedAt`/`lastActiveAt` timestamps rather than a randomized walk. Three series —
 * New Users (signups that month), Active Users (cumulative headcount), Churned
 * (inactive users whose last activity fell in that month, as a churn-timing proxy).
 */
export function userGrowthTrend(): AnalyticsSeriesPoint[] {
  const months = trailingMonths(6);
  const newByMonth = new Map(months.map((m) => [m.key, 0]));
  const churnByMonth = new Map(months.map((m) => [m.key, 0]));

  MOCK_USERS.forEach((u) => {
    const joinKey = monthKey(new Date(u.joinedAt));
    if (newByMonth.has(joinKey)) newByMonth.set(joinKey, newByMonth.get(joinKey)! + 1);
    if (u.status === "Inactive") {
      const lastActiveKey = monthKey(new Date(u.lastActiveAt));
      if (churnByMonth.has(lastActiveKey)) churnByMonth.set(lastActiveKey, churnByMonth.get(lastActiveKey)! + 1);
    }
  });

  const windowStart = months[0].date;
  let cumulative = MOCK_USERS.filter((u) => new Date(u.joinedAt) < windowStart).length;

  return months.map((m) => {
    cumulative += newByMonth.get(m.key) ?? 0;
    return {
      month: m.label,
      "New Users": newByMonth.get(m.key) ?? 0,
      "Active Users": cumulative,
      Churned: churnByMonth.get(m.key) ?? 0,
    };
  });
}

// Typed as AnalyticsSeriesPoint (rather than AnalyticsCategoryValue) so it drops straight into
// BarChart's `Record<string, string | number>[]` data prop without a cast.
export function usersByCity(): AnalyticsSeriesPoint[] {
  const counts = new Map<string, number>();
  MOCK_USERS.forEach((u) => counts.set(u.city, (counts.get(u.city) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));
}

// ---------------------------------------------------------------------------
// 2. Coaches
// ---------------------------------------------------------------------------

export function coachesKpis() {
  const total = MOCK_COACHES.length;
  const totalActiveClients = MOCK_COACHES.reduce((sum, c) => sum + c.activeClients, 0);
  const totalCapacity = MOCK_COACHES.reduce((sum, c) => sum + c.activeClients + c.availableSlots, 0);

  return {
    totalCoaches: total,
    avgClientsPerCoach: total ? totalActiveClients / total : 0,
    // No rating field on the Coach model yet — a placeholder pending a future review-collection phase.
    avgRatingPlaceholder: 4.6,
    utilizationRate: totalCapacity ? (totalActiveClients / totalCapacity) * 100 : 0,
  };
}

export function activeClientsByCoachLevel(): AnalyticsSeriesPoint[] {
  const totals = new Map<number, number>([1, 2, 3, 4, 5].map((lvl) => [lvl, 0]));
  MOCK_COACHES.forEach((c) => totals.set(c.level, (totals.get(c.level) ?? 0) + c.activeClients));
  return Array.from(totals.entries()).map(([level, value]) => ({ label: `Level ${level}`, value }));
}

// ---------------------------------------------------------------------------
// 3. Plans
// ---------------------------------------------------------------------------

export function plansKpis() {
  const activePlans = MOCK_CLIENTS.filter((c) => c.status === "Active").length;
  // Proxy for "completed the plan without dropping out": everyone who wasn't Cancelled.
  const completed = MOCK_CLIENTS.filter((c) => c.status !== "Cancelled").length;
  const completionRate = MOCK_CLIENTS.length ? (completed / MOCK_CLIENTS.length) * 100 : 0;
  const avgDurationWeeks = MOCK_PACKAGES.length
    ? MOCK_PACKAGES.reduce((sum, p) => sum + p.durationWeeks, 0) / MOCK_PACKAGES.length
    : 0;

  return { activePlans, completionRate, avgDurationWeeks };
}

export function planTypeDistribution(): AnalyticsCategoryValue[] {
  const counts = new Map<string, number>();
  MOCK_PACKAGES.forEach((p) => counts.set(p.planType, (counts.get(p.planType) ?? 0) + 1));
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

// ---------------------------------------------------------------------------
// 4. Engagement
// ---------------------------------------------------------------------------

export function engagementKpis() {
  const dailyActiveUsers = MOCK_USERS.filter((u) => daysWithinLast(u.lastActiveAt, 1)).length;
  const avgStreakDays = MOCK_USERS.length
    ? MOCK_USERS.reduce((sum, u) => sum + u.streakDays, 0) / MOCK_USERS.length
    : 0;
  const foodLogEntriesThisWeek = MOCK_FOOD_LOG.filter((f) => daysWithinLast(f.date, 7)).length;

  return { dailyActiveUsers, avgStreakDaysProxy: avgStreakDays, foodLogEntriesThisWeek };
}

/**
 * 14-day engagement trend. There's no real per-day session log in the mock layer, so this
 * synthesizes a plausible curve anchored to the real current DAU figure (today's last point
 * roughly matches `engagementKpis().dailyActiveUsers`) with light day-of-week variation.
 */
export function engagementTrend(): AnalyticsSeriesPoint[] {
  const today = engagementKpis().dailyActiveUsers || 12;
  const days: AnalyticsSeriesPoint[] = [];
  let level = Math.max(6, Math.round(today * 0.75));

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    level += randomInt(-2, 3) + (isWeekend ? -2 : 1);
    level = Math.max(4, level);
    days.push({
      day: d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
      "Active Users": level,
    });
  }
  // Anchor the final day to the real DAU count so the chart's endpoint reflects live KPI data.
  days[days.length - 1] = { ...days[days.length - 1], "Active Users": today };
  return days;
}

// ---------------------------------------------------------------------------
// 5. Challenges
// ---------------------------------------------------------------------------

export function challengesKpis() {
  const activeChallenges = MOCK_CHALLENGES.filter((c) => deriveChallengeStatus(c) === "Active").length;
  const totalParticipants = MOCK_PARTICIPANTS.length;
  const approved = MOCK_PARTICIPANTS.filter((p) => p.reviewDecision === "approved").length;
  const completionRate = totalParticipants ? (approved / totalParticipants) * 100 : 0;

  return { activeChallenges, totalParticipants, completionRate };
}

/** Trims the common " Challenge" suffix and caps length so bar-chart x-axis labels stay legible. */
function shortChallengeLabel(name: string): string {
  const trimmed = name.replace(/\s*Challenge\s*$/i, "");
  return trimmed.length > 20 ? `${trimmed.slice(0, 19)}…` : trimmed;
}

export function participantsByChallenge(): AnalyticsSeriesPoint[] {
  const counts = new Map<string, number>();
  MOCK_PARTICIPANTS.forEach((p) => counts.set(p.challengeId, (counts.get(p.challengeId) ?? 0) + 1));
  const nameById = new Map(MOCK_CHALLENGES.map((c) => [c.id, c.name]));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([challengeId, value]) => ({ label: shortChallengeLabel(nameById.get(challengeId) ?? challengeId), value }));
}

// ---------------------------------------------------------------------------
// 6. Rewards
// ---------------------------------------------------------------------------

export function rewardsKpis() {
  const totalPointsIssued = MOCK_REWARD_TRANSACTIONS.reduce((sum, t) => sum + t.points, 0);
  const uniqueUsers = new Set(MOCK_REWARD_TRANSACTIONS.map((t) => t.userId)).size;
  const avgPointsPerUser = uniqueUsers ? totalPointsIssued / uniqueUsers : 0;
  const topBadge = [...MOCK_BADGES].sort((a, b) => b.earnedCount - a.earnedCount)[0];

  return { totalPointsIssued, avgPointsPerUser, topBadgeName: topBadge?.name ?? "—", topBadgeCount: topBadge?.earnedCount ?? 0 };
}

export function pointsIssuedByMonth(): AnalyticsSeriesPoint[] {
  const months = trailingMonths(6);
  const totals = new Map(months.map((m) => [m.key, 0]));

  MOCK_REWARD_TRANSACTIONS.forEach((t) => {
    const key = monthKey(new Date(t.date));
    if (totals.has(key)) totals.set(key, totals.get(key)! + t.points);
  });

  return months.map((m) => ({ month: m.label, Points: totals.get(m.key) ?? 0 }));
}

// ---------------------------------------------------------------------------
// 7. Commerce
// ---------------------------------------------------------------------------

export function commerceKpis() {
  const totalRevenue = MOCK_ORDERS.reduce((sum, o) => sum + o.amount, 0);
  const now = new Date();
  const ordersThisMonth = MOCK_ORDERS.filter((o) => sameMonth(new Date(o.createdAt), now)).length;
  const avgOrderValue = MOCK_ORDERS.length ? totalRevenue / MOCK_ORDERS.length : 0;

  return { totalRevenue, ordersThisMonth, avgOrderValue };
}

/**
 * `MOCK_ORDERS` only spans the last ~60 days (see `src/mock/orders/data.ts`), so a real 6-month
 * lookback would leave the older 4 months at zero. Real months use the actual order sum; older
 * months extend the trend with a synthetic figure in the same ballpark as the real recent
 * average, so the chart reads as a genuine 6-month view rather than a mostly-empty one.
 */
export function revenueTrend(): AnalyticsSeriesPoint[] {
  const months = trailingMonths(6);
  const totals = new Map(months.map((m) => [m.key, 0]));
  const covered = new Set<string>();

  MOCK_ORDERS.forEach((o) => {
    const key = monthKey(new Date(o.createdAt));
    if (totals.has(key)) {
      totals.set(key, totals.get(key)! + o.amount);
      covered.add(key);
    }
  });

  const realMonths = months.filter((m) => covered.has(m.key));
  const realAvg = realMonths.length
    ? realMonths.reduce((sum, m) => sum + (totals.get(m.key) ?? 0), 0) / realMonths.length
    : 40000;

  return months.map((m) => {
    if (covered.has(m.key)) return { month: m.label, Revenue: totals.get(m.key)! };
    return { month: m.label, Revenue: Math.round(realAvg * (0.75 + Math.random() * 0.5)) };
  });
}
