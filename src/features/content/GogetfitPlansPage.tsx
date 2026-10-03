import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
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
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { ApiError } from "../../api/client";
import { deleteGogetfitPlan, listGogetfitPlans, restoreGogetfitPlan } from "../../api/gogetfitPlans";
import { formatCurrencyINR } from "../../utils/format";
import { PlanCover } from "./PlanCover";
import { PLAN_LEVELS, PLAN_TYPES, type GogetfitPlanRow, type PlanStatus } from "../../types/gogetfitPlans";

/** The legacy Package List showed 10 per page. */
const PAGE_SIZE = 10;

/**
 * GoGetFit Plans (legacy "Packages"): the paid coaching plans members buy.
 * Same columns and filters as the old Package List - name, type, level,
 * duration, persons, base price - with server-side search and paging.
 */
export function GogetfitPlansPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [planType, setPlanType] = useState("");
  const [coachLevel, setCoachLevel] = useState("");
  const [status, setStatus] = useState<PlanStatus>("active");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<GogetfitPlanRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      search: query || undefined,
      planType: planType || undefined,
      coachLevel: coachLevel || undefined,
      status,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, planType, coachLevel, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listGogetfitPlans, params);

  const filtered = Boolean(query || planType || coachLevel);

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteGogetfitPlan(deleteTarget.id);
      show(`"${deleteTarget.name}" deleted`, "info");
      setDeleteTarget(null);
      retry();
    } catch (cause) {
      show(cause instanceof ApiError ? cause.message : "Could not delete the plan. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(plan: GogetfitPlanRow) {
    setBusyId(plan.id);
    try {
      await restoreGogetfitPlan(plan.id);
      show(`"${plan.name}" restored`);
      retry();
    } catch (cause) {
      show(cause instanceof ApiError ? cause.message : "Could not restore the plan. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<GogetfitPlanRow>[] = [
    { key: "image", header: "Cover", render: (p) => <PlanCover image={p.image} name={p.name} width={180} /> },
    { key: "name", header: "Plan Name", render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
    {
      key: "planType",
      header: "Plan Type",
      render: (p) => <StatusBadge label={p.planType} tone={p.planType === "Challenge" ? "orange" : "info"} dot={false} />,
    },
    { key: "coachLevel", header: "Plan Level", render: (p) => p.coachLevel ?? "—" },
    { key: "durationWeeks", header: "Duration", render: (p) => `${p.durationWeeks} weeks` },
    { key: "personsAllowed", header: "Person(s)", render: (p) => p.personsAllowed },
    { key: "basePrice", header: "Base Price", render: (p) => formatCurrencyINR(p.pricing.basePrice) },
    {
      key: "reward",
      header: "Reward",
      render: (p) => (p.planType === "Challenge" && p.pricing.reward ? formatCurrencyINR(p.pricing.reward) : "—"),
    },
  ];

  const resetPage = () => setPage(1);

  return (
    <>
      <PageHeader
        title="GOGETFIT Plans"
        breadcrumb={[{ label: "Content" }, { label: "GOGETFIT Plans" }]}
        description="The paid coaching plans members buy in the app. Prices are in INR, including taxes."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/gogetfit-plans/new")}>
            Add Plan
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); resetPage(); }} placeholder="Search plans by name..." />
        <Select
          value={planType}
          aria-label="Plan Type"
          onChange={(e) => { setPlanType(e.target.value); resetPage(); }}
          options={[{ label: "All plan types", value: "" }, ...PLAN_TYPES.map((t) => ({ label: t, value: t }))]}
        />
        <Select
          value={coachLevel}
          aria-label="Plan Level"
          onChange={(e) => { setCoachLevel(e.target.value); resetPage(); }}
          options={[{ label: "All plan levels", value: "" }, ...PLAN_LEVELS.map((l) => ({ label: l, value: l }))]}
        />
        <Select
          value={status}
          aria-label="Status"
          onChange={(e) => { setStatus(e.target.value as PlanStatus); resetPage(); }}
          options={[
            { label: "Active plans", value: "active" },
            { label: "Deleted plans", value: "archived" },
          ]}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * PAGE_SIZE}
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(p) => navigate(`/content/gogetfit-plans/${p.id}`)}
        emptyTitle={filtered ? "No plans match your filters" : status === "archived" ? "No deleted plans" : "No plans yet"}
        emptyDescription={
          filtered ? "Try a different name, plan type or plan level." : status === "archived" ? "Deleted plans appear here and can be restored." : "Add the first plan members can buy."
        }
        emptyAction={
          !filtered && status === "active" ? (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/gogetfit-plans/new")}>
              Add Plan
            </Button>
          ) : undefined
        }
        rowActions={(p) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/content/gogetfit-plans/${p.id}`)} />
            {p.status === "active" ? (
              <>
                <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/content/gogetfit-plans/${p.id}/edit`)} />
                <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" disabled={busyId === p.id} onClick={() => setDeleteTarget(p)} />
              </>
            ) : (
              <IconButton icon={<RotateCcw size={15} />} label="Restore" size="sm" disabled={busyId === p.id} onClick={() => handleRestore(p)} />
            )}
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete plan?"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? It will no longer be offered to members. Past purchases keep their plan, and you can restore it from Deleted plans.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={busyId !== null && busyId === deleteTarget?.id}
      />
    </>
  );
}
