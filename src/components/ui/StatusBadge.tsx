import { cn } from "../../utils/cn";
import styles from "./StatusBadge.module.css";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral" | "orange";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, tone, dot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn(styles.root, styles[tone], className)}>
      {dot && <span className={styles.dot} />}
      {label}
    </span>
  );
}
