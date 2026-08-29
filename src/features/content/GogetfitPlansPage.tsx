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
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listGogetfitPlans, deleteGogetfitPlan } from "../../mock/gogetfitPlans/repository";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { GogetfitPlan, PlanTier } from "../../types/gogetfitPlans";

const TIER_TONE: Record<PlanTier, StatusTone> = { Solo: "info", Couples: "orange", Family: "success" };

export function GogetfitPlansPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<GogetfitPlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, tier: tier || undefined, page, pageSize }), [query, tier, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listGogetfitPlans, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGogetfitPlan(deleteTarget.id);
      show("Plan deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<GogetfitPlan>[] = [
    { key: "name", header: "Plan Name" },
    { key: "tier", header: "Tier", render: (p) => <StatusBadge label={p.tier} tone={TIER_TONE[p.tier]} /> },
    { key: "duration", header: "Duration" },
    { key: "people", header: "People" },
    { key: "price", header: "Price", render: (p) => formatCurrencyINR(p.price) },
    { key: "updatedAt", header: "Updated", render: (p) => formatDate(p.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="GOGETFIT Plans"
        breadcrumb={[{ label: "Content" }, { label: "GOGETFIT Plans" }]}
        description="Pricing plans shown on the public GoGetFit website (gogetfitonline.com/plans)."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/gogetfit-plans/new")}>
            Add Plan
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by plan name, tier..." />
        <Select
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(1); }}
          placeholder="Tier"
          options={[
            { label: "All tiers", value: "" },
            { label: "Solo", value: "Solo" },
            { label: "Couples", value: "Couples" },
            { label: "Family", value: "Family" },
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
        onRowClick={(p) => navigate(`/content/gogetfit-plans/${p.id}`)}
        emptyTitle="No plans yet"
        emptyDescription="Add the first pricing plan shown on the public website."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/gogetfit-plans/new")}>
            Add Plan
          </Button>
        }
        rowActions={(p) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/content/gogetfit-plans/${p.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/content/gogetfit-plans/${p.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(p)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan?"
        description={`"${deleteTarget?.name ?? ""}" will be removed from the public website's pricing page. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
