import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listCoupons } from "../../api/coupons";
import { formatDate } from "../../utils/format";
import { adminName, couponDay, type Coupon, type CouponStatus, type CouponVisibility } from "../../types/coupons";

const PAGE_SIZE = 10;

/** Two-line cell: the admin, then when. */
function Audit({ who, when }: { who: string; when: string | null }) {
  return (
    <div>
      <div>{who}</div>
      <div className="text-caption">{when ? formatDate(when) : "—"}</div>
    </div>
  );
}

/**
 * Coupons. Status is decided by the backend from the validity dates (active
 * within them, inactive before and after) - there is no archive or restore.
 * The server lists active coupons first (nearest expiry), then inactive ones.
 */
export function CouponListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CouponStatus | "">("active");
  const [visibility, setVisibility] = useState<CouponVisibility | "">("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ search: query || undefined, status, visibility, page, pageSize: PAGE_SIZE }),
    [query, status, visibility, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listCoupons, params);
  const filtered = Boolean(query || visibility);

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => (
        <div>
          <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>{c.code}</div>
          {c.description && <div className="text-caption" style={{ maxWidth: 220 }}>{c.description}</div>}
        </div>
      ),
    },
    { key: "discount", header: "Discount", render: (c) => `${c.discount.value}%` },
    { key: "validFrom", header: "Valid From", render: (c) => couponDay(c.validFrom) },
    { key: "validTo", header: "Valid To", render: (c) => couponDay(c.validTo) },
    {
      key: "visibility",
      // Visibility, in the admin's words. "public" in the API means the coupon is
      // listed in the general checkout coupon list; it says nothing about whether
      // the coupon is currently usable - that is Status.
      header: "Visible to All",
      render: (c) => (
        <StatusBadge
          label={c.visibility === "public" ? "Yes" : "No"}
          tone={c.visibility === "public" ? "info" : "neutral"}
          dot={false}
        />
      ),
    },
    {
      key: "status",
      // Current validity, computed by the backend from the dates - never a
      // stored field, and never the same thing as visibility.
      header: "Status",
      render: (c) => <StatusBadge label={c.status === "active" ? "Active" : "Inactive"} tone={c.status === "active" ? "success" : "neutral"} />,
    },
    { key: "created", header: "Created", render: (c) => <Audit who={adminName(c.createdBy)} when={c.createdAt} /> },
    { key: "updated", header: "Updated", render: (c) => <Audit who={adminName(c.updatedBy)} when={c.updatedAt} /> },
  ];

  return (
    <>
      <PageHeader
        title="Coupons"
        breadcrumb={[{ label: "Commerce" }, { label: "Coupons" }]}
        description="Percentage discount codes. Status is automatic, from the validity dates. Visible to All only decides whether a coupon is listed at checkout - a hidden coupon still works if the exact code is entered while it is valid."
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={retry}>Refresh</Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/coupons/new")}>Add Coupon</Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by code or description..." />
        <Select
          value={status}
          aria-label="Status"
          onChange={(e) => { setStatus(e.target.value as CouponStatus | ""); setPage(1); }}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "All statuses", value: "" },
          ]}
        />
        <Select
          value={visibility}
          aria-label="Visible to All"
          onChange={(e) => { setVisibility(e.target.value as CouponVisibility | ""); setPage(1); }}
          options={[
            { label: "Visible to all: any", value: "" },
            { label: "Visible to all: Yes", value: "public" },
            { label: "Visible to all: No", value: "private" },
          ]}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * PAGE_SIZE}
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(c) => navigate(`/commerce/coupons/${c.id}`)}
        emptyTitle={filtered ? "No coupons match your filters" : status === "active" ? "No active coupons" : status === "inactive" ? "No inactive coupons" : "No coupons yet"}
        emptyDescription={
          filtered
            ? "Try a different code, description or visibility."
            : status === "inactive"
              ? "Coupons appear here before their start date and after their end date."
              : "Add a coupon, or check Inactive for coupons outside their dates."
        }
        emptyAction={
          !filtered && status !== "inactive" ? (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/coupons/new")}>Add Coupon</Button>
          ) : undefined
        }
        rowActions={(c) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/commerce/coupons/${c.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/commerce/coupons/${c.id}/edit`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />}
    </>
  );
}
