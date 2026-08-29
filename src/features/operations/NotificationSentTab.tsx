import { useMemo, useState } from "react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listSentCampaigns } from "../../mock/notifications/repository";
import { formatDateTime } from "../../utils/format";
import type { NotificationCampaign } from "../../types/notifications";

export function NotificationSentTab({ refreshKey }: { refreshKey: number }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listSentCampaigns, params);

  const columns: Column<NotificationCampaign>[] = [
    { key: "title", header: "Title" },
    { key: "audienceLabel", header: "Audience" },
    { key: "sentAt", header: "Sent Date", render: (c) => (c.sentAt ? formatDateTime(c.sentAt) : "—") },
    { key: "deliveredCount", header: "Delivered", align: "right" },
    { key: "openedCount", header: "Opened", align: "right" },
    {
      key: "failedCount",
      header: "Failed",
      align: "right",
      render: (c) => (
        <span style={{ color: c.failedCount > 0 ? "var(--color-error)" : undefined }}>{c.failedCount}</span>
      ),
    },
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
        emptyTitle="No sent campaigns yet"
        emptyDescription="A historical log of every campaign that has gone out will appear here."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
