import { ApiError } from "../../api/client";

/** Human-readable text for a coupon API failure. Never a stack trace. */
export function couponErrorMessage(cause: unknown, fallback: string): string {
  if (!(cause instanceof ApiError)) return fallback;
  switch (cause.status) {
    case 409:
      return cause.message || "An active coupon with this code already exists.";
    case 400:
      return cause.message || "Invalid coupon data.";
    case 404:
      return "Coupon not found. It may have been removed.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You need admin access to manage coupons.";
    default:
      return fallback;
  }
}
