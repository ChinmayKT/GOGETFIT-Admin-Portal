import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listLeaderboard, listUserTransactions } from "../../mock/rewards/repository";
import { formatDate } from "../../utils/format";
import type { LeaderboardEntry, RewardTransaction } from "../../types/rewards";

interface Props {
  refreshKey: number;
}

export function LeaderboardTab({ refreshKey }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [breakupTarget, setBreakupTarget] = useState<LeaderboardEntry | null>(null);
  const [breakupRows, setBreakupRows] = useState<RewardTransaction[]>([]);
  const [breakupLoading, setBreakupLoading] = useState(false);

  const params = useMemo(() => ({ query, page, pageSize, refreshKey }), [query, page, pageSize, refreshKey]);
  const { rows, total, loading, error, retry } = usePagedQuery(listLeaderboard, params);

  async function openBreakup(entry: LeaderboardEntry) {
    setBreakupTarget(entry);
    setBreakupLoading(true);
    try {
      const txs = await listUserTransactions(entry.userId);
      setBreakupRows(txs);
    } finally {
      setBreakupLoading(false);
    }
  }

  const columns: Column<LeaderboardEntry>[] = [
    { key: "rank", header: "Rank", width: "72px", render: (e) => `#${e.rank}` },
    { key: "name", header: "Name" },
    { key: "totalPoints", header: "Total Points", render: (e) => e.totalPoints.toLocaleString("en-IN") },
    { key: "ggfId", header: "User ID" },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or user ID..." />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(e) => e.userId}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No reward activity yet"
        emptyDescription="Points will appear here once rewards are issued to users."
        rowActions={(e) => (
          <IconButton icon={<Eye size={15} />} label="View Breakup" size="sm" onClick={() => openBreakup(e)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <GlassDrawer
        open={!!breakupTarget}
        onClose={() => setBreakupTarget(null)}
        title={breakupTarget ? `${breakupTarget.name} — Points Breakup` : "Points Breakup"}
      >
        {breakupTarget && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="text-caption">User ID</div>
                <div className="text-primary">{breakupTarget.ggfId}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="text-caption">Total Points</div>
                <div className="text-primary" style={{ fontWeight: 700, fontSize: "var(--fs-title)" }}>
                  {breakupTarget.totalPoints.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {breakupLoading ? (
              <p className="text-secondary">Loading history...</p>
            ) : breakupRows.length === 0 ? (
              <p className="text-secondary">No individual transactions found for this user.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {breakupRows.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      paddingBottom: 12,
                      borderBottom: "1px solid var(--glass-border)",
                    }}
                  >
                    <div>
                      <div className="text-primary" style={{ fontSize: "var(--fs-body)" }}>{t.description}</div>
                      <div className="text-caption">{formatDate(t.date)} · Issued by {t.issuedBy}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: t.points >= 0 ? "var(--color-success)" : "var(--color-error)", whiteSpace: "nowrap" }}>
                      {t.points >= 0 ? "+" : ""}{t.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassDrawer>
    </>
  );
}
