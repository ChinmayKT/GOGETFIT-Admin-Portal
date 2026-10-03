import { apiRequest } from "./client";
import type { AdminUser, Pagination } from "../types/admin";
import type {
  CoachImageSlot,
  CoachProfile,
  CoachProfileLevel,
  CoachProfileStatus,
  CoachRecord,
} from "../types/coach";

/**
 * Coach profiles, from the new Node backend. Every call is gated server-side by
 * requireAuth + requireRole("admin").
 */

export interface CoachListParams extends Record<string, unknown> {
  search?: string;
  status?: CoachProfileStatus | "";
  level?: CoachProfileLevel | "";
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
export async function listCoaches(params: CoachListParams = {}) {
  const data = await apiRequest<{ coaches: CoachRecord[]; pagination: Pagination }>(
    `/admin/coaches${toQuery(params)}`,
  );
  return { rows: data.coaches, total: data.pagination.total, pagination: data.pagination };
}

export async function getCoach(id: string): Promise<CoachRecord> {
  const data = await apiRequest<{ coach: CoachRecord }>(`/admin/coaches/${id}`);
  return data.coach;
}

export interface UserPhoneSearchResult {
  user: AdminUser;
  /** Set when this user already has a coach profile. */
  coach: { id: string; status: CoachProfileStatus } | null;
}

/**
 * Add Coach step 1. The phone is sent as typed: the backend normalizes it with
 * the same rule the OTP login uses, so there is no second implementation here.
 * A 404 USER_NOT_FOUND means no account holds that number.
 */
export async function searchUserByPhone(phone: string): Promise<UserPhoneSearchResult> {
  return apiRequest<UserPhoneSearchResult>(`/admin/users/search${toQuery({ phone })}`);
}

/**
 * Only coach-owned text fields - never name/phone/email, which belong to the
 * user. Pictures have their own upload endpoints and are not part of this.
 */
export type CoachProfileInput = Omit<
  CoachProfile,
  "transformations" | "availableSlots" | "profilePicture" | "coverPicture"
> & {
  transformations: number;
  availableSlots: number;
};

export async function createCoach(userId: string, profile: CoachProfileInput): Promise<CoachRecord> {
  const data = await apiRequest<{ coach: CoachRecord }>("/admin/coaches", {
    method: "POST",
    body: { userId, profile },
  });
  return data.coach;
}

/** userId is deliberately not part of an edit: the link is fixed at creation. */
export async function updateCoach(
  id: string,
  patch: { profile?: Partial<CoachProfileInput>; status?: CoachProfileStatus },
): Promise<CoachRecord> {
  const data = await apiRequest<{ coach: CoachRecord }>(`/admin/coaches/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return data.coach;
}

const IMAGE_PATHS: Record<CoachImageSlot, string> = {
  profilePicture: "profile-picture",
  coverPicture: "cover-picture",
};

/** Formats the backend accepts; it re-checks the actual bytes. */
export const COACH_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Mirrors the backend's MAX_UPLOAD_BYTES default. */
export const COACH_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Uploads one coach picture as the raw request body; returns the updated coach. */
export async function uploadCoachImage(id: string, slot: CoachImageSlot, file: File): Promise<CoachRecord> {
  const data = await apiRequest<{ coach: CoachRecord }>(`/admin/coaches/${id}/${IMAGE_PATHS[slot]}`, {
    method: "PUT",
    file,
  });
  return data.coach;
}

export async function removeCoachImage(id: string, slot: CoachImageSlot): Promise<CoachRecord> {
  const data = await apiRequest<{ coach: CoachRecord }>(`/admin/coaches/${id}/${IMAGE_PATHS[slot]}`, {
    method: "DELETE",
  });
  return data.coach;
}

/** Where one enrollment stands - the backend's own status rule. */
export type CoachEnrollmentStatus = "active" | "inactive" | "not_started" | "deleted";

/** One enrollment with the coach: the member, the plan, the dates and legacy ids. */
export interface CoachEnrollmentRow {
  enrollmentId: string;
  legacyEnrollmentId: number | null;
  coachId: string | null;
  status: CoachEnrollmentStatus;
  hasStarted: boolean;
  enrollDate: string | null;
  startDate: string | null;
  endDate: string | null;
  user: { id: string; name: string | null; phone: string | null; email: string | null; legacyUserId: number | null };
  plan: { id: string; name: string | null; legacyPackageId: number | null };
}

export interface CoachClientsSummary {
  /** Every non-deleted enrollment - each coaching cycle counts. */
  totalEnrollments: number;
  /** Distinct people among those enrollments. */
  uniqueClients: number;
  activeClients: number;
  pendingClients: number;
  endedClients?: number;
  attention: number;
}

/** GET /api/admin/coaches/:id/clients - the coach's statistics and every enrollment with them. */
export async function getCoachClients(id: string) {
  return apiRequest<{ coachId: string; summary: CoachClientsSummary; enrollments: CoachEnrollmentRow[] }>(`/admin/coaches/${id}/clients`);
}
