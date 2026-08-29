import type { ReactNode } from "react";
import styles from "./FilterBar.module.css";

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
