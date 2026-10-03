/**
 * The Food Database, as served by /api/admin/foods.
 *
 * One document per food at one portion: nutrition belongs to `serving` and is
 * never per 100g unless the serving says so. The same food at a different
 * portion is a different food, which is why the name is not unique.
 *
 * This file owns the food vocabulary for the whole portal - the units and types
 * here are exactly the ones the backend model accepts, so there is no second
 * vocabulary to keep in step.
 */

export const FOOD_TYPES = ["Vegetarian", "Non-Vegetarian"] as const;
export type FoodType = (typeof FOOD_TYPES)[number];

export const FOOD_UNITS = [
  "Bowl",
  "Cup",
  "Glass",
  "Grams",
  "ML",
  "Piece",
  "Scoop",
  "Serving",
  "Slice",
  "Spoon",
] as const;
export type FoodUnit = (typeof FOOD_UNITS)[number];

/** archived = soft-deleted: out of the default list, still referenced by plans and logs. */
export type FoodStatus = "active" | "archived";

/** A stored image reference. Never the bytes, never base64, never a legacy filename. */
export interface FoodImage {
  url: string;
  storageKey: string | null;
}

export interface FoodServing {
  /** String, not FoodUnit: a stored value is displayed as it is, never coerced. */
  unit: string;
  quantity: number;
}

export interface FoodNutrition {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export interface FoodRow {
  id: string;
  name: string;
  foodType: string;
  brand: string | null;
  serving: FoodServing;
  /** The macros for one `serving` - not scaled, not normalised. */
  nutrition: FoodNutrition;
  image: FoodImage | null;
  status: FoodStatus;
  /** Secondary admin metadata; null for a food added in the portal. */
  legacyFoodId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Food extends FoodRow {
  notes: string | null;
  deletedAt: string | null;
  /** Present only on a migrated food, and immutable. */
  legacy: { source: string | null; foodId: number } | null;
  migration: { runId: string; migratedAt: string | null; version: number | null } | null;
}

/**
 * What the Add/Edit Food form writes. Legacy, audit and image fields are never
 * sent from here: the image has its own upload endpoint.
 */
export interface FoodInput {
  name: string;
  foodType: FoodType;
  brand: string | null;
  serving: { unit: FoodUnit; quantity: number };
  nutrition: FoodNutrition;
  notes: string | null;
}
