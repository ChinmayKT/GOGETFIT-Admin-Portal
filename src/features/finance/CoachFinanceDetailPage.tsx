import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { MetricCard } from "../../components/charts/MetricCard";
import { LineChart } from "../../components/charts/LineChart";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { coachFinanceDetail } from "../../mock/finance/repository";
import { getCoach } from "../../mock/coaches/repository";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { CoachFinancialPerformance, CoachFunnelStage, RevenuePoint, Subscription, SubscriptionStatus } from "../../types/finance";
import type { Coach } from "../../types/coach";
import styles from "./CoachFinanceDetailPage.module.css";

const COACH_STATUS_TONE: Record<string, StatusTone> = { Active: "success", "Pending Approval": "warning", Inactive: "neutral" };
const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
  Active: "success",
  "Expiring Soon": "warning",
  Expired: "neutral",
  Renewed: "info",
  Cancelled: "error",
};

interface DetailState {
  coach: CoachFinancialPerformance | null;
  funnel: CoachFunnelStage[];
  clients: Subscription[];
  trend: RevenuePoint[];
}

export function CoachFinanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<DetailState | null>(null);
  const [baseCoach, setBaseCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([coachFinanceDetail(id), getCoach(id)])
      .then(([detail, coach]) => {
        setData(detail);
        setBaseCoach(coach);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={load} />;
  if (!data?.coach) return <EmptyState title="Coach not found" description="This coach doesn't have financial performance data." />;

  const { coach, funnel, clients, trend } = data;
  const maxFunnel = Math.max(1, ...funnel.map((s) => s.count));

  const clientColumns: Column<Subscription>[] = [
    {
      key: "clientName",
      header: "Client",
      render: (s) => (
        <div className={styles.coachCell}>
          <span className={styles.coachCellName}>{s.clientName}</span>
        </div>
      ),
    },
    { key: "startDate", header: "Enrollment / Start Date", render: (s) => formatDate(s.startDate) },
    { key: "packageName", header: "Plan" },
    { key: "status", header: "Status", render: (s) => <StatusBadge label={s.status} tone={SUBSCRIPTION_STATUS_TONE[s.status]} /> },
    { key: "revenue", header: "Revenue", align: "right", render: (s) => formatCurrencyINR(s.revenue) },
    { key: "endDate", header: "End Date", render: (s) => formatDate(s.endDate) },
  ];

  return (
    <>
      <div className={styles.topRow}>
        <button className={styles.backLink} onClick={() => navigate("/finance/coaches")}>
          <ArrowLeft size={14} /> Back to Coach Performance
        </button>
      </div>

      <div className={styles.header}>
        <Avatar name={coach.coachName} src={baseCoach?.profilePicture ?? undefined} size="xl" />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{coach.coachName}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">Level {coach.level}</span>
            {baseCoach && <StatusBadge label={baseCoach.status} tone={COACH_STATUS_TONE[baseCoach.status]} />}
            <span className="text-caption">{coach.activeClients} active clients</span>
            <StatusBadge label={coach.tier} tone={coach.tier === "Excellent" ? "success" : coach.tier === "Strong" ? "info" : coach.tier === "Good" ? "neutral" : "warning"} />
          </div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <MetricCard label="Total Revenue" value={formatCurrencyINR(coach.revenue)} />
        <MetricCard label="New Clients" value={String(coach.newClients)} />
        <MetricCard label="Active Clients" value={String(coach.activeClients)} />
        <MetricCard label="Renewals" value={String(coach.renewals)} />
        <MetricCard label="Retention %" value={`${coach.retentionPct.toFixed(1)}%`} />
        <MetricCard label="Revenue / Client" value={formatCurrencyINR(coach.revenuePerClient)} />
      </div>

      <div className={styles.twoCol}>
        <GlassCard>
          <p className={styles.cardTitle}>Revenue Performance</p>
          <LineChart
            data={trend as unknown as Record<string, string | number>[]}
            xKey="label"
            series={[
              { key: "revenue", label: "Revenue" },
              { key: "enrollments", label: "Enrollments" },
              { key: "refunds", label: "Refunds" },
            ]}
          />
        </GlassCard>

        <GlassCard className={styles.funnelCard}>
          <p className={styles.cardTitle}>Coach Funnel</p>
          <div className={styles.funnelList}>
            {funnel.map((stage, i) => {
              const pctOfMax = (stage.count / maxFunnel) * 100;
              const prev = funnel[i - 1];
              const dropPct = prev && prev.count > 0 ? (stage.count / prev.count) * 100 : null;
              return (
                <div key={stage.stage}>
                  <div className={styles.funnelStage}>
                    <span className={styles.funnelLabel}>{stage.stage}</span>
                    <div className={styles.funnelTrack}>
                      <div className={styles.funnelFill} style={{ "--fill": `${Math.max(6, pctOfMax)}%` } as React.CSSProperties}>
                        <span className={styles.funnelFillLabel}>{stage.count}</span>
                      </div>
                    </div>
                    <span className={styles.funnelCount}>{stage.count}</span>
                  </div>
                  {dropPct !== null && (
                    <div className={styles.funnelDrop}>{dropPct.toFixed(0)}% of {prev.stage.toLowerCase()}</div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <p className={styles.sectionTitle}>Clients</p>
      <DataTable
        columns={clientColumns}
        rows={clients}
        getRowId={(s) => s.id}
        emptyTitle="No clients yet"
        emptyDescription="This coach doesn't have any subscription history yet."
      />
    </>
  );
}
