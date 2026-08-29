import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
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
import { listProducts, deleteProduct } from "../../mock/commerce/productRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Product, ProductSize } from "../../types/commerce";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral" };
const SIZES: ProductSize[] = ["S/M/L", "S/M", "M/L", "S/L", "One Size", "Free Size"];

export function ProductListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, size: size || undefined, status: status || undefined, page, pageSize }),
    [query, size, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listProducts, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      show("Item deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "Image",
      render: (p) =>
        p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} style={{ width: 44, height: 32, objectFit: "cover", borderRadius: 6, display: "block" }} />
        ) : (
          <div style={{ width: 44, height: 32, borderRadius: 6, background: "var(--surface-muted, #eee)" }} />
        ),
      width: "64px",
    },
    { key: "name", header: "Item Name", render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
    { key: "points", header: "Points" },
    { key: "size", header: "Size" },
    { key: "status", header: "Status", render: (p) => <StatusBadge label={p.status} tone={STATUS_TONE[p.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        breadcrumb={[{ label: "Commerce" }, { label: "Products" }]}
        description="Store catalog of redeemable items for members."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/products/new")}>
            Add Item
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by item name..." />
        <Select
          value={size}
          onChange={(e) => { setSize(e.target.value); setPage(1); }}
          placeholder="Size"
          options={[{ label: "All sizes", value: "" }, ...SIZES.map((s) => ({ label: s, value: s }))]}
        />
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
        getRowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(p) => navigate(`/commerce/products/${p.id}`)}
        emptyTitle="No items yet"
        emptyDescription="Add your first store item to build the redeemable catalog."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/products/new")}>
            Add Item
          </Button>
        }
        rowActions={(p) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/commerce/products/${p.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/commerce/products/${p.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(p)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete item?"
        description={`"${deleteTarget?.name ?? ""}" will be permanently removed from the store catalog.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
