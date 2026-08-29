import type { Quote } from "../../types/quote";
import { MOCK_QUOTES } from "./data";
import { delay, nextId } from "../shared/utils";

let store: Quote[] = [...MOCK_QUOTES];

/** Returns the full list (no server-side pagination — Quotes is a single inline-editable grid). */
export async function listQuotes() {
  return delay({ rows: [...store], total: store.length }, 400);
}

export async function createQuote(input: { text: string; updatedBy: string }) {
  const quote: Quote = {
    id: nextId("quote"),
    text: input.text,
    updatedBy: input.updatedBy,
    updatedAt: new Date().toISOString(),
  };
  store = [quote, ...store];
  return delay(quote, 500);
}

export async function updateQuote(id: string, patch: { text: string; updatedBy: string }) {
  store = store.map((q) => (q.id === id ? { ...q, ...patch, updatedAt: new Date().toISOString() } : q));
  return delay(store.find((q) => q.id === id)!, 500);
}

export async function deleteQuote(id: string) {
  store = store.filter((q) => q.id !== id);
  return delay(true, 300);
}
