import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Tabs } from "../../components/ui/Tabs";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getDiet, createDiet, updateDiet, emptyMeals } from "../../mock/nutrition/dietRepository";
import { DIET_TYPES } from "../../mock/nutrition/reference";
import { MealGrid } from "./MealGrid";
import type { DietMeal, DietType } from "../../types/nutrition";
import formStyles from "../users/UserFormPage.module.css";
import detailStyles from "../users/UserDetailPage.module.css";

export function DietFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [dietType, setDietType] = useState<DietType>("Veg");
  const [rangeFrom, setRangeFrom] = useState("1200");
  const [rangeTo, setRangeTo] = useState("1500");
  const [meals, setMeals] = useState<DietMeal[]>(emptyMeals());
  const [activeMeal, setActiveMeal] = useState("meal1");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ rangeFrom?: string; rangeTo?: string }>({});
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDiet(id).then((d) => {
      if (!d) return;
      setDietType(d.dietType);
      setRangeFrom(String(d.rangeFrom));
      setRangeTo(String(d.rangeTo));
      setMeals(d.meals);
      setLoading(false);
      setDirty(false);
    });
  }, [id]);

  const blocker = useBlocker(dirty && !saving);

  useEffect(() => {
    if (!dirty || saving) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saving]);

  function markDirty() {
    setDirty(true);
  }

  /** navigate(-1) is a POP navigation, which useBlocker doesn't reliably intercept — so
   * the in-page Back/Cancel actions check `dirty` themselves before leaving. */
  function goBack() {
    if (dirty) {
      setLeaveConfirmOpen(true);
    } else {
      navigate(-1);
    }
  }

  const handleMealsChange = useCallback((mealKey: string, rows: DietMeal["rows"]) => {
    setMeals((prev) => prev.map((m) => (m.key === mealKey ? { ...m, rows } : m)));
    markDirty();
  }, []);

  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, meal) => {
          meal.rows.forEach((r) => {
            acc.calories += r.calories || 0;
            acc.fat += r.fat || 0;
            acc.carbs += r.carbs || 0;
            acc.protein += r.protein || 0;
          });
          return acc;
        },
        { calories: 0, fat: 0, carbs: 0, protein: 0 },
      ),
    [meals],
  );

  function validate(): boolean {
    const next: { rangeFrom?: string; rangeTo?: string } = {};
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!rangeFrom || Number.isNaN(from) || from <= 0) next.rangeFrom = "Enter a valid calorie value";
    if (!rangeTo || Number.isNaN(to) || to <= 0) next.rangeTo = "Enter a valid calorie value";
    if (!next.rangeFrom && !next.rangeTo && from >= to) next.rangeTo = "Range To must be greater than Range From";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { dietType, rangeFrom: Number(rangeFrom), rangeTo: Number(rangeTo), meals };
      if (isEdit && id) {
        await updateDiet(id, payload);
        show("Diet plan updated");
      } else {
        await createDiet(payload);
        show("Diet plan created successfully");
      }
      setDirty(false);
      navigate("/nutrition/diets");
    } finally {
      setSaving(false);
    }
  }

  const tabs = meals.map((m) => ({ key: m.key, label: m.label, count: m.rows.length || undefined }));
  const activeMealData = meals.find((m) => m.key === activeMeal) ?? meals[0];

  if (loading) return <GlassCard><SkeletonForm fields={6} /></GlassCard>;

  return (
    <>
      <button className={formStyles.backLink} onClick={goBack}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Diet Plan" : "Add Diet Plan"}
        breadcrumb={[{ label: "Nutrition", path: "/nutrition/diets" }, { label: "Diet Plans", path: "/nutrition/diets" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={formStyles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Plan Details</p>
          <div className={formStyles.grid}>
            <Field label="Diet Type" required>
              <Select
                value={dietType}
                onChange={(e) => { setDietType(e.target.value as DietType); markDirty(); }}
                options={DIET_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            <Field label="Range From (kcal)" required error={errors.rangeFrom}>
              <Input type="number" min="0" step="50" value={rangeFrom} error={!!errors.rangeFrom}
                onChange={(e) => { setRangeFrom(e.target.value); markDirty(); }} />
            </Field>
            <Field label="Range To (kcal)" required error={errors.rangeTo}>
              <Input type="number" min="0" step="50" value={rangeTo} error={!!errors.rangeTo}
                onChange={(e) => { setRangeTo(e.target.value); markDirty(); }} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Nutrition Totals</p>
          <p className="text-caption" style={{ marginBottom: 16 }}>Calculated live from every meal below — no manual total step required.</p>
          <div className={detailStyles.statGrid}>
            <Stat label="Total Calories" value={`${totals.calories.toFixed(0)} kcal`} />
            <Stat label="Total Fat" value={`${totals.fat.toFixed(1)} g`} />
            <Stat label="Total Carbs" value={`${totals.carbs.toFixed(1)} g`} />
            <Stat label="Total Protein" value={`${totals.protein.toFixed(1)} g`} />
          </div>
        </GlassCard>

        <GlassCard padding="none">
          <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
            <Tabs tabs={tabs} active={activeMeal} onChange={setActiveMeal} />
          </div>
          <div style={{ padding: "var(--space-5)" }}>
            {activeMealData && <MealGrid rows={activeMealData.rows} onChange={(rows) => handleMealsChange(activeMealData.key, rows)} />}
          </div>
        </GlassCard>

        <div className={formStyles.footer}>
          <Button variant="ghost" onClick={goBack}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === "blocked" || leaveConfirmOpen}
        title="Leave without saving?"
        description="You have unsaved changes to this diet plan. If you leave now, your edits will be lost."
        confirmLabel="Discard & Leave"
        tone="danger"
        onConfirm={() => {
          if (blocker.state === "blocked") blocker.proceed();
          if (leaveConfirmOpen) {
            setLeaveConfirmOpen(false);
            setDirty(false);
            navigate(-1);
          }
        }}
        onCancel={() => {
          if (blocker.state === "blocked") blocker.reset();
          setLeaveConfirmOpen(false);
        }}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={detailStyles.stat}>
      <span className={detailStyles.statLabel}>{label}</span>
      <span className={detailStyles.statValue}>{value}</span>
    </div>
  );
}
