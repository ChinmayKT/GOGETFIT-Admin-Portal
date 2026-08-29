import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { DonutChart } from "../../../components/charts/DonutChart";
import { plansKpis, planTypeDistribution } from "../../../mock/analytics/data";
import styles from "../AnalyticsPage.module.css";

export function PlansSection() {
  const kpis = plansKpis();
  const distribution = planTypeDistribution();

  return (
    <>
      <div className={styles.kpiGrid3}>
        <MetricCard
          label="Active Plans"
          value={String(kpis.activePlans)}
          comparison="Clients currently on an active plan"
          sparklineData={[62, 65, 63, 67, 66, 69, kpis.activePlans]}
          icon={<ClipboardList size={16} />}
        />
        <MetricCard
          label="Completion Rate"
          value={`${kpis.completionRate.toFixed(1)}%`}
          comparison="Clients who didn't cancel"
          sparklineData={[80, 82, 81, 83, 84, 85, kpis.completionRate]}
          icon={<CheckCircle2 size={16} />}
        />
        <MetricCard
          label="Avg Duration"
          value={`${kpis.avgDurationWeeks.toFixed(1)} wks`}
          comparison="Across all packages"
          sparklineData={[10, 11, 10.5, 12, 11.5, 12, kpis.avgDurationWeeks]}
          icon={<Clock size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Plan-Type Distribution</p>
        <DonutChart data={distribution} height={260} />
      </GlassCard>
    </>
  );
}
