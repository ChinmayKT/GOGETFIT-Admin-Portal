import { useState, type ReactNode } from "react";
import styles from "./Tooltip.module.css";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className={styles.root}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className={styles.bubble} role="tooltip">
          {label}
        </span>
      )}
    </span>
  );
}
