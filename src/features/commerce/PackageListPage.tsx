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
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { listPackages, deletePackage } from "../../mock/commerce/packageRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR } from "../../utils/format";
import type { Package } from "../../types/package";

export function PackageListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [planType, setPlanType] = useState("");
  const [planLevel, setPlanLevel] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, planType: planType || undefined, planLevel: planLevel ? Number(planLevel) : undefined, page, pageSize }),
    [query, planType, planLevel, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listPackages, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePackage(deleteTarget.id);
      show("Package deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Package>[] = [
    { key: "planName", header: "Plan Name" },
    { key: "planType", header: "Plan Type", render: (p) => <StatusBadge label={p.planType} tone={p.planType === "Challenge" ? "orange" : "info"} /> },
    { key: "planLevel", header: "Plan Level", render: (p) => `Level ${p.planLevel}` },
    { key: "durationWeeks", header: "Duration", render: (p) => `${p.durationWeeks} weeks` },
    { key: "personsAllowed", header: "Persons Allowed" },
    { key: "basePrice", header: "Base Price", render: (p) => formatCurrencyINR(p.basePrice) },
  ];

  return (
    <>
      <PageHeader
        title="Packages"
        breadcrumb={[{ label: "Commerce" }, { label: "Packages" }]}
        description="Enrollment and challenge plans available for purchase."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/packages/new")}>
            Create Package
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by plan name..." />
        <Select
          value={planType}
          onChange={(e) => { setPlanType(e.target.value); setPage(1); }}
          placeholder="Plan Type"
          options={[
            { label: "All types", value: "" },
            { label: "Enrollment", value: "Enrollment" },
            { label: "Challenge", value: "Challenge" },
          ]}
        />
        <Select
          value={planLevel}
          onChange={(e) => { setPlanLevel(e.target.value); setPage(1); }}
          placeholder="Plan Level"
          options={[
            { label: "All levels", value: "" },
            ...[1, 2, 3, 4, 5].map((l) => ({ label: `Level ${l}`, value: String(l) })),
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
        onRowClick={(p) => navigate(`/commerce/packages/${p.id}/edit`)}
        emptyTitle="No packages yet"
        emptyDescription="Create your first package to start offering it to members."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/commerce/packages/new")}>
            Create Package
          </Button>
        }
        rowActions={(p) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/commerce/packages/${p.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(p)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete package?"
        description={`"${deleteTarget?.planName ?? ""}" will be permanently removed and can no longer be purchased.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
