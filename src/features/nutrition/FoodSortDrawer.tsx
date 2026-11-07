import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { GripVertical, Info } from "lucide-react";
import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Select } from "../../components/forms/Select";
import {
  SORT_CHOICES,
  describeRules,
  metricInfo,
  moveRule,
  toRows,
  toRules,
  type SortChoice,
  type SortRow,
  type SortRule,
} from "./foodSort";
import styles from "./FoodSortDrawer.module.css";

interface FoodSortDrawerProps {
  open: boolean;
  /** The applied rules (null = none): the rows start from these. */
  applied: SortRule[] | null;
  /** The list's own sort, which orders foods tied on every rule. */
  tieBreakLabel: string;
  /** Called with the rules to apply; empty when every nutrient is None. */
  onApply: (rules: SortRule[]) => void;
  onReset: () => void;
  /** Close without applying: the edits since opening are dropped. */
  onClose: () => void;
}

/**
 * Sort Food Database: all four nutrients, always listed, each None, High to
 * low or Low to high. Top to bottom is the priority (drag, or arrow keys on
 * the handle, to change it); None rows are left out. Edits are a draft until
 * Apply sorting; Cancel, Esc, the backdrop and the close button discard them.
 * Mount it with a new key per opening so each opening starts from [applied].
 */
export function FoodSortDrawer({ open, applied, tieBreakLabel, onApply, onReset, onClose }: FoodSortDrawerProps) {
  const [rows, setRows] = useState<SortRow[]>(() => toRows(applied));
  const [armed, setArmed] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const handles = useRef<(HTMLButtonElement | null)[]>([]);
  const focusAfterMove = useRef<number | null>(null);

  // Keyboard reordering keeps focus on the row that moved.
  useEffect(() => {
    if (focusAfterMove.current === null) return;
    handles.current[focusAfterMove.current]?.focus();
    focusAfterMove.current = null;
  }, [rows]);

  const choose = (index: number, choice: SortChoice) =>
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, choice } : r)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    focusAfterMove.current = to;
    setRows((rs) => moveRule(rs, from, to));
  };
  const onHandleKey = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      move(index, index - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(index, index + 1);
    }
  };

  const rules = toRules(rows);
  // Each row's place among the nutrients in use; null for None.
  const priorities = rows.map((r, i) =>
    r.choice === "none" ? null : rows.slice(0, i + 1).filter((x) => x.choice !== "none").length,
  );

  return (
    <GlassDrawer
      open={open}
      onClose={onClose}
      title="Sort Food Database"
      description="Choose how to order foods by nutrition values. Rules are applied from top to bottom."
      width={460}
      animateExit
      footer={
        <>
          <Button onClick={onReset}>Reset</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onApply(rules)}>
            Apply sorting
          </Button>
        </>
      }
    >
      <section className={styles.card} aria-labelledby="food-sort-rules">
        <div className={styles.cardHead}>
          <h3 id="food-sort-rules" className={styles.cardTitle}>
            Sorting Rules
          </h3>
          <StatusBadge label={`${rules.length} active`} tone={rules.length > 0 ? "success" : "neutral"} />
        </div>

        <ol className={styles.rules} aria-label="Sorting rules, highest priority first">
          {rows.map((row, index) => {
            const { label } = metricInfo(row.metric);
            const priority = priorities[index];
            const active = priority !== null;
            return (
              <li
                key={row.metric}
                className={[styles.rule, dragFrom === index ? styles.dragging : "", active ? "" : styles.off].join(" ")}
                draggable={armed === index}
                onDragStart={(e) => {
                  setDragFrom(index);
                  e.dataTransfer?.setData("text/plain", String(index));
                }}
                onDragOver={(e) => dragFrom !== null && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) setRows((rs) => moveRule(rs, dragFrom, index));
                  setDragFrom(null);
                  setArmed(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setArmed(null);
                }}
              >
                <button
                  ref={(el) => {
                    handles.current[index] = el;
                  }}
                  type="button"
                  className={styles.handle}
                  aria-label={`Reorder ${label}: use the arrow up and down keys`}
                  onPointerDown={() => setArmed(index)}
                  onPointerUp={() => setArmed(null)}
                  onKeyDown={(e) => onHandleKey(e, index)}
                >
                  <GripVertical size={18} aria-hidden />
                </button>
                <span className={styles.number} aria-hidden>
                  {active ? priority : "–"}
                </span>
                <div className={styles.fields}>
                  <span className={styles.ruleLabel}>
                    {!active ? "Not sorted" : priority === 1 ? "Primary sort" : "Then sort by"}
                  </span>
                  <div className={styles.selects}>
                    <span className={styles.metric}>{label}</span>
                    <Select
                      aria-label={`${label} order`}
                      value={row.choice}
                      onChange={(e) => choose(index, e.target.value as SortChoice)}
                      options={SORT_CHOICES}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className={styles.info}>
          <Info size={16} aria-hidden />
          <span>
            Set High to low or Low to high on the nutrients to sort by; None leaves one out.
            <br />
            Drag a row to change its priority.
          </span>
        </p>
      </section>

      <section className={styles.card} aria-labelledby="food-sort-preview">
        <h3 id="food-sort-preview" className={styles.cardTitle}>
          Preview
        </h3>
        <p className={styles.preview} aria-live="polite">
          {rules.length > 0 ? `Example order: ${describeRules(rules)}` : `No nutrition sort: ${tieBreakLabel}`}
        </p>
        {rules.length > 0 && (
          <p className={styles.tieBreak}>Foods tied on every rule follow the list's sort: {tieBreakLabel}.</p>
        )}
      </section>
    </GlassDrawer>
  );
}
