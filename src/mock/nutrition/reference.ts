import type { DietType, FoodType, FoodUnit } from "../../types/nutrition";

export const DIET_TYPES: DietType[] = ["Veg", "Veg-Egg", "Veg-NonVeg"];

export const FOOD_UNITS: FoodUnit[] = [
  "Bowl", "Cup", "Glass", "Grams", "ML", "Piece", "Scoop", "Serving", "Slice", "Spoon",
];

export const MEAL_LABELS = ["Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5"];

export const MEAL_MAX_ROWS = 8;

interface FoodPoolEntry {
  name: string;
  type: FoodType;
  brand: string;
  unit: FoodUnit;
  qty: number;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export const FOOD_POOL: FoodPoolEntry[] = [
  { name: "Roti (Whole Wheat)", type: "Vegetarian", brand: "Home Made", unit: "Piece", qty: 1, calories: 104, fat: 2.5, carbs: 18, protein: 3 },
  { name: "Brown Rice (Cooked)", type: "Vegetarian", brand: "Generic", unit: "Bowl", qty: 1, calories: 216, fat: 1.8, carbs: 45, protein: 5 },
  { name: "Boiled Egg", type: "Non-Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 78, fat: 5.3, carbs: 0.6, protein: 6.3 },
  { name: "Paneer Tikka", type: "Vegetarian", brand: "Home Made", unit: "Serving", qty: 1, calories: 265, fat: 18, carbs: 6, protein: 20 },
  { name: "Grilled Chicken Breast", type: "Non-Vegetarian", brand: "Generic", unit: "Grams", qty: 150, calories: 248, fat: 5.4, carbs: 0, protein: 46 },
  { name: "Dal Tadka", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 180, fat: 6, carbs: 22, protein: 9 },
  { name: "Oats Porridge", type: "Vegetarian", brand: "Quaker", unit: "Bowl", qty: 1, calories: 158, fat: 3, carbs: 27, protein: 6 },
  { name: "Greek Yogurt", type: "Vegetarian", brand: "Epigamia", unit: "Cup", qty: 1, calories: 100, fat: 0.4, carbs: 6, protein: 17 },
  { name: "Banana", type: "Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 105, fat: 0.3, carbs: 27, protein: 1.3 },
  { name: "Almonds", type: "Vegetarian", brand: "Generic", unit: "Grams", qty: 30, calories: 174, fat: 15, carbs: 6, protein: 6.4 },
  { name: "Peanut Butter", type: "Vegetarian", brand: "Pintola", unit: "Spoon", qty: 2, calories: 190, fat: 16, carbs: 6, protein: 8 },
  { name: "Whey Protein Shake", type: "Vegetarian", brand: "MuscleBlaze", unit: "Scoop", qty: 1, calories: 120, fat: 2, carbs: 3, protein: 24 },
  { name: "Sweet Potato (Boiled)", type: "Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 112, fat: 0.1, carbs: 26, protein: 2 },
  { name: "Quinoa (Cooked)", type: "Vegetarian", brand: "Generic", unit: "Bowl", qty: 1, calories: 222, fat: 3.6, carbs: 39, protein: 8 },
  { name: "Fish Curry", type: "Non-Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 210, fat: 11, carbs: 5, protein: 24 },
  { name: "Idli", type: "Vegetarian", brand: "Home Made", unit: "Piece", qty: 2, calories: 78, fat: 0.4, carbs: 16, protein: 2.4 },
  { name: "Masala Dosa", type: "Vegetarian", brand: "Home Made", unit: "Piece", qty: 1, calories: 168, fat: 6, carbs: 25, protein: 4 },
  { name: "Sambar", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 120, fat: 3, carbs: 18, protein: 6 },
  { name: "Poha", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 180, fat: 5, carbs: 30, protein: 4 },
  { name: "Milk (Toned)", type: "Vegetarian", brand: "Amul", unit: "Glass", qty: 1, calories: 120, fat: 4.5, carbs: 10, protein: 6.5 },
  { name: "Curd", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 98, fat: 4, carbs: 8, protein: 6 },
  { name: "Tofu", type: "Vegetarian", brand: "Generic", unit: "Grams", qty: 100, calories: 76, fat: 4.8, carbs: 1.9, protein: 8 },
  { name: "Soya Chunks (Cooked)", type: "Vegetarian", brand: "Nutrela", unit: "Bowl", qty: 1, calories: 160, fat: 1, carbs: 12, protein: 26 },
  { name: "Rajma Curry", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 210, fat: 5, carbs: 30, protein: 11 },
  { name: "Chole Masala", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 230, fat: 7, carbs: 32, protein: 10 },
  { name: "Moong Dal Cheela", type: "Vegetarian", brand: "Home Made", unit: "Piece", qty: 2, calories: 140, fat: 3, carbs: 20, protein: 8 },
  { name: "Multigrain Bread", type: "Vegetarian", brand: "Britannia", unit: "Slice", qty: 2, calories: 140, fat: 2, carbs: 24, protein: 6 },
  { name: "Avocado", type: "Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 234, fat: 21, carbs: 12, protein: 3 },
  { name: "Broccoli (Steamed)", type: "Vegetarian", brand: "Generic", unit: "Bowl", qty: 1, calories: 55, fat: 0.6, carbs: 11, protein: 4 },
  { name: "Chicken Soup", type: "Non-Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 90, fat: 3, carbs: 6, protein: 10 },
  { name: "Egg Whites", type: "Non-Vegetarian", brand: "Generic", unit: "Piece", qty: 3, calories: 51, fat: 0.2, carbs: 0.6, protein: 11 },
  { name: "Mixed Nuts", type: "Vegetarian", brand: "Generic", unit: "Grams", qty: 25, calories: 152, fat: 13, carbs: 5, protein: 5 },
  { name: "Sprouts Salad", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 105, fat: 1, carbs: 18, protein: 7 },
  { name: "Apple", type: "Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 95, fat: 0.3, carbs: 25, protein: 0.5 },
  { name: "Cucumber", type: "Vegetarian", brand: "Generic", unit: "Piece", qty: 1, calories: 16, fat: 0.1, carbs: 3.6, protein: 0.7 },
  { name: "Protein Bar", type: "Vegetarian", brand: "RiteBite", unit: "Piece", qty: 1, calories: 200, fat: 7, carbs: 20, protein: 15 },
  { name: "Mutton Curry", type: "Non-Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 280, fat: 18, carbs: 6, protein: 24 },
  { name: "ORS Electrolyte Drink", type: "Vegetarian", brand: "Generic", unit: "ML", qty: 250, calories: 45, fat: 0, carbs: 11, protein: 0 },
  { name: "Cottage Cheese Salad", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 175, fat: 10, carbs: 8, protein: 15 },
  { name: "Vegetable Upma", type: "Vegetarian", brand: "Home Made", unit: "Bowl", qty: 1, calories: 170, fat: 5, carbs: 26, protein: 4 },
];

export const LOG_MEAL_NAMES = ["Breakfast", "Mid-Morning Snack", "Lunch", "Evening Snack", "Dinner"];

export const FOOD_ITEM_REQUEST_NAMES = [
  "Millet Khichdi", "Ragi Dosa", "Jackfruit Biryani", "Paneer Bhurji", "Chia Seed Pudding",
  "Overnight Oats", "Grilled Fish Tikka", "Beetroot Salad", "Sattu Drink", "Makhana Bowl",
  "Sprouted Moong Salad", "Vegan Protein Shake", "Turkey Breast Slices", "Buckwheat Pancake", "Lentil Soup",
];
