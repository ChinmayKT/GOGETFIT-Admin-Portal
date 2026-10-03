import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Archive, RotateCcw, Dumbbell, Film, PlayCircle as Youtube } from "lucide-react";
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
import { archiveWorkout, listWorkouts, restoreWorkout } from "../../api/workouts";
import { resolveMediaUrl } from "../../api/media";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatDate } from "../../utils/format";
import {
  EQUIPMENT_LABELS,
  WORKOUT_EQUIPMENT,
  WORKOUT_LEVELS,
  WORKOUT_TYPES,
  type WorkoutEquipment,
  type WorkoutRow,
  type WorkoutStatus,
} from "../../types/workout";

/**
 * Workouts - the real /api/admin/workouts collection, including the 188
 * migrated from the legacy system.
 *
 * Everything is done by the server: one page at a time, with search, filters
 * and sorting as query parameters. The legacy screen sent all 188 rows to the
 * browser and paged them there.
 */

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name:asc" },
  { label: "Name (Z-A)", value: "name:desc" },
  { label: "Newest first", value: "createdAt:desc" },
  { label: "Oldest first", value: "createdAt:asc" },
  { label: "Level (low to high)", value: "level:asc" },
  { label: "Level (high to low)", value: "level:desc" },
];

const equipmentLabel = (value: string) => EQUIPMENT_LABELS[value as WorkoutEquipment] ?? value;

