import { Gift, Star, Medal } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { BarChart } from "../../../components/charts/BarChart";
import { rewardsKpis, pointsIssuedByMonth } from "../../../mock/analytics/data";
import { formatCompactNumber } from "../../../utils/format";
import styles from "../AnalyticsPage.module.css";

export function RewardsSection() {
  const kpis = rewardsKpis();
  const byMonth = pointsIssuedByMonth();
  // The shared BarChart's Y-axis has a fixed 40px width, which clips 4-digit tick labels
  // (e.g. renders "1000" as "000"). Points issued per month can cross that threshold, so the
  // chart displays hundreds of points while the KPI cards above keep the true point totals.
  const byMonthInHundreds = byMonth.map((m) => ({ ...m, "Points (x100)": Math.round(Number(m.Points) / 100) }));

  return (
    <>
      <div className={styles.kpiGrid3}>
        <MetricCard
          label="Total Points Issued"
          value={formatCompactNumber(kpis.totalPointsIssued)}
          comparison="Across all reward transactions"
          sparklineData={[900, 1100, 1050, 1250, 1300, 1400, kpis.totalPointsIssued]}
          icon={<Gift size={16} />}
        />
        <MetricCard
          label="Avg Points / User"
          value={kpis.avgPointsPerUser.toFixed(0)}
          comparison="Among users with reward activity"
          sparklineData={[30, 32, 31, 34, 33, 35, kpis.avgPointsPerUser]}
          icon={<Star size={16} />}
        />
        <MetricCard
          label="Top Badge Earned"
          value={kpis.topBadgeName}
          comparison={`Earned ${kpis.topBadgeCount} times`}
          icon={<Medal size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Points Issued by Month (hundreds)</p>
        <BarChart data={byMonthInHundreds} xKey="month" series={[{ key: "Points (x100)", label: "Points Issued (x100)" }]} height={280} />
      </GlassCard>
    </>
  );
}
