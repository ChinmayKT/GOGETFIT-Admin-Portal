/**
 * Workouts, as served by /api/admin/workouts.
 *
 * The vocabulary here is exactly what the backend Workout model accepts, so
 * there is no second list to keep in step.
 */

export const WORKOUT_TYPES = ["Gym", "Home", "General"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

/**
 * The stored equipment values. "Pair of Dumbells" is the legacy spelling (one
 * "b") that 35 migrated workouts are stored under - it is the value, not the
 * label. Use EQUIPMENT_LABELS when showing it to a person.
 */
export const WORKOUT_EQUIPMENT = [
  "Gym Equipment",
  "Pair of Dumbells",
  "Resistance Band",
  "Body Weight",
] as const;
export type WorkoutEquipment = (typeof WORKOUT_EQUIPMENT)[number];

/** What an operator reads, for the one value legacy misspelled. */
export const EQUIPMENT_LABELS: Record<WorkoutEquipment, string> = {
  "Gym Equipment": "Gym Equipment",
  "Pair of Dumbells": "Pair of Dumbbells",
  "Resistance Band": "Resistance Band",
  "Body Weight": "Body Weight",
};

export const WORKOUT_LEVELS = [1, 2, 3, 4, 5] as const;
export type WorkoutLevel = (typeof WORKOUT_LEVELS)[number];

/** archived = soft-deleted: out of the default list, still referenced by plans. */
export type WorkoutStatus = "active" | "archived";

/** A stored file reference. Never the bytes. */
export interface MediaRef {
  url: string;
  storageKey: string | null;
}

/** Who did something, resolved by the backend for display. */
export interface Actor {
  id: string;
  name: string | null;
  email: string | null;
}

export interface WorkoutRow {
  id: string;
  name: string;
  /** String, not the union: a stored value is shown as it is, never coerced. */
  type: string;
  equipment: string;
  primaryMuscle: string;
  secondaryMuscle: string | null;
  level: number;
  thumbnail: MediaRef | null;
  /** The list does not carry the video itself, only whether there is one. */
  hasVideo: boolean;
  youtubeUrl: string | null;
  status: WorkoutStatus;
  /** Secondary admin metadata; null for a workout added in the portal. */
  legacyWorkoutId: number | null;
  createdBy: Actor | null;
  updatedBy: Actor | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Workout extends WorkoutRow {
  description: string;
  video: MediaRef | null;
  archivedAt: string | null;
  archivedBy: Actor | null;
  legacy: { source: string | null; workoutId: number } | null;
  migration: { runId: string; migratedAt: string | null; version: number | null } | null;
}

/**
 * What the Add/Edit Workout form writes. Media is never in this body - the
 * video and the thumbnail have their own endpoints, so editing text never
 * touches an uploaded file.
 */
export interface WorkoutInput {
  name: string;
  type: WorkoutType;
  equipment: WorkoutEquipment;
  primaryMuscle: string;
  secondaryMuscle: string | null;
  level: WorkoutLevel;
  description: string;
  youtubeUrl: string | null;
}

/**
 * Suggestions for the free-text muscle fields. Legacy stores free text that
 * mixes a muscle with a training phase ("Back (Cool Down)"), so this is a
 * datalist, never a closed list.
 */
export const MUSCLE_SUGGESTIONS = [
  "Chest", "Back", "Lats", "Shoulder", "Biceps", "Triceps", "Forearms",
  "Abdominal (Core)", "Obliques", "Legs", "Quadriceps", "Hamstrings",
  "Glutes", "Calves", "Full Body", "Traps", "Lowerback (Core)",
];
