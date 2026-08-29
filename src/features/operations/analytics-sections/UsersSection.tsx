import { Users, UserPlus, Activity, UserMinus } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { LineChart } from "../../../components/charts/LineChart";
import { BarChart } from "../../../components/charts/BarChart";
import { usersKpis, userGrowthTrend, usersByCity } from "../../../mock/analytics/data";
import { formatCompactNumber } from "../../../utils/format";
import styles from "../AnalyticsPage.module.css";

export function UsersSection() {
  const kpis = usersKpis();
  const growth = userGrowthTrend();
  const cities = usersByCity();

  return (
    <>
      <div className={styles.kpiGrid}>
        <MetricCard
          label="Total Users"
          value={formatCompactNumber(kpis.totalUsers)}
          comparison="All registered users"
          sparklineData={[40, 55, 48, 62, 70, 68, 82]}
          icon={<Users size={16} />}
        />
        <MetricCard
          label="New This Month"
          value={String(kpis.newThisMonth)}
          comparison="Joined this calendar month"
          sparklineData={[6, 9, 7, 12, 10, 14, kpis.newThisMonth]}
          icon={<UserPlus size={16} />}
        />
        <MetricCard
          label="Active Rate"
          value={`${kpis.activeRate.toFixed(1)}%`}
          comparison="Status = Active"
          sparklineData={[80, 82, 79, 84, 83, 85, kpis.activeRate]}
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="Churn Rate"
          value={`${kpis.churnRate.toFixed(1)}%`}
          comparison="Status = Inactive"
          sparklineData={[9, 8, 10, 7, 8, 6, kpis.churnRate]}
          icon={<UserMinus size={16} />}
        />
      </div>

      <div className={styles.chartGrid}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>User Growth (6-month drill-down)</p>
          <LineChart
            data={growth}
            xKey="month"
            series={[
              { key: "New Users", label: "New Users" },
              { key: "Active Users", label: "Active Users" },
              { key: "Churned", label: "Churned" },
            ]}
            height={280}
          />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Users by City (Top 6)</p>
          <BarChart data={cities} xKey="label" series={[{ key: "value", label: "Users" }]} height={280} />
        </GlassCard>
      </div>
    </>
  );
}
