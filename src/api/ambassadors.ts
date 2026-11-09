import { ApiError, apiRequest } from "./client";
import type { Pagination } from "../types/admin";
import type {
  Ambassador,
  AmbassadorActivity,
  AmbassadorDetail,
  AmbassadorPayout,
  AmbassadorStatus,
  AmbassadorSummary,
  PayoutInput,
  ReferralOrder,
} from "../types/ambassador";

/** Brand Ambassadors admin API - requireAuth + requireRole("admin") on the server. */

export interface AmbassadorListParams {
  query?: string;
  status?: string;
  /** Registered within the last N days. */
  joinedWithinDays?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface ReferralListParams {
  query?: string;
  planId?: string;
  paymentStatus?: string;
  referralStatus?: string;
  /** Inclusive YYYY-MM-DD bounds on the purchase date. */
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

const toQuery = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/** The server pages at most 100 rows; Export walks every page. */
const EXPORT_PAGE = 100;
async function fetchAll<T>(fetchPage: (page: number) => Promise<{ rows: T[]; total: number }>) {
  const first = await fetchPage(1);
  const rows = [...first.rows];
  for (let page = 2; rows.length < first.total; page += 1) {
    const next = await fetchPage(page);
    if (next.rows.length === 0) break;
    rows.push(...next.rows);
  }
  return rows;
}

type ListResponse = { ambassadors: Ambassador[]; pagination: Pagination; summary: AmbassadorSummary };

export async function listAmbassadors(params: AmbassadorListParams = {}) {
  const data = await apiRequest<ListResponse>(`/admin/ambassadors${toQuery(params)}`);
  return { rows: data.ambassadors, total: data.pagination.total };
}

/** Every ambassador matching the filters, for Export. */
export async function exportAmbassadors(params: AmbassadorListParams = {}) {
  const rows = await fetchAll((page) => listAmbassadors({ ...params, page, pageSize: EXPORT_PAGE }));
  return { rows, total: rows.length };
}

export async function ambassadorSummary(): Promise<AmbassadorSummary> {
  return (await apiRequest<ListResponse>("/admin/ambassadors?pageSize=1")).summary;
}

/** Null when there is no such ambassador (404); other failures throw. */
export async function getAmbassador(id: string): Promise<AmbassadorDetail | null> {
  try {
    return (await apiRequest<{ ambassador: AmbassadorDetail }>(`/admin/ambassadors/${encodeURIComponent(id)}`)).ambassador;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function setAmbassadorStatus(id: string, status: AmbassadorStatus, reason?: string) {
  return (
    await apiRequest<{ ambassador: AmbassadorDetail }>(`/admin/ambassadors/${id}/status`, {
      method: "PATCH",
      body: { status, ...(reason ? { reason } : {}) },
    })
  ).ambassador;
}

type ReferralResponse = { referrals: ReferralOrder[]; pagination: Pagination; plans: { id: string; name: string }[] };

export async function listReferralOrders(ambassadorId: string, params: ReferralListParams = {}) {
  const data = await apiRequest<ReferralResponse>(`/admin/ambassadors/${ambassadorId}/referrals${toQuery(params)}`);
  return { rows: data.referrals, total: data.pagination.total };
}

export async function exportReferralOrders(ambassadorId: string, params: ReferralListParams = {}) {
  return fetchAll((page) => listReferralOrders(ambassadorId, { ...params, page, pageSize: EXPORT_PAGE }));
}

/** The plans this ambassador's referrals were for - the Plan filter's options. */
export async function getReferralPlanOptions(ambassadorId: string) {
  const data = await apiRequest<ReferralResponse>(`/admin/ambassadors/${ambassadorId}/referrals?pageSize=1`);
  return data.plans.map((p) => ({ label: p.name, value: p.id }));
}

export async function getPayouts(ambassadorId: string): Promise<AmbassadorPayout[]> {
  return (await apiRequest<{ payouts: AmbassadorPayout[] }>(`/admin/ambassadors/${ambassadorId}/payouts`)).payouts;
}

export async function getActivity(ambassadorId: string): Promise<AmbassadorActivity[]> {
  return (await apiRequest<{ activity: AmbassadorActivity[] }>(`/admin/ambassadors/${ambassadorId}/activity`)).activity;
}

/** Changes the rate for this ambassador's future referrals; past ones keep theirs. */
export async function setAmbassadorCommission(id: string, commissionPercent: number, reason?: string) {
  return (
    await apiRequest<{ ambassador: AmbassadorDetail }>(`/admin/ambassadors/${id}/commission`, {
      method: "PATCH",
      body: { commissionPercent, ...(reason ? { reason } : {}) },
    })
  ).ambassador;
}

/** Records a payout made outside the system; returns the updated periods. */
export async function recordPayout(ambassadorId: string, input: PayoutInput): Promise<AmbassadorPayout[]> {
  return (await apiRequest<{ payouts: AmbassadorPayout[] }>(`/admin/ambassadors/${ambassadorId}/payouts`, { method: "POST", body: input })).payouts;
}
