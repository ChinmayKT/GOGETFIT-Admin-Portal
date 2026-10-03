import { apiRequest } from "./client";
import { FOOD_UNITS } from "../mock/nutrition/reference";
import type { DietFoodRow, DietMeal, DietPlan, DietType, FoodUnit } from "../types/nutrition";

/**
 * Free Diet Plan templates, from the new Node backend.
 *
 * The legacy Admin Portal talked to MariaDB directly from its data layer; this
 * portal never does. Everything here goes through /api/admin/free-diet-plans,
 * which is gated by requireAuth + requireRole("admin") on the server.
 */

/** Wire shape of one food row, exactly as the backend returns it. */
interface ApiFood {
  legacyPlanMealId: number | null;
  foodName: string | null;
  foodType: string | null;
  /** Lowercase, as the legacy r_plan_meal.unit column held it. */
  unit: string | null;
  quantity: number | null;
  calories: number | null;
  fat: number | null;
  carbs: number | null;
  protein: number | null;
}

interface ApiMeal {
  mealId: number;
  foods: ApiFood[];
}

/**
 * What a write sends. Narrower than ApiFood on purpose: legacyPlanMealId is
 * backend-owned (the API rejects it from a client) and foodType has no field in
 * the editor, exactly as the legacy grid had no column for it.
 */
