import { useMemo } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { DonutChart } from "../../../components/charts/DonutChart";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { CHART_SERIES } from "../../../components/charts/chartTheme";
import { revenueByBusinessType } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function ByBusinessTypeSection() {
  const byType = useMemo(() => revenueByBusinessType(), []);
  const donutData = byType.map((c) => ({ label: c.label, value: c.value }));

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 16 }}>Revenue by Business Type</p>

      {byType.length === 0 ? (
        <EmptyState title="No revenue yet" description="Revenue by business type will show up here once payments are recorded." />
      ) : (
        <div className={styles.chartGrid}>
          <DonutChart data={donutData} height={300} />
          <div className={styles.breakdownList}>
            {byType.map((c, i) => (
              <div key={c.label} className={styles.breakdownRow}>
                <span className={styles.breakdownDot} style={{ background: CHART_SERIES[i % CHART_SERIES.length] }} />
                <span className={styles.breakdownLabel}>{c.label}</span>
                <span className={styles.breakdownValue}>{formatCurrencyINR(c.value)}</span>
                <span className={styles.breakdownPct}>{c.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
