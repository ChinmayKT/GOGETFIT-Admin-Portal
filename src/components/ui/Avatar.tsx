import { cn } from "../../utils/cn";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <span className={cn(styles.root, styles[size], className)}>
      {src ? <img src={src} alt={name} /> : <span className={styles.initials}>{initials(name)}</span>}
    </span>
  );
}

export function AvatarGroup({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  return (
    <span className={styles.group}>
      {shown.map((n, i) => (
        <Avatar key={n + i} name={n} size="sm" className={styles.groupItem} />
      ))}
      {overflow > 0 && <span className={cn(styles.root, styles.sm, styles.overflow)}>+{overflow}</span>}
    </span>
  );
}
