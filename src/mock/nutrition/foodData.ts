import type { Food } from "../../types/nutrition";
import { FOOD_POOL } from "./reference";
import { daysAgo, randomInt } from "../shared/utils";

function makeFood(index: number): Food {
  const base = FOOD_POOL[index % FOOD_POOL.length];
  return {
    id: `food_${index}`,
    foodName: base.name,
    foodType: base.type,
    brandName: base.brand,
    unit: base.unit,
    qty: base.qty,
    comments: index % 4 === 0 ? "Preferred pre-workout option" : "",
    calories: base.calories,
    fat: base.fat,
    carbs: base.carbs,
    protein: base.protein,
    image: null,
    createdAt: daysAgo(randomInt(5, 500)),
  };
}

export const MOCK_FOODS: Food[] = FOOD_POOL.map((_, i) => makeFood(i + 1));
