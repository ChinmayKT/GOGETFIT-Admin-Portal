import type { Order } from "../../types/order";
import { MOCK_ORDERS } from "./data";
import { delay, matchesQuery, paginate, sortRows } from "../shared/utils";

let store: Order[] = [...MOCK_ORDERS];

export interface OrderListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listOrders(params: OrderListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;
  let rows = store.filter((o) => matchesQuery([o.orderNumber, o.userName, o.email, o.phone], query));
  if (status) rows = rows.filter((o) => o.status === status);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

export async function getOrder(id: string) {
  return delay(store.find((o) => o.id === id) ?? null);
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  store = store.map((o) => (o.id === id ? { ...o, status } : o));
  return delay(store.find((o) => o.id === id)!, 500);
}

export function recentOrders(limit = 5) {
  return [...store].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export function revenueMTD() {
  const now = new Date();
  return store
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + o.amount, 0);
}
