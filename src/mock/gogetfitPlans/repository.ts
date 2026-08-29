import type { GogetfitPlan } from "../../types/gogetfitPlans";
import { MOCK_GOGETFIT_PLANS } from "./data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: GogetfitPlan[] = [...MOCK_GOGETFIT_PLANS];

export interface PlanListParams {
  query?: string;
  tier?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listGogetfitPlans(params: PlanListParams = {}) {
  const { query = "", tier, page = 1, pageSize = 10, sortKey = "price", sortDir = "asc" } = params;
  let rows = store.filter((p) => matchesQuery([p.name, p.tier, p.duration], query));
  if (tier) rows = rows.filter((p) => p.tier === tier);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

export async function getGogetfitPlan(id: string) {
  return delay(store.find((p) => p.id === id) ?? null);
}

export async function createGogetfitPlan(input: Omit<GogetfitPlan, "id" | "createdAt" | "updatedAt">) {
  const plan: GogetfitPlan = { ...input, id: nextId("plan"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  store = [plan, ...store];
  return delay(plan, 500);
}

export async function updateGogetfitPlan(id: string, patch: Partial<GogetfitPlan>) {
  store = store.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
  return delay(store.find((p) => p.id === id)!, 500);
}

export async function deleteGogetfitPlan(id: string) {
  store = store.filter((p) => p.id !== id);
  return delay(true, 400);
}