interface ApiFoodInput {
  foodName: string;
  unit: string;
  quantity: number;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

interface ApiMealInput {
  mealId: number;
  foods: ApiFoodInput[];
}

interface ApiPlanRow {
  id: string;
  dietType: string;
  range: { from: number | null; to: number | null };
  mealCount: number;
  foodCount: number;
  status: "active" | "archived";
  legacyPlanId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ApiPlanDetail extends ApiPlanRow {
  meals: ApiMeal[];
  totals: { calories: number; fat: number; carbs: number; protein: number };
  legacy: { source: string | null; planId: number } | null;
}

interface ApiPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FreeDietPlanListParams extends Record<string, unknown> {
  search?: string;
  dietType?: string;
  status?: "active" | "archived";
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

/**
 * The API stores units the way the legacy column did (lowercase); the UI has
 * always shown them capitalized, and the Food Database screen shares that
 * FoodUnit type. Converted at this boundary so neither side has to change.
 */
const toDisplayUnit = (unit: string | null): FoodUnit => {
  const match = FOOD_UNITS.find((known) => known.toLowerCase() === (unit ?? "").toLowerCase());
  return match ?? "Serving";
};

const toApiUnit = (unit: FoodUnit): string => unit.toLowerCase();

/**
 * Rows need a stable local key for the editable grid. The legacy row id is used
 * when there is one, so a migrated row keeps its identity across a re-render.
 */
const toRow = (food: ApiFood, mealId: number, index: number): DietFoodRow => ({
  id: food.legacyPlanMealId != null ? `legacy-${food.legacyPlanMealId}` : `m${mealId}-r${index}`,
  foodName: food.foodName ?? "",
  unit: toDisplayUnit(food.unit),
  qty: food.quantity ?? 0,
  calories: food.calories ?? 0,
  fat: food.fat ?? 0,
  carbs: food.carbs ?? 0,
  protein: food.protein ?? 0,
});

/** Meal 1 to Meal 5, always all five tabs, with the stored rows filled in.
 *
 * The backend stores only the meals a plan actually has - 504 migrated templates
 * genuinely have no meal 5 - so the empty tabs are added here for the editor and
 * are dropped again on save rather than being written back as empty meals. */
export const toMeals = (apiMeals: ApiMeal[]): DietMeal[] =>
  [1, 2, 3, 4, 5].map((mealId) => {
    const stored = apiMeals.find((meal) => meal.mealId === mealId);
    return {
      key: `meal${mealId}`,
      label: `Meal ${mealId}`,
      rows: (stored?.foods ?? []).map((food, index) => toRow(food, mealId, index)),
    };
  });

export const toPlan = (plan: ApiPlanDetail): DietPlan => ({
  id: plan.id,
  dietType: plan.dietType as DietType,
  rangeFrom: plan.range.from ?? 0,
  rangeTo: plan.range.to ?? 0,
  meals: toMeals(plan.meals),
  createdAt: plan.createdAt ?? "",
  updatedAt: plan.updatedAt ?? "",
});

/** A list row. meals is filled with counts only - the list never loads foods. */
const toListPlan = (row: ApiPlanRow): DietPlan & { foodCount: number; legacyPlanId: number | null } => ({
  id: row.id,
  dietType: row.dietType as DietType,
  rangeFrom: row.range.from ?? 0,
  rangeTo: row.range.to ?? 0,
  // The list's "Food Items" column needs the count, not the rows themselves.
  meals: [],
  foodCount: row.foodCount,
  legacyPlanId: row.legacyPlanId,
  createdAt: row.createdAt ?? "",
  updatedAt: row.updatedAt ?? "",
});

export type FreeDietPlanListRow = ReturnType<typeof toListPlan>;

/** Only meals that hold at least one row are sent, and empty rows are dropped. */
export const toApiMeals = (meals: DietMeal[]): ApiMealInput[] =>
  meals
    .map((meal, index) => ({
      mealId: index + 1,
      foods: meal.rows
        .filter((row) => row.foodName.trim() !== "")
        .map((row) => ({
          foodName: row.foodName.trim(),
          unit: toApiUnit(row.unit),
          quantity: Number(row.qty),
          calories: Number(row.calories),
          fat: Number(row.fat),
          carbs: Number(row.carbs),
          protein: Number(row.protein),
        })),
    }))
    .filter((meal) => meal.foods.length > 0);

const toQuery = (params: FreeDietPlanListParams): string => {
  const search = new URLSearchParams();

  if (params.search) search.set("search", params.search);
  if (params.dietType) search.set("dietType", params.dietType);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.sortKey) search.set("sortKey", params.sortKey);
  if (params.sortDir) search.set("sortDir", params.sortDir);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/**
 * One page of plans. Returned in the { rows, total } shape usePagedQuery already
 * expects, so the existing table wiring is reused unchanged.
 */
export async function listFreeDietPlans(params: FreeDietPlanListParams = {}) {
  const data = await apiRequest<{ plans: ApiPlanRow[]; pagination: ApiPagination }>(
    `/admin/free-diet-plans${toQuery(params)}`,
  );
  return {
    rows: data.plans.map(toListPlan),
    total: data.pagination.total,
    pagination: data.pagination,
  };
}

export async function getFreeDietPlan(id: string): Promise<DietPlan> {
  const data = await apiRequest<{ plan: ApiPlanDetail }>(`/admin/free-diet-plans/${id}`);
  return toPlan(data.plan);
}

export interface FreeDietPlanInput {
  dietType: DietType;
  rangeFrom: number;
  rangeTo: number;
  meals: DietMeal[];
}

export async function createFreeDietPlan(input: FreeDietPlanInput): Promise<DietPlan> {
  const data = await apiRequest<{ plan: ApiPlanDetail }>("/admin/free-diet-plans", {
    method: "POST",
    body: {
      dietType: input.dietType,
      range: { from: input.rangeFrom, to: input.rangeTo },
      meals: toApiMeals(input.meals),
    },
  });
  return toPlan(data.plan);
}

export async function updateFreeDietPlan(id: string, input: FreeDietPlanInput): Promise<DietPlan> {
  const data = await apiRequest<{ plan: ApiPlanDetail }>(`/admin/free-diet-plans/${id}`, {
    method: "PATCH",
    body: {
      dietType: input.dietType,
      range: { from: input.rangeFrom, to: input.rangeTo },
      meals: toApiMeals(input.meals),
    },
  });
  return toPlan(data.plan);
}

/** Archives the template server-side; it disappears from the list either way. */
export async function deleteFreeDietPlan(id: string): Promise<void> {
  await apiRequest<{ plan: ApiPlanDetail }>(`/admin/free-diet-plans/${id}`, { method: "DELETE" });
}
