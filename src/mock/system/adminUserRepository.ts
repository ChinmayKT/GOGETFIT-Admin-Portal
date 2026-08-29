import type { AdminUser } from "../../types/permissions";
import { MOCK_ADMIN_USERS } from "./adminUserData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: AdminUser[] = [...MOCK_ADMIN_USERS];

export interface AdminUserListParams {
  query?: string;
  roleId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listAdminUsers(params: AdminUserListParams = {}) {
  const { query = "", roleId, status, page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;

  let rows = store.filter((a) => matchesQuery([a.name, a.email], query));
  if (roleId) rows = rows.filter((a) => a.roleId === roleId);
  if (status) rows = rows.filter((a) => a.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getAdminUser(id: string) {
  return delay(store.find((a) => a.id === id) ?? null);
}

export async function createAdminUser(input: Omit<AdminUser, "id" | "createdAt" | "lastActive" | "avatarSeed">) {
  const admin: AdminUser = {
    ...input,
    id: nextId("admin"),
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    avatarSeed: input.name,
  };
  store = [admin, ...store];
  return delay(admin, 600);
}

export async function updateAdminUser(id: string, patch: Partial<AdminUser>) {
  store = store.map((a) => (a.id === id ? { ...a, ...patch } : a));
  return delay(store.find((a) => a.id === id)!, 600);
}

export async function deactivateAdminUser(id: string) {
  return updateAdminUser(id, { status: "Inactive" });
}

export function countAdminUsersByRole(roleId: string): number {
  return store.filter((a) => a.roleId === roleId).length;
}
