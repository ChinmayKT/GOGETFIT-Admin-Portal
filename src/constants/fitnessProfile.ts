/**
 * The member fitness-profile vocabulary and calculations, exactly as the
 * Flutter app defines them - the portal must never have its own version:
 *
 *   values/labels  GoGetFit 2.0/lib/features/calculators/domain/bmr_tdee_classification.dart (ActivityLevel)
 *                  GoGetFit 2.0/lib/features/profile/domain/entities/profile_entities.dart (FoodType, FitnessGoal)
 *   formulas       bmr_tdee_classification.dart computeBmr / computeTdee / computeBodyFatPercentage
 *   age            auth_controller.dart ageInYears
 *
 * The stored value is the app's enum name; the label is what the app shows.
 * The formulas here are a PREVIEW only: the backend recalculates body fat,
 * BMR and TDEE itself when a user is created (utils/fitness-calculations.js).
 */

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
export type FoodType = "vegetarian" | "nonVegetarian" | "vegetarianPlusEgg";
export type FitnessGoal = "fatLoss" | "muscleGain" | "maintainPhysique";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { value: "sedentary", label: "Sedentary", description: "Little or no exercise", multiplier: 1.2 },
  { value: "light", label: "Lightly Active", description: "Light exercise 1–3 days/week", multiplier: 1.375 },
  { value: "moderate", label: "Moderately Active", description: "Moderate exercise 3–5 days/week", multiplier: 1.55 },
  { value: "active", label: "Active", description: "Hard exercise 6–7 days/week", multiplier: 1.725 },
  { value: "veryActive", label: "Very Active", description: "Very hard exercise & physical job", multiplier: 1.9 },
];

export const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "nonVegetarian", label: "Non-Vegetarian" },
  { value: "vegetarianPlusEgg", label: "Vegetarian + Egg" },
];

export const FITNESS_GOALS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: "fatLoss", label: "Fat / Weight Loss", description: "Drop body fat and overall weight" },
  { value: "muscleGain", label: "Muscle / Weight Gain", description: "Build muscle and put on weight" },
  { value: "maintainPhysique", label: "Maintain Physique", description: "Hold the shape you have now" },
];

/** The app's bounds: sign-up age 13–100, height wheel 4.0–8.0 ft (in cm), weight 30–250 kg, 0.1 steps. */
export const PROFILE_LIMITS = {
  minAge: 13,
  maxAge: 100,
  height: { min: 121.9, max: 243.8 },
  weight: { min: 30, max: 250 },
};

/**
 * Height is entered in DECIMAL feet, as the app's wheel does (4.0–8.0 ft in
 * 0.1 steps - so 5.5 ft is five and a half feet, not 5'5"), and stored in cm
 * with the app's own conversion: double.parse((ft * 30.48).toStringAsFixed(1)).
 */
export const HEIGHT_FEET = { min: 4, max: 8 };
export const feetToCm = (feet: number) => Number((feet * 30.48).toFixed(1));

/** Whole years lived on [asOf] - the app's ageInYears. DOB is yyyy-mm-dd. */
export function ageInYears(dob: string, asOf: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hadBirthdayThisYear = asOf.getMonth() + 1 > mo || (asOf.getMonth() + 1 === mo && asOf.getDate() >= d);
  return asOf.getFullYear() - y - (hadBirthdayThisYear ? 0 : 1);
}

/** Mifflin-St Jeor - kcal/day at complete rest. */
export const computeBmr = (gender: Gender, weightKg: number, heightCm: number, age: number) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
};

/** BMR scaled by the activity multiplier. */
export const computeTdee = (bmr: number, level: ActivityLevel) => bmr * ACTIVITY_LEVELS.find((a) => a.value === level)!.multiplier;

/** Deurenberg: 1.20·BMI + 0.23·age − 16.2 (male) / − 5.4 (female). */
export const computeBodyFatPercentage = (gender: Gender, weightKg: number, heightCm: number, age: number) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return 1.2 * bmi + 0.23 * age + (gender === "male" ? -16.2 : -5.4);
};
