import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Star } from "lucide-react";
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
import { listChallenges, deleteChallenge } from "../../mock/challenges/repository";
import { deriveChallengeStatus, CHALLENGE_STATUS_TONE } from "../../mock/challenges/status";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import type { Challenge, ChallengeStatus } from "../../types/challenge";

const STATUSES: ChallengeStatus[] = ["Draft", "Upcoming", "Active", "Completed", "Archived"];

export function ChallengeListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listChallenges, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteChallenge(deleteTarget.id);
      show("Challenge deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Challenge>[] = [
    {
      key: "name",
      header: "Challenge Name",
      render: (c) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            {c.priority && <Star size={13} color="var(--color-warning)" fill="var(--color-warning)" />}
            {c.name}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (c) => (
        <span className="text-caption" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 280 }}>
          {c.description}
        </span>
      ),
    },
    { key: "startDate", header: "Start Date", render: (c) => formatDate(c.startDate) },
    { key: "endDate", header: "End Date", render: (c) => formatDate(c.endDate) },
    { key: "enrollmentLastDate", header: "Enrollment Last Date", render: (c) => formatDate(c.enrollmentLastDate) },
    { key: "priority", header: "Priority", render: (c) => <StatusBadge label={c.priority ? "Priority" : "Normal"} tone={c.priority ? "warning" : "neutral"} /> },
    {
      key: "status",
      header: "Status",
      render: (c) => {
        const derived = deriveChallengeStatus(c);
        return <StatusBadge label={derived} tone={CHALLENGE_STATUS_TONE[derived]} />;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Challenges"
        breadcrumb={[{ label: "Challenges" }]}
        description="Fitness challenges members can enroll in — track enrollment and review submissions."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/challenges/new")}>
            Add Challenge
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by challenge name..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[{ label: "All statuses", value: "" }, ...STATUSES.map((s) => ({ label: s, value: s }))]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(c) => navigate(`/challenges/${c.id}`)}
        emptyTitle="No challenges yet"
        emptyDescription="Add your first challenge to start enrolling members."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/challenges/new")}>
            Add Challenge
          </Button>
        }
        rowActions={(c) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View Participants" size="sm" onClick={() => navigate(`/challenges/${c.id}/participants`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/challenges/${c.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(c)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete challenge?"
        description={`"${deleteTarget?.name ?? ""}" and all of its participant records will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
