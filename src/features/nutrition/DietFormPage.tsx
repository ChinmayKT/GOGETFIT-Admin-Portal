import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
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
import {
  createFreeDietPlan,
  getFreeDietPlan,
  updateFreeDietPlan,
  toMeals,
} from "../../api/freeDietPlans";
import { ApiError } from "../../api/client";
import { DIET_TYPES } from "../../mock/nutrition/reference";
import { MealGrid } from "./MealGrid";
import type { DietMeal, DietType } from "../../types/nutrition";
import formStyles from "../users/UserFormPage.module.css";
import detailStyles from "../users/UserDetailPage.module.css";

/** mode="view" renders the stored plan read-only, with an Edit action into the editor. */
export function DietFormPage({ mode = "edit" }: { mode?: "view" | "edit" }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const readOnly = mode === "view";
  const navigate = useNavigate();
  const { show } = useToast();

  const [dietType, setDietType] = useState<DietType>("Veg.");
  const [rangeFrom, setRangeFrom] = useState("1200");
  const [rangeTo, setRangeTo] = useState("1500");
  // All five meal tabs exist in the editor even when the stored plan has fewer;
  // empty ones are dropped again on save rather than written back as empty meals.
  const [meals, setMeals] = useState<DietMeal[]>(toMeals([]));
  const [activeMeal, setActiveMeal] = useState("meal1");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ rangeFrom?: string; rangeTo?: string }>({});
  const [loadError, setLoadError] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getFreeDietPlan(id)
      .then((plan) => {
        if (cancelled) return;
        // Populated from the stored document - never from a hardcoded default.
        setDietType(plan.dietType);
        setRangeFrom(String(plan.rangeFrom));
        setRangeTo(String(plan.rangeTo));
        setMeals(plan.meals);
        setLoading(false);
        setDirty(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
        await updateFreeDietPlan(id, payload);
        show("Free diet plan updated");
      } else {
        await createFreeDietPlan(payload);
        show("Free diet plan created successfully");
      }
      setDirty(false);
      navigate("/nutrition/freediets");
    } catch (cause) {
      // The backend owns validation and the duplicate-band rule, so its message
      // is what the operator needs to see.
      show(
        cause instanceof ApiError ? cause.message : "Could not save the diet plan. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const tabs = meals.map((m) => ({ key: m.key, label: m.label, count: m.rows.length || undefined }));
  const activeMealData = meals.find((m) => m.key === activeMeal) ?? meals[0];

  if (loading) return <GlassCard><SkeletonForm fields={6} /></GlassCard>;

  if (loadError) {
    return (
      <GlassCard>
        <p className="text-title" style={{ marginBottom: 8 }}>Could not load this diet plan</p>
        <p className="text-caption" style={{ marginBottom: 20 }}>
          The plan may have been deleted, or the server could not be reached.
        </p>
        <Button variant="primary" onClick={() => navigate("/nutrition/freediets")}>
          Back to Free Diet Plans
        </Button>
      </GlassCard>
    );
  }

  return (
    <>
      <button className={formStyles.backLink} onClick={goBack}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={readOnly ? "Free Diet Plan" : isEdit ? "Edit Free Diet Plan" : "Add Free Diet Plan"}
        breadcrumb={[
          { label: "Nutrition", path: "/nutrition/freediets" },
          { label: "Free Diet Plans", path: "/nutrition/freediets" },
          { label: readOnly ? "View" : isEdit ? "Edit" : "Add" },
        ]}
        actions={
          readOnly && id ? (
            <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/nutrition/freediets/${id}/edit`)}>
              Edit Plan
            </Button>
          ) : undefined
        }
      />

      <div className={formStyles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Plan Details</p>
          <div className={formStyles.grid}>
            <Field label="Diet Type" required>
              <Select
                disabled={readOnly}
                value={dietType}
                onChange={(e) => { setDietType(e.target.value as DietType); markDirty(); }}
                options={DIET_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            <Field label="Range From (kcal)" required error={errors.rangeFrom}>
              <Input disabled={readOnly} type="number" min="0" step="50" value={rangeFrom} error={!!errors.rangeFrom}
                onChange={(e) => { setRangeFrom(e.target.value); markDirty(); }} />
            </Field>
            <Field label="Range To (kcal)" required error={errors.rangeTo}>
              <Input disabled={readOnly} type="number" min="0" step="50" value={rangeTo} error={!!errors.rangeTo}
                onChange={(e) => { setRangeTo(e.target.value); markDirty(); }} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Nutrition Totals</p>
          {!readOnly && <p className="text-caption" style={{ marginBottom: 16 }}>Calculated live from every meal below — no manual total step required.</p>}
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
            {activeMealData && <MealGrid readOnly={readOnly} rows={activeMealData.rows} onChange={(rows) => handleMealsChange(activeMealData.key, rows)} />}
          </div>
        </GlassCard>

        {!readOnly && (
          <div className={formStyles.footer}>
            <Button variant="ghost" onClick={goBack}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              {isEdit ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        )}
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
