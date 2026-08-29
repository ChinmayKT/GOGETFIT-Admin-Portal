import styles from "./ErrorState.module.css";
import { Button } from "../ui/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description = "We couldn't load this data.", onRetry }: ErrorStateProps) {
  return (
    <div className={styles.root}>
      <div className={styles.icon} aria-hidden="true">
        !
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className={styles.action}>
          Try Again
        </Button>
      )}
    </div>
  );
}
