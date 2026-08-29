import type { ModuleKey, PermissionAction, Role } from "../../types/permissions";

const ALL: PermissionAction[] = ["view", "create", "edit", "delete", "publish"];
const CRUD: PermissionAction[] = ["view", "create", "edit", "delete"];
const VIEW_ONLY: PermissionAction[] = ["view"];
const NONE: PermissionAction[] = [];

function matrix(overrides: Partial<Record<ModuleKey, PermissionAction[]>>): Role["permissions"] {
  const base: Role["permissions"] = {
    dashboard: VIEW_ONLY,
    users: NONE,
    coaches: NONE,
    nutrition: NONE,
    workouts: NONE,
    challenges: NONE,
    rewards: NONE,
    progress: NONE,
    content: NONE,
    commerce: NONE,
    operations: NONE,
    analytics: NONE,
    system: NONE,
  };
  return { ...base, ...overrides };
}

export const ROLES: Role[] = [
  {
    id: "role_super_admin",
    name: "Super Admin",
    description: "Full access to every module, including system configuration.",
    isSystemDefault: true,
    permissions: matrix({
      users: ALL, coaches: ALL, nutrition: ALL, workouts: ALL, challenges: ALL, rewards: ALL,
      progress: ALL, content: ALL, commerce: ALL, operations: ALL, analytics: ALL, system: ALL,
    }),
  },
  {
    id: "role_operations_admin",
    name: "Operations Admin",
    description: "Runs day-to-day operations across people, commerce and support workflows.",
    permissions: matrix({
      users: CRUD, coaches: CRUD, nutrition: VIEW_ONLY, workouts: VIEW_ONLY, challenges: CRUD,
      rewards: CRUD, progress: CRUD, commerce: CRUD, operations: ALL, analytics: VIEW_ONLY,
    }),
  },
  {
    id: "role_coach_manager",
    name: "Coach Manager",
    description: "Manages the coaching roster, capacity and client assignments.",
    permissions: matrix({ coaches: ALL, users: VIEW_ONLY, progress: CRUD, analytics: VIEW_ONLY }),
  },
  {
    id: "role_nutrition_manager",
    name: "Nutrition Manager",
    description: "Owns diet plans, the food database and food requests.",
    permissions: matrix({ nutrition: ALL, users: VIEW_ONLY }),
  },
  {
    id: "role_fitness_manager",
    name: "Fitness Manager",
    description: "Owns the workout library and challenge programs.",
    permissions: matrix({ workouts: ALL, challenges: ALL, users: VIEW_ONLY }),
  },
  {
    id: "role_content_manager",
    name: "Content Manager",
    description: "Publishes articles, banners, FAQs, quotes and media.",
    permissions: matrix({ content: ALL }),
  },
  {
    id: "role_commerce_manager",
    name: "Commerce Manager",
    description: "Manages products, packages, orders and coupons.",
    permissions: matrix({ commerce: ALL, analytics: VIEW_ONLY }),
  },
  {
    id: "role_support",
    name: "Support",
    description: "Front-line support with read access and limited edit rights on users.",
    permissions: matrix({ users: ["view", "edit"], coaches: VIEW_ONLY, commerce: VIEW_ONLY }),
  },
  {
    id: "role_analyst",
    name: "Analyst",
    description: "Read-only access to analytics and reporting across the business.",
    permissions: matrix({ analytics: VIEW_ONLY, users: VIEW_ONLY, commerce: VIEW_ONLY, coaches: VIEW_ONLY }),
  },
];

export function getRole(id: string): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

export function canView(role: Role, module: ModuleKey): boolean {
  return module === "dashboard" || role.permissions[module]?.includes("view");
}
