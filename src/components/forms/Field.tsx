import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Field.module.css";

interface FieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Field({ label, required, helperText, error, children, htmlFor, className }: FieldProps) {
  return (
    <div className={cn(styles.root, className)}>
      {label && (
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        helperText && <p className={styles.helper}>{helperText}</p>
      )}
    </div>
  );
}
