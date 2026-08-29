import type { ReactNode } from "react";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  breadcrumb?: Crumb[];
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, breadcrumb, description, actions }: PageHeaderProps) {
  return (
    <div className={styles.root}>
      <div>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
