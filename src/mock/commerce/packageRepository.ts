import type { Package } from "../../types/package";
import { MOCK_PACKAGES } from "./packageData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Package[] = [...MOCK_PACKAGES];

export interface PackageListParams {
  query?: string;
  planType?: string;
  planLevel?: number;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listPackages(params: PackageListParams = {}) {
  const { query = "", planType, planLevel, page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;

  let rows = store.filter((p) => matchesQuery([p.planName], query));
  if (planType) rows = rows.filter((p) => p.planType === planType);
  if (planLevel) rows = rows.filter((p) => p.planLevel === planLevel);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getPackage(id: string) {
  return delay(store.find((p) => p.id === id) ?? null);
}

export async function createPackage(input: Omit<Package, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const pkg: Package = { ...input, id: nextId("package"), createdAt: now, updatedAt: now };
  store = [pkg, ...store];
  return delay(pkg, 600);
}

export async function updatePackage(id: string, patch: Partial<Package>) {
  store = store.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
  return delay(store.find((p) => p.id === id)!, 600);
}

export async function deletePackage(id: string) {
  store = store.filter((p) => p.id !== id);
  return delay(true, 400);
}
