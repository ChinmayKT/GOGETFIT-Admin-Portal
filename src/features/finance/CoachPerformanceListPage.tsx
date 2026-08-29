import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { GlassDataSurface } from "../../components/data-display/GlassDataSurface";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { SkeletonTable } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { coachPerformanceOverview } from "../../mock/finance/repository";
import { formatCurrencyINR } from "../../utils/format";
import { cn } from "../../utils/cn";
import type { CoachAcquisition, CoachFinancialPerformance, CoachPerformanceBreakdown, CoachTier } from "../../types/finance";
import styles from "./CoachPerformanceListPage.module.css";

const TIER_TONE: Record<CoachTier, StatusTone> = {
  Excellent: "success",
  Strong: "info",
  Good: "neutral",
  "Needs Attention": "warning",
};

const TABS = [
  { key: "revenue", label: "Coach Revenue Performance" },
  { key: "acquisition", label: "Client Acquisition" },
  { key: "load", label: "Client Load" },
  { key: "top", label: "Top Performing" },
];

type LoadFilter = "all" | "highest" | "lowest" | "utilization" | "available";
const LOAD_FILTERS: { key: LoadFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "highest", label: "Highest Clients" },
  { key: "lowest", label: "Lowest Clients" },
  { key: "utilization", label: "Highest Utilization" },
  { key: "available", label: "Available Capacity" },
];

type TopSort = "overall" | "revenue" | "acquisition" | "retention" | "load";
const TOP_SORT_OPTIONS: { value: TopSort; label: string }[] = [
  { value: "overall", label: "Sort by Overall Score" },
  { value: "revenue", label: "Sort by Revenue" },
  { value: "acquisition", label: "Sort by Acquisition" },
  { value: "retention", label: "Sort by Retention" },
  { value: "load", label: "Sort by Client Load" },
];

interface OverviewData {
  coaches: CoachFinancialPerformance[];
  acquisition: CoachAcquisition[];
}

