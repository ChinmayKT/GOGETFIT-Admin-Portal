import { useMemo, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { Select } from "../../components/forms/Select";
import { GlassCard } from "../../components/ui/GlassCard";
import { Pagination } from "../../components/data-display/Pagination";
import { SkeletonRows } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { listAuditLogs, auditLogAdminOptions } from "../../mock/system/auditLogRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { MODULE_KEYS, MODULE_LABELS } from "../../types/system";
import { formatDateTime } from "../../utils/format";
import type { AuditAction } from "../../types/system";

const ACTION_TONE: Record<AuditAction, string> = {
  Created: "var(--color-success, #34c759)",
  Updated: "var(--ggf-orange)",
  Deleted: "var(--color-error, #ff453a)",
  Published: "var(--ggf-orange)",
  Deactivated: "var(--color-error, #ff453a)",
  Approved: "var(--color-success, #34c759)",
  Reactivated: "var(--color-success, #34c759)",
};

export function AuditLogsPage() {
  const [adminId, setAdminId] = useState("");
  const [module, setModule] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const adminOptions = useMemo(() => auditLogAdminOptions(), []);

  const params = useMemo(
    () => ({
      adminId: adminId || undefined,
      module: (module || undefined) as (typeof MODULE_KEYS)[number] | undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize,
    }),
    [adminId, module, from, to, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listAuditLogs, params);

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        breadcrumb={[{ label: "System" }, { label: "Audit Logs" }]}
        description="A reverse-chronological trail of every meaningful change made across the portal."
      />

      <FilterBar>
        <Select
          value={adminId}
          onChange={(e) => { setAdminId(e.target.value); resetPage(); }}
          placeholder="Admin"
          options={[{ label: "All admins", value: "" }, ...adminOptions.map((a) => ({ label: a.name, value: a.id }))]}
        />
        <Select
          value={module}
          onChange={(e) => { setModule(e.target.value); resetPage(); }}
          placeholder="Module"
          options={[{ label: "All modules", value: "" }, ...MODULE_KEYS.map((m) => ({ label: MODULE_LABELS[m], value: m }))]}
        />
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); resetPage(); }}
          aria-label="From date"
          style={{
            height: 40,
            padding: "0 12px",
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-body)",
          }}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); resetPage(); }}
          aria-label="To date"
          style={{
            height: 40,
            padding: "0 12px",
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-body)",
          }}
        />
      </FilterBar>

      <GlassCard>
        {loading ? (
          <SkeletonRows rows={8} columns={1} />
        ) : error ? (
          <ErrorState onRetry={retry} />
        ) : rows.length === 0 ? (
          <EmptyState title="No activity found" description="Try widening the date range or clearing filters." />
        ) : (
          <div style={{ position: "relative" }}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 5,
                top: 6,
                bottom: 6,
                width: 2,
                background: "var(--glass-border)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {rows.map((entry) => (
                <div key={entry.id} style={{ display: "flex", gap: 16, position: "relative", paddingLeft: 24 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 5,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: ACTION_TONE[entry.action] ?? "var(--ggf-orange)",
                      boxShadow: "0 0 0 3px var(--glass-fill-bright)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{entry.adminName}</span>
                      <span className="text-secondary">{entry.action.toLowerCase()}</span>
                      <span
                        className="text-caption"
                        style={{
                          padding: "1px 8px",
                          borderRadius: 999,
                          background: "var(--glass-fill)",
                          border: "1px solid var(--glass-border)",
                        }}
                      >
                        {MODULE_LABELS[entry.module]}
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>{entry.objectName}</span>
                    </div>
                    <div className="text-caption" style={{ marginTop: 2 }}>
                      {formatDateTime(entry.timestamp)}
                    </div>
                    {entry.diffs && entry.diffs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                        {entry.diffs.map((d, i) => (
                          <div
                            key={i}
                            className="text-caption"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              width: "fit-content",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--glass-fill)",
                              border: "1px solid var(--glass-border)",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{d.field}:</span>
                            <span style={{ color: "var(--text-muted)" }}>{d.before}</span>
                            <span style={{ color: "var(--text-muted)" }}>→</span>
                            <span style={{ color: "var(--ggf-orange)", fontWeight: 600 }}>{d.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
