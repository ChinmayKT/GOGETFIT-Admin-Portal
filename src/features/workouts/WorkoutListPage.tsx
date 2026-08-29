import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Dumbbell } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { listWorkouts } from "../../mock/workouts/repository";
import { WORKOUT_TYPES, WORKOUT_EQUIPMENT, WORKOUT_LEVELS } from "../../mock/workouts/reference";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Workout } from "../../types/workout";

export function WorkoutListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, type: type || undefined, equipment: equipment || undefined, level: level ? Number(level) : undefined, page, pageSize }),
    [query, type, equipment, level, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listWorkouts, params);

  const columns: Column<Workout>[] = [
    {
      key: "name",
      header: "WorkOut Name",
      render: (w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 8, background: "var(--glass-fill-bright)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Dumbbell size={16} color="var(--text-muted)" />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{w.name}</div>
            <div className="text-caption">Level {w.level}</div>
          </div>
        </div>
      ),
    },
    { key: "type", header: "WorkOut Type", render: (w) => <StatusBadge label={w.type} tone={w.type === "Gym" ? "info" : w.type === "Home" ? "success" : "neutral"} /> },
    { key: "equipment", header: "Equipment" },
    {
      key: "primaryMuscle",
      header: "Primary Muscle",
      render: (w) => (
        <span>
          {w.primaryMuscle}
          {w.secondaryMuscle && <span className="text-caption"> + {w.secondaryMuscle}</span>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Workouts"
        breadcrumb={[{ label: "Fitness" }, { label: "Workouts" }]}
        description="The exercise library used to build workout plans, with video demos and thumbnails."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/fitness/workouts/new")}>
            Add WorkOut
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, muscle..." />
        <Select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          placeholder="WorkOut Type"
          options={[{ label: "All types", value: "" }, ...WORKOUT_TYPES.map((t) => ({ label: t, value: t }))]}
        />
        <Select
          value={equipment}
          onChange={(e) => { setEquipment(e.target.value); setPage(1); }}
          placeholder="Equipment"
          options={[{ label: "All equipment", value: "" }, ...WORKOUT_EQUIPMENT.map((eq) => ({ label: eq, value: eq }))]}
        />
        <Select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          placeholder="Level"
          options={[{ label: "All levels", value: "" }, ...WORKOUT_LEVELS.map((l) => ({ label: `Level ${l}`, value: String(l) }))]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(w) => w.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(w) => navigate(`/fitness/workouts/${w.id}/edit`)}
        emptyTitle="No workouts yet"
        emptyDescription="Add your first workout to start building the exercise library."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/fitness/workouts/new")}>
            Add WorkOut
          </Button>
        }
        rowActions={(w) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/fitness/workouts/${w.id}/edit`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/fitness/workouts/${w.id}/edit`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
