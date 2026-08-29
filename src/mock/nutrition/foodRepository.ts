import type { Food } from "../../types/nutrition";
import { MOCK_FOODS } from "./foodData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Food[] = [...MOCK_FOODS];

export interface FoodListParams {
  query?: string;
  foodType?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listFoods(params: FoodListParams = {}) {
  const { query = "", foodType, page = 1, pageSize = 10, sortKey = "foodName", sortDir = "asc" } = params;

  let rows = store.filter((f) => matchesQuery([f.foodName, f.brandName, f.comments], query));
  if (foodType) rows = rows.filter((f) => f.foodType === foodType);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getFood(id: string) {
  return delay(store.find((f) => f.id === id) ?? null);
}

export async function createFood(input: Omit<Food, "id" | "createdAt">) {
  const food: Food = { ...input, id: nextId("food"), createdAt: new Date().toISOString() };
  store = [food, ...store];
  return delay(food, 600);
}

export async function updateFood(id: string, patch: Partial<Food>) {
  store = store.map((f) => (f.id === id ? { ...f, ...patch } : f));
  return delay(store.find((f) => f.id === id)!, 600);
}

export async function deleteFood(id: string) {
  store = store.filter((f) => f.id !== id);
  return delay(true, 400);
}

export function foodOptions() {
  return store.map((f) => ({ id: f.id, name: f.foodName }));
}
