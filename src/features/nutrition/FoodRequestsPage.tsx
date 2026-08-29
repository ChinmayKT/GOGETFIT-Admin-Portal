import { useMemo, useState, type ReactNode } from "react";
import { Eye, Check, X } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { listFoodRequests, markFoodRequestAdded, rejectFoodRequest } from "../../mock/nutrition/requestRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import type { FoodRequest } from "../../types/nutrition";

const STATUS_TONE: Record<string, StatusTone> = { Pending: "warning", Added: "success", Rejected: "error" };

export function FoodRequestsPage() {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewTarget, setViewTarget] = useState<FoodRequest | null>(null);
  const [addTarget, setAddTarget] = useState<FoodRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FoodRequest | null>(null);
  const [working, setWorking] = useState(false);

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listFoodRequests, params);

  async function handleMarkAdded() {
    if (!addTarget) return;
    setWorking(true);
    try {
      await markFoodRequestAdded(addTarget.id);
      show(`"${addTarget.foodItem}" marked as added to the food database`);
      setAddTarget(null);
      retry();
    } finally {
      setWorking(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setWorking(true);
    try {
      await rejectFoodRequest(rejectTarget.id);
      show(`Request for "${rejectTarget.foodItem}" rejected`, "info");
      setRejectTarget(null);
      retry();
    } finally {
      setWorking(false);
    }
  }

  const columns: Column<FoodRequest>[] = [
    { key: "foodItem", header: "Food Item" },
    {
      key: "description",
      header: "Description",
      render: (r) => <span style={{ display: "inline-block", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</span>,
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} /> },
    { key: "requestedBy", header: "Requested By" },
    { key: "requestedDate", header: "Requested Date", render: (r) => formatDate(r.requestedDate) },
  ];

  return (
    <>
      <PageHeader
        title="Food Requests"
        breadcrumb={[{ label: "Nutrition" }, { label: "Food Requests" }]}
        description="Foods users have requested to be added to the database."
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by food item, requester..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Pending", value: "Pending" },
            { label: "Added", value: "Added" },
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
        emptyTitle="No food requests"
        emptyDescription="Requests submitted by users for new foods will show up here."
        rowActions={(r) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => setViewTarget(r)} />
            {r.status === "Pending" && (
              <>
                <IconButton icon={<Check size={15} />} label="Mark Added" size="sm" onClick={() => setAddTarget(r)} />
                <IconButton icon={<X size={15} />} label="Reject" size="sm" variant="danger" onClick={() => setRejectTarget(r)} />
              </>
            )}
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <GlassDrawer open={!!viewTarget} onClose={() => setViewTarget(null)} title="Food Request Details">
        {viewTarget && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Detail label="Food Item" value={viewTarget.foodItem} />
            <Detail label="Description" value={viewTarget.description} />
            <Detail label="Status" value={<StatusBadge label={viewTarget.status} tone={STATUS_TONE[viewTarget.status]} />} />
            <Detail label="Requested By" value={viewTarget.requestedBy} />
            <Detail label="Requested Date" value={formatDate(viewTarget.requestedDate)} />
          </div>
        )}
      </GlassDrawer>

      <ConfirmDialog
        open={!!addTarget}
        title="Mark as added?"
        description={`Confirm that "${addTarget?.foodItem ?? ""}" has been added to the food database. This updates the request status to Added.`}
        confirmLabel="Mark Added"
        tone="primary"
        onConfirm={handleMarkAdded}
        onCancel={() => setAddTarget(null)}
        loading={working}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject this request?"
        description={`"${rejectTarget?.foodItem ?? ""}" will be marked as rejected. The requester will not be notified further.`}
        confirmLabel="Reject"
        tone="danger"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
        loading={working}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-caption" style={{ marginBottom: 4 }}>{label}</div>
      <div className="text-primary" style={{ fontSize: "var(--fs-body)" }}>{value}</div>
    </div>
  );
}
