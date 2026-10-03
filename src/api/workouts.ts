import { apiRequest } from "./client";
import type { Pagination } from "../types/admin";
import type { Workout, WorkoutInput, WorkoutRow, WorkoutStatus } from "../types/workout";

/**
 * Workout admin API - gated by requireAuth + requireRole("admin") on the
 * server. Paging, search, filtering and sorting all happen in MongoDB.
 */

export interface WorkoutListParams extends Record<string, unknown> {
  search?: string;
  type?: string;
  equipment?: string;
  level?: number;
  status?: WorkoutStatus;
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
export async function listWorkouts(params: WorkoutListParams = {}) {
  const data = await apiRequest<{ workouts: WorkoutRow[]; pagination: Pagination }>(
    `/admin/workouts${toQuery(params)}`,
  );
  return { rows: data.workouts, total: data.pagination.total, pagination: data.pagination };
}

export async function getWorkout(id: string): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}`)).workout;
}

export async function createWorkout(input: WorkoutInput): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>("/admin/workouts", { method: "POST", body: input })).workout;
}

/** Only the supplied fields change. Media is untouched by a text edit. */
export async function updateWorkout(
  id: string,
  input: Partial<WorkoutInput> & { status?: WorkoutStatus },
): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}`, { method: "PUT", body: input })).workout;
}

/** Archives the workout (soft delete). Plans that reference it keep working. */
export async function archiveWorkout(id: string): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}`, { method: "DELETE" })).workout;
}

export async function restoreWorkout(id: string): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}/restore`, { method: "POST" })).workout;
}

/** Uploads the .mp4 as the raw request body; returns the updated workout. */
export async function uploadWorkoutVideo(id: string, file: File): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}/video`, { method: "PUT", file })).workout;
}

export async function removeWorkoutVideo(id: string): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}/video`, { method: "DELETE" })).workout;
}

export async function uploadWorkoutThumbnail(id: string, file: File): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}/thumbnail`, { method: "PUT", file })).workout;
}

export async function removeWorkoutThumbnail(id: string): Promise<Workout> {
  return (await apiRequest<{ workout: Workout }>(`/admin/workouts/${id}/thumbnail`, { method: "DELETE" })).workout;
}
