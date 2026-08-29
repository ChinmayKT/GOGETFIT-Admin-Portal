export type WorkoutType = "Gym" | "Home" | "General";
export type WorkoutEquipment = "Gym Equipment" | "Pair of Dumbbells" | "Resistance Band" | "Body Weight";
export type WorkoutLevel = 1 | 2 | 3 | 4 | 5;

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  equipment: WorkoutEquipment;
  primaryMuscle: string;
  secondaryMuscle: string | null;
  level: WorkoutLevel;
  description: string;
  youtubeLink: string | null;

  /** Object URL / mock URL for the uploaded .mp4 — null until a video is uploaded. */
  videoUrl: string | null;
  videoFileName: string | null;
  /** Object URL / mock URL for the uploaded thumbnail image — null until uploaded. */
  thumbnailUrl: string | null;
  thumbnailFileName: string | null;

  createdAt: string;
}
