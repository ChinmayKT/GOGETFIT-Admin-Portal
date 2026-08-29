export type PermissionAction = "view" | "create" | "edit" | "delete" | "publish";

export type ModuleKey =
  | "dashboard"
  | "users"
  | "coaches"
  | "nutrition"
  | "workouts"
  | "challenges"
  | "rewards"
  | "progress"
  | "content"
  | "commerce"
  | "operations"
  | "analytics"
  | "system";

export type PermissionMatrix = Record<ModuleKey, PermissionAction[]>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
  isSystemDefault?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "Active" | "Inactive";
  lastActive: string;
  createdAt: string;
  avatarSeed: string;
}
