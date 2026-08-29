export const CHALLENGE_NAMES = [
  "30-Day Fat Loss Challenge",
  "Summer Shred Challenge",
  "10K Steps a Day Challenge",
  "Push-Up Progression Challenge",
  "Plank Endurance Challenge",
  "Squat Streak Challenge",
  "Hydration Habit Challenge",
  "New Year New You Challenge",
  "Festive Fitness Challenge",
  "Core Strength 21-Day Challenge",
  "Home Workout Warriors Challenge",
  "Transformation Sprint Challenge",
  "Marathon Prep Challenge",
  "Flexibility & Mobility Challenge",
  "Beginner Fitness Kickstart Challenge",
  "Weight Loss Warriors Challenge",
  "Strength Building 8-Week Challenge",
  "Yoga & Mindfulness Challenge",
];

export function challengeDescription(name: string): string {
  return `${name} is a structured, time-boxed program that motivates members to build consistent habits, track daily progress, and submit proof-of-work videos for review by the coaching team.`;
}
