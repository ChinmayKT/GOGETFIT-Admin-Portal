import type { ModuleKey, PermissionAction } from "./permissions";

export type { AdminUser } from "./permissions";

export const MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "users",
  "coaches",
  "nutrition",
  "workouts",
  "challenges",
  "rewards",
  "progress",
  "content",
  "commerce",
  "operations",
  "analytics",
  "system",
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  users: "Users",
  coaches: "Coaches",
  nutrition: "Nutrition",
  workouts: "Workouts",
  challenges: "Challenges",
  rewards: "Rewards",
  progress: "Progress",
  content: "Content",
  commerce: "Commerce",
  operations: "Operations",
  analytics: "Analytics",
  system: "System",
};

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "publish"];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  publish: "Publish",
};

export type AuditAction = "Created" | "Updated" | "Deleted" | "Published" | "Deactivated" | "Approved" | "Reactivated";

export interface AuditLogDiff {
  field: string;
  before: string;
  after: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  module: ModuleKey;
  objectName: string;
  diffs?: AuditLogDiff[];
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  environment: "All" | "Beta users only";
  enabled: boolean;
}
