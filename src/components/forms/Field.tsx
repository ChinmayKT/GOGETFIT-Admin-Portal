import { cloneElement, isValidElement, useId, Children, type ReactNode, type ReactElement } from "react";
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

interface AssociableProps {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Auto-associates the label with its control via `htmlFor`/`id` so screen readers
 * announce the label when the control receives focus — pass `htmlFor` explicitly
 * only when the child isn't a single element (e.g. a custom composite control).
 */
export function Field({ label, required, helperText, error, children, htmlFor, className }: FieldProps) {
  const generatedId = useId();
  const canAssociate = !htmlFor && Children.count(children) === 1 && isValidElement(children);
  const controlId = htmlFor ?? (canAssociate ? generatedId : undefined);
  const messageId = error ? `${generatedId}-error` : helperText ? `${generatedId}-helper` : undefined;

  const control = canAssociate
    ? cloneElement(children as ReactElement<AssociableProps>, {
        id: (children as ReactElement<AssociableProps>).props.id ?? controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": messageId,
      })
    : children;

  return (
    <div className={cn(styles.root, className)}>
      {label && (
        <label htmlFor={controlId} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      {control}
      {error ? (
        <p className={styles.error} role="alert" id={messageId}>
          {error}
        </p>
      ) : (
        helperText && (
          <p className={styles.helper} id={messageId}>
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
