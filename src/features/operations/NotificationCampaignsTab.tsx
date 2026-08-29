import { useMemo, useState } from "react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listCampaigns } from "../../mock/notifications/repository";
import { formatDate } from "../../utils/format";
import type { NotificationCampaign } from "../../types/notifications";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Completed: "neutral" };

export function NotificationCampaignsTab({ refreshKey }: { refreshKey: number }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listCampaigns, params);

  const columns: Column<NotificationCampaign>[] = [
    { key: "title", header: "Title" },
    { key: "audienceLabel", header: "Audience" },
    { key: "sentCount", header: "Sent Count", align: "right" },
    { key: "openRate", header: "Open Rate", align: "right", render: (c) => `${c.openRate}%` },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={c.status} tone={STATUS_TONE[c.status] ?? "neutral"} /> },
    { key: "createdAt", header: "Created Date", render: (c) => formatDate(c.createdAt) },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by title or audience..." />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No campaigns yet"
        emptyDescription="Active and completed notification campaigns will appear here."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
