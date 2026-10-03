/**
 * Mirrors the canonical MongoDB user shape returned by /api/admin/*.
 *
 * Deliberately NOT the legacy flat `AppUser`: the new backend nests everything
 * under `profile`, and there are no root-level height/weight/email/isVerified
 * fields to fall back on.
 */

/** The four roles are additive - an account can hold several at once. */
export type Role = "user" | "client" | "coach" | "admin";

export const ROLE_ORDER: Role[] = ["user", "client", "coach", "admin"];

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  client: "Client",
  coach: "Coach",
  admin: "Admin",
};

export type AccountStatus = "active" | "inactive" | "blocked";

export interface FitnessProfile {
  /** Centimetres. */
  height: number | null;
  /** Kilograms. */
  weight: number | null;
  bodyFatPercentage: number | null;
  activityLevel: string | null;
  foodType: string | null;
  goal: string | null;
  /** kcal/day, carried over from the legacy system - never recomputed here. */
  bmr: number | null;
  /** kcal/day. The legacy column was named tdee. */
  tdee: number | null;
}

export interface AdminUserProfile {
  name: string | null;
  email: string | null;
  isEmailVerified: boolean;
  /** ISO date, yyyy-mm-dd. */
  dateOfBirth: string | null;
  age: number | null;
  gender: "male" | "female" | null;
  city: string | null;
  profilePicture: string | null;
  /** The Free Diet Plan template this member is currently matched to, or null. */
  freeDietPlanId: string | null;
  fitnessProfile: FitnessProfile;
}

export interface AdminUser {
  id: string;
  phone: { raw: string | null; normalized: string | null };
  profile: AdminUserProfile;
  profileCompleted: boolean;
  /** Additive - render every entry, never just the first. */
  roles: Role[];
  status: AccountStatus | null;
  /** Migration/debug aid: the originating legacy MariaDB row, when there was one. */
  legacy: { source: string | null; userId: number } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: Pagination;
}

/** Sorts into canonical order so the badge row reads the same for every user. */
export const sortRoles = (roles: Role[]): Role[] =>
  ROLE_ORDER.filter((role) => roles.includes(role));
