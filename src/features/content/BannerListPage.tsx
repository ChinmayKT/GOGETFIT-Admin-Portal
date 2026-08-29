import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
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
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listBanners, deleteBanner } from "../../mock/content/bannerRepository";
import { formatDate } from "../../utils/format";
import type { Banner } from "../../types/content";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral" };

export function BannerListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listBanners, params);

  // Legacy defect being fixed: the old Banners screen deleted a row immediately on click with
  // no confirmation. Delete here always routes through ConfirmDialog before it takes effect.
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteTarget.id);
      show("Banner deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Banner>[] = [
    {
      key: "imageUrl",
      header: "Thumbnail",
      width: "88px",
      render: (b) => (
        <div style={{ width: 64, height: 40, borderRadius: 6, overflow: "hidden", background: "var(--glass-fill-bright)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {b.imageUrl ? <img src={b.imageUrl} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={16} color="var(--text-muted)" />}
        </div>
      ),
    },
    { key: "name", header: "Banner Name", render: (b) => <span style={{ fontWeight: 600 }}>{b.name}</span> },
    { key: "fromDate", header: "From Date", render: (b) => formatDate(b.fromDate) },
    { key: "toDate", header: "To Date", render: (b) => formatDate(b.toDate) },
    { key: "status", header: "Status", render: (b) => <StatusBadge label={b.status} tone={STATUS_TONE[b.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Banners"
        breadcrumb={[{ label: "Content" }, { label: "Banners" }]}
        description="Promotional banners shown on the home feed and app carousels."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/banners/new")}>
            Add Banner
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by banner name..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(b) => b.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(b) => navigate(`/content/banners/${b.id}`)}
        emptyTitle="No banners yet"
        emptyDescription="Add your first promotional banner to feature it in the app."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/banners/new")}>
            Add Banner
          </Button>
        }
        rowActions={(b) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/content/banners/${b.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/content/banners/${b.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(b)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete banner?"
        description={`"${deleteTarget?.name ?? ""}" will be permanently removed and stop showing in the app immediately.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
