import { cn } from "../../utils/cn";
import styles from "./Skeleton.module.css";

export function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn(styles.block, className)} style={style} />;
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <SkeletonBlock style={{ width: 40, height: 40, borderRadius: "50%" }} />
      <SkeletonBlock style={{ width: "60%", height: 14, marginTop: 16 }} />
      <SkeletonBlock style={{ width: "40%", height: 24, marginTop: 8 }} />
    </div>
  );
}

export function SkeletonRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className={styles.rows}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBlock key={c} style={{ height: 14, width: c === 0 ? "20%" : `${60 / columns}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className={styles.table}>
      <div className={styles.tableHead}>
        {Array.from({ length: columns }).map((_, c) => (
          <SkeletonBlock key={c} style={{ height: 12, width: "70%" }} />
        ))}
      </div>
      <SkeletonRows rows={rows} columns={columns} />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className={styles.profile}>
      <SkeletonBlock style={{ width: 88, height: 88, borderRadius: "50%" }} />
      <div style={{ flex: 1 }}>
        <SkeletonBlock style={{ width: "30%", height: 20, marginBottom: 10 }} />
        <SkeletonBlock style={{ width: "50%", height: 14, marginBottom: 8 }} />
        <SkeletonBlock style={{ width: "40%", height: 14 }} />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return <SkeletonBlock style={{ width: "100%", height: 220, borderRadius: 16 }} />;
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className={styles.form}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBlock style={{ width: "25%", height: 11, marginBottom: 8 }} />
          <SkeletonBlock style={{ width: "100%", height: 40 }} />
        </div>
      ))}
    </div>
  );
}
