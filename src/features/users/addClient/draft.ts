import type { AdminUser } from "../../../types/admin";
import type { CoachRecord } from "../../../types/coach";
import type { Coupon } from "../../../types/coupons";
import type { GogetfitPlanRow } from "../../../types/gogetfitPlans";
import type { ManualEnrollmentInput, PaymentMethod } from "../../../api/enrolledClients";

/**
 * Add Client form state. Lives in the page for the whole flow, so Back never
 * loses data. Holds the chosen records themselves (from the real APIs), so the
 * summary and review never need a second lookup.
 */

export type { PaymentMethod };

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

/** Methods whose payment can only be traced by its reference - the server requires it too. */
export const REFERENCE_REQUIRED: PaymentMethod[] = ["upi", "bank_transfer"];

export const methodLabel = (m: PaymentMethod) => PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m;

export interface Draft {
  user: AdminUser | null;
  plan: GogetfitPlanRow | null;
  coach: CoachRecord | null;
  coupon: Coupon | null;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  /** Once the admin edits End Date, a plan/start change no longer overwrites it. */
  endTouched: boolean;
  method: PaymentMethod;
  /** Kept as typed; parsed when validated. */
  amount: string;
  /** Once the admin edits the amount, a plan or coupon change no longer overwrites it. */
  amountTouched: boolean;
  paymentDate: string;
  reference: string;
  notes: string;
}

export const STEPS = ["Client", "Enrollment", "Payment", "Review"] as const;
export type StepIndex = 0 | 1 | 2 | 3;

/** Local calendar day as yyyy-mm-dd. */
export const isoDay = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * The plan's end date: start + the plan's duration in weeks - the same rule the
 * legacy start call used (05 Mar + 12 weeks = 28 May).
 */
export const planEndDate = (start: string, weeks: number) => {
  const [y, m, d] = start.split("-").map(Number);
  if (!y || !m || !d) return "";
  return isoDay(new Date(y, m - 1, d + weeks * 7));
};

export const emptyDraft = (today = isoDay()): Draft => ({
  user: null,
  plan: null,
  coach: null,
  coupon: null,
  enrollmentDate: today,
  startDate: "",
  endDate: "",
  endTouched: false,
  method: "cash",
  amount: "",
  amountTouched: false,
  paymentDate: today,
  reference: "",
  notes: "",
});

/** A coach offers exactly the plans of their own level (the backend enforces the same rule). */
export const coachOffersPlan = (coach: CoachRecord, plan: GogetfitPlanRow | null) =>
  !plan?.coachLevel || coach.profile.level === plan.coachLevel;

/**
 * Plan price after the coupon, by the legacy rule the server also uses: the
 * discount is truncated to whole rupees (₹4,999 at 10% → ₹4,500). Preview only -
 * the server recalculates it when the enrollment is created.
 */
export const pricing = (d: Draft) => {
  if (!d.plan) return null;
  const price = d.plan.pricing.basePrice;
  const percent = d.coupon?.discount.value ?? 0;
  const discount = Math.trunc((price * percent) / 100);
  return { price, percent, discount, due: price - discount };
};

/** Applies a change, keeping the derived defaults (end date, amount, coach) in step with it. */
export const update = (d: Draft, patch: Partial<Draft>): Draft => {
  const next = { ...d, ...patch };
  if ("plan" in patch && next.coach && !coachOffersPlan(next.coach, next.plan)) next.coach = null;
  if (("plan" in patch || "startDate" in patch) && !next.endTouched && next.plan && next.startDate) {
    next.endDate = planEndDate(next.startDate, next.plan.durationWeeks);
  }
  if (("plan" in patch || "coupon" in patch) && !next.amountTouched) {
    const p = pricing(next);
    next.amount = p ? String(p.due) : "";
  }
  return next;
};

export const parseAmount = (s: string) => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

export type Errors = Partial<Record<keyof Draft, string>>;

/**
 * Two kinds of messages:
 *  - `errors`: something entered is wrong - shown next to the field straight away.
 *  - `missing`: required and still empty - only disables Continue, never shouted at.
 * Everything else (user/plan/coach/coupon still valid, pricing) is the server's job.
 */
export const validateStep = (step: StepIndex, d: Draft): { errors: Errors; missing: (keyof Draft)[] } => {
  const errors: Errors = {};
  const missing: (keyof Draft)[] = [];
  const need = (key: keyof Draft, ok: boolean) => {
    if (!ok) missing.push(key);
  };

  if (step === 0) need("user", Boolean(d.user));

  if (step === 1) {
    need("plan", Boolean(d.plan));
    need("coach", Boolean(d.coach));
    need("enrollmentDate", Boolean(d.enrollmentDate));
    // Start and End Date are optional; only an impossible range is an error.
    if (d.startDate && d.endDate && d.endDate < d.startDate) errors.endDate = "End Date must be on or after the Start Date.";
  }

  if (step === 2) {
    const amount = parseAmount(d.amount);
    need("amount", amount !== null);
    if (amount !== null && (Number.isNaN(amount) || amount < 0 || !Number.isInteger(amount))) {
      errors.amount = "Enter a whole amount in rupees, 0 or more.";
    }
    need("paymentDate", Boolean(d.paymentDate));
    if (REFERENCE_REQUIRED.includes(d.method)) need("reference", d.reference.trim() !== "");
  }

  if (step === 3) {
    for (const s of [0, 1, 2] as StepIndex[]) {
      const r = validateStep(s, d);
      Object.assign(errors, r.errors);
      missing.push(...r.missing);
    }
  }

  return { errors, missing };
};

export const isStepValid = (step: StepIndex, d: Draft) => {
  const { errors, missing } = validateStep(step, d);
  return Object.keys(errors).length === 0 && missing.length === 0;
};

/** The request body: ids and the admin's own entries only - never prices or discounts. */
export const toPayload = (d: Draft): ManualEnrollmentInput => ({
  userId: d.user!.id,
  planId: d.plan!.id,
  coachId: d.coach!.id,
  couponId: d.coupon?.id ?? null,
  enrollDate: d.enrollmentDate,
  startDate: d.startDate || null,
  endDate: d.endDate || null,
  payment: {
    method: d.method,
    amount: Number(d.amount),
    paymentDate: d.paymentDate,
    referenceId: d.reference.trim() || null,
    notes: d.notes.trim() || null,
  },
});

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** "918123260930" → "+91 81232 60930"; anything else is shown as stored. */
export const formatPhone = (normalized: string | null) => {
  if (!normalized) return "—";
  const m = /^91(\d{5})(\d{5})$/.exec(normalized);
  return m ? `+91 ${m[1]} ${m[2]}` : `+${normalized}`;
};

export const durationLabel = (weeks: number) => `${weeks} week${weeks === 1 ? "" : "s"}`;