export function CoachPerformanceListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("revenue");
  const [query, setQuery] = useState("");
  const [loadFilter, setLoadFilter] = useState<LoadFilter>("highest");
  const [topSort, setTopSort] = useState<TopSort>("overall");

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    coachPerformanceOverview()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const q = query.trim().toLowerCase();
  const filterByName = <T extends { coachName: string }>(rows: T[]) => (!q ? rows : rows.filter((r) => r.coachName.toLowerCase().includes(q)));

  const revenueRows = useMemo(() => (data ? filterByName(data.coaches) : []), [data, q]);
  const acquisitionRows = useMemo(() => (data ? filterByName(data.acquisition) : []), [data, q]);

  const loadRows = useMemo(() => {
    if (!data) return [];
    const rows = filterByName(data.coaches);
    const sorted = [...rows];
    switch (loadFilter) {
      case "highest":
        return sorted.sort((a, b) => b.activeClients - a.activeClients);
      case "lowest":
        return sorted.sort((a, b) => a.activeClients - b.activeClients);
      case "utilization":
        return sorted.sort((a, b) => b.utilizationPct - a.utilizationPct);
      case "available":
        return sorted.sort((a, b) => (b.capacity - b.activeClients) - (a.capacity - a.activeClients));
      default:
        return sorted.sort((a, b) => a.rank - b.rank);
    }
  }, [data, q, loadFilter]);

  const topRows = useMemo(() => {
    if (!data) return [];
    const rows = filterByName(data.coaches);
    const scoreFor: Record<TopSort, (c: CoachFinancialPerformance) => number> = {
      overall: (c) => c.performanceScore,
      revenue: (c) => c.performanceBreakdown.revenue,
      acquisition: (c) => c.performanceBreakdown.acquisition,
      retention: (c) => c.performanceBreakdown.retention,
      load: (c) => c.activeClients,
    };
    const fn = scoreFor[topSort];
    return [...rows].sort((a, b) => fn(b) - fn(a));
  }, [data, q, topSort]);

  const acquisitionColumns: Column<CoachAcquisition>[] = [
    {
      key: "coachName",
      header: "Coach",
      render: (a) => (
        <div className={styles.coachCell}>
          <Avatar name={a.coachName} size="sm" />
          <span className={styles.coachName}>{a.coachName}</span>
        </div>
      ),
    },
    { key: "newClientsAcquired", header: "New Clients Acquired", align: "right" },
    { key: "acquisitionRevenue", header: "Acquisition Revenue", align: "right", render: (a) => formatCurrencyINR(a.acquisitionRevenue) },
    { key: "percentOfNewClients", header: "% of New Clients", align: "right", render: (a) => `${a.percentOfNewClients.toFixed(1)}%` },
  ];

  return (
    <>
      <PageHeader
        title="Coach Performance"
        breadcrumb={[{ label: "Finance" }, { label: "Coach Performance" }]}
        description="Which coaches drive the most revenue, clients and retention — at a glance."
      />

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by coach name..." />
      </FilterBar>

      <Panel loading={loading} error={error} onRetry={load}>
        {tab === "revenue" && (
          <RevenueTab rows={revenueRows} onRowClick={(c) => navigate(`/finance/coaches/${c.coachId}`)} />
        )}
        {tab === "acquisition" && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Client Acquisition</span>
              <span className={styles.sectionCaption}>
                Acquisition credits the coach who originally brought a client in — it doesn't mean the client is still assigned to that coach today.
              </span>
            </div>
            <DataTable
              columns={acquisitionColumns}
              rows={acquisitionRows}
              getRowId={(a) => a.coachId}
              emptyTitle="No acquisition data"
              emptyDescription="No coaches have acquired new clients in the current window."
            />
          </>
        )}
        {tab === "load" && (
          <>
            <div className={styles.filterChips}>
              {LOAD_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={cn(styles.chip, loadFilter === f.key && styles.chipActive)}
                  onClick={() => setLoadFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <LoadTab rows={loadRows} onRowClick={(c) => navigate(`/finance/coaches/${c.coachId}`)} />
          </>
        )}
        {tab === "top" && (
          <>
            <div className={styles.topSortRow}>
              <Select
                value={topSort}
                onChange={(e) => setTopSort(e.target.value as TopSort)}
                options={TOP_SORT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
            <TopTab rows={topRows} onRowClick={(c) => navigate(`/finance/coaches/${c.coachId}`)} />
          </>
        )}
      </Panel>
    </>
  );
}

function Panel({ loading, error, onRetry, children }: { loading: boolean; error: boolean; onRetry: () => void; children: ReactNode }) {
  if (loading) {
    return (
      <GlassDataSurface>
        <SkeletonTable />
      </GlassDataSurface>
    );
  }
  if (error) {
    return (
      <GlassDataSurface>
        <ErrorState onRetry={onRetry} />
      </GlassDataSurface>
    );
  }
  return <>{children}</>;
}

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? styles.gold : rank === 2 ? styles.silver : rank === 3 ? styles.bronze : undefined;
  return <span className={cn(styles.rankBadge, cls)}>{rank}</span>;
}

function RevenueTab({ rows, onRowClick }: { rows: CoachFinancialPerformance[]; onRowClick: (c: CoachFinancialPerformance) => void }) {
  if (rows.length === 0) {
    return (
      <GlassDataSurface>
        <EmptyState title="No coaches found" description="Try a different search term." />
      </GlassDataSurface>
    );
  }
  return (
    <GlassDataSurface className={styles.surface}>
      <div className={styles.leaderboard}>
        <div className={cn(styles.headerRow, styles.gridRevenue)}>
          <span>Rank</span>
          <span>Coach</span>
          <span>Active</span>
          <span>New</span>
          <span>Renewals</span>
          <span>Revenue</span>
          <span>Rev / Client</span>
          <span>Retention</span>
          <span>Tier</span>
        </div>
        {rows.map((c) => (
          <div
            key={c.coachId}
            className={cn(
              styles.row,
              styles.gridRevenue,
              c.rank <= 3 && styles.topRow,
              c.rank === 1 && styles.rank1,
              c.rank === 2 && styles.rank2,
              c.rank === 3 && styles.rank3,
            )}
            onClick={() => onRowClick(c)}
          >
            <RankBadge rank={c.rank} />
            <span className={styles.coachCell}>
              <Avatar name={c.coachName} size="sm" />
              <span>
                <div className={styles.coachName}>{c.coachName}</div>
                <div className="text-caption">Level {c.level}</div>
              </span>
            </span>
            <span className={styles.colNum}>{c.activeClients}</span>
            <span className={styles.colNum}>{c.newClients}</span>
            <span className={styles.colNum}>{c.renewals}</span>
            <span className={styles.colNum}>{formatCurrencyINR(c.revenue)}</span>
            <span className={styles.colNum}>{formatCurrencyINR(c.revenuePerClient)}</span>
            <span className={styles.colNum}>{c.retentionPct.toFixed(1)}%</span>
            <span>
              <StatusBadge label={c.tier} tone={TIER_TONE[c.tier]} />
            </span>
          </div>
        ))}
      </div>
    </GlassDataSurface>
  );
}

