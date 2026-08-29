import type { RewardTransaction, RewardRule, Badge, LeaderboardEntry } from "../../types/rewards";
import { MOCK_REWARD_TRANSACTIONS, MOCK_REWARD_RULES, MOCK_BADGES, ADMIN_STAFF } from "./data";
import { MOCK_USERS } from "../users/data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: RewardTransaction[] = [...MOCK_REWARD_TRANSACTIONS];
let rules: RewardRule[] = [...MOCK_REWARD_RULES];
let badges: Badge[] = [...MOCK_BADGES];

export interface TransactionListParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listTransactions(params: TransactionListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "date", sortDir = "desc" } = params;

  let rows = store.filter((t) => matchesQuery([t.userName, t.ggfId, t.description, t.issuedBy], query));
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

/**
 * Legacy defect fix: the old "View Breakup" action loaded the overall leaderboard
 * instead of the individual user's own point history. This returns ONLY the
 * transactions belonging to `userId`, sorted newest first.
 */
export async function listUserTransactions(userId: string): Promise<RewardTransaction[]> {
  const rows = sortRows(store.filter((t) => t.userId === userId), "date", "desc");
  return delay(rows);
}

export interface LeaderboardListParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function listLeaderboard(params: LeaderboardListParams = {}) {
  const { query = "", page = 1, pageSize = 10 } = params;

  const totals = new Map<string, { ggfId: string; name: string; totalPoints: number }>();
  for (const t of store) {
    const existing = totals.get(t.userId);
    if (existing) existing.totalPoints += t.points;
    else totals.set(t.userId, { ggfId: t.ggfId, name: t.userName, totalPoints: t.points });
  }

  let entries: LeaderboardEntry[] = Array.from(totals.entries())
    .map(([userId, v]) => ({ userId, ...v, rank: 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  entries = entries.filter((e) => matchesQuery([e.name, e.ggfId], query));

  return delay(paginate(entries, page, pageSize));
}

export async function deleteTransaction(id: string) {
  store = store.filter((t) => t.id !== id);
  return delay(true, 400);
}

export interface AddRewardInput {
  name: string;
  ggfId: string;
  points: number;
  issuedBy: string;
  description: string;
}

export async function addReward(input: AddRewardInput): Promise<RewardTransaction> {
  const user = MOCK_USERS.find((u) => u.ggfId.toLowerCase() === input.ggfId.trim().toLowerCase());
  if (!user) throw new Error("No user found with this GGF ID");

  const tx: RewardTransaction = {
    id: nextId("rtx"),
    userId: user.id,
    ggfId: user.ggfId,
    userName: input.name.trim() || `${user.firstName} ${user.lastName}`,
    points: input.points,
    description: input.description,
    date: new Date().toISOString(),
    issuedBy: input.issuedBy,
  };
  store = [tx, ...store];
  return delay(tx, 600);
}

export function adminStaffOptions(): string[] {
  return ADMIN_STAFF;
}

export async function listRules() {
  return delay(rules);
}

export async function updateRule(id: string, patch: Partial<RewardRule>) {
  rules = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
  return delay(rules.find((r) => r.id === id)!, 500);
}

export async function listBadges() {
  return delay(badges);
}
