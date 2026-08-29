import type { AppUser } from "../../types/user";
import { MOCK_USERS } from "./data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: AppUser[] = [...MOCK_USERS];

export interface UserListParams {
  query?: string;
  status?: string;
  goal?: string;
  coachId?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listUsers(params: UserListParams = {}) {
  const { query = "", status, goal, coachId, page = 1, pageSize = 10, sortKey = "joinedAt", sortDir = "desc" } = params;

  let rows = store.filter((u) =>
    matchesQuery([u.firstName, u.lastName, u.email, u.phone, u.ggfId, u.city], query),
  );
  if (status) rows = rows.filter((u) => u.status === status);
  if (goal) rows = rows.filter((u) => u.goal === goal);
  if (coachId) rows = rows.filter((u) => u.coachId === coachId);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getUser(id: string) {
  return delay(store.find((u) => u.id === id) ?? null);
}

export async function createUser(input: Partial<AppUser>) {
  const user: AppUser = {
    id: nextId("user"),
    ggfId: `GGF${Math.floor(Math.random() * 90000 + 10000)}`,
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    gender: input.gender ?? "Male",
    userType: input.userType ?? "User",
    dob: input.dob ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    city: input.city ?? "",
    state: input.state ?? "",
    country: input.country ?? "India",
    zipCode: input.zipCode ?? "",
    address: input.address ?? "",
    heightCm: input.heightCm ?? 0,
    weightKg: input.weightKg ?? 0,
    waistCm: input.waistCm ?? 0,
    neckCm: input.neckCm ?? 0,
    hipsCm: input.hipsCm ?? 0,
    bodyFatPct: input.bodyFatPct ?? 0,
    bmr: input.bmr ?? 0,
    tdee: input.tdee ?? 0,
    goal: input.goal ?? "General Fitness",
    coachId: null,
    coachName: null,
    planName: null,
    status: "Pending",
    streakDays: 0,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  store = [user, ...store];
  return delay(user, 600);
}

export async function updateUser(id: string, patch: Partial<AppUser>) {
  store = store.map((u) => (u.id === id ? { ...u, ...patch } : u));
  return delay(store.find((u) => u.id === id)!, 600);
}

export function userStats() {
  return {
    total: store.length,
    active: store.filter((u) => u.status === "Active").length,
  };
}
