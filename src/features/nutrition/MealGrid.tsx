import { useMemo } from "react";
import { Plus, Copy, Trash2 } from "lucide-react";
import { GlassDataSurface } from "../../components/data-display/GlassDataSurface";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { FOOD_UNITS, MEAL_MAX_ROWS } from "../../mock/nutrition/reference";
import { nextId } from "../../mock/shared/utils";
import type { DietFoodRow, FoodUnit } from "../../types/nutrition";
import styles from "./MealGrid.module.css";

const UNIT_OPTIONS = FOOD_UNITS.map((u) => ({ label: u, value: u }));

interface MealGridProps {
  rows: DietFoodRow[];
  onChange: (rows: DietFoodRow[]) => void;
}

function emptyRow(): DietFoodRow {
  return { id: nextId("row"), foodName: "", unit: "Serving", qty: 1, calories: 0, fat: 0, carbs: 0, protein: 0 };
}

export function MealGrid({ rows, onChange }: MealGridProps) {
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          calories: acc.calories + (r.calories || 0),
          fat: acc.fat + (r.fat || 0),
          carbs: acc.carbs + (r.carbs || 0),
          protein: acc.protein + (r.protein || 0),
        }),
        { calories: 0, fat: 0, carbs: 0, protein: 0 },
      ),
    [rows],
  );

  const atCap = rows.length >= MEAL_MAX_ROWS;

  function updateRow(id: string, patch: Partial<DietFoodRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (atCap) return;
    onChange([...rows, emptyRow()]);
  }

  function duplicateRow(id: string) {
    if (atCap) return;
    const source = rows.find((r) => r.id === id);
    if (!source) return;
    const index = rows.findIndex((r) => r.id === id);
    const copy: DietFoodRow = { ...source, id: nextId("row") };
    const next = [...rows];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  function deleteRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  return (
    <GlassDataSurface>
      {rows.length === 0 ? (
        <p className={styles.empty}>No food items yet. Add a row to start building this meal.</p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameCell}>Food Name</th>
                <th className={styles.unitCell}>Unit</th>
                <th className={styles.numCell}>Qty</th>
                <th className={styles.numCell}>Calories</th>
                <th className={styles.numCell}>Fat (g)</th>
                <th className={styles.numCell}>Carbs (g)</th>
                <th className={styles.numCell}>Protein (g)</th>
                <th className={styles.actionsCell} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.nameCell}>
                    <Input value={row.foodName} placeholder="e.g. Boiled Egg" onChange={(e) => updateRow(row.id, { foodName: e.target.value })} />
                  </td>
                  <td className={styles.unitCell}>
                    <Select value={row.unit} onChange={(e) => updateRow(row.id, { unit: e.target.value as FoodUnit })} options={UNIT_OPTIONS} />
                  </td>
                  <td className={styles.numCell}>
                    <Input type="number" min="0" step="0.1" value={row.qty} onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={styles.numCell}>
                    <Input type="number" min="0" step="1" value={row.calories} onChange={(e) => updateRow(row.id, { calories: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={styles.numCell}>
                    <Input type="number" min="0" step="0.1" value={row.fat} onChange={(e) => updateRow(row.id, { fat: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={styles.numCell}>
                    <Input type="number" min="0" step="0.1" value={row.carbs} onChange={(e) => updateRow(row.id, { carbs: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={styles.numCell}>
                    <Input type="number" min="0" step="0.1" value={row.protein} onChange={(e) => updateRow(row.id, { protein: Number(e.target.value) || 0 })} />
                  </td>
                  <td className={styles.actionsCell}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <IconButton icon={<Copy size={14} />} label="Duplicate row" size="sm" onClick={() => duplicateRow(row.id)} disabled={atCap} />
                      <IconButton icon={<Trash2 size={14} />} label="Delete row" size="sm" variant="danger" onClick={() => deleteRow(row.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.subtotalRow}>
                <td colSpan={3}>Meal Subtotal</td>
                <td>{totals.calories.toFixed(0)}</td>
                <td>{totals.fat.toFixed(1)}</td>
                <td>{totals.carbs.toFixed(1)}</td>
                <td>{totals.protein.toFixed(1)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addRow} disabled={atCap}>
          Add Row
        </Button>
        {atCap && <span className={styles.capWarning}>Maximum {MEAL_MAX_ROWS} rows per meal reached — remove a row to add another.</span>}
      </div>
    </GlassDataSurface>
  );
}
