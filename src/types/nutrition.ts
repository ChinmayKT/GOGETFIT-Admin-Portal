export type DietType = "Veg" | "Veg-Egg" | "Veg-NonVeg";
export type FoodUnit = "Bowl" | "Cup" | "Glass" | "Grams" | "ML" | "Piece" | "Scoop" | "Serving" | "Slice" | "Spoon";
export type FoodType = "Vegetarian" | "Non-Vegetarian";
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

export interface Food {
  id: string;
  foodName: string;
  foodType: FoodType;
  brandName: string;
  unit: FoodUnit;
  qty: number;
  comments: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  image: string | null;
  createdAt: string;
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
