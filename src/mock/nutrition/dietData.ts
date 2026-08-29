import type { DietFoodRow, DietMeal, DietPlan, DietType } from "../../types/nutrition";
import { DIET_TYPES, FOOD_POOL, MEAL_LABELS } from "./reference";
import { daysAgo, nextId, randomInt } from "../shared/utils";

function makeRow(seedIndex: number): DietFoodRow {
  const base = FOOD_POOL[seedIndex % FOOD_POOL.length];
  return {
    id: nextId("dietrow"),
    foodName: base.name,
    unit: base.unit,
    qty: base.qty,
    calories: base.calories,
    fat: base.fat,
    carbs: base.carbs,
    protein: base.protein,
  };
}

function makeMeal(mealIndex: number, planIndex: number): DietMeal {
  const rowCount = randomInt(2, 5);
  const rows = Array.from({ length: rowCount }, (_, r) => makeRow(planIndex * 7 + mealIndex * 3 + r));
  return { key: `meal${mealIndex + 1}`, label: MEAL_LABELS[mealIndex], rows };
}

function makePlan(index: number): DietPlan {
  const dietType: DietType = DIET_TYPES[index % DIET_TYPES.length];
  const rangeFrom = 1200 + (index % 6) * 200;
  const rangeTo = rangeFrom + 300;
  const meals = Array.from({ length: 5 }, (_, m) => makeMeal(m, index));

  return {
    id: `diet_${index}`,
    dietType,
    rangeFrom,
    rangeTo,
    meals,
    createdAt: daysAgo(randomInt(30, 500)),
    updatedAt: daysAgo(randomInt(0, 29)),
  };
}

export const MOCK_DIET_PLANS: DietPlan[] = Array.from({ length: 18 }, (_, i) => makePlan(i + 1));
