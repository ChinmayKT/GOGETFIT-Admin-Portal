import type { Banner } from "../../types/content";
import { MOCK_BANNERS } from "./bannerData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Banner[] = [...MOCK_BANNERS];

export interface BannerListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listBanners(params: BannerListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10, sortKey = "updatedAt", sortDir = "desc" } = params;

  let rows = store.filter((b) => matchesQuery([b.name, b.description], query));
  if (status) rows = rows.filter((b) => b.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getBanner(id: string) {
  return delay(store.find((b) => b.id === id) ?? null);
}

export async function createBanner(input: Omit<Banner, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const banner: Banner = { ...input, id: nextId("banner"), createdAt: now, updatedAt: now };
  store = [banner, ...store];
  return delay(banner, 600);
}

export async function updateBanner(id: string, patch: Partial<Banner>) {
  store = store.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b));
  return delay(store.find((b) => b.id === id)!, 600);
}

export async function deleteBanner(id: string) {
  store = store.filter((b) => b.id !== id);
  return delay(true, 400);
}
