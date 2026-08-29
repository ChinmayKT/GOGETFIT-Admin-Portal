import type { ReactNode } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Sparkline } from "./Sparkline";
import { cn } from "../../utils/cn";
import styles from "./MetricCard.module.css";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  comparison?: string;
  sparklineData?: number[];
  icon?: ReactNode;
}

export function MetricCard({ label, value, trend, comparison, sparklineData, icon }: MetricCardProps) {
  return (
    <GlassCard className={styles.root}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.valueRow}>
        <span className={cn("text-numeric", styles.value)}>{value}</span>
        {trend && (
          <span className={cn(styles.trend, styles[trend.direction])}>
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
        )}
      </div>
      {comparison && <p className={styles.comparison}>{comparison}</p>}
      {sparklineData && (
        <div className={styles.sparkline}>
          <Sparkline data={sparklineData} />
        </div>
      )}
    </GlassCard>
  );
}
