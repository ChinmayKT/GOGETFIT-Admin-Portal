import type { ActivityLevel, FitnessGoal, FoodType, Gender } from "../constants/fitnessProfile";
import { apiRequest } from "./client";
import type { AdminUser, AdminUserListResponse, Role } from "../types/admin";

export interface AdminUserListParams {
  search?: string;
  role?: Role | "";
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

const toQuery = (params: AdminUserListParams): string => {
  const search = new URLSearchParams();

  if (params.search) search.set("search", params.search);
  if (params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.sortKey) search.set("sortKey", params.sortKey);
  if (params.sortDir) search.set("sortDir", params.sortDir);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/**
 * One page of users. Always paginated - the backend caps pageSize, so the
 * portal can never pull the whole collection into the browser.
 *
 * Adapted to the { rows, total } contract that usePagedQuery already expects,
 * so the existing table wiring is reused unchanged.
 */
export async function listAdminUsers(params: AdminUserListParams = {}) {
  const data = await apiRequest<AdminUserListResponse>(`/admin/users${toQuery(params)}`);
  return { rows: data.users, total: data.pagination.total, pagination: data.pagination };
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>(`/admin/users/${id}`);
  return data.user;
}

/**
 * What Add User sends - the same onboarding the app collects. Age, body fat,
 * BMR and TDEE are calculated by the server; roles are always ["user"].
 */
export interface CreateUserInput {
  phone: string;
  name: string;
  /** Optional; the app's email rule. */
  email?: string;
  /** yyyy-mm-dd */
  dateOfBirth: string;
  gender: Gender;
  city: string;
  fitnessProfile: {
    height: number;
    weight: number;
    activityLevel: ActivityLevel;
    foodType: FoodType;
    goal: FitnessGoal;
  };
}

/** The backend's Free Diet Plan match for the new profile. */
export interface FreeDietPlanMatch {
  status: string;
  planId: string | null;
  [key: string]: unknown;
}

/** POST /api/admin/users - onboard a normal user. */
export async function createAdminUser(input: CreateUserInput) {
  return apiRequest<{ user: AdminUser; freeDietPlan: FreeDietPlanMatch }>("/admin/users", { method: "POST", body: input });
}

/** PATCH /api/admin/users/:id - the same form minus the phone (the login is not changed here). */
export async function updateAdminUser(id: string, input: Omit<CreateUserInput, "phone">) {
  return apiRequest<{ user: AdminUser; freeDietPlan: FreeDietPlanMatch }>(`/admin/users/${id}`, { method: "PATCH", body: input });
}

/** The authenticated administrator, re-read from MongoDB on every call. */
export async function getAdminMe(): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>("/admin/me");
  return data.user;
}

export async function adminLogin(email: string, password: string) {
  return apiRequest<{ token: string; user: AdminUser }>("/auth/admin/login", {
    method: "POST",
    body: { email, password },
    anonymous: true,
  });
}

export interface QuestionAnswer {
  key: string;
  step: string;
  stepTitle: string;
  question: string;
  type: "singleChoice" | "wheel" | "slider" | "shortText" | "longText";
  /** null when the member left it unanswered. */
  answer: string | number | null;
}

export interface SubmittedQuestionnaire {
  questionnaireId: string;
  enrollmentId: string | null;
  status: "draft" | "submitted";
  submittedAt: string | null;
  updatedAt: string | null;
  enrollment?: { id: string; enrollDate: string | null; startDate: string | null; endDate: string | null };
  plan?: { id: string; name: string | null; planType: string | null; durationWeeks: number | null };
  coach?: { id: string; name: string | null; level: string | null };
  questions: QuestionAnswer[];
}

/** A member's submitted questionnaires, newest submission first. */
export async function listUserQuestionnaires(userId: string) {
  return apiRequest<{ questionnaires: SubmittedQuestionnaire[]; total: number }>(
    `/admin/users/${encodeURIComponent(userId)}/questionnaires`,
  );
}

export interface BodyMetricsMediaRef {
  url: string;
  storageKey: string;
}

export interface SubmittedBodyMetrics {
  bodyMetricsId: string;
  enrollmentId: string | null;
  status: "draft" | "submitted";
  submittedAt: string | null;
  /** Canonical units: age in years, weight in kg, every other value in cm. */
  measurements: Record<string, number | null>;
  media: {
    front: BodyMetricsMediaRef | null;
    side: BodyMetricsMediaRef | null;
    back: BodyMetricsMediaRef | null;
    video: BodyMetricsMediaRef | null;
  };
  enrollment?: { id: string; enrollDate: string | null; startDate: string | null; endDate: string | null };
  plan?: { id: string; name: string | null; planType: string | null; durationWeeks: number | null };
  coach?: { id: string; name: string | null; level: string | null };
}

/** A member's submitted Body Metrics - one per enrollment - newest first. */
export async function listUserBodyMetrics(userId: string) {
  return apiRequest<{ bodyMetrics: SubmittedBodyMetrics[]; total: number }>(
    `/admin/users/${encodeURIComponent(userId)}/body-metrics`,
  );
}

/** The four values a diet plan tracks, in kcal and grams. */
export interface DietNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * One food prescribed in a meal. `perPortion` is the plan's frozen snapshot for
 * `portion` of the food; `nutrition` is what the member reads (perPortion /
 * portion * qty), computed by the server from the snapshot - never from the Food.
 */
export interface DietPlanFood {
  foodId: string;
  /** Current identity from the Food Database; null when the reference is broken. */
  food: { id: string; name: string | null; brand: string | null; foodType: string | null; image: { url: string; storageKey: string | null } | null; status: string | null } | null;
  missingFood: boolean;
  qty: number;
  portion: number;
  servingUnit: string;
  perPortion: DietNutrients;
  nutrition: DietNutrients;
}

export interface DietPlanMeal {
  meal: number;
  label: string;
  foods: DietPlanFood[];
  totals: DietNutrients;
}

/** One assignment: a plan over one contiguous run of days (YYYY-MM-DD, inclusive). */
export interface ClientDietPlan {
  id: string;
  planId: string;
  name: string;
  fromDate: string;
  toDate: string;
  days: number;
  /** Derived from the dates against today; not stored. */
  period: "past" | "current" | "upcoming";
  status: "active" | "archived";
  assignedAt: string | null;
  coach: { id: string; name: string | null; level: string | null } | null;
  legacyCreatedBy: number | null;
  enrollment: { id: string; planName: string | null; enrollDate: string | null; startDate: string | null; endDate: string | null; isDeleted: boolean } | null;
  missingEnrollmentId: string | null;
  goal: string | null;
  bmr: number | null;
  tdee: number | null;
  targets: DietNutrients | null;
  totals: DietNutrients;
  meals: DietPlanMeal[];
  legacyPlanId: number | null;
}

/** Which assignment the member sees, day by day. Days with no plan are absent. */
export interface DietScheduleRange {
  from: string;
  to: string;
  dietPlanId: string;
}

export interface ClientDietPlans {
  client: { id: string; name: string | null };
  /** The server's business day (IST), YYYY-MM-DD. */
  today: string;
  dietPlans: ClientDietPlan[];
  schedule: DietScheduleRange[];
  missingFoodIds: string[];
}

/** A member's coach-assigned diet plans (read-only), newest assignment first. */
export async function listUserDietPlans(userId: string) {
  return apiRequest<ClientDietPlans>(`/admin/users/${encodeURIComponent(userId)}/diet-plans`);
}

/** One food of a Free Diet Plan template, as authored. */
export interface FreeDietPlanFood {
  legacyPlanMealId: number | null;
  foodName: string | null;
  foodType: string | null;
  unit: string | null;
  quantity: number | null;
  calories: number | null;
  fat: number | null;
  carbs: number | null;
  protein: number | null;
}

/**
 * The Free Diet Plan a user received - the profile-matched template, not a
 * coach's diet plan - with the figures it was chosen from. Read-only; every
 * value is the backend's.
 */
export interface UserFreeDietPlan {
  user: { id: string; name: string | null };
  /** no_fitness | incomplete | not_assigned | plan_missing | assigned */
  status: "no_fitness" | "incomplete" | "not_assigned" | "plan_missing" | "assigned";
  fitness: {
    height: number | null;
    weight: number | null;
    bodyFatPercentage: number | null;
    activityLevel: string | null;
    foodType: string | null;
    goal: string | null;
    bmr: number | null;
    tdee: number | null;
  };
  /** What the match still needs, as the backend's match service reports it. */
  missing: { field: string; label: string }[];
  /** The match service's own target (from BMR, TDEE and goal) and its rounded lookup figure. */
  match: { dietType: string | null; targetCalories: number | null; lookupCalories: number | null };
  freeDietPlanId: string | null;
  freeDietPlan: {
    id: string;
    dietType: string | null;
    /** The template's calorie band - the range the target falls in. */
    range: { from: number | null; to: number | null };
    mealCount: number;
    foodCount: number;
    status: string | null;
    legacyPlanId: number | null;
    meals: { mealId: number; foods: FreeDietPlanFood[] }[];
    totals: { calories: number; fat: number; carbs: number; protein: number };
  } | null;
  /** False when the profile changed after this plan was assigned. */
  planMatchesProfile: boolean | null;
}

/** The Free Diet Plan a user received, with BMR, TDEE and the matching range. */
export async function getUserFreeDietPlan(userId: string) {
  return apiRequest<UserFreeDietPlan>(`/admin/users/${encodeURIComponent(userId)}/free-diet-plan`);
}

// ─── Workout plans (coach-assigned, read-only) ──────────────────────────────

/** One exercise as prescribed. setsRaw/repsRaw are exactly as written ("12-15", "15sec"); the parsed fields are null when the text could not be read safely. */
export interface WorkoutPlanExercise {
  workoutId: string | null;
  name: string | null;
  /** The exercise is no longer in the library: only its saved name (if any) remains. */
  missingWorkout: boolean;
  /** Still referenced, but archived in the library. */
  archived: boolean;
  type: string | null;
  equipment: string | null;
  primaryMuscle: string | null;
  thumbnail: { url: string } | null;
  video: { url: string } | null;
  setsRaw: string | null;
  repsRaw: string | null;
  sets: number | null;
  measure: "reps" | "time" | null;
  amount: number | null;
  amountMax: number | null;
  note: string | null;
}

export interface WorkoutPlanBlock {
  blockId: string;
  name: string;
  order: number;
  exercises: WorkoutPlanExercise[];
}

export interface ClientWorkoutPlan {
  id: string;
  planId: string;
  name: string;
  assignedAt: string | null;
  /** First and last selected day (YYYY-MM-DD); null when the plan has none. */
  fromDate: string | null;
  toDate: string | null;
  /** Every selected day, exactly as stored - gaps are real gaps. */
  days: string[];
  /** The selected days on which the member sees this plan (a newer active plan wins a shared day). */
  shownDays: string[];
  status: "active" | "archived";
  period: "past" | "current" | "upcoming" | null;
  coach: { id: string; name: string | null; level: string | null } | null;
  legacy: { workoutPlanId: number; createdBy: number | null; coachSource: string | null } | null;
  counts: { blocks: number; exercises: number; days: number };
  blocks: WorkoutPlanBlock[];
}

export interface ClientWorkoutPlans {
  client: { id: string; name: string | null };
  /** The server's business day (IST), YYYY-MM-DD. */
  today: string;
  timezone: string;
  /** In the member's precedence order: newest assignment first. */
  workoutPlans: ClientWorkoutPlan[];
}

/** A member's coach-assigned workout plans (read-only), newest assignment first. */
export async function listUserWorkoutPlans(userId: string) {
  return apiRequest<ClientWorkoutPlans>(`/admin/users/${encodeURIComponent(userId)}/workout-plans`);
}