function LoadTab({ rows, onRowClick }: { rows: CoachFinancialPerformance[]; onRowClick: (c: CoachFinancialPerformance) => void }) {
  if (rows.length === 0) {
    return (
      <GlassDataSurface>
        <EmptyState title="No coaches found" description="Try a different search term." />
      </GlassDataSurface>
    );
  }
  return (
    <GlassDataSurface className={styles.surface}>
      <div className={styles.leaderboard}>
        <div className={cn(styles.headerRow, styles.gridLoad)}>
          <span>Coach</span>
          <span>Active Clients</span>
          <span>Capacity</span>
          <span>Utilization</span>
          <span>Pending</span>
        </div>
        {rows.map((c) => {
          const utilTone = c.utilizationPct >= 90 ? "high" : c.utilizationPct < 70 ? "low" : undefined;
          return (
            <div key={c.coachId} className={cn(styles.row, styles.gridLoad)} onClick={() => onRowClick(c)}>
              <span className={styles.coachCell}>
                <Avatar name={c.coachName} size="sm" />
                <span>
                  <div className={styles.coachName}>{c.coachName}</div>
                  <div className="text-caption">Level {c.level}</div>
                </span>
              </span>
              <span className={styles.colNum}>{c.activeClients}</span>
              <span className={styles.colNum}>{c.capacity}</span>
              <span>
                <div className={styles.progressTrack}>
                  <div
                    className={cn(styles.progressFill, utilTone === "high" && styles.high, utilTone === "low" && styles.low)}
                    style={{ "--fill": `${Math.min(100, c.utilizationPct)}%` } as React.CSSProperties}
                  />
                </div>
                <div className={styles.progressMeta}>
                  <span>{c.utilizationPct.toFixed(0)}%</span>
                </div>
              </span>
              <span className={styles.colNum}>{c.pendingAssignments}</span>
            </div>
          );
        })}
      </div>
    </GlassDataSurface>
  );
}

const BREAKDOWN_META: { key: keyof CoachPerformanceBreakdown; label: string; color: string }[] = [
  { key: "revenue", label: "REV", color: "var(--chart-series-1)" },
  { key: "acquisition", label: "ACQ", color: "var(--chart-series-3)" },
  { key: "retention", label: "RET", color: "var(--chart-series-4)" },
  { key: "engagement", label: "ENG", color: "var(--chart-series-7)" },
];

function TopTab({ rows, onRowClick }: { rows: CoachFinancialPerformance[]; onRowClick: (c: CoachFinancialPerformance) => void }) {
  if (rows.length === 0) {
    return (
      <GlassDataSurface>
        <EmptyState title="No coaches found" description="Try a different search term." />
      </GlassDataSurface>
    );
  }
  return (
    <GlassDataSurface className={styles.surface}>
      <div className={styles.leaderboard}>
        <div className={cn(styles.headerRow, styles.gridTop)}>
          <span>#</span>
          <span>Coach</span>
          <span>Breakdown</span>
          <span>Score</span>
        </div>
        {rows.map((c, i) => {
          const rank = i + 1;
          const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
          return (
            <div key={c.coachId} className={cn(styles.row, styles.gridTop, rank <= 3 && styles.topRow)} onClick={() => onRowClick(c)}>
              <span>{medal ? <span className={styles.medal}>{medal}</span> : <span className={styles.rankBadge}>{rank}</span>}</span>
              <span className={styles.coachCell}>
                <Avatar name={c.coachName} size="sm" />
                <span>
                  <div className={styles.coachName}>{c.coachName}</div>
                  <div className="text-caption">{c.tier}</div>
                </span>
              </span>
              <span className={styles.breakdown}>
                {BREAKDOWN_META.map((b) => (
                  <div key={b.key} className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>{b.label}</span>
                    <div className={styles.breakdownTrack}>
                      <div
                        className={styles.breakdownFill}
                        style={{ "--fill": `${c.performanceBreakdown[b.key]}%`, background: b.color } as React.CSSProperties}
                      />
                    </div>
                    <span className={styles.breakdownValue}>{c.performanceBreakdown[b.key]}</span>
                  </div>
                ))}
              </span>
              <span className={styles.scoreCell}>{c.performanceScore}</span>
            </div>
          );
        })}
      </div>
    </GlassDataSurface>
  );
}
