import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { listCoupons, deleteCoupon } from "../../mock/commerce/couponRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import type { Coupon } from "../../types/commerce";

const AUDIENCE_TONE: Record<string, StatusTone> = { Everyone: "info", "Specific Users": "warning" };

export function CouponListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, audience: audience || undefined, page, pageSize }),
    [query, audience, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listCoupons, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      show("Coupon deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Coupon>[] = [
    { key: "name", header: "Coupon Name", render: (c) => <span style={{ fontWeight: 600 }}>{c.name}</span> },
    { key: "code", header: "Coupon Code", render: (c) => <code>{c.code}</code> },
    { key: "discountPercent", header: "Discount", render: (c) => `${c.discountPercent}%` },
    { key: "validFrom", header: "Valid From", render: (c) => formatDate(c.validFrom) },
    { key: "validTo", header: "Valid To", render: (c) => formatDate(c.validTo) },
    { key: "audience", header: "Audience", render: (c) => <StatusBadge label={c.audience} tone={AUDIENCE_TONE[c.audience]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Coupons"
        breadcrumb={[{ label: "Commerce" }, { label: "Coupons" }]}
        description="Discount coupons available to members at checkout."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/coupons/new")}>
            Add Coupon
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or code..." />
        <Select
          value={audience}
          onChange={(e) => { setAudience(e.target.value); setPage(1); }}
          placeholder="Audience"
          options={[
            { label: "All audiences", value: "" },
            { label: "Everyone", value: "Everyone" },
            { label: "Specific Users", value: "Specific Users" },
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
        emptyTitle="No coupons yet"
        emptyDescription="Add your first coupon to offer discounts to members."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/coupons/new")}>
            Add Coupon
          </Button>
        }
        rowActions={(c) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/commerce/coupons/${c.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(c)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon?"
        description={`"${deleteTarget?.name ?? ""}" (${deleteTarget?.code ?? ""}) will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
