import { apiRequest } from "./client";

/**
 * Enrolled clients — one row per enrollment/purchase, from the new backend.
 *
 * The backend stores relationships as ids and resolves the related User, Coach,
 * Plan and Coupon with $lookup at query time, so these nested objects are joined
 * for display and are null when the relationship could not be resolved. Only
 * fields the migrated legacy data actually supports are exposed here.
 */

export type EnrollmentStatus = "active" | "inactive" | "not_started" | "deleted";

export interface EnrolledClientRow {
  id: string;
  status: EnrollmentStatus;
  client: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    /** The member's own photo URL, or null. */
    profilePicture?: string | null;
    legacyUserId: number | null;
  } | null;
  /** profilePicture: the coach's own professional photo URL, or null. */
  coach: { id: string; name: string | null; level: string | null; profilePicture?: string | null } | null;
  /** Kept for every row: most legacy coach relationships have no new Coach yet. */
  legacyCoachId: number | null;
  /** The coach's name as the legacy system recorded it, when there is no Coach. */
  legacyCoachName: string | null;
  plan: {
    id: string;
    name: string | null;
    planType: string | null;
    durationWeeks: number | null;
  } | null;
  coupon: { id: string; code: string | null } | null;
  /** The code as typed at checkout, even when it resolved to no coupon document. */
  legacyCouponCode: string | null;
  transactionId: string | null;
  amount: number | null;
  currency: string | null;
  paymentStatus: string | null;
  enrollDate: string | null;
  startDate: string | null;
  endDate: string | null;
  hasStarted: boolean;
  legacyEnrollmentId: number | null;
  /** "admin_manual" for enrollments created in the portal; null for migrated rows. */
  source?: string | null;
  /** How a manual payment was collected; null for gateway/migrated payments. */
  paymentMethod?: PaymentMethod | null;
  /** A manual payment's receipt / UTR / bank reference. */
  paymentReference?: string | null;
}

export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "other";

/**
 * What Add Client sends. Only the admin's choices: the plan price, the coupon
 * discount, the payment status and createdBy are all worked out by the server.
 */
export interface ManualEnrollmentInput {
  userId: string;
  planId: string;
  coachId: string;
  couponId: string | null;
  /** yyyy-mm-dd, India calendar days. Start and end are optional. */
  enrollDate: string;
  startDate: string | null;
  endDate: string | null;
  payment: {
    method: PaymentMethod;
    /** Whole rupees actually received. */
    amount: number;
    paymentDate: string;
    referenceId: string | null;
    notes: string | null;
  };
}

/** The server's own pricing for the enrollment it created. */
export interface ManualEnrollmentPricing {
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  amountReceived: number;
  difference: number;
}

interface ApiPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EnrolledClientListParams extends Record<string, unknown> {
  search?: string;
  status?: EnrollmentStatus | "";
  userId?: string;
  coachId?: string;
  planId?: string;
  couponId?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

const toQuery = (params: EnrolledClientListParams): string => {
  const search = new URLSearchParams();

  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.userId) search.set("userId", params.userId);
  if (params.coachId) search.set("coachId", params.coachId);
  if (params.planId) search.set("planId", params.planId);
  if (params.couponId) search.set("couponId", params.couponId);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.sortKey) search.set("sortKey", params.sortKey);
  if (params.sortDir) search.set("sortDir", params.sortDir);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/**
 * One page of enrollments. Returned in the { rows, total } shape usePagedQuery
 * already expects, so the existing table wiring is reused unchanged. The backend
 * caps pageSize, so the portal can never pull the whole collection.
 */
export async function listEnrolledClients(params: EnrolledClientListParams = {}) {
  const data = await apiRequest<{
    enrolledClients: EnrolledClientRow[];
    pagination: ApiPagination;
  }>(`/admin/enrolled-clients${toQuery(params)}`);

  return { rows: data.enrolledClients, total: data.pagination.total, pagination: data.pagination };
}

export async function getEnrolledClient(id: string) {
  const data = await apiRequest<{ enrolledClient: EnrolledClientRow }>(
    `/admin/enrolled-clients/${id}`,
  );
  return data.enrolledClient;
}

/** POST /api/admin/enrolled-clients - Add Client. */
export async function createEnrolledClient(input: ManualEnrollmentInput) {
  return apiRequest<{ enrolledClient: EnrolledClientRow; pricing: ManualEnrollmentPricing }>("/admin/enrolled-clients", {
    method: "POST",
    body: input,
  });
}

/**
 * The four states the backend can actually report, with the labels this portal
 * already uses. There is deliberately no "Pending Renewal" or "Cancelled": the
 * legacy system never recorded either, so neither can be shown honestly.
 */
export const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "Active",
  inactive: "Expired",
  not_started: "Not Started",
  deleted: "Deleted",
};
