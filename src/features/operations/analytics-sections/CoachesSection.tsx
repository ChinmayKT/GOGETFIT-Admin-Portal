import { Award, Users, Star, Gauge } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { BarChart } from "../../../components/charts/BarChart";
import { coachesKpis, activeClientsByCoachLevel } from "../../../mock/analytics/data";
import styles from "../AnalyticsPage.module.css";

export function CoachesSection() {
  const kpis = coachesKpis();
  const byLevel = activeClientsByCoachLevel();

  return (
    <>
      <div className={styles.kpiGrid}>
        <MetricCard
          label="Total Coaches"
          value={String(kpis.totalCoaches)}
          comparison="All onboarded coaches"
          sparklineData={[20, 21, 22, 24, 25, 26, kpis.totalCoaches]}
          icon={<Award size={16} />}
        />
        <MetricCard
          label="Avg Clients / Coach"
          value={kpis.avgClientsPerCoach.toFixed(1)}
          comparison="Active clients per coach"
          sparklineData={[14, 15, 16, 15, 17, 18, kpis.avgClientsPerCoach]}
          icon={<Users size={16} />}
        />
        <MetricCard
          label="Avg Rating"
          value={kpis.avgRatingPlaceholder.toFixed(1)}
          comparison="Placeholder — no review data yet"
          sparklineData={[4.4, 4.5, 4.5, 4.6, 4.6, 4.6, kpis.avgRatingPlaceholder]}
          icon={<Star size={16} />}
        />
        <MetricCard
          label="Utilization"
          value={`${kpis.utilizationRate.toFixed(1)}%`}
          comparison="Active clients vs total capacity"
          sparklineData={[58, 60, 62, 61, 63, 64, kpis.utilizationRate]}
          icon={<Gauge size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Active Clients by Coach Level</p>
        <BarChart data={byLevel} xKey="label" series={[{ key: "value", label: "Active Clients" }]} height={280} />
      </GlassCard>
    </>
  );
}
