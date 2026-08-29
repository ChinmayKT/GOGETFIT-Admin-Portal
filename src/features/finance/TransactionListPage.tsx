import { useMemo, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { listTransactions } from "../../mock/finance/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { FinanceTransaction } from "../../types/finance";

const TYPE_TONE: Record<string, StatusTone> = {
  Payment: "info",
  Refund: "orange",
  Adjustment: "neutral",
  Renewal: "success",
};

const STATUS_TONE: Record<string, StatusTone> = {
  Success: "success",
  Pending: "warning",
  Failed: "error",
};

export function TransactionListPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({ query, type: type || undefined, page, pageSize }), [query, type, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listTransactions, params);

  const columns: Column<FinanceTransaction>[] = [
    { key: "transactionNumber", header: "Transaction ID" },
    { key: "paymentId", header: "Payment ID", render: (t) => t.paymentId ?? "—" },
    { key: "clientName", header: "Client" },
    { key: "type", header: "Type", render: (t) => <StatusBadge label={t.type} tone={TYPE_TONE[t.type]} /> },
    { key: "amount", header: "Amount", render: (t) => formatCurrencyINR(t.amount) },
    { key: "status", header: "Status", render: (t) => <StatusBadge label={t.status} tone={STATUS_TONE[t.status]} /> },
    { key: "createdAt", header: "Date", render: (t) => formatDate(t.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        breadcrumb={[{ label: "Finance" }, { label: "Transactions" }]}
        description="A unified ledger of payments, refunds, adjustments, and renewals."
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by transaction number, client, payment ID..."
        />
        <Select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          placeholder="Type"
          options={[
            { label: "All types", value: "" },
            { label: "Payment", value: "Payment" },
            { label: "Refund", value: "Refund" },
            { label: "Adjustment", value: "Adjustment" },
            { label: "Renewal", value: "Renewal" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(t) => t.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No transactions yet"
        emptyDescription="Transaction records will show up here."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
