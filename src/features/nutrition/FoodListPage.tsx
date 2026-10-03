import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Archive, Utensils } from "lucide-react";
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
import { archiveFood, listFoods } from "../../api/foods";
import { resolveMediaUrl } from "../../api/media";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { FOOD_TYPES, FOOD_UNITS, type FoodRow } from "../../types/food";

/**
 * Food Database - the real /api/admin/foods collection, including the 960 foods
 * migrated from the legacy system.
 *
 * Everything is done by the server: one page of rows is fetched at a time, and
 * search, filters and sorting are query parameters, never array operations on
 * the rows already in the browser.
 */

/** Sort choices, mapped onto the backend's allow-listed keys. */
const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name:asc" },
  { label: "Name (Z-A)", value: "name:desc" },
  { label: "Newest first", value: "createdAt:desc" },
  { label: "Oldest first", value: "createdAt:asc" },
  { label: "Calories (high to low)", value: "calories:desc" },
  { label: "Calories (low to high)", value: "calories:asc" },
];

const number = (value: number | null, digits = 0) => (value === null ? "—" : value.toFixed(digits));

export function FoodListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [foodType, setFoodType] = useState("");
  const [unit, setUnit] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<FoodRow | null>(null);
  const [archiving, setArchiving] = useState(false);
  const pageSize = 10;

  // One request per settled search term rather than one per keystroke.
  const search = useDebouncedValue(query);

  const params = useMemo(() => {
    const [sortKey, sortDir] = sort.split(":") as [string, "asc" | "desc"];
    return {
      search: search || undefined,
      foodType: foodType || undefined,
      unit: unit || undefined,
      sortKey,
      sortDir,
      page,
      pageSize,
    };
  }, [search, foodType, unit, sort, page]);

  const { rows, total, loading, error, retry } = usePagedQuery(listFoods, params);

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveFood(archiveTarget.id);
      show(`"${archiveTarget.name}" archived`, "info");
      setArchiveTarget(null);
      retry();
    } catch {
      show("Could not archive this food. Please try again.", "error");
    } finally {
      setArchiving(false);
    }
  }

  const columns: Column<FoodRow>[] = [
    {
      key: "name",
      header: "Food",
      render: (f) => {
        const image = resolveMediaUrl(f.image?.url);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 8, background: "var(--glass-fill-bright)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
              }}
            >
              {image ? (
                <img src={image} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                // No picture: the placeholder, never an invented image.
                <Utensils size={16} color="var(--text-muted)" aria-label="No image" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{f.name}</div>
              <div className="text-caption">{f.brand ?? "—"}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "foodType",
      header: "Type",
      render: (f) => <StatusBadge label={f.foodType} tone={f.foodType === "Vegetarian" ? "success" : "warning"} />,
    },
    { key: "serving", header: "Portion", render: (f) => `${f.serving.quantity} ${f.serving.unit}` },
    { key: "calories", header: "Calories", render: (f) => number(f.nutrition.calories) },
    { key: "protein", header: "Protein (g)", render: (f) => number(f.nutrition.protein, 1) },
    { key: "carbs", header: "Carbs (g)", render: (f) => number(f.nutrition.carbs, 1) },
    { key: "fat", header: "Fat (g)", render: (f) => number(f.nutrition.fat, 1) },
  ];

  const filtered = Boolean(search || foodType || unit);

  return (
    <>
      <PageHeader
        title="Food Database"
        breadcrumb={[{ label: "Nutrition" }, { label: "Food Database" }]}
        description="Master list of foods with nutrition values used across diet plans."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/foods/new")}>
            Add Food
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by food name, brand..."
        />
        <Select
          value={foodType}
          aria-label="Food Type"
          onChange={(e) => { setFoodType(e.target.value); setPage(1); }}
          placeholder="Food Type"
          options={[{ label: "All types", value: "" }, ...FOOD_TYPES.map((t) => ({ label: t, value: t }))]}
        />
        <Select
          value={unit}
          aria-label="Unit"
          onChange={(e) => { setUnit(e.target.value); setPage(1); }}
          placeholder="Unit"
          options={[{ label: "All units", value: "" }, ...FOOD_UNITS.map((u) => ({ label: u, value: u }))]}
        />
        <Select
          value={sort}
          aria-label="Sort"
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(f) => f.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(f) => navigate(`/nutrition/foods/${f.id}/edit`)}
        emptyTitle={filtered ? "No foods match these filters" : "No foods yet"}
        emptyDescription={
          filtered
            ? "Try a different search term or clear the filters."
            : "Add your first food item to start building diet plans."
        }
        emptyAction={
          filtered ? undefined : (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/foods/new")}>
              Add Food
            </Button>
          )
        }
        rowActions={(f) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/nutrition/foods/${f.id}/edit`)} />
            <IconButton icon={<Archive size={15} />} label="Archive" size="sm" variant="danger" onClick={() => setArchiveTarget(f)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive food item?"
        description={`"${archiveTarget?.name ?? ""}" will be hidden from the food database. Nothing is deleted, and diet plans that already use it keep working.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
        loading={archiving}
      />
    </>
  );
}
