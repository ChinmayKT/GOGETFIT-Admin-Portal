import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Download, Utensils } from "lucide-react";
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
import { listFoods, deleteFood } from "../../mock/nutrition/foodRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Food } from "../../types/nutrition";

export function FoodListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [foodType, setFoodType] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, foodType: foodType || undefined, page, pageSize }), [query, foodType, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listFoods, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFood(deleteTarget.id);
      show("Food item deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Food>[] = [
    {
      key: "foodName",
      header: "Food",
      render: (f) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 8, background: "var(--glass-fill-bright)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
            }}
          >
            {f.image ? (
              <img src={f.image} alt={f.foodName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Utensils size={16} color="var(--text-muted)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{f.foodName}</div>
            <div className="text-caption">{f.brandName}</div>
          </div>
        </div>
      ),
    },
    { key: "foodType", header: "Type", render: (f) => <StatusBadge label={f.foodType} tone={f.foodType === "Vegetarian" ? "success" : "warning"} /> },
    { key: "unit", header: "Unit" },
    { key: "qty", header: "Qty" },
    { key: "calories", header: "Calories", render: (f) => f.calories.toFixed(0) },
    { key: "fat", header: "Fat (g)", render: (f) => f.fat.toFixed(1) },
    { key: "carbs", header: "Carbs (g)", render: (f) => f.carbs.toFixed(1) },
    { key: "protein", header: "Protein (g)", render: (f) => f.protein.toFixed(1) },
  ];

  return (
    <>
      <PageHeader
        title="Food Database"
        breadcrumb={[{ label: "Nutrition" }, { label: "Food Database" }]}
        description="Master list of foods with nutrition values used across diet plans."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" icon={<Download size={15} />} onClick={() => show("Export started — check your downloads shortly", "info")}>
              Download XLSX
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/foods/new")}>
              Add Food
            </Button>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by food name, brand..." />
        <Select
          value={foodType}
          onChange={(e) => { setFoodType(e.target.value); setPage(1); }}
          placeholder="Food Type"
          options={[
            { label: "All types", value: "" },
            { label: "Vegetarian", value: "Vegetarian" },
            { label: "Non-Vegetarian", value: "Non-Vegetarian" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(f) => f.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(f) => navigate(`/nutrition/foods/${f.id}/edit`)}
        emptyTitle="No foods yet"
        emptyDescription="Add your first food item to start building diet plans."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/foods/new")}>
            Add Food
          </Button>
        }
        rowActions={(f) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/nutrition/foods/${f.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(f)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete food item?"
        description={`"${deleteTarget?.foodName ?? ""}" will be permanently removed from the food database.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
