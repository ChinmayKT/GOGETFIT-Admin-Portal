import type { Challenge, ChallengeParticipant, ReviewDecision } from "../../types/challenge";
import { MOCK_CHALLENGES } from "./data";
import { MOCK_PARTICIPANTS } from "./participantsData";
import { deriveChallengeStatus } from "./status";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Challenge[] = [...MOCK_CHALLENGES];
let participantStore: ChallengeParticipant[] = [...MOCK_PARTICIPANTS];

export interface ChallengeListParams {
  query?: string;
  status?: string;
  priority?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listChallenges(params: ChallengeListParams = {}) {
  const { query = "", status, priority, page = 1, pageSize = 10, sortKey = "startDate", sortDir = "asc" } = params;

  let rows = store.filter((c) => matchesQuery([c.name, c.description], query));
  if (status) rows = rows.filter((c) => deriveChallengeStatus(c) === status);
  if (priority !== undefined) rows = rows.filter((c) => c.priority === priority);

  rows = sortKey === "status"
    ? [...rows].sort((a, b) => {
        const cmp = deriveChallengeStatus(a).localeCompare(deriveChallengeStatus(b));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getChallenge(id: string) {
  return delay(store.find((c) => c.id === id) ?? null);
}

export async function createChallenge(input: Omit<Challenge, "id" | "createdAt">) {
  const challenge: Challenge = { ...input, id: nextId("challenge"), createdAt: new Date().toISOString() };
  store = [challenge, ...store];
  return delay(challenge, 600);
}

export async function updateChallenge(id: string, patch: Partial<Challenge>) {
  store = store.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return delay(store.find((c) => c.id === id)!, 600);
}

export async function deleteChallenge(id: string) {
  store = store.filter((c) => c.id !== id);
  participantStore = participantStore.filter((p) => p.challengeId !== id);
  return delay(true, 400);
}

export interface ParticipantListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listParticipants(challengeId: string, params: ParticipantListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10, sortKey = "joinedDate", sortDir = "desc" } = params;

  let rows = participantStore.filter((p) => p.challengeId === challengeId);
  rows = rows.filter((p) => matchesQuery([p.name, p.ggfId], query));
  if (status) rows = rows.filter((p) => p.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getParticipant(challengeId: string, userId: string) {
  return delay(participantStore.find((p) => p.challengeId === challengeId && p.userId === userId) ?? null);
}

export async function reviewParticipant(challengeId: string, userId: string, decision: ReviewDecision, note: string | null) {
  participantStore = participantStore.map((p) =>
    p.challengeId === challengeId && p.userId === userId
      ? { ...p, status: "reviewed", reviewDecision: decision, reviewNote: note }
      : p,
  );
  return delay(participantStore.find((p) => p.challengeId === challengeId && p.userId === userId)!, 500);
}
