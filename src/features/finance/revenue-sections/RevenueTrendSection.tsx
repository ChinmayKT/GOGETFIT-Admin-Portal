import { useMemo, useState } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { LineChart } from "../../../components/charts/LineChart";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { revenueTrend } from "../../../mock/finance/repository";
import styles from "../RevenueAnalyticsPage.module.css";

const RANGE_OPTIONS: { key: string; label: string; months: number }[] = [
  { key: "3m", label: "3 Months", months: 3 },
  { key: "6m", label: "6 Months", months: 6 },
  { key: "12m", label: "12 Months", months: 12 },
];

export function RevenueTrendSection() {
  const [activeRange, setActiveRange] = useState("12m");
  const months = RANGE_OPTIONS.find((r) => r.key === activeRange)?.months ?? 12;
  const trend = useMemo(() => revenueTrend(months), [months]);
  const hasData = trend.some((t) => t.revenue > 0);

  return (
    <GlassCard>
      <div className={styles.chartHeader}>
        <p className="text-title">Revenue Trend</p>
        <div className={styles.rangeGroup}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              className={`${styles.rangeBtn} ${activeRange === r.key ? styles.rangeBtnActive : ""}`}
              onClick={() => setActiveRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <LineChart
          data={trend as unknown as Record<string, string | number>[]}
          xKey="label"
          series={[{ key: "revenue", label: "Revenue" }]}
          height={340}
        />
      ) : (
        <EmptyState title="No revenue in this period" description="Try a wider date range." />
      )}
    </GlassCard>
  );
}
