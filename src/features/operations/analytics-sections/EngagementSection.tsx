import { Activity, Flame, Utensils } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { LineChart } from "../../../components/charts/LineChart";
import { engagementKpis, engagementTrend } from "../../../mock/analytics/data";
import styles from "../AnalyticsPage.module.css";

export function EngagementSection() {
  const kpis = engagementKpis();
  const trend = engagementTrend();

  return (
    <>
      <div className={styles.kpiGrid3}>
        <MetricCard
          label="Daily Active Users"
          value={String(kpis.dailyActiveUsers)}
          comparison="Last active within 24h (estimate)"
          sparklineData={[10, 12, 11, 13, 12, 14, kpis.dailyActiveUsers]}
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="Avg Session Proxy"
          value={`${kpis.avgStreakDaysProxy.toFixed(0)} days`}
          comparison="Avg streak days, as an engagement proxy"
          sparklineData={[30, 32, 31, 34, 33, 35, kpis.avgStreakDaysProxy]}
          icon={<Flame size={16} />}
        />
        <MetricCard
          label="Food Log Entries"
          value={String(kpis.foodLogEntriesThisWeek)}
          comparison="Logged in the last 7 days"
          sparklineData={[18, 22, 20, 25, 23, 27, kpis.foodLogEntriesThisWeek]}
          icon={<Utensils size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>14-Day Engagement Trend</p>
        <LineChart data={trend} xKey="day" series={[{ key: "Active Users", label: "Active Users" }]} height={280} />
      </GlassCard>
    </>
  );
}
