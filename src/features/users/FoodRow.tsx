import { useState, type ReactNode } from "react";
import { Utensils } from "lucide-react";
import styles from "./ClientDetailPage.module.css";

/**
 * One food in a meal, shared by Diet Plans and Free Diet Plan so both read the
 * same way: identity -> quantity -> nutrition, left to right.
 *
 * Purely presentational: every value arrives already formatted by the caller,
 * which owns where it came from (a coach plan's frozen snapshot, or a free
 * template's authored row). Nothing is calculated here.
 *
 * Rendered as a plain line in the meal (a hairline between foods), not a card.
 *
 * `image` decides the left column:
 *   - undefined: no image column at all (free templates have no Food, so no
 *     picture - the row is intentionally image-less, not broken);
 *   - { src: null }: the column shows the placeholder glyph;
 *   - { src }: the picture, falling back to the glyph if it fails to load.
 */
export interface FoodRowProps {
  name: string;
  image?: { src: string | null; alt: string };
  /** Vegetarian / Non-Vegetarian dot; omitted when the type is unknown. */
  veg?: boolean | null;
  /** Muted line under the name, e.g. brand. */
  meta?: string | null;
  quantity: string;
  calories: string;
  fat: string;
  carbs: string;
  protein: string;
  /** Accessible summary of the macros, e.g. "F 1.6 g · C 24.0 g · P 4.4 g". */
  macrosLabel: string;
  /** Small print under the quantity (a coach plan's per-portion snapshot). */
  footnote?: ReactNode;
  /** A warning line (missing Food), shown in the error colour. */
  warning?: string | null;
}

export function FoodRow({ name, image, veg, meta, quantity, calories, fat, carbs, protein, macrosLabel, footnote, warning }: FoodRowProps) {
  const [broken, setBroken] = useState(false);
  const classes = [styles.foodRow, image ? null : styles.foodRowNoImage].filter(Boolean).join(" ");

  return (
    <article className={classes} aria-label={name}>
      {image && (
        <div className={styles.foodRowImage}>
          {image.src && !broken ? (
            <img src={image.src} alt={image.alt} loading="lazy" onError={() => setBroken(true)} />
          ) : (
            <Utensils size={16} aria-label="No image" />
          )}
        </div>
      )}

      <div className={styles.foodRowIdentity}>
        <p className={styles.foodRowName}>
          {veg != null && <span className={veg ? styles.dpVeg : styles.dpNonVeg} aria-label={veg ? "Vegetarian" : "Non-vegetarian"} />}
          <span title={name}>{name}</span>
        </p>
        {meta && (
          <span className={styles.foodRowMeta} title={meta}>
            {meta}
          </span>
        )}
        {warning && <span className={styles.foodRowWarning}>{warning}</span>}
        <div className={styles.foodRowQuantity}>
          <span className={styles.dpQty}>{quantity}</span>
          {footnote}
        </div>
      </div>

      <div className={styles.foodRowNutrition}>
        <span className={styles.dpKcal}>
          <strong>{calories}</strong> kcal
        </span>
        <div className={styles.dpMacros} aria-label={macrosLabel}>
          <span>
            <em>F</em>
            {fat}
          </span>
          <span>
            <em>C</em>
            {carbs}
          </span>
          <span>
            <em>P</em>
            {protein}
          </span>
        </div>
      </div>
    </article>
  );
}
