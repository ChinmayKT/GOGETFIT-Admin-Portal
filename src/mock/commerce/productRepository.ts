import type { Product } from "../../types/commerce";
import { MOCK_PRODUCTS } from "./productData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Product[] = [...MOCK_PRODUCTS];

export interface ProductListParams {
  query?: string;
  size?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listProducts(params: ProductListParams = {}) {
  const { query = "", size, status, page = 1, pageSize = 10, sortKey = "updatedAt", sortDir = "desc" } = params;

  let rows = store.filter((p) => matchesQuery([p.name, p.description], query));
  if (size) rows = rows.filter((p) => p.size === size);
  if (status) rows = rows.filter((p) => p.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getProduct(id: string) {
  return delay(store.find((p) => p.id === id) ?? null);
}

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const product: Product = { ...input, id: nextId("product"), createdAt: now, updatedAt: now };
  store = [product, ...store];
  return delay(product, 600);
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  store = store.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
  return delay(store.find((p) => p.id === id)!, 600);
}

export async function deleteProduct(id: string) {
  store = store.filter((p) => p.id !== id);
  return delay(true, 400);
}
