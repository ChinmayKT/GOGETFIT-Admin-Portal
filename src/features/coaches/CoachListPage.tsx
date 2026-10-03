import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { listCoaches } from "../../api/coaches";
import { resolveMediaUrl } from "../../api/media";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import {
  COACH_PROFILE_LEVELS,
  type CoachProfileLevel,
  type CoachProfileStatus,
  type CoachRecord,
} from "../../types/coach";
import { formatPhone } from "./CoachUserCard";

const PAGE_SIZE = 25;

const STATUS_TONE: Record<CoachProfileStatus, StatusTone> = { active: "success", inactive: "neutral" };
const STATUS_LABEL: Record<CoachProfileStatus, string> = { active: "Active", inactive: "Inactive" };

export function CoachListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Server-side search, filtering and pagination.
  const params = useMemo(
    () => ({
      search: query || undefined,
      level: (level || undefined) as CoachProfileLevel | undefined,
      status: (status || undefined) as CoachProfileStatus | undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, level, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listCoaches, params);

  const columns: Column<CoachRecord>[] = [
    {
      key: "name",
      header: "Coach",
      render: (c) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={c.user?.name ?? c.user?.phone ?? "?"} src={resolveMediaUrl(c.profile.profilePicture?.url) ?? undefined} size="sm" />
          <div>
            <div style={{ fontWeight: 600 }}>{c.user?.name ?? "—"}</div>
            <div className="text-caption">{formatPhone(c.user?.phone ?? null)}</div>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (c) => c.user?.email ?? "—" },
    { key: "level", header: "Level", render: (c) => c.profile.level },
    { key: "specialization", header: "Specialization", render: (c) => c.profile.specialization ?? "—" },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} /> },
    { key: "createdAt", header: "Created", render: (c) => (c.createdAt ? formatDate(c.createdAt) : "—") },
  ];

  return (
    <>
      <PageHeader
        title="Coaches"
        breadcrumb={[{ label: "People" }, { label: "Coaches" }]}
        description="Users who hold a coach profile."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/coaches/new")}>
            Add Coach
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by name, phone, email, specialization..."
        />
        <Select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          placeholder="Level"
          options={[{ label: "All levels", value: "" }, ...COACH_PROFILE_LEVELS.map((l) => ({ label: l, value: l }))]}
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * PAGE_SIZE}
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(c) => navigate(`/coaches/${c.id}`)}
        emptyTitle="No coaches found"
        emptyDescription="Add a coach from an existing user, or adjust your search and filters."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/coaches/new")}>
            Add Coach
          </Button>
        }
        rowActions={(c) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/coaches/${c.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/coaches/${c.id}/edit`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
