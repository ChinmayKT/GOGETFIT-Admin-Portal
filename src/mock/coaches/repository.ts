import type { Coach } from "../../types/coach";
import { MOCK_COACHES } from "./data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Coach[] = [...MOCK_COACHES];

export interface CoachListParams {
  query?: string;
  level?: number;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listCoaches(params: CoachListParams = {}) {
  const { query = "", level, status, page = 1, pageSize = 10, sortKey = "activeClients", sortDir = "desc" } = params;

  let rows = store.filter((c) =>
    matchesQuery([c.firstName, c.lastName, c.email, c.city, c.specialization], query),
  );
  if (level) rows = rows.filter((c) => c.level === level);
  if (status) rows = rows.filter((c) => c.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getCoach(id: string) {
  return delay(store.find((c) => c.id === id) ?? null);
}

export async function createCoach(input: Omit<Coach, "id" | "certificates" | "activeClients" | "pendingClients" | "joinedAt">) {
  const coach: Coach = {
    ...input,
    id: nextId("coach"),
    certificates: [],
    activeClients: 0,
    pendingClients: 0,
    joinedAt: new Date().toISOString(),
  };
  store = [coach, ...store];
  return delay(coach, 600);
}

export async function updateCoach(id: string, patch: Partial<Coach>) {
  store = store.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return delay(store.find((c) => c.id === id)!, 600);
}

export async function addCertificate(coachId: string, fileName: string) {
  store = store.map((c) =>
    c.id === coachId
      ? { ...c, certificates: [...c.certificates, { id: nextId("cert"), fileName, uploadedAt: new Date().toISOString() }] }
      : c,
  );
  return delay(store.find((c) => c.id === coachId)!, 500);
}

export async function removeCertificate(coachId: string, certId: string) {
  store = store.map((c) => (c.id === coachId ? { ...c, certificates: c.certificates.filter((cert) => cert.id !== certId) } : c));
  return delay(store.find((c) => c.id === coachId)!, 300);
}

export function coachOptions() {
  return store.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));
}
