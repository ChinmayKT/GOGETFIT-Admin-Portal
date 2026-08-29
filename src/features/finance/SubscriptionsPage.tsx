import { useEffect, useMemo, useState } from "react";
import { Users, CalendarClock, Wallet, RotateCcw, TrendingDown } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { MetricCard } from "../../components/charts/MetricCard";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonCard } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { subscriptionsOverview, listSubscriptions } from "../../mock/finance/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { Subscription, SubscriptionStatus, SubscriptionsSummary } from "../../types/finance";
import styles from "./SubscriptionsPage.module.css";

const STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
  Active: "success",
  "Expiring Soon": "warning",
  Expired: "error",
  Renewed: "info",
  Cancelled: "neutral",
};

export function SubscriptionsPage() {
  const [summary, setSummary] = useState<SubscriptionsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadSummary = () => {
    setSummaryLoading(true);
    setSummaryError(false);
    subscriptionsOverview()
      .then((res) => setSummary(res.summary))
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false));
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = useMemo(
    () => ({ query, status: status || undefined, page, pageSize }),
    [query, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listSubscriptions, params);

  const columns: Column<Subscription>[] = [
    { key: "clientName", header: "Client" },
    { key: "coachName", header: "Coach" },
    { key: "packageName", header: "Package" },
    { key: "startDate", header: "Start Date", render: (s) => formatDate(s.startDate) },
    { key: "endDate", header: "End Date", render: (s) => formatDate(s.endDate) },
    { key: "status", header: "Status", render: (s) => <StatusBadge label={s.status} tone={STATUS_TONE[s.status]} /> },
    { key: "revenue", header: "Revenue", align: "right", render: (s) => formatCurrencyINR(s.revenue) },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        breadcrumb={[{ label: "Finance" }, { label: "Subscriptions" }]}
        description="Client subscription lifecycle, upcoming renewals and expected renewal revenue."
      />

      {summaryLoading && (
        <div className={styles.kpiGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!summaryLoading && (summaryError || !summary) && (
        <GlassCard style={{ marginBottom: 24 }}>
          <ErrorState description="We couldn't load the subscriptions summary." onRetry={loadSummary} />
        </GlassCard>
      )}

      {!summaryLoading && !summaryError && summary && (
        <>
          <div className={styles.kpiGrid}>
            <MetricCard
              label="Active Subscriptions"
              value={String(summary.activeCount)}
              comparison="Currently active clients"
              icon={<Users size={16} />}
            />
            <MetricCard
              label="Upcoming Renewals"
              value={String(summary.upcomingRenewals)}
              comparison="Subscriptions expiring soon"
              icon={<CalendarClock size={16} />}
            />
            <MetricCard
              label="Expected Renewal Revenue"
              value={formatCurrencyINR(summary.expectedRenewalRevenue)}
              comparison="From expiring-soon subscriptions"
              icon={<Wallet size={16} />}
            />
            <MetricCard
              label="Renewal Rate"
              value={`${summary.renewalRatePct.toFixed(1)}%`}
              comparison="Renewed vs. due for renewal"
              icon={<RotateCcw size={16} />}
            />
            <MetricCard
              label="Churn Rate"
              value={`${summary.churnRatePct.toFixed(1)}%`}
              comparison="Expired share of all subscriptions"
              icon={<TrendingDown size={16} />}
            />
          </div>

          <GlassCard glow bright className={styles.forecastCard}>
            <span className={styles.forecastLabel}>Expected Next 30 Days</span>
            <span className={`text-display ${styles.forecastValue}`}>{formatCurrencyINR(summary.expectedRenewalRevenue)}</span>
            <span className={styles.forecastNote}>
              Renewal forecast based on {summary.upcomingRenewals} subscription{summary.upcomingRenewals === 1 ? "" : "s"} expiring soon
            </span>
          </GlassCard>
        </>
      )}

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); setPage(1); }}
          placeholder="Search by client, coach, or package..."
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Expiring Soon", value: "Expiring Soon" },
            { label: "Expired", value: "Expired" },
            { label: "Renewed", value: "Renewed" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(s) => s.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No subscriptions found"
        emptyDescription="Try adjusting your search or status filter."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
