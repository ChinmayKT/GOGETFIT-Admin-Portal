import type { Coach } from "../../types/coach";

/*
 * Mock coaches for the screens not yet on the backend (Finance, Assignments,
 * Certificates). Coach create/edit/list lives in src/api/coaches.ts only.
 */
import { MOCK_COACHES } from "./data";
import { delay, nextId } from "../shared/utils";

let store: Coach[] = [...MOCK_COACHES];

export async function getCoach(id: string) {
  return delay(store.find((c) => c.id === id) ?? null);
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
