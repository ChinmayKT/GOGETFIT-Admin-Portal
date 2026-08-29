import type { FoodRequest, FoodRequestStatus } from "../../types/nutrition";
import { FOOD_ITEM_REQUEST_NAMES } from "./reference";
import { fullName } from "../shared/reference";
import { daysAgo, randomInt } from "../shared/utils";

const DESCRIPTIONS = [
  "Would love to see this added — I eat it regularly and want to log accurate macros.",
  "My coach recommended this food but it isn't in the database yet.",
  "Common regional dish, please add with standard serving size.",
  "Requesting this as a low-calorie snack option for evening cravings.",
  "This is a staple in my diet plan, needs accurate nutrition values.",
];

function makeRequest(index: number): FoodRequest {
  const status: FoodRequestStatus = index % 5 === 0 ? "Added" : index % 7 === 0 ? "Rejected" : "Pending";
  const { name } = fullName();
  return {
    id: `foodreq_${index}`,
    foodItem: FOOD_ITEM_REQUEST_NAMES[index % FOOD_ITEM_REQUEST_NAMES.length],
    description: DESCRIPTIONS[index % DESCRIPTIONS.length],
    status,
    requestedBy: name,
    requestedDate: daysAgo(randomInt(1, 90)),
  };
}

export const MOCK_FOOD_REQUESTS: FoodRequest[] = Array.from({ length: 22 }, (_, i) => makeRequest(i + 1));