export function WorkoutListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<WorkoutStatus>("active");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [archiveTarget, setArchiveTarget] = useState<WorkoutRow | null>(null);
  const [busy, setBusy] = useState(false);
  const pageSize = 10;

  const search = useDebouncedValue(query);

  const params = useMemo(() => {
    const [sortKey, sortDir] = sort.split(":") as [string, "asc" | "desc"];
    return {
      search: search || undefined,
      type: type || undefined,
      equipment: equipment || undefined,
      level: level ? Number(level) : undefined,
      status,
      sortKey,
      sortDir,
      page,
      pageSize,
    };
  }, [search, type, equipment, level, status, sort, page]);

  const { rows, total, loading, error, retry } = usePagedQuery(listWorkouts, params);

  const resetPage = () => setPage(1);

  async function handleArchive() {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      await archiveWorkout(archiveTarget.id);
      show(`"${archiveTarget.name}" archived`, "info");
      setArchiveTarget(null);
      retry();
    } catch {
      show("Could not archive this workout. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(workout: WorkoutRow) {
    try {
      await restoreWorkout(workout.id);
      show(`"${workout.name}" restored`);
      retry();
    } catch {
      show("Could not restore this workout. Please try again.", "error");
    }
  }

  const columns: Column<WorkoutRow>[] = [
    {
      key: "thumbnail",
      header: "Preview",
      // Its own column at 16:9: these are video posters (the stored files are
      // 300x168), so a small square tile cropped nearly half of every frame and
      // left the image unreadable.
      render: (w) => {
        const thumbnail = resolveMediaUrl(w.thumbnail?.url);
        return (
          <div
            style={{
              width: 112, height: 63, borderRadius: 8, background: "var(--glass-fill-bright)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              flexShrink: 0, border: "1px solid var(--glass-border)", position: "relative",
            }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`${w.name} thumbnail`}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              // No thumbnail stored: the placeholder, never an invented image.
              <Dumbbell size={18} color="var(--text-muted)" aria-label="No thumbnail" />
            )}
            {w.hasVideo && (
              <span
                aria-label="Has video"
                style={{
                  position: "absolute", right: 4, bottom: 4, display: "flex", alignItems: "center",
                  gap: 3, padding: "1px 5px", borderRadius: 4, fontSize: 10,
                  background: "rgba(0,0,0,.6)", color: "#fff",
                }}
              >
                <Film size={10} /> MP4
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      header: "WorkOut Name",
      render: (w) => (
        <div>
          <div style={{ fontWeight: 600 }}>{w.name}</div>
          <div className="text-caption" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Level {w.level}</span>
            {w.youtubeUrl && (
              // Opens the clip directly. stopPropagation keeps the row click
              // (which navigates to Edit) from swallowing it.
              <a
                href={w.youtubeUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Watch ${w.name} on YouTube`}
                title={w.youtubeUrl}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)" }}
              >
                <Youtube size={12} /> YouTube
              </a>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (w) => (
        <StatusBadge label={w.type} tone={w.type === "Gym" ? "info" : w.type === "Home" ? "success" : "neutral"} />
      ),
    },
    { key: "equipment", header: "Equipment", render: (w) => equipmentLabel(w.equipment) },
    {
      key: "primaryMuscle",
      header: "Primary Muscle",
      render: (w) => (
        <div>
          <div>{w.primaryMuscle}</div>
          {w.secondaryMuscle && <div className="text-caption">+ {w.secondaryMuscle}</div>}
        </div>
      ),
    },
    {
      key: "updatedBy",
      header: "Last updated",
      render: (w) => (
        <div>
          <div>{w.updatedAt ? formatDate(w.updatedAt) : "—"}</div>
          <div className="text-caption">{w.updatedBy?.name ?? w.updatedBy?.email ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (w) => (
        <StatusBadge label={w.status === "active" ? "Active" : "Archived"} tone={w.status === "active" ? "success" : "neutral"} />
      ),
    },
  ];

  const filtered = Boolean(search || type || equipment || level);

  return (
    <>
      <PageHeader
        title="Workouts"
        breadcrumb={[{ label: "Fitness" }, { label: "Workouts" }]}
        description="Exercise library used to build workout plans."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/fitness/workouts/new")}>
            Add Workout
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); resetPage(); }}
          placeholder="Search by workout name, muscle..."
        />
        <Select
          value={type}
          aria-label="WorkOut Type"
          onChange={(e) => { setType(e.target.value); resetPage(); }}
          placeholder="WorkOut Type"
          options={[{ label: "All types", value: "" }, ...WORKOUT_TYPES.map((t) => ({ label: t, value: t }))]}
        />
        <Select
          value={equipment}
          aria-label="Equipment"
          onChange={(e) => { setEquipment(e.target.value); resetPage(); }}
          placeholder="Equipment"
          options={[
            { label: "All equipment", value: "" },
            ...WORKOUT_EQUIPMENT.map((eq) => ({ label: EQUIPMENT_LABELS[eq], value: eq })),
          ]}
        />
        <Select
          value={level}
          aria-label="Level"
          onChange={(e) => { setLevel(e.target.value); resetPage(); }}
          placeholder="Level"
          options={[
            { label: "All levels", value: "" },
            ...WORKOUT_LEVELS.map((l) => ({ label: `Level ${l}`, value: String(l) })),
          ]}
        />
        <Select
          value={status}
          aria-label="Status"
          onChange={(e) => { setStatus(e.target.value as WorkoutStatus); resetPage(); }}
          options={[
            { label: "Active workouts", value: "active" },
            { label: "Archived workouts", value: "archived" },
          ]}
        />
        <Select
          value={sort}
          aria-label="Sort"
          onChange={(e) => { setSort(e.target.value); resetPage(); }}
          options={SORT_OPTIONS}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(w) => w.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(w) => navigate(`/fitness/workouts/${w.id}/edit`)}
        emptyTitle={filtered ? "No workouts match these filters" : status === "archived" ? "No archived workouts" : "No workouts yet"}
        emptyDescription={
          filtered
            ? "Try a different search term or clear the filters."
            : status === "archived"
              ? "Archived workouts appear here and can be restored."
              : "Add your first workout to start building plans."
        }
        emptyAction={
          filtered || status === "archived" ? undefined : (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/fitness/workouts/new")}>
              Add Workout
            </Button>
          )
        }
        rowActions={(w) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/fitness/workouts/${w.id}/edit`)} />
            {w.status === "active" ? (
              <IconButton icon={<Archive size={15} />} label="Archive" size="sm" variant="danger" onClick={() => setArchiveTarget(w)} />
            ) : (
              <IconButton icon={<RotateCcw size={15} />} label="Restore" size="sm" onClick={() => handleRestore(w)} />
            )}
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive workout?"
        description={`"${archiveTarget?.name ?? ""}" will be hidden from the workout library. Nothing is deleted, and workout plans that already use it keep working.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
        loading={busy}
      />
    </>
  );
}
