import type { Coupon } from "../../types/commerce";
import { MOCK_COUPONS } from "./couponData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Coupon[] = [...MOCK_COUPONS];

export interface CouponListParams {
  query?: string;
  audience?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listCoupons(params: CouponListParams = {}) {
  const { query = "", audience, page = 1, pageSize = 10, sortKey = "updatedAt", sortDir = "desc" } = params;

  let rows = store.filter((c) => matchesQuery([c.name, c.code], query));
  if (audience) rows = rows.filter((c) => c.audience === audience);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getCoupon(id: string) {
  return delay(store.find((c) => c.id === id) ?? null);
}

export async function createCoupon(input: Omit<Coupon, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const coupon: Coupon = { ...input, id: nextId("coupon"), createdAt: now, updatedAt: now };
  store = [coupon, ...store];
  return delay(coupon, 600);
}

export async function updateCoupon(id: string, patch: Partial<Coupon>) {
  store = store.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  return delay(store.find((c) => c.id === id)!, 600);
}

export async function deleteCoupon(id: string) {
  store = store.filter((c) => c.id !== id);
  return delay(true, 400);
}
