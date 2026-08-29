import styles from "./LiquidBackground.module.css";

/** Ambient near-black canvas with subtle orange glow. Sits behind AppShell, never above content. */
export function LiquidBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />
      <div className={styles.grain} />
    </div>
  );
}
