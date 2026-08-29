import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listFailedCampaigns, retryFailedCampaign } from "../../mock/notifications/repository";
import { formatDateTime } from "../../utils/format";
import type { NotificationCampaign } from "../../types/notifications";

export function NotificationFailedTab({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [retryTarget, setRetryTarget] = useState<NotificationCampaign | null>(null);
  const [working, setWorking] = useState(false);

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listFailedCampaigns, params);

  async function handleRetry() {
    if (!retryTarget) return;
    setWorking(true);
    try {
      await retryFailedCampaign(retryTarget.id);
      show(`"${retryTarget.title}" resent successfully`, "success");
      setRetryTarget(null);
      retry();
      onChanged();
    } finally {
      setWorking(false);
    }
  }

  const columns: Column<NotificationCampaign>[] = [
    { key: "title", header: "Title" },
    { key: "audienceLabel", header: "Audience" },
    { key: "failureReason", header: "Failure Reason", render: (c) => c.failureReason ?? "—" },
    { key: "createdAt", header: "Failed Date", render: (c) => formatDateTime(c.createdAt) },
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
        emptyTitle="No failed campaigns"
        emptyDescription="Campaigns that failed to send will appear here for retry."
        rowActions={(c) => (
          <IconButton icon={<RotateCcw size={15} />} label="Retry" size="sm" onClick={() => setRetryTarget(c)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!retryTarget}
        title="Retry sending this campaign?"
        description={`"${retryTarget?.title ?? ""}" will be resent to its audience and moved to the Sent tab.`}
        confirmLabel="Retry"
        tone="primary"
        onConfirm={handleRetry}
        onCancel={() => setRetryTarget(null)}
        loading={working}
      />
    </>
  );
}
