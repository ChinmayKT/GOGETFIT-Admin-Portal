import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { getChallenge, listParticipants } from "../../mock/challenges/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import type { Challenge, ChallengeParticipant } from "../../types/challenge";
import styles from "../users/UserDetailPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = { enrolled: "info", submitted: "warning", reviewed: "success" };
const STATUS_LABEL: Record<string, string> = { enrolled: "Enrolled", submitted: "Submitted", reviewed: "Reviewed" };

export function ParticipantsListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!id) return;
    getChallenge(id).then(setChallenge);
  }, [id]);

  const fetcher = useMemo(() => (params: Parameters<typeof listParticipants>[1]) => listParticipants(id!, params), [id]);
  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(fetcher, params);

  const columns: Column<ChallengeParticipant>[] = [
    { key: "name", header: "Participant Name", render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span> },
    { key: "ggfId", header: "User ID" },
    { key: "gender", header: "Gender" },
    { key: "status", header: "Status", render: (p) => <StatusBadge label={STATUS_LABEL[p.status]} tone={STATUS_TONE[p.status]} /> },
    { key: "joinedDate", header: "Joined Date", render: (p) => formatDate(p.joinedDate) },
  ];

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(`/challenges/${id}`)} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={14} /> Back to {challenge?.name ?? "Challenge"}
      </button>
      <PageHeader
        title="Participants"
        breadcrumb={[{ label: "Challenges", path: "/challenges" }, { label: challenge?.name ?? "Challenge", path: `/challenges/${id}` }, { label: "Participants" }]}
        description="Members enrolled in this challenge and their submission status."
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or User ID..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Enrolled", value: "enrolled" },
            { label: "Submitted", value: "submitted" },
            { label: "Reviewed", value: "reviewed" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(p) => navigate(`/challenges/${id}/participants/${p.userId}`)}
        emptyTitle="No participants yet"
        emptyDescription="No members have enrolled in this challenge yet."
        rowActions={(p) => (
          <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/challenges/${id}/participants/${p.userId}`)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
