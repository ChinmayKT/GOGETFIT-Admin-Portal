import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { getUserFreeDietPlan, type FreeDietPlanFood, type UserFreeDietPlan } from "../../api/adminUsers";
import { ACTIVITY_LEVELS, FITNESS_GOALS, FOOD_TYPES } from "../../constants/fitnessProfile";
import { FoodRow } from "./FoodRow";
import styles from "./ClientDetailPage.module.css";

/**
 * Free Diet Plan - the template the backend matched to this user from their
 * fitness profile. Not a coach's diet plan (that is the Diet Plans tab).
 * Read-only: every figure is the backend's - BMR and TDEE as stored, the
 * target from the match service, the range from the template itself.
 */

export type FreeDietPlanState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: UserFreeDietPlan };

/** Loads a user's Free Diet Plan with the page. */
export function useUserFreeDietPlan(userId: string | undefined) {
  const [state, setState] = useState<FreeDietPlanState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setState({ status: "loading" });
    getUserFreeDietPlan(userId)
      .then((res) => {
        if (stale) return;
        setState(res && typeof res.status === "string" && res.fitness ? { status: "ready", data: res } : { status: "error" });
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [userId, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

const kcal = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${Math.round(value).toLocaleString("en-IN")} kcal/day`;
const num = (value: number | null | undefined, unit = "") =>
  value === null || value === undefined ? "—" : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
const labelOf = (list: { value: string; label: string }[], value: string | null) =>
  value === null ? "—" : (list.find((o) => o.value === value)?.label ?? value);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue} style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

function FitnessSnapshot({ data }: { data: UserFreeDietPlan }) {
  const f = data.fitness;
  const range = data.freeDietPlan?.range;
  return (
    <GlassCard>
      <p className={styles.qaSectionTitle}>Fitness Snapshot</p>
      <dl className={styles.statGrid} aria-label="Fitness snapshot">
        <Stat label="BMR" value={kcal(f.bmr)} />
        <Stat label="TDEE" value={kcal(f.tdee)} />
        <Stat label="Target Calories" value={kcal(data.match.lookupCalories)} />
        <Stat
          label="Plan Range"
          value={range && range.from !== null && range.to !== null ? `${range.from.toLocaleString("en-IN")} – ${range.to.toLocaleString("en-IN")} kcal/day` : "—"}
        />
        <Stat label="Goal" value={labelOf(FITNESS_GOALS, f.goal)} />
        <Stat label="Food Type" value={labelOf(FOOD_TYPES, f.foodType)} />
        <Stat label="Activity Level" value={labelOf(ACTIVITY_LEVELS, f.activityLevel)} />
        <Stat label="Height" value={num(f.height, " cm")} />
        <Stat label="Weight" value={num(f.weight, " kg")} />
      </dl>
      <p className="text-caption" style={{ marginTop: 12 }}>
        Target calories come from BMR, TDEE and goal; the Free Diet Plan is the template for this food type whose range contains that target.
      </p>
    </GlassCard>
  );
}

/**
 * One authored template food, in the same row as a coach plan's food. No image
 * column: a template row names a food but references no Food document, so there
 * is no picture to show and none is looked up. Values are the template's own.
 */
function TemplateFoodRow({ food }: { food: FreeDietPlanFood }) {
  const quantity = [food.quantity === null ? null : num(food.quantity), food.unit].filter(Boolean).join(" ") || "—";
  return (
    <FoodRow
      name={food.foodName ?? "—"}
      meta={food.foodType}
      quantity={quantity}
      calories={num(food.calories)}
      fat={`${num(food.fat)}g`}
      carbs={`${num(food.carbs)}g`}
      protein={`${num(food.protein)}g`}
      macrosLabel={`F ${num(food.fat)} g · C ${num(food.carbs)} g · P ${num(food.protein)} g`}
    />
  );
}

function PlanCard({ data }: { data: UserFreeDietPlan }) {
  const plan = data.freeDietPlan!;
  const t = plan.totals;
  return (
    <>
      {data.planMatchesProfile === false && (
        <div className={styles.dpNotice} role="note">
          <AlertTriangle size={16} aria-hidden />
          The fitness profile changed after this plan was assigned; it is matched again the next time the profile is saved.
        </div>
      )}
      <GlassCard>
        <div className={styles.dpHead}>
          <div>
            <p className="text-caption">Assigned Free Diet Plan</p>
            <p className={styles.planName}>
              {plan.dietType ?? "Free Diet Plan"} · {plan.range.from?.toLocaleString("en-IN")} – {plan.range.to?.toLocaleString("en-IN")} kcal
            </p>
            <span className="text-caption">
              {[`${plan.mealCount} meals`, `${plan.foodCount} foods`, plan.legacyPlanId !== null ? `Legacy plan #${plan.legacyPlanId}` : null].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className={styles.dpBadges}>
            <StatusBadge label="Assigned" tone="success" />
            {plan.status === "archived" && <StatusBadge label="Template archived" tone="warning" />}
          </div>
        </div>
        <dl className={styles.statGrid} aria-label="Plan nutrition" style={{ marginTop: 20 }}>
          <Stat label="Calories" value={`${Math.round(t.calories).toLocaleString("en-IN")} kcal`} />
          <Stat label="Protein" value={num(t.protein, " g")} />
          <Stat label="Carbs" value={num(t.carbs, " g")} />
          <Stat label="Fat" value={num(t.fat, " g")} />
        </dl>
        <p className="text-caption" style={{ marginTop: 12 }}>
          <Link to={`/nutrition/freediets/${plan.id}`}>View template in Free Diet Plans →</Link>
        </p>
      </GlassCard>

      <p className="text-title">Plan Content</p>
      {plan.meals.length === 0 ? (
        <GlassCard>
          <EmptyState title="No meals in this template" description="The template was authored without any food." />
        </GlassCard>
      ) : (
        plan.meals.map((m) => {
          const kcalSum = m.foods.reduce((n, f) => n + (f.calories ?? 0), 0);
          return (
            <GlassCard key={m.mealId}>
              <div className={styles.dpMealHead}>
                <p className={styles.planName}>Meal {m.mealId}</p>
                <span className="text-caption">
                  {m.foods.length} {m.foods.length === 1 ? "food" : "foods"} · {num(Number(kcalSum.toFixed(1)))} kcal
                </span>
              </div>
              {m.foods.length === 0 ? (
                <EmptyState title="No foods in this meal" />
              ) : (
                <div className={styles.foodList}>
                  {m.foods.map((f, i) => (
                    <TemplateFoodRow key={`${m.mealId}-${f.legacyPlanMealId ?? i}-${i}`} food={f} />
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })
      )}
    </>
  );
}

export function UserFreeDietPlanTab({ state, onRetry }: { state: FreeDietPlanState; onRetry: () => void }) {
  if (state.status === "loading")
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  if (state.status === "error") return <ErrorState onRetry={onRetry} />;
  const { data } = state;

  if (data.status === "no_fitness") {
    return (
      <GlassCard>
        <EmptyState title="Fitness information not available" description="This user has not entered fitness details in the app yet, so no Free Diet Plan can be matched." />
      </GlassCard>
    );
  }

  return (
    <div className={styles.purchases}>
      <FitnessSnapshot data={data} />

      {data.status === "assigned" && <PlanCard data={data} />}

      {data.status === "incomplete" && (
        <GlassCard>
          <EmptyState
            title="Free Diet Plan not available"
            description="Complete the required fitness information to generate a free diet plan."
          />
          <div className={styles.fdpMissing} aria-label="Missing information">
            <span className={styles.statLabel}>Missing</span>
            {data.missing.map((m) => (
              <StatusBadge key={m.field} label={m.label} tone="warning" />
            ))}
          </div>
        </GlassCard>
      )}

      {data.status === "not_assigned" && (
        <GlassCard>
          <EmptyState
            title="Free Diet Plan not assigned"
            description={`No ${data.match.dietType ?? ""} Free Diet Plan template covers a target of ${data.match.lookupCalories?.toLocaleString("en-IN") ?? "—"} kcal/day.`}
          />
        </GlassCard>
      )}

      {data.status === "plan_missing" && (
        <GlassCard>
          <EmptyState
            title="Assigned plan not found"
            description="This user points at a Free Diet Plan template that no longer exists. It is matched again the next time the profile is saved."
          />
        </GlassCard>
      )}
    </div>
  );
}
