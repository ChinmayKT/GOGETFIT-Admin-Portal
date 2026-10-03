import { apiRequest } from "./client";
import type { Pagination } from "../types/admin";
import type { GogetfitPlan, GogetfitPlanInput, GogetfitPlanRow, PlanStatus } from "../types/gogetfitPlans";

/** GoGetFit Plans admin API - gated by requireAuth + requireRole("admin") on the server. */

export interface GogetfitPlanListParams extends Record<string, unknown> {
  search?: string;
  planType?: string;
  coachLevel?: string;
  status?: PlanStatus;
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

/** In the { rows, total } shape usePagedQuery expects. Server-side paging, search and filters. */
export async function listGogetfitPlans(params: GogetfitPlanListParams = {}) {
  const data = await apiRequest<{ plans: GogetfitPlanRow[]; pagination: Pagination }>(
    `/admin/gogetfit-plans${toQuery(params)}`,
  );
  return { rows: data.plans, total: data.pagination.total, pagination: data.pagination };
}

export async function getGogetfitPlan(id: string): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}`)).plan;
}

export async function createGogetfitPlan(input: GogetfitPlanInput): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>("/admin/gogetfit-plans", { method: "POST", body: input })).plan;
}

/** Only the supplied fields change (PATCH); pricing and content may be partial. */
export async function updateGogetfitPlan(
  id: string,
  input: Partial<Omit<GogetfitPlanInput, "pricing" | "content">> & {
    pricing?: Partial<GogetfitPlanInput["pricing"]>;
    content?: Partial<GogetfitPlanInput["content"]>;
  },
): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}`, { method: "PATCH", body: input })).plan;
}

/** Archives the plan (soft delete). It leaves the default list and can be restored. */
export async function deleteGogetfitPlan(id: string): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}`, { method: "DELETE" })).plan;
}

export async function restoreGogetfitPlan(id: string): Promise<GogetfitPlan> {
  return (
    await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}`, { method: "PATCH", body: { status: "active" } })
  ).plan;
}

/** Uploads the plan's 3:1 cover as the raw request body; returns the updated plan. */
export async function uploadGogetfitPlanImage(id: string, file: File): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}/image`, { method: "PUT", file })).plan;
}

export async function removeGogetfitPlanImage(id: string): Promise<GogetfitPlan> {
  return (await apiRequest<{ plan: GogetfitPlan }>(`/admin/gogetfit-plans/${id}/image`, { method: "DELETE" })).plan;
}
