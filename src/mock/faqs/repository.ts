import type { Faq } from "../../types/faq";
import { MOCK_FAQS } from "./data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Faq[] = [...MOCK_FAQS];

export interface FaqListParams {
  query?: string;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listFaqs(params: FaqListParams = {}) {
  const { query = "", category, status, page = 1, pageSize = 10, sortKey = "order", sortDir = "asc" } = params;

  let rows = store.filter((f) => matchesQuery([f.question, f.answer, f.category], query));
  if (category) rows = rows.filter((f) => f.category === category);
  if (status) rows = rows.filter((f) => f.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getFaq(id: string) {
  return delay(store.find((f) => f.id === id) ?? null);
}

/** Suggests the next order value ("last + 1") for a brand-new FAQ. */
export async function nextFaqOrder() {
  const max = store.reduce((acc, f) => Math.max(acc, f.order), 0);
  return delay(max + 1, 150);
}

export async function createFaq(input: Omit<Faq, "id" | "updatedAt">) {
  const faq: Faq = { ...input, id: nextId("faq"), updatedAt: new Date().toISOString() };
  store = [faq, ...store];
  return delay(faq, 600);
}

export async function updateFaq(id: string, patch: Partial<Faq>) {
  store = store.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f));
  return delay(store.find((f) => f.id === id)!, 600);
}

export async function deleteFaq(id: string) {
  store = store.filter((f) => f.id !== id);
  return delay(true, 400);
}

/** Swaps this FAQ's `order` with its immediate neighbor (by global order, not the current filtered/paged view). */
export async function moveFaq(id: string, direction: "up" | "down") {
  const sorted = [...store].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((f) => f.id === id);
  if (idx === -1) return delay(false, 300);

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return delay(false, 300);

  const current = sorted[idx];
  const neighbor = sorted[swapIdx];
  const currentOrder = current.order;
  const neighborOrder = neighbor.order;

  store = store.map((f) => {
    if (f.id === current.id) return { ...f, order: neighborOrder };
    if (f.id === neighbor.id) return { ...f, order: currentOrder };
    return f;
  });

  return delay(true, 300);
}
