import { MOCK_CLIENTS } from "./clientsData";
import { delay, matchesQuery, paginate, sortRows } from "../shared/utils";

let store = [...MOCK_CLIENTS];

export interface ClientListParams {
  query?: string;
  status?: string;
  coachId?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listClients(params: ClientListParams = {}) {
  const { query = "", status, coachId, page = 1, pageSize = 10, sortKey = "startDate", sortDir = "desc" } = params;

  let rows = store.filter((c) => matchesQuery([c.clientName, c.email, c.phone, c.ggfId, c.transactionId], query));
  if (status) rows = rows.filter((c) => c.status === status);
  if (coachId) rows = rows.filter((c) => c.coachId === coachId);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}
