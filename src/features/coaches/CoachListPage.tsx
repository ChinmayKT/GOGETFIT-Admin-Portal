import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, FileBadge } from "lucide-react";
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
import { listCoaches } from "../../mock/coaches/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Coach } from "../../types/coach";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", "Pending Approval": "warning", Inactive: "neutral" };

export function CoachListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, level: level ? Number(level) : undefined, status: status || undefined, page, pageSize }),
    [query, level, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listCoaches, params);

  const columns: Column<Coach>[] = [
    {
      key: "name",
      header: "Coach",
      render: (c) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={`${c.firstName} ${c.lastName}`} src={c.profilePicture ?? undefined} size="sm" />
          <div>
            <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
            <div className="text-caption">{c.city}, {c.state}</div>
          </div>
        </div>
      ),
    },
    { key: "level", header: "Level", render: (c) => `Level ${c.level}` },
    { key: "specialization", header: "Specialization" },
    { key: "transformationsCount", header: "Transformations" },
    { key: "activeClients", header: "Active Clients" },
    { key: "availableSlots", header: "Available Slots" },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={c.status} tone={STATUS_TONE[c.status]} /> },
  ];

  return (
    <>
      <PageHeader
        title="Coaches"
        breadcrumb={[{ label: "People" }, { label: "Coaches" }]}
        description="The full coaching roster, capacity and profiles."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/coaches/new")}>
            Add Coach
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, city, specialization..." />
        <Select
          value={level}
          onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          placeholder="Level"
          options={[
            { label: "All levels", value: "" },
            ...[1, 2, 3, 4, 5].map((l) => ({ label: `Level ${l}`, value: String(l) })),
          ]}
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Pending Approval", value: "Pending Approval" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(c) => navigate(`/coaches/${c.id}`)}
        emptyTitle="No coaches yet"
        emptyDescription="Add your first coach to start managing the coaching team."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/coaches/new")}>
            Add Coach
          </Button>
        }
        rowActions={(c) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/coaches/${c.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/coaches/${c.id}/edit`)} />
            <IconButton icon={<FileBadge size={15} />} label="Certificates" size="sm" onClick={() => navigate(`/coaches/${c.id}/certificates`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
