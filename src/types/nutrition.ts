/**
 * Exactly the values the legacy Admin Portal's Diet Type dropdown offered and
 * m_plan.diet_type stores, so the portal, the API and MongoDB share one
 * vocabulary with no translation table in between.
 */
export type DietType = "Veg." | "Veg/Egg" | "Veg/NonVeg";

/**
 * The food vocabulary is owned by types/food.ts, which mirrors the backend Food
 * model. Re-exported here so the diet screens keep one import path.
 */
import type { FoodType, FoodUnit } from "./food";

export type { FoodType, FoodUnit };
export type FoodRequestStatus = "Pending" | "Added" | "Rejected";

export interface DietFoodRow {
  id: string;
  foodName: string;
  unit: FoodUnit;
  qty: number;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export interface DietMeal {
  key: string;
  label: string;
  rows: DietFoodRow[];
}

export interface NutritionTotals {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export interface DietPlan {
  id: string;
  dietType: DietType;
  rangeFrom: number;
  rangeTo: number;
  meals: DietMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodRequest {
  id: string;
  foodItem: string;
  description: string;
  status: FoodRequestStatus;
  requestedBy: string;
  requestedDate: string;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  userId: string;
  userName: string;
  meal: string;
  foodItem: string;
  qty: string;
  calories: number;
}
