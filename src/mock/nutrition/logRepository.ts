import { MOCK_FOOD_LOG } from "./logData";
import { delay, paginate, sortRows } from "../shared/utils";

export interface FoodLogListParams {
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listFoodLog(params: FoodLogListParams = {}) {
  const { userId, from, to, page = 1, pageSize = 12 } = params;

  let rows = [...MOCK_FOOD_LOG];
  if (userId) rows = rows.filter((r) => r.userId === userId);
  if (from) rows = rows.filter((r) => r.date >= from);
  if (to) rows = rows.filter((r) => r.date <= `${to}T23:59:59.999Z`);
  rows = sortRows(rows, "date", "desc");

  return delay(paginate(rows, page, pageSize), 350);
}
