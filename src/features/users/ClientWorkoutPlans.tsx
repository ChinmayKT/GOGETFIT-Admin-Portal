import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Select } from "../../components/forms/Select";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { listUserWorkoutPlans, type ClientWorkoutPlan, type ClientWorkoutPlans as ClientWorkoutPlansData, type WorkoutPlanExercise } from "../../api/adminUsers";
import { resolveMediaUrl } from "../../api/media";
import { formatCalendarDay, formatDate } from "../../utils/format";
import { addDays } from "./ClientDietPlans";
import styles from "./ClientDetailPage.module.css";

/**
 * Workout Plans - the coach-assigned workout plans of one member, read-only,
 * laid out like the Diet Plans tab: pick a plan or a day, then the plan's
 * blocks and exercises. The day decides which plan is shown, using the
 * server's shownDays (a newer active plan wins a shared day) - the portal
 * never re-derives it. Each plan's selected days are shown exactly as stored -
 * never as a continuous range or a weekly schedule. Sets and reps are the raw
 * text the coach wrote ("12-15", "15sec").
 */

export type WorkoutPlansState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: ClientWorkoutPlansData };

/** Loads a member's workout plans with the page, for the tab's count. */
export function useClientWorkoutPlans(userId: string | undefined) {
  const [state, setState] = useState<WorkoutPlansState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setState({ status: "loading" });
    listUserWorkoutPlans(userId)
      .then((res) => {
        if (stale) return;
        setState(res && Array.isArray(res.workoutPlans) ? { status: "ready", data: res } : { status: "error" });
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [userId, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

const PERIOD: Record<NonNullable<ClientWorkoutPlan["period"]>, { label: string; tone: StatusTone }> = {
  current: { label: "Current", tone: "success" },
  upcoming: { label: "Upcoming", tone: "info" },
  past: { label: "Past", tone: "neutral" },
};

const coachLabel = (p: ClientWorkoutPlan) =>
  p.coach?.name ?? (p.legacy?.createdBy != null ? `Not linked (legacy creator #${p.legacy.createdBy})` : "Not linked");

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const planName = (p: ClientWorkoutPlan) => p.name.trim() || "Untitled plan";

const range = (p: ClientWorkoutPlan) => (p.fromDate ? `${formatCalendarDay(p.fromDate)} → ${formatCalendarDay(p.toDate)}` : "No assigned dates");

// ─── which plan the member sees ─────────────────────────────────────────────

/** The plan the member sees on [day] (the server's shownDays, newest first), or null. */
export const workoutOnDay = (plans: ClientWorkoutPlan[], day: string) =>
  plans.find((p) => p.status === "active" && p.shownDays.includes(day)) ?? null;

/** Every day some plan is shown, sorted. */
const shownCalendar = (plans: ClientWorkoutPlan[]) =>
  [...new Set(plans.filter((p) => p.status === "active").flatMap((p) => p.shownDays))].sort();

/** Where to open: today if a plan is shown on it, else the latest shown day before it, else the next one. */
export const initialWorkoutDay = (data: ClientWorkoutPlansData) => {
  const { workoutPlans, today } = data;
  const calendar = shownCalendar(workoutPlans);
  if (calendar.length === 0) return workoutPlans[0]?.fromDate ?? today;
  if (calendar.includes(today)) return today;
  const past = calendar.filter((d) => d < today);
  return past.length ? past[past.length - 1] : calendar[0];
};

const planLabel = (p: ClientWorkoutPlan) =>
  [
    planName(p),
    range(p),
    plural(p.counts.days, "day"),
    p.period ? PERIOD[p.period].label : null,
    p.coach?.name ?? null,
    p.status === "archived" ? "Archived" : null,
  ]
    .filter(Boolean)
    .join(" · ");

// ─── components ─────────────────────────────────────────────────────────────

export function ClientWorkoutPlans({ state, onRetry }: { state: WorkoutPlansState; onRetry: () => void }) {
  const data = state.status === "ready" ? state.data : null;
  const [day, setDay] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  // Open on the first load (and after a retry) at the most useful day.
  useEffect(() => {
    if (!data) return;
    const start = initialWorkoutDay(data);
    setDay(start);
    const shown = workoutOnDay(data.workoutPlans, start);
    setPlanId(shown?.id ?? (shownCalendar(data.workoutPlans).length ? null : (data.workoutPlans[0]?.id ?? null)));
  }, [data]);

  const byId = useMemo(() => new Map((data?.workoutPlans ?? []).map((p) => [p.id, p])), [data]);

  if (state.status === "loading")
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  if (state.status === "error") return <ErrorState onRetry={onRetry} />;
  if (!data || data.workoutPlans.length === 0) {
    return (
      <GlassCard>
        <EmptyState title="No workout plans" description="No workout plans assigned to this client." />
      </GlassCard>
    );
  }
  if (!day) return null;

  const plans = data.workoutPlans;
  const goToDay = (next: string) => {
    setDay(next);
    setPlanId(workoutOnDay(plans, next)?.id ?? null);
  };
  const choosePlan = (id: string) => {
    const chosen = byId.get(id);
    if (!chosen) return;
    // Open the plan on a day the member sees it: today if it is shown today, else its
    // first shown day; a plan newer ones hide entirely opens on its first assigned day.
    const shownDays = chosen.status === "active" ? chosen.shownDays : [];
    setPlanId(chosen.id);
    setDay(shownDays.includes(data.today) ? data.today : (shownDays[0] ?? chosen.days[0] ?? day));
  };

  const plan = planId ? (byId.get(planId) ?? null) : null;
  const shownPlan = workoutOnDay(plans, day);
  const calendar = shownCalendar(plans);

  return (
    <div className={styles.purchases}>
      <GlassCard>
        <div className={styles.dpToolbar}>
          <label className={styles.dpField}>
            <span className={styles.statLabel}>Workout plan</span>
            <Select
              aria-label="Workout plan"
              value={plan?.id ?? ""}
              placeholder="No plan on this day"
              onChange={(e) => choosePlan(e.target.value)}
              options={plans.map((p) => ({ value: p.id, label: planLabel(p) }))}
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
          {plural(plans.length, "plan")} · where plans share a day, the member sees the newer one
          {calendar.length
            ? ` · plans run ${formatCalendarDay(calendar[0])} → ${formatCalendarDay(calendar[calendar.length - 1])}`
            : " · none is on the member's calendar"}
        </p>
      </GlassCard>

      {!plan ? (
        <GlassCard>
          <EmptyState
            title={`No workout plan on ${formatCalendarDay(day)}`}
            description="The member sees no workout plan on this day. Use the plan list or move to a day a plan covers."
          />
        </GlassCard>
      ) : (
        <>
          {shownPlan?.id !== plan.id && (
            <div className={styles.dpNotice} role="note">
              <AlertTriangle size={16} aria-hidden />
              {plan.status === "archived"
                ? "This plan is archived; the member no longer sees it."
                : shownPlan
                  ? `On ${formatCalendarDay(day)} the member sees “${planName(shownPlan)}”, a newer assignment, instead of this plan.`
                  : `This plan is not assigned on ${formatCalendarDay(day)}.`}
            </div>
          )}
          <PlanSummary plan={plan} day={day} onDay={setDay} />
          {plan.blocks.length === 0 ? (
            <GlassCard>
              <EmptyState title="No workout blocks" description="The coach assigned this plan without any blocks. The member sees an empty plan on its days." />
            </GlassCard>
          ) : (
            plan.blocks.map((b) => (
              <GlassCard key={b.blockId}>
                <section aria-label={`Block ${b.order + 1}: ${b.name}`}>
                  <div className={styles.dpMealHead}>
                    <p className={styles.planName}>
                      Block {b.order + 1} · {b.name.trim() || "Untitled block"}
                    </p>
                    <span className="text-caption">{plural(b.exercises.length, "exercise")}</span>
                  </div>
                  {b.exercises.length === 0 ? (
                    <span className="text-caption">No exercises in this block. The member sees it empty.</span>
                  ) : (
                    <div className={styles.foodList}>
                      {b.exercises.map((e, i) => (
                        <ExerciseRow key={`${e.workoutId ?? "missing"}-${i}`} exercise={e} />
                      ))}
                    </div>
                  )}
                </section>
              </GlassCard>
            ))
          )}
        </>
      )}
    </div>
  );
}

/** The plan's header, counts and every assigned date; a date opens that day with this plan kept. */
function PlanSummary({ plan, day, onDay }: { plan: ClientWorkoutPlan; day: string; onDay: (day: string) => void }) {
  const hidden = plan.days.length - plan.shownDays.length;
  const shown = new Set(plan.shownDays);

  return (
    <GlassCard>
      <div className={styles.dpHead}>
        <div>
          <p className={styles.planName}>{planName(plan)}</p>
          <span className="text-caption">
            {[
              range(plan),
              plural(plan.counts.days, "assigned day"),
              `Coach ${coachLabel(plan)}`,
              plan.assignedAt ? `Assigned ${formatDate(plan.assignedAt)}` : null,
              plan.legacy ? `Legacy plan #${plan.legacy.workoutPlanId}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <div className={styles.dpBadges}>
          {plan.period && <StatusBadge label={PERIOD[plan.period].label} tone={PERIOD[plan.period].tone} />}
          {plan.status === "archived" && <StatusBadge label="Archived" tone="neutral" />}
        </div>
      </div>

      <dl className={styles.statGrid} aria-label="Plan summary" style={{ marginTop: 16 }}>
        <Stat label="Blocks" value={String(plan.counts.blocks)} />
        <Stat label="Exercises" value={String(plan.counts.exercises)} />
        <Stat label="Assigned Days" value={String(plan.counts.days)} />
        <Stat label="Days Member Sees It" value={plan.status === "archived" ? "0 (archived)" : String(plan.shownDays.length)} />
      </dl>

      {plan.status === "active" && hidden > 0 && (
        <div className={styles.dpNotice} role="note" style={{ marginTop: 16 }}>
          <AlertTriangle size={16} aria-hidden />
          {plan.shownDays.length === 0
            ? "A newer plan is assigned on every one of this plan's days, so the member never sees it."
            : `On ${plural(hidden, "day")} a newer plan is assigned too, and the member sees that one instead.`}
        </div>
      )}

      <p className={styles.qaSectionTitle} style={{ marginTop: 20 }}>
        Assigned dates
      </p>
      {plan.days.length === 0 ? (
        <span className="text-caption">This plan has no assigned dates; the member never sees it.</span>
      ) : (
        <ul className={styles.wpDays} aria-label="Assigned dates">
          {plan.days.map((d) => (
            <li key={d}>
              <button
                type="button"
                className={[styles.dpRun, d === day ? styles.dpRunActive : null, shown.has(d) ? null : styles.wpDayHidden].filter(Boolean).join(" ")}
                aria-pressed={d === day}
                title={shown.has(d) ? "The member sees this plan" : "The member sees a newer plan on this day"}
                onClick={() => onDay(d)}
              >
                {formatCalendarDay(d)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/** One exercise: library identity on the left, the prescription exactly as written on the right. */
function ExerciseRow({ exercise: e }: { exercise: WorkoutPlanExercise }) {
  const [broken, setBroken] = useState(false);
  const name = e.name ?? "Unknown exercise";
  const src = resolveMediaUrl(e.thumbnail?.url ?? null);
  const meta = [e.primaryMuscle, e.equipment, e.type].filter(Boolean).join(" · ");
  return (
    <article className={styles.foodRow} aria-label={name}>
      <div className={styles.foodRowImage}>
        {src && !broken ? <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} /> : <Dumbbell size={16} aria-label="No image" />}
      </div>
      <div className={styles.foodRowIdentity}>
        <p className={styles.foodRowName}>
          <span title={name}>{name}</span>
        </p>
        {meta && <span className={styles.foodRowMeta}>{meta}</span>}
        {e.missingWorkout && <span className={styles.foodRowWarning}>No longer in the exercise library</span>}
        {e.archived && <span className={styles.foodRowMeta}>Archived in the exercise library</span>}
        {e.note && <span className={styles.foodRowMeta}>Note: {e.note}</span>}
      </div>
      <div className={styles.foodRowNutrition} aria-label={`Sets ${e.setsRaw ?? "—"}, reps or time ${e.repsRaw ?? "—"}`}>
        <span className={styles.dpKcal}>
          Sets <strong>{e.setsRaw?.trim() || "—"}</strong>
        </span>
        <span className={styles.dpKcal}>
          Reps / time <strong>{e.repsRaw?.trim() || "—"}</strong>
        </span>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue} style={{ margin: 0 }}>
        {value}
      </dd>
    </div>
  );
}
