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
import {
  deleteFreeDietPlan,
  listFreeDietPlans,
  type FreeDietPlanListRow,
} from "../../api/freeDietPlans";
import { ApiError } from "../../api/client";
import { DIET_TYPES } from "../../mock/nutrition/reference";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";


export function DietListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [dietType, setDietType] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FreeDietPlanListRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  // Server-side paging, filtering and search: the backend caps pageSize, so the
  // browser never receives the whole collection.
  const params = useMemo(
    () => ({ search: query || undefined, dietType: dietType || undefined, page, pageSize }),
    [query, dietType, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listFreeDietPlans, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFreeDietPlan(deleteTarget.id);
      show("Free diet plan deleted", "info");
      setDeleteTarget(null);
      retry();
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.isForbidden
          ? "Your account is not allowed to delete diet plans"
          : "Could not delete the diet plan. Please try again.";
      show(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<FreeDietPlanListRow>[] = [
    { key: "dietType", header: "Diet Type", render: (d) => <StatusBadge label={d.dietType} tone="orange" /> },
    { key: "rangeFrom", header: "Range From", render: (d) => `${d.rangeFrom} kcal` },
    { key: "rangeTo", header: "Range To", render: (d) => `${d.rangeTo} kcal` },
    {
      key: "foodCount",
      header: "Food Items",
      // Counted by the backend: the list response never carries the food rows.
      render: (d) => `${d.foodCount} food row${d.foodCount === 1 ? "" : "s"}`,
    },
    { key: "updatedAt", header: "Last Updated", render: (d) => formatDate(d.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Free Diet Plans"
        breadcrumb={[{ label: "Nutrition" }, { label: "Free Diet Plans" }]}
        description="Diet plans given to users when they complete their profile."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/freediets/new")}>
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
          rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(d) => d.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(d) => navigate(`/nutrition/freediets/${d.id}`)}
        emptyTitle="No free diet plans yet"
        emptyDescription="Create your first free diet plan so users get one when they complete their profile."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/nutrition/freediets/new")}>
            Add Plan
          </Button>
        }
        rowActions={(d) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/nutrition/freediets/${d.id}/edit`)} />
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
        description={`This ${deleteTarget?.dietType ?? ""} plan (${deleteTarget?.rangeFrom ?? ""}–${deleteTarget?.rangeTo ?? ""} kcal) will be removed from the list. It is archived rather than destroyed, so plans already given to members keep their history.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
