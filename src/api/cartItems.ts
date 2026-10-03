import { apiRequest } from "./client";
import type { Pagination } from "../types/admin";

/**
 * "In cart" - members who added a coaching plan and have not bought it.
 *
 * Only active cart items are returned. A purchased item leaves this list by
 * itself: the purchase flips the cart item's status inside the same transaction
 * that creates the enrollment, so nothing here needs cleaning up after a sale.
 */

export interface CartItemRow {
  id: string;
  status: "active";
  user: { id: string; name: string | null; phone: string | null; email: string | null } | null;
  coach: { id: string; name: string | null; level: string | null } | null;
  plan: {
    id: string;
    name: string | null;
    planType: string | null;
    durationWeeks: number | null;
    price: number | null;
    currency: string;
  } | null;
  addedAt: string | null;
  updatedAt: string | null;
}

export interface CartItemListParams extends Record<string, unknown> {
  search?: string;
  coachId?: string;
  planId?: string;
  addedFrom?: string;
  addedTo?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

const toQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/** In the { rows, total } shape usePagedQuery expects. */
export async function listCartItems(params: CartItemListParams = {}) {
  const data = await apiRequest<{ cartItems: CartItemRow[]; pagination: Pagination }>(
    `/admin/cart-items${toQuery(params)}`,
  );
  return { rows: data.cartItems, total: data.pagination.total, pagination: data.pagination };
}
