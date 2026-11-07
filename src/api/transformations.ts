import { apiRequest } from "./client";

/** A transformation image a coach submitted, as GET /api/admin/transformations returns it. */
export interface CoachTransformation {
  id: string;
  title: string;
  imageUrl: string;
  submittedAt: string;
  coach: { id: string; name: string | null };
  clientId: string;
}

/** Newest first, in the { rows, total } shape usePagedQuery expects. Admins only (server-side). */
export async function listTransformations(params: { page: number; pageSize: number }) {
  const data = await apiRequest<{ items: CoachTransformation[]; pagination: { total: number } }>(
    `/admin/transformations?page=${params.page}&pageSize=${params.pageSize}`,
  );
  return { rows: data.items, total: data.pagination.total };
}
