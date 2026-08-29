import type { WorkoutEquipment, WorkoutLevel, WorkoutType } from "../../types/workout";

export const WORKOUT_TYPES: WorkoutType[] = ["Gym", "Home", "General"];
export const WORKOUT_EQUIPMENT: WorkoutEquipment[] = ["Gym Equipment", "Pair of Dumbbells", "Resistance Band", "Body Weight"];
export const WORKOUT_LEVELS: WorkoutLevel[] = [1, 2, 3, 4, 5];

export const MUSCLE_GROUPS = [
  "Chest", "Back", "Lats", "Shoulders", "Biceps", "Triceps", "Forearms",
  "Abs/Core", "Obliques", "Quadriceps", "Hamstrings", "Glutes", "Calves",
  "Hip Flexors", "Full Body", "Traps",
];

interface WorkoutSeed {
  name: string;
  type: WorkoutType;
  equipment: WorkoutEquipment;
  primaryMuscle: string;
  secondaryMuscle: string | null;
  level: WorkoutLevel;
}

/** Curated catalogue of realistic exercises spanning every type/equipment/level combination. */
export const WORKOUT_CATALOGUE: WorkoutSeed[] = [
  { name: "Barbell Bench Press", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Chest", secondaryMuscle: "Triceps", level: 3 },
  { name: "Incline Dumbbell Press", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Chest", secondaryMuscle: "Shoulders", level: 3 },
  { name: "Flat Dumbbell Fly", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Chest", secondaryMuscle: null, level: 2 },
  { name: "Push-Up", type: "Home", equipment: "Body Weight", primaryMuscle: "Chest", secondaryMuscle: "Triceps", level: 1 },
  { name: "Diamond Push-Up", type: "Home", equipment: "Body Weight", primaryMuscle: "Triceps", secondaryMuscle: "Chest", level: 2 },
  { name: "Barbell Back Squat", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Quadriceps", secondaryMuscle: "Glutes", level: 4 },
  { name: "Goblet Squat", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Quadriceps", secondaryMuscle: "Glutes", level: 2 },
  { name: "Bodyweight Squat", type: "Home", equipment: "Body Weight", primaryMuscle: "Quadriceps", secondaryMuscle: "Glutes", level: 1 },
  { name: "Bulgarian Split Squat", type: "Home", equipment: "Pair of Dumbbells", primaryMuscle: "Quadriceps", secondaryMuscle: "Glutes", level: 3 },
  { name: "Romanian Deadlift", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Hamstrings", secondaryMuscle: "Glutes", level: 3 },
  { name: "Dumbbell Romanian Deadlift", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Hamstrings", secondaryMuscle: "Glutes", level: 3 },
  { name: "Glute Bridge", type: "Home", equipment: "Body Weight", primaryMuscle: "Glutes", secondaryMuscle: "Hamstrings", level: 1 },
  { name: "Barbell Hip Thrust", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Glutes", secondaryMuscle: "Hamstrings", level: 3 },
  { name: "Resistance Band Lateral Walk", type: "Home", equipment: "Resistance Band", primaryMuscle: "Glutes", secondaryMuscle: "Quadriceps", level: 2 },
  { name: "Pull-Up", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Lats", secondaryMuscle: "Biceps", level: 4 },
  { name: "Lat Pulldown", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Lats", secondaryMuscle: "Biceps", level: 2 },
  { name: "Bent-Over Barbell Row", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Back", secondaryMuscle: "Biceps", level: 3 },
  { name: "Dumbbell Row", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Back", secondaryMuscle: "Biceps", level: 2 },
  { name: "Resistance Band Row", type: "Home", equipment: "Resistance Band", primaryMuscle: "Back", secondaryMuscle: "Biceps", level: 2 },
  { name: "Superman Hold", type: "Home", equipment: "Body Weight", primaryMuscle: "Back", secondaryMuscle: "Glutes", level: 1 },
  { name: "Overhead Barbell Press", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Shoulders", secondaryMuscle: "Triceps", level: 4 },
  { name: "Dumbbell Shoulder Press", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Shoulders", secondaryMuscle: "Triceps", level: 3 },
  { name: "Dumbbell Lateral Raise", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Shoulders", secondaryMuscle: null, level: 2 },
  { name: "Pike Push-Up", type: "Home", equipment: "Body Weight", primaryMuscle: "Shoulders", secondaryMuscle: "Triceps", level: 3 },
  { name: "Resistance Band Shoulder Press", type: "Home", equipment: "Resistance Band", primaryMuscle: "Shoulders", secondaryMuscle: "Triceps", level: 2 },
  { name: "Barbell Bicep Curl", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Biceps", secondaryMuscle: "Forearms", level: 2 },
  { name: "Dumbbell Hammer Curl", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Biceps", secondaryMuscle: "Forearms", level: 2 },
  { name: "Resistance Band Curl", type: "Home", equipment: "Resistance Band", primaryMuscle: "Biceps", secondaryMuscle: "Forearms", level: 1 },
  { name: "Bench Triceps Dip", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Triceps", secondaryMuscle: "Chest", level: 3 },
  { name: "Overhead Triceps Extension", type: "Gym", equipment: "Pair of Dumbbells", primaryMuscle: "Triceps", secondaryMuscle: null, level: 2 },
  { name: "Plank", type: "General", equipment: "Body Weight", primaryMuscle: "Abs/Core", secondaryMuscle: "Back", level: 1 },
  { name: "Bicycle Crunch", type: "General", equipment: "Body Weight", primaryMuscle: "Abs/Core", secondaryMuscle: "Obliques", level: 1 },
  { name: "Hanging Leg Raise", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Abs/Core", secondaryMuscle: "Hip Flexors", level: 4 },
  { name: "Russian Twist", type: "Home", equipment: "Body Weight", primaryMuscle: "Abs/Core", secondaryMuscle: "Obliques", level: 2 },
  { name: "Standing Calf Raise", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Calves", secondaryMuscle: null, level: 1 },
  { name: "Jump Rope", type: "General", equipment: "Body Weight", primaryMuscle: "Calves", secondaryMuscle: "Full Body", level: 2 },
  { name: "Burpees", type: "General", equipment: "Body Weight", primaryMuscle: "Full Body", secondaryMuscle: "Abs/Core", level: 4 },
  { name: "Mountain Climbers", type: "General", equipment: "Body Weight", primaryMuscle: "Abs/Core", secondaryMuscle: "Full Body", level: 2 },
  { name: "Jumping Jacks", type: "General", equipment: "Body Weight", primaryMuscle: "Full Body", secondaryMuscle: "Calves", level: 1 },
  { name: "Farmer's Carry", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "Forearms", secondaryMuscle: "Full Body", level: 3 },
];
