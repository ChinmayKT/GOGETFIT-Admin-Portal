import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Archive, Utensils, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
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
import { FoodSortDrawer } from "./FoodSortDrawer";
import { describeRules, toSortParam, type SortMetric, type SortRule } from "./foodSort";

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
  // The applied nutrition rules (null = none), and the drawer that edits a copy.
  // In page state like the other filters: a refresh starts from the default.
  const [sortRules, setSortRules] = useState<SortRule[] | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortSession, setSortSession] = useState(0);
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
      // Nutrition rules order first, on the server across every match; the
      // Sort control above then orders the foods they leave tied.
      sort: sortRules ? toSortParam(sortRules) : undefined,
      page,
      pageSize,
    };
  }, [search, foodType, unit, sort, sortRules, page]);

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

  /**
   * The applied nutrition sort, under its column: priority and direction,
   * e.g. "1 · High to low". Nothing under a nutrient the sort leaves out.
   */
  function ruleUnder(metric: SortMetric) {
    const at = sortRules?.findIndex((r) => r.metric === metric) ?? -1;
    if (!sortRules || at < 0) return undefined;
    const direction = sortRules[at].direction === "desc" ? "High to low" : "Low to high";
    return (
      <span data-testid={`sort-rule-${metric}`} title={`Sort rule ${at + 1} of ${sortRules.length}: ${direction}`}>
        {sortRules.length > 1 ? `${at + 1} · ` : ""}
        {direction}
      </span>
    );
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
    { key: "serving", header: "Portion", render: (f) => `${f.servingQuantity} ${f.servingUnit}` },
    { key: "calories", header: "Calories", subheader: ruleUnder("calories"), render: (f) => number(f.calories) },
    { key: "protein", header: "Protein (g)", subheader: ruleUnder("protein"), render: (f) => number(f.protein, 1) },
    { key: "carbs", header: "Carbs (g)", subheader: ruleUnder("carbs"), render: (f) => number(f.carbs, 1) },
    { key: "fat", header: "Fat (g)", subheader: ruleUnder("fat"), render: (f) => number(f.fat, 1) },
  ];

  const filtered = Boolean(search || foodType || unit);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Name (A-Z)";

  function openSort() {
    setSortSession((n) => n + 1);
    setSortOpen(true);
  }
  const closeSort = useCallback(() => setSortOpen(false), []);
  // Every nutrient on None is the same as Reset: no nutrition sort.
  function applySort(rules: SortRule[]) {
    setSortRules(rules.length > 0 ? rules : null);
    setPage(1);
    setSortOpen(false);
  }
  // Back to the list's own order. Search, filters and the Sort control stay.
  function resetSort() {
    setSortRules(null);
    setPage(1);
    setSortOpen(false);
  }

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
        <Button
          icon={<ArrowUpDown size={15} />}
          iconRight={sortOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          onClick={openSort}
          aria-haspopup="dialog"
          aria-expanded={sortOpen}
          aria-label={sortRules ? `Sort By: ${describeRules(sortRules)}` : "Sort By"}
          title={sortRules ? `Sorted by ${describeRules(sortRules)}` : undefined}
          style={sortRules || sortOpen ? { borderColor: "var(--ggf-orange)", color: "var(--ggf-orange)" } : undefined}
        >
          Sort By
          {sortRules && (
            <span
              aria-hidden
              style={{
                marginLeft: 6, padding: "0 6px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: "var(--ggf-orange)", color: "#000",
              }}
            >
              {sortRules.length}
            </span>
          )}
        </Button>
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

      <FoodSortDrawer
        key={sortSession}
        open={sortOpen}
        applied={sortRules}
        tieBreakLabel={sortLabel}
        onApply={applySort}
        onReset={resetSort}
        onClose={closeSort}
      />

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
