import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Select } from "../../components/forms/Select";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import {
  listUserDietPlans,
  type ClientDietPlan,
  type ClientDietPlans as ClientDietPlansData,
  type DietPlanFood,
  type DietScheduleRange,
} from "../../api/adminUsers";
import { resolveMediaUrl } from "../../api/media";
import { formatCalendarDay, formatDate } from "../../utils/format";
import { dash } from "./clientFormat";
import { FoodRow } from "./FoodRow";
import styles from "./ClientDetailPage.module.css";

/**
 * Diet Plans - the coach-assigned plans of one member, read-only, laid out like
 * the app's "Your Diet Plan": plan summary (coach, goal, BMR/TDEE, targets
 * against what is planned), then each meal with its foods.
 *
 * Every assignment covers one run of days. The day the admin looks at decides
 * which assignment is shown, using the server's schedule (the member's own
 * rule: newest assignment wins on a shared day) - the portal never re-derives it.
 * Food numbers are the plan's frozen snapshot, scaled by the server.
 */

export type DietPlansState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: ClientDietPlansData };

/** Loads a member's diet plans with the page, for the tab's count. */
export function useClientDietPlans(userId: string | undefined) {
  const [state, setState] = useState<DietPlansState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setState({ status: "loading" });
    listUserDietPlans(userId)
      .then((res) => {
        if (stale) return;
        setState(res && Array.isArray(res.dietPlans) && Array.isArray(res.schedule) ? { status: "ready", data: res } : { status: "error" });
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [userId, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

// ─── day arithmetic on YYYY-MM-DD ──────────────────────────────────────────

export const addDays = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00.000Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The assignment the member sees on [day], or null. */
export const planOnDay = (schedule: DietScheduleRange[], day: string) =>
  schedule.find((r) => r.from <= day && day <= r.to)?.dietPlanId ?? null;

/** The first day [planId] is actually shown, or null when newer plans hide every one of its days. */
export const firstShownDay = (schedule: DietScheduleRange[], planId: string) =>
  schedule.find((r) => r.dietPlanId === planId)?.from ?? null;

/** Where to open: today if a plan covers it, else the latest shown day before it, else the next one. */
export const initialDay = (data: ClientDietPlansData) => {
  const { schedule, today } = data;
  if (schedule.length === 0) return data.dietPlans[0]?.fromDate ?? today;
  if (planOnDay(schedule, today)) return today;
  const past = schedule.filter((r) => r.to < today);
  return past.length ? past[past.length - 1].to : schedule[0].from;
};

// ─── formatting ─────────────────────────────────────────────────────────────

/** One decimal, as the app shows plan nutrition. */
const n1 = (value: number | null | undefined) => (value === null || value === undefined ? "—" : value.toFixed(1));
const whole = (value: number | null | undefined) => (value === null || value === undefined ? "—" : String(Math.round(value)));

const PERIOD: Record<ClientDietPlan["period"], { label: string; tone: StatusTone }> = {
  current: { label: "Current", tone: "success" },
  upcoming: { label: "Upcoming", tone: "info" },
  past: { label: "Past", tone: "neutral" },
};

const coachLabel = (p: ClientDietPlan) =>
  p.coach?.name ?? (p.legacyCreatedBy !== null ? `Not linked (legacy creator #${p.legacyCreatedBy})` : "Not linked");

const range = (p: ClientDietPlan) => `${formatCalendarDay(p.fromDate)} → ${formatCalendarDay(p.toDate)}`;

/**
 * One logical plan (planId) and its date runs. A plan assigned on sparse days
 * is several documents; the plan list shows it once, like the tab's count.
 */
export interface PlanGroup {
  planId: string;
  runs: ClientDietPlan[];
}

/** Plans in the server's order (newest assignment first), each with its runs by date. */
export const groupPlans = (plans: ClientDietPlan[]): PlanGroup[] => {
  const groups = new Map<string, ClientDietPlan[]>();
  for (const p of plans) groups.set(p.planId, [...(groups.get(p.planId) ?? []), p]);
  return [...groups].map(([planId, runs]) => ({ planId, runs: [...runs].sort((a, b) => a.fromDate.localeCompare(b.fromDate)) }));
};

/** A plan is current if any run is, else upcoming if any run is, else past. */
const groupPeriod = (g: PlanGroup): ClientDietPlan["period"] =>
  g.runs.some((r) => r.period === "current") ? "current" : g.runs.some((r) => r.period === "upcoming") ? "upcoming" : "past";

const groupLabel = (g: PlanGroup) => {
  const first = g.runs[0];
  const last = g.runs[g.runs.length - 1];
  return [
    first.name.trim(),
    `${formatCalendarDay(first.fromDate)} → ${formatCalendarDay(last.toDate)}`,
    g.runs.length > 1 ? `${g.runs.length} date ranges` : null,
    PERIOD[groupPeriod(g)].label,
    first.coach?.name ?? null,
    g.runs.every((r) => r.status === "archived") ? "Archived" : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

// ─── components ─────────────────────────────────────────────────────────────

export function ClientDietPlans({ state, onRetry }: { state: DietPlansState; onRetry: () => void }) {
  const data = state.status === "ready" ? state.data : null;
  const [day, setDay] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  // Open on the first load (and after a retry) at the most useful day.
  useEffect(() => {
    if (!data) return;
    const start = initialDay(data);
    setDay(start);
    setPlanId(planOnDay(data.schedule, start) ?? (data.schedule.length ? null : (data.dietPlans[0]?.id ?? null)));
  }, [data]);

  const byId = useMemo(() => new Map((data?.dietPlans ?? []).map((p) => [p.id, p])), [data]);
  const groups = useMemo(() => groupPlans(data?.dietPlans ?? []), [data]);

  if (state.status === "loading")
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  if (state.status === "error") return <ErrorState onRetry={onRetry} />;
  if (!data || data.dietPlans.length === 0) {
    return (
      <GlassCard>
        <EmptyState title="No diet plans" description="No coach has assigned a diet plan to this member." />
      </GlassCard>
    );
  }
  if (!day) return null;

  const goToDay = (next: string) => {
    setDay(next);
    setPlanId(planOnDay(data.schedule, next));
  };
  const choosePlan = (key: string) => {
    const group = groups.find((g) => g.planId === key);
    if (!group) return;
    // Open the plan on a day the member actually sees it: today if one of its runs is
    // shown today, else its first shown day; a plan newer ones hide entirely opens on its first day.
    const ids = new Set(group.runs.map((r) => r.id));
    const todays = planOnDay(data.schedule, data.today);
    if (todays && ids.has(todays)) {
      setPlanId(todays);
      setDay(data.today);
      return;
    }
    const shown = group.runs.map((r) => ({ run: r, day: firstShownDay(data.schedule, r.id) })).find((x) => x.day);
    setPlanId(shown?.run.id ?? group.runs[0].id);
    setDay(shown?.day ?? group.runs[0].fromDate);
  };

  const plan = planId ? (byId.get(planId) ?? null) : null;
  const shownOnDay = planOnDay(data.schedule, day);
  const shownPlan = shownOnDay ? byId.get(shownOnDay) : null;
  const first = data.schedule[0]?.from;
  const last = data.schedule[data.schedule.length - 1]?.to;

  return (
    <div className={styles.purchases}>
      <GlassCard>
        <div className={styles.dpToolbar}>
          <label className={styles.dpField}>
            <span className={styles.statLabel}>Diet plan</span>
            <Select
              aria-label="Diet plan"
              value={plan?.planId ?? ""}
              placeholder="No plan on this day"
              onChange={(e) => choosePlan(e.target.value)}
              options={groups.map((g) => ({ value: g.planId, label: groupLabel(g) }))}
            />
          </label>
          <div className={styles.dpField}>
            <span className={styles.statLabel}>Day</span>
            <div className={styles.dpDateNav}>
              <IconButton icon={<ChevronLeft size={16} />} label="Previous day" size="sm" onClick={() => goToDay(addDays(day, -1))} />
              <input
                type="date"
                aria-label="Day"
                className={styles.dpDateInput}
                value={day}
                onChange={(e) => e.target.value && goToDay(e.target.value)}
              />
              <IconButton icon={<ChevronRight size={16} />} label="Next day" size="sm" onClick={() => goToDay(addDays(day, 1))} />
              <Button size="sm" variant="ghost" onClick={() => goToDay(data.today)}>
                Today
              </Button>
            </div>
          </div>
        </div>
        <p className="text-caption" style={{ marginTop: 12 }}>
          {groups.length} plan{groups.length === 1 ? "" : "s"}
          {data.dietPlans.length !== groups.length && ` over ${data.dietPlans.length} date ranges`}
          {first && last ? ` · plans run ${formatCalendarDay(first)} → ${formatCalendarDay(last)}` : " · none is on the member's calendar"}
          {data.missingFoodIds.length > 0 && ` · ${data.missingFoodIds.length} food reference(s) missing`}
        </p>
      </GlassCard>

      {!plan ? (
        <GlassCard>
          <EmptyState
            title={`No diet plan on ${formatCalendarDay(day)}`}
            description="The member sees no diet plan on this day. Use the plan list or move to a day a plan covers."
          />
        </GlassCard>
      ) : (
        <>
          {shownOnDay !== plan.id && (
            <div className={styles.dpNotice} role="note">
              <AlertTriangle size={16} aria-hidden />
              {shownPlan
                ? `On ${formatCalendarDay(day)} the member sees “${shownPlan.name.trim()}”, a newer assignment, instead of this plan.`
                : plan.status === "archived"
                  ? "This plan is archived; the member no longer sees it."
                  : `This plan is not shown on ${formatCalendarDay(day)}.`}
            </div>
          )}
          <PlanSummary plan={plan} runs={groups.find((g) => g.planId === plan.planId)?.runs ?? [plan]} onRun={(r) => { setPlanId(r.id); setDay(firstShownDay(data.schedule, r.id) ?? r.fromDate); }} />
          {plan.meals.length === 0 ? (
            <GlassCard>
              <EmptyState title="No meals in this plan" description="The coach assigned this plan without any food. The member sees an empty plan on its days." />
            </GlassCard>
          ) : (
            plan.meals.map((m) => (
              <GlassCard key={m.meal}>
                <div className={styles.dpMealHead}>
                  <p className={styles.planName}>{m.label}</p>
                  <span className="text-caption">
                    {n1(m.totals.calories)} kcal · F {n1(m.totals.fat)} g · C {n1(m.totals.carbs)} g · P {n1(m.totals.protein)} g
                  </span>
                </div>
                <div className={styles.foodList}>
                  {m.foods.map((f, i) => (
                    <FoodCard key={`${f.foodId}-${i}`} food={f} />
                  ))}
                </div>
              </GlassCard>
            ))
          )}
        </>
      )}
    </div>
  );
}

function PlanSummary({ plan, runs, onRun }: { plan: ClientDietPlan; runs: ClientDietPlan[]; onRun: (run: ClientDietPlan) => void }) {
  const period = PERIOD[plan.period];
  return (
    <GlassCard>
      <div className={styles.dpHead}>
        <div>
          <p className={styles.planName}>{plan.name.trim()}</p>
          <span className="text-caption">
            {[
              `${range(plan)} · ${plan.days} day${plan.days === 1 ? "" : "s"}`,
              `Coach ${coachLabel(plan)}`,
              plan.enrollment ? `Enrollment ${dash(plan.enrollment.planName)}` : "No enrollment",
              plan.assignedAt ? `Assigned ${formatDate(plan.assignedAt)}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <div className={styles.dpBadges}>
          <StatusBadge label={period.label} tone={period.tone} />
          {plan.status === "archived" && <StatusBadge label="Archived" tone="neutral" />}
        </div>
      </div>

      {runs.length > 1 && (
        <div className={styles.dpRuns} aria-label="Date ranges">
          <span className={styles.statLabel}>Date ranges</span>
          {runs.map((r) => (
            <button
              key={r.id}
              type="button"
              className={r.id === plan.id ? `${styles.dpRun} ${styles.dpRunActive}` : styles.dpRun}
              aria-pressed={r.id === plan.id}
              onClick={() => onRun(r)}
            >
              {range(r)}
            </button>
          ))}
        </div>
      )}

      <dl className={styles.statGrid} aria-label="Plan snapshot" style={{ marginTop: 20 }}>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Goal</dt>
          <dd className={styles.statValue} style={{ margin: 0 }}>{dash(plan.goal)}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>BMR</dt>
          <dd className={styles.statValue} style={{ margin: 0 }}>{plan.bmr === null ? "—" : `${whole(plan.bmr)} kcal`}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>TDEE</dt>
          <dd className={styles.statValue} style={{ margin: 0 }}>{plan.tdee === null ? "—" : `${whole(plan.tdee)} kcal`}</dd>
        </div>
      </dl>

      <p className={styles.qaSectionTitle} style={{ marginTop: 24 }}>Daily target vs planned</p>
      <div className={styles.dpTargets}>
        <TargetBar label="Calories" unit="kcal" planned={plan.totals.calories} target={plan.targets?.calories ?? null} />
        <TargetBar label="Protein" unit="g" planned={plan.totals.protein} target={plan.targets?.protein ?? null} />
        <TargetBar label="Carbs" unit="g" planned={plan.totals.carbs} target={plan.targets?.carbs ?? null} />
        <TargetBar label="Fat" unit="g" planned={plan.totals.fat} target={plan.targets?.fat ?? null} />
      </div>
    </GlassCard>
  );
}

function TargetBar({ label, unit, planned, target }: { label: string; unit: string; planned: number; target: number | null }) {
  const pct = target ? Math.round((planned / target) * 100) : null;
  return (
    <div className={styles.dpTarget}>
      <div className={styles.dpTargetHead}>
        <span className={styles.statLabel}>{label}</span>
        <span className="text-caption">{pct === null ? "No target" : `${pct}%`}</span>
      </div>
      <p className={styles.statValue}>
        {n1(planned)} <span className="text-caption">/ {target === null ? "—" : `${target} ${unit}`}</span>
      </p>
      <div className={styles.dpBar} role="meter" aria-label={`${label} planned against target`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct ?? 0, 100)}>
        <span className={pct !== null && pct > 100 ? styles.dpBarOver : undefined} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
      </div>
    </div>
  );
}

/**
 * One coach-assigned food. Identity (name, brand, image, type) is the current
 * Food; quantity and every number are the plan's frozen assignment snapshot,
 * exactly as the API returned them.
 */
function FoodCard({ food }: { food: DietPlanFood }) {
  const name = food.food?.name ?? "Food not found";
  const foodType = food.food?.foodType;
  const per = food.perPortion;
  const n = food.nutrition;
  const perTitle = `The plan's frozen values for ${food.portion} ${food.servingUnit}: ${n1(per.calories)} kcal · F ${n1(per.fat)} g · C ${n1(per.carbs)} g · P ${n1(per.protein)} g`;
  return (
    <FoodRow
      name={name}
      image={{ src: resolveMediaUrl(food.food?.image?.url ?? null), alt: name }}
      veg={foodType === "Vegetarian" ? true : foodType === "Non-Vegetarian" ? false : null}
      meta={food.food?.brand ?? null}
      warning={food.missingFood ? `Reference ${food.foodId} no longer exists in the Food Database` : null}
      quantity={`${food.qty} ${food.servingUnit}`}
      footnote={
        <span className={styles.dpPer} title={perTitle}>
          Per {food.portion} {food.servingUnit}: {n1(per.calories)} kcal
        </span>
      }
      calories={n1(n.calories)}
      fat={`${n1(n.fat)}g`}
      carbs={`${n1(n.carbs)}g`}
      protein={`${n1(n.protein)}g`}
      macrosLabel={`F ${n1(n.fat)} g · C ${n1(n.carbs)} g · P ${n1(n.protein)} g`}
    />
  );
}
