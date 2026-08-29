import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, CreditCard, UserPlus, RotateCcw, Receipt, TrendingUp,
  Download, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { MetricCard } from "../../components/charts/MetricCard";
import { LineChart } from "../../components/charts/LineChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { Button } from "../../components/ui/Button";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonCard, SkeletonChart } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { financeOverview, revenueTrend } from "../../mock/finance/repository";
import { formatCurrencyINR } from "../../utils/format";
import type { FinanceOverviewKpis, RevenuePoint, RevenueByCategory, RevenueByPackage, BusinessHealth, FinanceInsight } from "../../types/finance";
import styles from "./FinanceOverviewPage.module.css";

interface FinanceOverviewData {
  kpis: FinanceOverviewKpis;
  trend: RevenuePoint[];
  byBusinessType: RevenueByCategory[];
  byPackage: RevenueByPackage[];
  health: BusinessHealth;
  insights: FinanceInsight[];
}

const RANGE_OPTIONS: { key: string; label: string; months: number }[] = [
  { key: "7d", label: "7 Days", months: 1 },
  { key: "30d", label: "30 Days", months: 1 },
  { key: "3m", label: "3 Months", months: 3 },
  { key: "6m", label: "6 Months", months: 6 },
  { key: "12m", label: "12 Months", months: 12 },
];

const HEALTH_TONE: Record<BusinessHealth["overall"], StatusTone> = {
  Strong: "success",
  Stable: "info",
  "Needs Attention": "warning",
};

const INSIGHT_ICON: Record<FinanceInsight["tone"], React.ReactNode> = {
  warning: <AlertTriangle size={16} />,
  success: <CheckCircle2 size={16} />,
  info: <Info size={16} />,
};

function trendOf(pct: number): { value: string; direction: "up" | "down" | "flat" } {
  const direction = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return { value: `${Math.abs(pct).toFixed(1)}%`, direction };
}

