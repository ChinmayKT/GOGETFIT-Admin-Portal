import { apiRequest } from "./client";
import type { Pagination } from "../types/admin";
import type { Food, FoodInput, FoodRow, FoodStatus } from "../types/food";

/**
 * Food Database admin API - gated by requireAuth + requireRole("admin") on the
 * server. Paging, search, filtering and sorting all happen in MongoDB; the
 * browser never holds more than one page.
 */

export interface FoodListParams extends Record<string, unknown> {
  search?: string;
  foodType?: string;
  unit?: string;
  status?: FoodStatus;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

const toQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/** In the { rows, total } shape usePagedQuery expects. */
export async function listFoods(params: FoodListParams = {}) {
  const data = await apiRequest<{ foods: FoodRow[]; pagination: Pagination }>(`/admin/foods${toQuery(params)}`);
  return { rows: data.foods, total: data.pagination.total, pagination: data.pagination };
}

export async function getFood(id: string): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}`)).food;
}

export async function createFood(input: FoodInput): Promise<Food> {
  return (await apiRequest<{ food: Food }>("/admin/foods", { method: "POST", body: input })).food;
}

/**
 * Only the supplied fields change. A migrated food keeps its legacy block: it
 * is not in the body, and the server refuses it if it ever were.
 */
export async function updateFood(
  id: string,
  input: Partial<FoodInput> & { status?: FoodStatus },
): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}`, { method: "PUT", body: input })).food;
}

/** Archives the food (soft delete). It leaves the default list and can be restored. */
export async function archiveFood(id: string): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}`, { method: "DELETE" })).food;
}

export async function restoreFood(id: string): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}`, { method: "PUT", body: { status: "active" } })).food;
}

/** Uploads the picture as the raw request body; returns the updated food. */
export async function uploadFoodImage(id: string, file: File): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}/image`, { method: "PUT", file })).food;
}

export async function removeFoodImage(id: string): Promise<Food> {
  return (await apiRequest<{ food: Food }>(`/admin/foods/${id}/image`, { method: "DELETE" })).food;
}
