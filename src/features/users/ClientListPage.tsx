import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { listClients } from "../../mock/users/clientsRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Client } from "../../types/user";
import { formatDate } from "../../utils/format";

const STATUS_TONE: Record<string, StatusTone> = {
  Active: "success",
  Expired: "neutral",
  "Pending Renewal": "warning",
  Cancelled: "error",
};

export function ClientListPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listClients, params);

  const columns: Column<Client>[] = [
    { key: "clientName", header: "Client" },
    { key: "coachName", header: "Coach" },
    { key: "planName", header: "Plan" },
    { key: "couponCode", header: "Coupon", render: (c) => c.couponCode ?? "—" },
    { key: "transactionId", header: "Transaction ID" },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={c.status} tone={STATUS_TONE[c.status]} /> },
    { key: "startDate", header: "Start", render: (c) => formatDate(c.startDate) },
    { key: "endDate", header: "End", render: (c) => formatDate(c.endDate) },
    { key: "ggfId", header: "GGF ID" },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        breadcrumb={[{ label: "People", path: "/users" }, { label: "Clients" }]}
        description="Members currently enrolled in a coaching plan."
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            Add User
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, email, transaction ID..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Pending Renewal", value: "Pending Renewal" },
            { label: "Expired", value: "Expired" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No clients found"
        emptyDescription="Try adjusting your search or filters."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
