import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import styles from "./Breadcrumb.module.css";

export interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.root} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className={styles.segment}>
          {item.path && i < items.length - 1 ? (
            <Link to={item.path} className={styles.link}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={13} className={styles.sep} />}
        </span>
      ))}
    </nav>
  );
}
