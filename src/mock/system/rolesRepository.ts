import type { PermissionMatrix, Role } from "../../types/permissions";
import { ROLES } from "./roles";
import { delay, nextId } from "../shared/utils";

/**
 * Editable-roles store for the Roles & Permissions screen.
 *
 * Architecture note: this is a SEPARATE mock store, seeded from `ROLES` (deep-copied),
 * rather than mutating the shared `ROLES` array that `roles.ts` exports. `RoleProvider`
 * (and the Topbar's role-switcher / Sidebar's nav filtering) reads `ROLES`/`getRole`/`canView`
 * directly and is never touched by edits made here — so editing a role's matrix or creating
 * a new role on this screen can never break role-based nav filtering elsewhere in the app.
 * It does mean a role created here won't show up in the Topbar switcher, which is an
 * acceptable mock-only tradeoff per the phase spec ("your call on architecture").
 */
let store: Role[] = ROLES.map((r) => ({ ...r, permissions: { ...r.permissions } }));

export async function listEditableRoles() {
  return delay([...store], 300);
}

export async function getEditableRole(id: string) {
  return delay(store.find((r) => r.id === id) ?? null, 200);
}

export async function updateRolePermissions(id: string, permissions: PermissionMatrix) {
  store = store.map((r) => (r.id === id ? { ...r, permissions } : r));
  return delay(store.find((r) => r.id === id)!, 500);
}

export async function createRole(input: { name: string; description: string; permissions: PermissionMatrix }) {
  const role: Role = { id: nextId("role"), name: input.name, description: input.description, permissions: input.permissions };
  store = [...store, role];
  return delay(role, 500);
}
