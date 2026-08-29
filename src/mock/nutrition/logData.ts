import type { FoodLogEntry } from "../../types/nutrition";
import { FOOD_POOL, LOG_MEAL_NAMES } from "./reference";
import { MOCK_USERS } from "../users/data";
import { daysAgo, randomInt } from "../shared/utils";

function makeEntry(index: number): FoodLogEntry {
  const user = MOCK_USERS[index % MOCK_USERS.length];
  const food = FOOD_POOL[index % FOOD_POOL.length];
  const meal = LOG_MEAL_NAMES[index % LOG_MEAL_NAMES.length];

  return {
    id: `foodlog_${index}`,
    date: daysAgo(randomInt(0, 21)),
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    meal,
    foodItem: food.name,
    qty: `${food.qty} ${food.unit}`,
    calories: food.calories,
  };
}

export const MOCK_FOOD_LOG: FoodLogEntry[] = Array.from({ length: 120 }, (_, i) => makeEntry(i + 1));
