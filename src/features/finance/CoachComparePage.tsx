import { useMemo, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { Select } from "../../components/forms/Select";
import { BarChart } from "../../components/charts/BarChart";
import { EmptyState } from "../../components/feedback/EmptyState";
import { coachFinancialPerformanceList } from "../../mock/finance/repository";
import { formatCurrencyINR } from "../../utils/format";
import { cn } from "../../utils/cn";
import type { CoachFinancialPerformance } from "../../types/finance";
import styles from "./CoachComparePage.module.css";

const SLOT_LABELS = ["Coach 1", "Coach 2", "Coach 3"];

interface Metric {
  key: string;
  label: string;
  higherIsBetter?: boolean;
  value: (c: CoachFinancialPerformance) => number;
  format: (c: CoachFinancialPerformance) => string;
}

const METRICS: Metric[] = [
  { key: "activeClients", label: "Active Clients", value: (c) => c.activeClients, format: (c) => String(c.activeClients) },
  { key: "newClients", label: "New Clients", value: (c) => c.newClients, format: (c) => String(c.newClients) },
  { key: "revenue", label: "Revenue", value: (c) => c.revenue, format: (c) => formatCurrencyINR(c.revenue) },
  { key: "revenuePerClient", label: "Revenue / Client", value: (c) => c.revenuePerClient, format: (c) => formatCurrencyINR(c.revenuePerClient) },
  { key: "retentionPct", label: "Retention %", value: (c) => c.retentionPct, format: (c) => `${c.retentionPct.toFixed(1)}%` },
  { key: "renewals", label: "Renewals", value: (c) => c.renewals, format: (c) => String(c.renewals) },
  { key: "performanceScore", label: "Performance Score", value: (c) => c.performanceScore, format: (c) => String(c.performanceScore) },
];

export function CoachComparePage() {
  const [coaches] = useState(() => coachFinancialPerformanceList());
  const [slotIds, setSlotIds] = useState<string[]>(() => coaches.slice(0, 3).map((c) => c.coachId));

  const selected = useMemo(
    () => slotIds.map((id) => coaches.find((c) => c.coachId === id)).filter((c): c is CoachFinancialPerformance => !!c),
    [slotIds, coaches],
  );

  const optionsForSlot = (index: number) =>
    coaches
      .filter((c) => c.coachId === slotIds[index] || !slotIds.includes(c.coachId))
      .map((c) => ({ label: c.coachName, value: c.coachId }));

  const setSlot = (index: number, coachId: string) => {
    setSlotIds((prev) => {
      const next = [...prev];
      next[index] = coachId;
      return next;
    });
  };

  const revenueChartData = selected.map((c) => ({ name: c.coachName, revenue: c.revenue }));
  const retentionChartData = selected.map((c) => ({ name: c.coachName, retention: c.retentionPct }));

  if (coaches.length === 0) {
    return <EmptyState title="No coaches available" description="Add coaches to compare their financial performance." />;
  }

  return (
    <>
      <PageHeader
        title="Compare Coaches"
        breadcrumb={[{ label: "Finance" }, { label: "Coach Performance" }, { label: "Compare" }]}
        description="Compare revenue, clients and retention side by side across coaches."
      />

      <div className={styles.pickerRow}>
        {SLOT_LABELS.map((label, i) => (
          <div key={label} className={styles.pickerSlot}>
            <span className={styles.pickerLabel}>{label}</span>
            <Select
              value={slotIds[i] ?? ""}
              onChange={(e) => setSlot(i, e.target.value)}
              placeholder="Select a coach"
              options={optionsForSlot(i)}
            />
          </div>
        ))}
      </div>

      {selected.length === 0 ? (
        <EmptyState title="Pick coaches to compare" description="Select at least one coach above to see a side-by-side comparison." />
      ) : (
        <>
          <GlassCard className={styles.compareTableWrap}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  {selected.map((c) => (
                    <th key={c.coachId}>
                      <div className={styles.coachHeaderCell}>
                        <Avatar name={c.coachName} size="sm" />
                        <span className={styles.coachHeaderName}>{c.coachName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => {
                  const values = selected.map((c) => metric.value(c));
                  const best = Math.max(...values);
                  return (
                    <tr key={metric.key}>
                      <td>{metric.label}</td>
                      {selected.map((c) => (
                        <td key={c.coachId} className={cn(values.length > 1 && metric.value(c) === best && styles.bestValue)}>
                          {metric.format(c)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>

          <div className={styles.chartGrid}>
            <GlassCard>
              <p className={styles.cardTitle}>Revenue Comparison</p>
              <BarChart data={revenueChartData} xKey="name" series={[{ key: "revenue", label: "Revenue" }]} />
            </GlassCard>
            <GlassCard>
              <p className={styles.cardTitle}>Retention Comparison</p>
              <BarChart data={retentionChartData} xKey="name" series={[{ key: "retention", label: "Retention %" }]} />
            </GlassCard>
          </div>
        </>
      )}
    </>
  );
}
