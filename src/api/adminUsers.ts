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
