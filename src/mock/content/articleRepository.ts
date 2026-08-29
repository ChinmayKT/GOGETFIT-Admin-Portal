import type { Article } from "../../types/content";
import { MOCK_ARTICLES } from "./articleData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Article[] = [...MOCK_ARTICLES];

export interface ArticleListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listArticles(params: ArticleListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10, sortKey = "updatedAt", sortDir = "desc" } = params;

  let rows = store.filter((a) => matchesQuery([a.title, a.description, a.author], query));
  if (status) rows = rows.filter((a) => a.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getArticle(id: string) {
  return delay(store.find((a) => a.id === id) ?? null);
}

export async function createArticle(input: Omit<Article, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const article: Article = { ...input, id: nextId("article"), createdAt: now, updatedAt: now };
  store = [article, ...store];
  return delay(article, 600);
}

export async function updateArticle(id: string, patch: Partial<Article>) {
  store = store.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a));
  return delay(store.find((a) => a.id === id)!, 600);
}

export async function deleteArticle(id: string) {
  store = store.filter((a) => a.id !== id);
  return delay(true, 400);
}
