import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./controls.module.css";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export function Select({ error, className, options, placeholder, ...rest }: SelectProps) {
  return (
    <div className={styles.selectWrap}>
      <select className={cn(styles.select, error && styles.errorState, className)} {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={styles.selectIcon} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
