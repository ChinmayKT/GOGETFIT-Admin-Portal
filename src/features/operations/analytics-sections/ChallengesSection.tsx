import { Trophy, Users, CheckCircle2 } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { BarChart } from "../../../components/charts/BarChart";
import { challengesKpis, participantsByChallenge } from "../../../mock/analytics/data";
import { formatCompactNumber } from "../../../utils/format";
import styles from "../AnalyticsPage.module.css";

export function ChallengesSection() {
  const kpis = challengesKpis();
  const perChallenge = participantsByChallenge();

  return (
    <>
      <div className={styles.kpiGrid3}>
        <MetricCard
          label="Active Challenges"
          value={String(kpis.activeChallenges)}
          comparison="Currently in progress"
          sparklineData={[2, 3, 2, 3, 3, 4, kpis.activeChallenges]}
          icon={<Trophy size={16} />}
        />
        <MetricCard
          label="Total Participants"
          value={formatCompactNumber(kpis.totalParticipants)}
          comparison="Across all challenges"
          sparklineData={[120, 140, 135, 150, 160, 170, kpis.totalParticipants]}
          icon={<Users size={16} />}
        />
        <MetricCard
          label="Completion Rate"
          value={`${kpis.completionRate.toFixed(1)}%`}
          comparison="Submissions approved by a coach"
          sparklineData={[28, 30, 29, 32, 31, 33, kpis.completionRate]}
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Participants per Challenge (Top 6)</p>
        <BarChart data={perChallenge} xKey="label" series={[{ key: "value", label: "Participants" }]} height={280} />
      </GlassCard>
    </>
  );
}
