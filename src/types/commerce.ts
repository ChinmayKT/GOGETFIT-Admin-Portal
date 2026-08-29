export type ProductSize = "S/M/L" | "S/M" | "M/L" | "S/L" | "One Size" | "Free Size";
export type ProductStatus = "Active" | "Inactive";

export interface Product {
  id: string;
  name: string;
  description: string;
  points: number;
  size: ProductSize;
  imageUrl: string | null;
  imageFileName: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplification: discount is percentage-only (a flat "Discount %" field). The legacy
 * screen exposed a single numeric "Discount" field with no unit — a percentage-vs-flat
 * toggle would double the form's surface area for a distinction the mock data doesn't
 * need to demonstrate, so this rebuild keeps it to percentage and notes the simplification
 * here rather than in a hidden assumption.
 */
export type CouponAudience = "Everyone" | "Specific Users";

export interface Coupon {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  /**
   * Reframing of the legacy single "Everyone Yes/No" boolean into a clearer Audience
   * concept. `everyone` is kept as the underlying boolean-ish flag for compatibility;
   * `userIds` is populated only when audience === "Specific Users".
   */
  audience: CouponAudience;
  everyone: boolean;
  userIds: string[];
  createdAt: string;
  updatedAt: string;
}
