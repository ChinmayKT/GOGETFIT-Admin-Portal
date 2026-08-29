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
import { listOrders } from "../../mock/orders/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR } from "../../utils/format";
import type { Order } from "../../types/order";

const STATUS_TONE: Record<string, StatusTone> = { Booked: "warning", Sent: "info", Delivered: "success" };

export function OrderListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listOrders, params);

  const columns: Column<Order>[] = [
    { key: "orderNumber", header: "Order" },
    { key: "userName", header: "User" },
    { key: "itemName", header: "Item" },
    { key: "amount", header: "Amount", render: (o) => formatCurrencyINR(o.amount) },
    { key: "status", header: "Status", render: (o) => <StatusBadge label={o.status} tone={STATUS_TONE[o.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumb={[{ label: "Commerce" }, { label: "Orders" }]}
        description="Merchandise and plan orders placed by members."
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by order number, user, email, phone..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Booked", value: "Booked" },
            { label: "Sent", value: "Sent" },
            { label: "Delivered", value: "Delivered" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(o) => o.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(o) => navigate(`/commerce/orders/${o.id}`)}
        emptyTitle="No orders yet"
        emptyDescription="Orders placed by members will show up here."
        rowActions={(o) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/commerce/orders/${o.id}`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
