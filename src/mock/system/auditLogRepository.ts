import type { ModuleKey } from "../../types/permissions";
import { MOCK_AUDIT_LOGS } from "./auditLogData";
import { delay, paginate } from "../shared/utils";

const store = MOCK_AUDIT_LOGS;

export interface AuditLogListParams {
  adminId?: string;
  module?: ModuleKey | "";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(params: AuditLogListParams = {}) {
  const { adminId, module, from, to, page = 1, pageSize = 15 } = params;

  let rows = [...store];
  if (adminId) rows = rows.filter((r) => r.adminId === adminId);
  if (module) rows = rows.filter((r) => r.module === module);
  if (from) rows = rows.filter((r) => new Date(r.timestamp).getTime() >= new Date(from).getTime());
  if (to) rows = rows.filter((r) => new Date(r.timestamp).getTime() <= new Date(to).getTime() + 86400000);

  return delay(paginate(rows, page, pageSize));
}

export function auditLogAdminOptions() {
  const seen = new Map<string, string>();
  for (const entry of store) seen.set(entry.adminId, entry.adminName);
  return Array.from(seen, ([id, name]) => ({ id, name }));
}
