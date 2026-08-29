import type { Transformation, TransformationStatus } from "../../types/progress";
import { MOCK_TRANSFORMATIONS } from "./transformationData";
import { MOCK_USERS } from "../users/data";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let store: Transformation[] = [...MOCK_TRANSFORMATIONS];

export interface TransformationListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listTransformations(params: TransformationListParams = {}) {
  const { query = "", status, page = 1, pageSize = 12, sortKey = "submittedAt", sortDir = "desc" } = params;

  let rows = store.filter((t) => matchesQuery([t.title, t.userName, t.ggfId, t.description], query));
  if (status) rows = rows.filter((t) => t.status === status);
  rows = sortRows(rows, sortKey, sortDir);

  return delay(paginate(rows, page, pageSize));
}

export async function getTransformation(id: string) {
  return delay(store.find((t) => t.id === id) ?? null);
}

export async function updateTransformationStatus(id: string, status: TransformationStatus) {
  store = store.map((t) =>
    t.id === id
      ? { ...t, status, reviewedAt: new Date().toISOString(), reviewNote: status === "Rejected" || status === "Changes Requested" ? t.reviewNote : null }
      : t,
  );
  return delay(store.find((t) => t.id === id)!, 500);
}

export interface CreateTransformationInput {
  ggfId: string;
  title: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

export async function createTransformation(input: CreateTransformationInput): Promise<Transformation> {
  const user = MOCK_USERS.find((u) => u.ggfId.toLowerCase() === input.ggfId.trim().toLowerCase());
  if (!user) throw new Error("No user found with this GGF ID");

  const t: Transformation = {
    id: nextId("xform"),
    userId: user.id,
    ggfId: user.ggfId,
    userName: `${user.firstName} ${user.lastName}`,
    title: input.title,
    description: input.description,
    beforeImageUrl: input.beforeImageUrl,
    afterImageUrl: input.afterImageUrl,
    status: "Pending Review",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewNote: null,
  };
  store = [t, ...store];
  return delay(t, 600);
}
