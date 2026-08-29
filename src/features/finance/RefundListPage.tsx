import { useMemo, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { MetricCard } from "../../components/charts/MetricCard";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { listRefunds, refundKpis } from "../../mock/finance/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { Refund } from "../../types/finance";

const STATUS_TONE: Record<string, StatusTone> = {
  Requested: "info",
  Processing: "warning",
  Completed: "success",
  Rejected: "error",
};

export function RefundListPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const kpis = useMemo(() => refundKpis(), []);

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listRefunds, params);

  const columns: Column<Refund>[] = [
    { key: "refundNumber", header: "Refund ID" },
    { key: "paymentId", header: "Payment" },
    { key: "clientName", header: "Client" },
    { key: "originalAmount", header: "Original Amount", render: (r) => formatCurrencyINR(r.originalAmount) },
    { key: "refundAmount", header: "Refund Amount", render: (r) => formatCurrencyINR(r.refundAmount) },
    { key: "reason", header: "Reason" },
    { key: "requestedBy", header: "Requested By" },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} /> },
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Refunds"
        breadcrumb={[{ label: "Finance" }, { label: "Refunds" }]}
        description="Refund requests and their processing status across all payments."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        <MetricCard label="Refund Amount" value={formatCurrencyINR(kpis.totalRefundAmount)} />
        <MetricCard label="Pending Refunds" value={String(kpis.pendingRefunds)} />
        <MetricCard label="Completed Refunds" value={String(kpis.completedRefunds)} />
        <MetricCard label="Refund Rate" value={`${kpis.refundRatePct.toFixed(1)}%`} />
      </div>

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by refund number, client, reason..."
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Requested", value: "Requested" },
            { label: "Processing", value: "Processing" },
            { label: "Completed", value: "Completed" },
            { label: "Rejected", value: "Rejected" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No refunds yet"
        emptyDescription="Refund requests will show up here."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
