import type { Workout } from "../../types/workout";
import { WORKOUT_CATALOGUE } from "./reference";
import { daysAgo, randomInt } from "../shared/utils";

function makeWorkout(index: number): Workout {
  const seed = WORKOUT_CATALOGUE[index % WORKOUT_CATALOGUE.length];
  const muscles = seed.secondaryMuscle ? `${seed.primaryMuscle} and ${seed.secondaryMuscle}` : seed.primaryMuscle;

  return {
    id: `workout_${index + 1}`,
    name: seed.name,
    type: seed.type,
    equipment: seed.equipment,
    primaryMuscle: seed.primaryMuscle,
    secondaryMuscle: seed.secondaryMuscle,
    level: seed.level,
    description: `${seed.name} is a Level ${seed.level} ${seed.type.toLowerCase()} workout targeting the ${muscles}. Performed using ${seed.equipment.toLowerCase()}, it's an effective addition to a structured training program.`,
    youtubeLink: index % 2 === 0 ? `https://www.youtube.com/watch?v=ggf-workout-${index + 1}` : null,
    videoUrl: null,
    videoFileName: null,
    thumbnailUrl: null,
    thumbnailFileName: null,
    createdAt: daysAgo(randomInt(10, 400)),
  };
}

export const MOCK_WORKOUTS: Workout[] = WORKOUT_CATALOGUE.map((_, i) => makeWorkout(i));
