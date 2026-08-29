import type { Workout } from "../../types/workout";
import { MOCK_WORKOUTS } from "./data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Workout[] = [...MOCK_WORKOUTS];

export interface WorkoutListParams {
  query?: string;
  type?: string;
  equipment?: string;
  level?: number;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listWorkouts(params: WorkoutListParams = {}) {
  const { query = "", type, equipment, level, page = 1, pageSize = 10, sortKey = "name", sortDir = "asc" } = params;

  let rows = store.filter((w) =>
    matchesQuery([w.name, w.primaryMuscle, w.secondaryMuscle, w.equipment, w.type], query),
  );
  if (type) rows = rows.filter((w) => w.type === type);
  if (equipment) rows = rows.filter((w) => w.equipment === equipment);
  if (level) rows = rows.filter((w) => w.level === level);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getWorkout(id: string) {
  return delay(store.find((w) => w.id === id) ?? null);
}

export async function createWorkout(input: Omit<Workout, "id" | "createdAt">) {
  const workout: Workout = { ...input, id: nextId("workout"), createdAt: new Date().toISOString() };
  store = [workout, ...store];
  return delay(workout, 600);
}

export async function updateWorkout(id: string, patch: Partial<Workout>) {
  store = store.map((w) => (w.id === id ? { ...w, ...patch } : w));
  return delay(store.find((w) => w.id === id)!, 600);
}
