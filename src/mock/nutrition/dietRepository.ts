import type { DietMeal, DietPlan } from "../../types/nutrition";
import { MOCK_DIET_PLANS } from "./dietData";
import { MEAL_LABELS } from "./reference";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: DietPlan[] = [...MOCK_DIET_PLANS];

export interface DietListParams {
  query?: string;
  dietType?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export function emptyMeals(): DietMeal[] {
  return MEAL_LABELS.map((label, i) => ({ key: `meal${i + 1}`, label, rows: [] }));
}

export async function listDiets(params: DietListParams = {}) {
  const { query = "", dietType, page = 1, pageSize = 10, sortKey = "updatedAt", sortDir = "desc" } = params;

  let rows = store.filter((d) => matchesQuery([d.dietType, String(d.rangeFrom), String(d.rangeTo)], query));
  if (dietType) rows = rows.filter((d) => d.dietType === dietType);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getDiet(id: string) {
  return delay(store.find((d) => d.id === id) ?? null);
}

export async function createDiet(input: Omit<DietPlan, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const plan: DietPlan = { ...input, id: nextId("diet"), createdAt: now, updatedAt: now };
  store = [plan, ...store];
  return delay(plan, 600);
}

export async function updateDiet(id: string, patch: Partial<DietPlan>) {
  store = store.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d));
  return delay(store.find((d) => d.id === id)!, 600);
}

export async function deleteDiet(id: string) {
  store = store.filter((d) => d.id !== id);
  return delay(true, 400);
}
