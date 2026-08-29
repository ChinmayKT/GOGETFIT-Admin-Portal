import { MOCK_MEASUREMENTS } from "./measurementData";
import { delay, matchesQuery, paginate, sortRows } from "../shared/utils";

let store = [...MOCK_MEASUREMENTS];

export interface MeasurementListParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listMeasurementUsers(params: MeasurementListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "userName", sortDir = "asc" } = params;

  let rows = store.filter((u) => matchesQuery([u.userName, u.ggfId], query));
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getMeasurementHistory(userId: string) {
  return delay(store.find((u) => u.userId === userId) ?? null);
}