export function FinanceOverviewPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [data, setData] = useState<FinanceOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeRange, setActiveRange] = useState("6m");
  const [trend, setTrend] = useState<RevenuePoint[] | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    financeOverview()
      .then((res) => {
        setData(res);
        setTrend(res.trend);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (key: string) => {
    const option = RANGE_OPTIONS.find((r) => r.key === key);
    if (!option) return;
    setActiveRange(key);
    setTrend(revenueTrend(option.months));
  };

  const donutData = useMemo(
    () => data?.byBusinessType.map((c) => ({ label: c.label, value: c.value })) ?? [],
    [data],
  );

  const maxPackageRevenue = useMemo(
    () => Math.max(1, ...(data?.byPackage.map((p) => p.revenue) ?? [1])),
    [data],
  );

  if (loading) {
    return (
      <>
        <PageHeader title="Finance Overview" description="Revenue, payments and coach business performance — mock data for prototype purposes." />
        <div className={styles.kpiGrid}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <GlassCard style={{ marginBottom: 24 }}><SkeletonChart /></GlassCard>
        <div className={styles.midGrid}>
          <GlassCard><SkeletonChart /></GlassCard>
          <GlassCard><SkeletonChart /></GlassCard>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Finance Overview" description="Revenue, payments and coach business performance — mock data for prototype purposes." />
        <GlassCard>
          <ErrorState description="We couldn't load the finance overview." onRetry={load} />
        </GlassCard>
      </>
    );
  }

  const { kpis, byPackage, health, insights } = data;

  return (
    <>
      <PageHeader
        title="Finance Overview"
        description="Revenue, payments and coach business performance — mock data for prototype purposes."
        actions={
          <>
            <StatusBadge label="🔒 Super Admin" tone="orange" dot={false} />
            <Button variant="primary" icon={<Download size={15} />} onClick={() => show("Export started — check your downloads shortly", "success")}>
              Export
            </Button>
          </>
        }
      />

      <div className={styles.kpiGrid}>
        <MetricCard
          label="Total Revenue"
          value={formatCurrencyINR(kpis.totalRevenue)}
          trend={trendOf(kpis.revenueGrowthPct)}
          comparison="vs last month"
          icon={<Wallet size={16} />}
        />
        <MetricCard
          label="This Month"
          value={formatCurrencyINR(kpis.thisMonthRevenue)}
          trend={trendOf(kpis.thisMonthGrowthPct)}
          comparison="vs last month"
          icon={<TrendingUp size={16} />}
        />
        <MetricCard
          label="Successful Payments"
          value={String(kpis.successfulPayments)}
          comparison={`${kpis.successRatePct.toFixed(1)}% success rate`}
          icon={<CreditCard size={16} />}
        />
        <MetricCard
          label="New Enrollments"
          value={String(kpis.newEnrollments)}
          trend={trendOf(kpis.newEnrollmentsGrowthPct)}
          comparison="vs last month"
          icon={<UserPlus size={16} />}
        />
        <MetricCard
          label="Refunds"
          value={formatCurrencyINR(kpis.refundsTotal)}
          comparison={`${kpis.refundsPctOfRevenue.toFixed(1)}% of revenue`}
          icon={<RotateCcw size={16} />}
        />
        <MetricCard
          label="Average Order Value"
          value={formatCurrencyINR(kpis.averageOrderValue)}
          trend={trendOf(kpis.aovGrowthPct)}
          comparison="vs last month"
          icon={<Receipt size={16} />}
        />
      </div>

      <GlassCard style={{ marginBottom: 24 }}>
        <div className={styles.trendHeader}>
          <p className="text-title">Revenue Trend</p>
          <div className={styles.rangeGroup}>
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                className={`${styles.rangeBtn} ${activeRange === r.key ? styles.rangeBtnActive : ""}`}
                onClick={() => handleRangeChange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <LineChart data={(trend ?? []) as unknown as Record<string, string | number>[]} xKey="label" series={[{ key: "revenue", label: "Revenue" }]} height={300} />
      </GlassCard>

      <div className={styles.midGrid}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Revenue by Business Type</p>
          <DonutChart data={donutData} height={260} />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Top Packages by Revenue</p>
          <div className={styles.packageList}>
            {byPackage.map((p, i) => (
              <div key={p.packageId} className={styles.packageRow}>
                <span className={styles.packageRank}>{i + 1}</span>
                <div className={styles.packageInfo}>
                  <div className={styles.packageTop}>
                    <span className={styles.packageName}>{p.packageName}</span>
                    <span className="text-numeric" style={{ fontSize: 14 }}>{formatCurrencyINR(p.revenue)}</span>
                  </div>
                  <div className={styles.packageBarTrack}>
                    <div className={styles.packageBarFill} style={{ width: `${(p.revenue / maxPackageRevenue) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard style={{ marginBottom: 24 }}>
        <div className={styles.healthHeader}>
          <p className="text-title">Business Health Snapshot</p>
          <StatusBadge label={`Business Health: ${health.overall}`} tone={HEALTH_TONE[health.overall]} />
        </div>
        <div className={styles.healthGrid}>
          <HealthStat label="Client Growth" value={`${health.clientGrowthPct.toFixed(1)}%`} />
          <HealthStat label="Revenue Growth" value={`${health.revenueGrowthPct.toFixed(1)}%`} />
          <HealthStat label="Renewal Rate" value={`${health.renewalRatePct.toFixed(1)}%`} />
          <HealthStat label="Payment Success" value={`${health.paymentSuccessPct.toFixed(1)}%`} />
          <HealthStat label="Refund Rate" value={`${health.refundRatePct.toFixed(1)}%`} />
          <HealthStat label="Coach Utilization" value={`${health.coachUtilizationPct.toFixed(1)}%`} />
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 14 }}>Attention Required</p>
        <div className={styles.insightList}>
          {insights.length === 0 && <p className="text-caption">No open items — everything looks healthy.</p>}
          {insights.map((insight) => {
            const clickable = Boolean(insight.actionPath);
            return (
              <div
                key={insight.id}
                className={`${styles.insightRow} ${styles[insight.tone]} ${clickable ? styles.insightClickable : ""}`}
                onClick={clickable ? () => navigate(insight.actionPath!) : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
              >
                <span className={styles.insightIcon}>{INSIGHT_ICON[insight.tone]}</span>
                <span className={styles.insightMessage}>{insight.message}</span>
                {insight.actionLabel && <span className={styles.insightAction}>{insight.actionLabel} →</span>}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </>
  );
}

function HealthStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.healthStat}>
      <span className={styles.healthStatLabel}>{label}</span>
      <span className={`text-numeric ${styles.healthStatValue}`}>{value}</span>
    </div>
  );
}
