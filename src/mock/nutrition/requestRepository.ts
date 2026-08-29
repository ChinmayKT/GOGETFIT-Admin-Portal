import type { FoodRequest } from "../../types/nutrition";
import { MOCK_FOOD_REQUESTS } from "./requestData";
import { delay, matchesQuery, paginate, sortRows } from "../shared/utils";

let store: FoodRequest[] = [...MOCK_FOOD_REQUESTS];

export interface FoodRequestListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listFoodRequests(params: FoodRequestListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10, sortKey = "requestedDate", sortDir = "desc" } = params;

  let rows = store.filter((r) => matchesQuery([r.foodItem, r.description, r.requestedBy], query));
  if (status) rows = rows.filter((r) => r.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getFoodRequest(id: string) {
  return delay(store.find((r) => r.id === id) ?? null);
}

export async function markFoodRequestAdded(id: string) {
  store = store.map((r) => (r.id === id ? { ...r, status: "Added" as const } : r));
  return delay(store.find((r) => r.id === id)!, 500);
}

export async function rejectFoodRequest(id: string) {
  store = store.map((r) => (r.id === id ? { ...r, status: "Rejected" as const } : r));
  return delay(store.find((r) => r.id === id)!, 500);
}
