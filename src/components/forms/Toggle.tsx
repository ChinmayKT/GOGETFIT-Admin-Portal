import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={styles.root} data-disabled={disabled || undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={styles.track}
        data-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
