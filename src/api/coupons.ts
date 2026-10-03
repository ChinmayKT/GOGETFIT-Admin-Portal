import { apiRequest } from "./client";
import type { Pagination } from "../types/admin";
import type { Coupon, CouponInput, CouponStatus, CouponVisibility } from "../types/coupons";

/** Coupons admin API - requireAuth + requireRole("admin") on the server. */

export interface CouponListParams extends Record<string, unknown> {
  search?: string;
  status?: CouponStatus | "";
  visibility?: CouponVisibility | "";
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

const toQuery = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export async function listCoupons(params: CouponListParams = {}) {
  const data = await apiRequest<{ coupons: Coupon[]; pagination: Pagination }>(`/admin/coupons${toQuery(params)}`);
  return { rows: data.coupons, total: data.pagination.total, pagination: data.pagination };
}

export async function getCoupon(id: string): Promise<Coupon> {
  return (await apiRequest<{ coupon: Coupon }>(`/admin/coupons/${id}`)).coupon;
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  return (await apiRequest<{ coupon: Coupon }>("/admin/coupons", { method: "POST", body: input })).coupon;
}

/** Only the supplied fields change. */
export async function updateCoupon(id: string, patch: Partial<CouponInput>): Promise<Coupon> {
  return (await apiRequest<{ coupon: Coupon }>(`/admin/coupons/${id}`, { method: "PATCH", body: patch })).coupon;
}
