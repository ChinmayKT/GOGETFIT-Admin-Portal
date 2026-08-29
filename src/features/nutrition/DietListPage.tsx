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
import { listDiets, deleteDiet } from "../../mock/nutrition/dietRepository";
import { DIET_TYPES } from "../../mock/nutrition/reference";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import type { DietPlan } from "../../types/nutrition";

export function DietListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [dietType, setDietType] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DietPlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, dietType: dietType || undefined, page, pageSize }), [query, dietType, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listDiets, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiet(deleteTarget.id);
      show("Diet plan deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<DietPlan>[] = [
    { key: "dietType", header: "Diet Type", render: (d) => <StatusBadge label={d.dietType} tone="orange" /> },
    { key: "rangeFrom", header: "Range From", render: (d) => `${d.rangeFrom} kcal` },
    { key: "rangeTo", header: "Range To", render: (d) => `${d.rangeTo} kcal` },
    {
      key: "meals",
      header: "Food Items",
      render: (d) => `${d.meals.reduce((sum, m) => sum + m.rows.length, 0)} across 5 meals`,
    },
    { key: "updatedAt", header: "Last Updated", render: (d) => formatDate(d.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Diet Plans"
        breadcrumb={[{ label: "Nutrition" }, { label: "Diet Plans" }]}
        description="Calorie-range based meal plans assigned across the client base."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/diets/new")}>
            Add Plan
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by diet type, calorie range..." />
        <Select
          value={dietType}
          onChange={(e) => { setDietType(e.target.value); setPage(1); }}
          placeholder="Diet Type"
          options={[{ label: "All diet types", value: "" }, ...DIET_TYPES.map((t) => ({ label: t, value: t }))]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(d) => d.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(d) => navigate(`/nutrition/diets/${d.id}/edit`)}
        emptyTitle="No diet plans yet"
        emptyDescription="Create your first diet plan to start assigning it to clients."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/diets/new")}>
            Add Plan
          </Button>
        }
        rowActions={(d) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/nutrition/diets/${d.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(d)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete diet plan?"
        description={`This ${deleteTarget?.dietType ?? ""} plan (${deleteTarget?.rangeFrom ?? ""}–${deleteTarget?.rangeTo ?? ""} kcal) will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
