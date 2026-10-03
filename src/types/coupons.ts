import { formatDate } from "../utils/format";
/** Coupons, as served by /api/admin/coupons (CRUD only - no redemption yet). */

export type CouponVisibility = "public" | "private";
/**
 * Decided by the backend from validFrom/validTo (inclusive, by calendar day):
 * active while today is inside the window, inactive before and after. Never set
 * by an admin, and never computed in the portal.
 */
export type CouponStatus = "active" | "inactive";

/** Who created / last changed a coupon, for display. */
export interface CouponAdmin {
  id: string;
  name: string | null;
  email: string | null;
}

export interface Coupon {
  id: string;
  /** Upper-case, trimmed. */
  code: string;
  description: string | null;
  /** Percentage only. */
  discount: { type: "percent"; value: number };
  /** ISO; the window is inclusive of both days. */
  validFrom: string;
  validTo: string;
  visibility: CouponVisibility;
  status: CouponStatus;
  createdBy: CouponAdmin | null;
  updatedBy: CouponAdmin | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** What the form sends. Status and audit fields are backend-controlled. */
export interface CouponInput {
  code: string;
  description: string | null;
  discount: { type: "percent"; value: number };
  /** yyyy-mm-dd, as a date input gives it. */
  validFrom: string;
  validTo: string;
  visibility: CouponVisibility;
}

/** A coupon's validity date as the calendar day it was entered as (stored at UTC midnight). */
export const couponDay = (iso: string | null) => formatDate(iso, { timeZone: "UTC" });

/** For a date input: yyyy-mm-dd. */
export const couponDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export const adminName = (admin: CouponAdmin | null) => admin?.name ?? admin?.email ?? "—";
