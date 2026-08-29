import { useMemo, useState } from "react";
import { CalendarX } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listScheduledCampaigns, cancelScheduledCampaign } from "../../mock/notifications/repository";
import { formatDateTime } from "../../utils/format";
import type { NotificationCampaign } from "../../types/notifications";

const STATUS_TONE: Record<string, StatusTone> = { Scheduled: "info", Paused: "warning" };

export function NotificationScheduledTab({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [cancelTarget, setCancelTarget] = useState<NotificationCampaign | null>(null);
  const [working, setWorking] = useState(false);

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listScheduledCampaigns, params);

  async function handleCancel() {
    if (!cancelTarget) return;
    setWorking(true);
    try {
      await cancelScheduledCampaign(cancelTarget.id);
      show(`"${cancelTarget.title}" cancelled`, "info");
      setCancelTarget(null);
      retry();
      onChanged();
    } finally {
      setWorking(false);
    }
  }

  const columns: Column<NotificationCampaign>[] = [
    { key: "title", header: "Title" },
    { key: "audienceLabel", header: "Audience" },
    { key: "scheduledAt", header: "Scheduled Date/Time", render: (c) => (c.scheduledAt ? formatDateTime(c.scheduledAt) : "—") },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={c.status} tone={STATUS_TONE[c.status] ?? "neutral"} /> },
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
        emptyTitle="No scheduled campaigns"
        emptyDescription="Campaigns queued to send at a future date will appear here."
        rowActions={(c) => (
          c.status === "Scheduled" ? (
            <IconButton icon={<CalendarX size={15} />} label="Cancel" size="sm" variant="danger" onClick={() => setCancelTarget(c)} />
          ) : null
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel scheduled campaign?"
        description={`"${cancelTarget?.title ?? ""}" will not be sent as scheduled. It will be marked as paused.`}
        confirmLabel="Cancel Campaign"
        tone="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={working}
      />
    </>
  );
}
