import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { listPayments } from "../../mock/finance/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { Payment } from "../../types/finance";

const STATUS_TONE: Record<string, StatusTone> = {
  Success: "success",
  Pending: "warning",
  Failed: "error",
  Refunded: "neutral",
  "Partially Refunded": "neutral",
};

export function PaymentListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, status: status || undefined, method: method || undefined, page, pageSize }),
    [query, status, method, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listPayments, params);

  const columns: Column<Payment>[] = [
    { key: "paymentNumber", header: "Payment ID" },
    { key: "clientName", header: "Client" },
    { key: "packageName", header: "Package" },
    { key: "coachName", header: "Coach" },
    { key: "finalAmount", header: "Amount", render: (p) => formatCurrencyINR(p.finalAmount) },
    { key: "status", header: "Status", render: (p) => <StatusBadge label={p.status} tone={STATUS_TONE[p.status]} /> },
    { key: "createdAt", header: "Date", render: (p) => formatDate(p.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        breadcrumb={[{ label: "Finance" }, { label: "Payments" }]}
        description="All payment transactions across enrollments, renewals, challenges, and store orders."
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by payment number, client, transaction ref, coach..."
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Success", value: "Success" },
            { label: "Pending", value: "Pending" },
            { label: "Failed", value: "Failed" },
            { label: "Refunded", value: "Refunded" },
            { label: "Partially Refunded", value: "Partially Refunded" },
          ]}
        />
        <Select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          placeholder="Method"
          options={[
            { label: "All methods", value: "" },
            { label: "UPI", value: "UPI" },
            { label: "Credit Card", value: "Credit Card" },
            { label: "Debit Card", value: "Debit Card" },
            { label: "Net Banking", value: "Net Banking" },
            { label: "Wallet", value: "Wallet" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(p) => navigate(`/finance/payments/${p.id}`)}
        emptyTitle="No payments yet"
        emptyDescription="Payments made by clients will show up here."
        rowActions={(p) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/finance/payments/${p.id}`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
