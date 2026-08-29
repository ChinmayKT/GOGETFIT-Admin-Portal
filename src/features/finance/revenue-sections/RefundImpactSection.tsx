import { useMemo } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { BarChart } from "../../../components/charts/BarChart";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { revenueTrend } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function RefundImpactSection() {
  const trend = useMemo(() => revenueTrend(12), []);
  const totalRefunds = trend.reduce((s, t) => s + t.refunds, 0);
  const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0);
  const grossRevenue = totalRevenue + totalRefunds;
  const refundPct = grossRevenue > 0 ? (totalRefunds / grossRevenue) * 100 : 0;

  const hasData = trend.some((t) => t.refunds > 0 || t.revenue > 0);

  return (
    <GlassCard>
      <div className={styles.refundStat}>
        <span className={styles.refundLabel}>Refund Impact (Last 12 Months)</span>
        <span className={`text-display ${styles.refundValue}`}>{refundPct.toFixed(1)}%</span>
        <p className={styles.refundNote}>
          Refunds equaled {refundPct.toFixed(1)}% of gross revenue over the last 12 months — {formatCurrencyINR(totalRefunds)}{" "}
          refunded against {formatCurrencyINR(grossRevenue)} in gross revenue (net revenue recognized: {formatCurrencyINR(totalRevenue)}).
        </p>
        <div className={styles.refundSubStats}>
          <div className={styles.refundSubStat}>
            <span className={styles.refundSubStatLabel}>Total Refunds</span>
            <span className={styles.refundSubStatValue}>{formatCurrencyINR(totalRefunds)}</span>
          </div>
          <div className={styles.refundSubStat}>
            <span className={styles.refundSubStatLabel}>Gross Revenue</span>
            <span className={styles.refundSubStatValue}>{formatCurrencyINR(grossRevenue)}</span>
          </div>
          <div className={styles.refundSubStat}>
            <span className={styles.refundSubStatLabel}>Net Revenue</span>
            <span className={styles.refundSubStatValue}>{formatCurrencyINR(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {hasData ? (
        <BarChart
          data={trend as unknown as Record<string, string | number>[]}
          xKey="label"
          series={[{ key: "refunds", label: "Refunds" }]}
          height={220}
        />
      ) : (
        <EmptyState title="No refund activity" description="Monthly refunds will show up here once refunds are processed." />
      )}
    </GlassCard>
  );
}
