import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listTransactions, deleteTransaction } from "../../mock/rewards/repository";
import { formatDate } from "../../utils/format";
import type { RewardTransaction } from "../../types/rewards";

interface Props {
  refreshKey: number;
}

export function TransactionsTab({ refreshKey }: Props) {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteTarget, setDeleteTarget] = useState<RewardTransaction | null>(null);
  const [working, setWorking] = useState(false);

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listTransactions, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      await deleteTransaction(deleteTarget.id);
      show(`Transaction for ${deleteTarget.userName} deleted`, "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setWorking(false);
    }
  }

  const columns: Column<RewardTransaction>[] = [
    { key: "userName", header: "Name" },
    {
      key: "points",
      header: "Points",
      render: (t) => (
        <span style={{ color: t.points >= 0 ? "var(--color-success)" : "var(--color-error)", fontWeight: 600 }}>
          {t.points >= 0 ? "+" : ""}{t.points}
        </span>
      ),
    },
    { key: "ggfId", header: "User ID" },
    { key: "description", header: "Description" },
    { key: "date", header: "Date", render: (t) => formatDate(t.date) },
    { key: "issuedBy", header: "Issued By" },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, user ID, description..." />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(t) => t.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No transactions yet"
        emptyDescription="Reward points issued to users will show up here."
        rowActions={(t) => (
          <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(t)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this transaction?"
        description={`This removes ${deleteTarget?.points ?? 0} point(s) issued to ${deleteTarget?.userName ?? ""} from the record. This also updates their leaderboard total.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={working}
      />
    </>
  );
}
