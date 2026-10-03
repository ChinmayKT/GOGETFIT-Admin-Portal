import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, Plus, Check } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { GlassModal } from "../../../components/ui/GlassModal";
import { Field } from "../../../components/forms/Field";
import { Input } from "../../../components/forms/Input";
import { Select } from "../../../components/forms/Select";
import { Textarea } from "../../../components/forms/Textarea";
import { listAdminUsers } from "../../../api/adminUsers";
import { resolveMediaUrl } from "../../../api/media";
import { cn } from "../../../utils/cn";
import { formatCalendarDay } from "../../../utils/format";
import type { AdminUser } from "../../../types/admin";
import type { CoachRecord } from "../../../types/coach";
import type { Coupon } from "../../../types/coupons";
import type { GogetfitPlanRow } from "../../../types/gogetfitPlans";
import {
  PAYMENT_METHODS,
  REFERENCE_REQUIRED,
  coachOffersPlan,
  durationLabel,
  formatPhone,
  inr,
  methodLabel,
  parseAmount,
  pricing,
  type Draft,
  type Errors,
  type StepIndex,
} from "./draft";
import styles from "./AddClientPage.module.css";

export interface StepProps {
  draft: Draft;
  errors: Errors;
  onChange: (patch: Partial<Draft>) => void;
}

/** yyyy-mm-dd as DD/MM/YYYY, read as a calendar day (never shifted by timezone). */
export const formatDay = (iso: string) => formatCalendarDay(iso);

export const userName = (u: AdminUser) => u.profile.name ?? u.profile.email ?? "Unnamed user";
export const coachName = (c: CoachRecord) => c.user?.name ?? "Unnamed coach";

// --- Step 1: Client --------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 250;

/** Debounced search over real users (active accounts only - the server refuses others). */
function useUserSearch(query: string) {
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let stale = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      listAdminUsers({ search: q, status: "active", pageSize: 8 })
        .then((page) => {
          if (stale) return;
          setResults(page.rows);
          setFailed(false);
        })
        .catch(() => {
          if (!stale) setFailed(true);
        })
        .finally(() => {
          if (!stale) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return { results, loading, failed };
}

export function UserStep({ draft, onChange }: StepProps) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const selected = draft.user;
  const { results, loading, failed } = useUserSearch(selected ? "" : query);
  const searched = query.trim().length >= 2;

  if (selected) {
    return (
      <section>
        <StepHeading title="Select User" helper="Choose an existing user to enroll as a client." />
        <div className={styles.selectedUser} aria-label="Selected user">
          <span className={styles.selectedLabel}>Selected User</span>
          <div className={styles.userRow}>
            <Avatar name={userName(selected)} src={resolveMediaUrl(selected.profile.profilePicture) ?? undefined} size="lg" />
            <UserText user={selected} strong />
            <Button variant="secondary" onClick={() => onChange({ user: null })}>
              Change User
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <StepHeading title="Select User" helper="Choose an existing user to enroll as a client." />
      <Field label="Search User">
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <Input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone or email"
            autoFocus
          />
        </div>
      </Field>

      {searched && (
        <div className={styles.results} role="list" aria-label="Matching users" aria-busy={loading}>
          {results.map((u) => (
            <div key={u.id} className={styles.resultRow} role="listitem">
              <Avatar name={userName(u)} src={resolveMediaUrl(u.profile.profilePicture) ?? undefined} size="md" />
              <UserText user={u} />
              <Button size="sm" variant="secondary" onClick={() => onChange({ user: u })} aria-label={`Select ${userName(u)}`}>
                Select
              </Button>
            </div>
          ))}
          {loading && results.length === 0 && <div className={cn(styles.noResults, "text-caption")}>Searching…</div>}
          {failed && !loading && <div className={cn(styles.noResults, "text-caption")}>Search failed. Try again.</div>}
          {!loading && !failed && results.length === 0 && (
            <div className={styles.noResults}>
              <span>
                No user matches “{query.trim()}”. <span className="text-caption">Can't find this user?</span>
              </span>
              <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
                Create New User
              </Button>
            </div>
          )}
        </div>
      )}

      <GlassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New User"
        size="sm"
        footer={<Button variant="secondary" onClick={() => setCreateOpen(false)}>Close</Button>}
      >
        <p className="text-caption">
          User creation is handled separately in Users. Create the user there first, then come back and enroll them as a client.
        </p>
      </GlassModal>
    </section>
  );
}

function UserText({ user, strong = false }: { user: AdminUser; strong?: boolean }) {
  return (
    <div className={styles.userText}>
      <span className={strong ? styles.userNameStrong : styles.userName}>{userName(user)}</span>
      <span className="text-caption">
        {formatPhone(user.phone.normalized)}
        {user.profile.email ? ` · ${user.profile.email}` : ""}
      </span>
    </div>
  );
}

// --- Step 2: Enrollment ----------------------------------------------------------------

export function EnrollmentStep({ draft, errors, onChange, plans, coaches }: StepProps & { plans: GogetfitPlanRow[]; coaches: CoachRecord[] }) {
  const plan = draft.plan;
  const eligible = coaches.filter((c) => coachOffersPlan(c, plan));
  return (
    <section>
      <StepHeading title="Enrollment" helper="Choose the plan and coach, and when the plan runs." />
      <div className={styles.grid2}>
        <Field label="Plan" required>
          <Select
            value={plan?.id ?? ""}
            placeholder="Select Plan"
            options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${inr(p.pricing.basePrice)}` }))}
            onChange={(e) => onChange({ plan: plans.find((p) => p.id === e.target.value) ?? null })}
          />
        </Field>
        <Field
          label="Coach"
          required
          htmlFor="add-client-coach"
          helperText={plan?.coachLevel ? `Coaches who offer ${plan.coachLevel} plans.` : undefined}
        >
          <CoachPicker id="add-client-coach" coaches={eligible} value={draft.coach} onChange={(coach) => onChange({ coach })} />
        </Field>
      </div>

      {plan && (
        <div className={styles.planSummary} aria-label="Plan summary">
          <Pair label="Plan" value={plan.name} />
          <Pair label="Duration" value={durationLabel(plan.durationWeeks)} />
          <Pair label="Plan Price" value={inr(plan.pricing.basePrice)} />
        </div>
      )}

      <div className={styles.grid3}>
        <Field label="Enrollment Date" required helperText="The day this enrollment is recorded.">
          <Input type="date" value={draft.enrollmentDate} onChange={(e) => onChange({ enrollmentDate: e.target.value })} />
        </Field>
        <Field label="Start Date" helperText="Optional">
          <Input type="date" value={draft.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </Field>
        <Field
          label="End Date"
          error={errors.endDate}
          helperText={plan && draft.startDate && !draft.endTouched ? `Set from the plan's ${durationLabel(plan.durationWeeks)}.` : "Optional"}
        >
          <Input
            type="date"
            value={draft.endDate}
            error={Boolean(errors.endDate)}
            onChange={(e) => onChange({ endDate: e.target.value, endTouched: true })}
          />
        </Field>
      </div>
    </section>
  );
}

/** A searchable single-select for coaches: name, specialization, level - nothing else. */
function CoachPicker({
  id,
  coaches,
  value,
  onChange,
}: {
  id: string;
  coaches: CoachRecord[];
  value: CoachRecord | null;
  onChange: (coach: CoachRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const options = coaches.filter(
    (c) =>
      !q ||
      coachName(c).toLowerCase().includes(q) ||
      (c.profile.specialization ?? "").toLowerCase().includes(q) ||
      c.profile.level.toLowerCase().includes(q),
  );

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (c: CoachRecord) => {
    onChange(c);
    setOpen(false);
    setQuery("");
  };
  const detail = (c: CoachRecord) => [c.profile.specialization, c.profile.level].filter(Boolean).join(" · ");

  return (
    <div className={styles.picker} ref={root}>
      <button
        id={id}
        type="button"
        className={cn(styles.pickerTrigger, !value && styles.pickerPlaceholder)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? (
          <span className={styles.coachLine}>
            <span>{coachName(value)}</span>
            <span className="text-caption">{detail(value)}</span>
          </span>
        ) : (
          "Select Coach"
        )}
      </button>
      {open && (
        <div className={styles.pickerPanel}>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coach" aria-label="Search coach" autoFocus />
          <div role="listbox" aria-label="Coaches" className={styles.pickerList}>
            {options.map((c) => (
              <div
                key={c.id}
                role="option"
                aria-selected={c.id === value?.id}
                tabIndex={0}
                className={cn(styles.pickerOption, c.id === value?.id && styles.pickerOptionActive)}
                onClick={() => choose(c)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choose(c))}
              >
                <span className={styles.coachName}>{coachName(c)}</span>
                <span className="text-caption">{detail(c)}</span>
                {c.id === value?.id && <Check size={14} className={styles.pickerCheck} aria-hidden="true" />}
              </div>
            ))}
            {options.length === 0 && <div className={cn(styles.pickerOption, "text-caption")}>No coach matches.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step 3: Payment -------------------------------------------------------------------

const couponLabel = (c: Coupon) => `${c.code} · ${c.discount.value}% off · ${c.visibility === "public" ? "Public" : "Private"}`;

export function PaymentStep({ draft, errors, onChange, coupons }: StepProps & { coupons: Coupon[] }) {
  const needsReference = REFERENCE_REQUIRED.includes(draft.method);
  const coupon = draft.coupon;
  const p = pricing(draft);
  return (
    <section>
      <StepHeading title="Payment" helper="Record the payment collected during manual onboarding." />

      <Field label="Payment Method" required htmlFor="add-client-method">
        <div id="add-client-method" className={cn(styles.segmented, styles.segmented4)} role="radiogroup" aria-label="Payment Method">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={draft.method === m.value}
              className={cn(styles.segment, draft.method === m.value && styles.segmentActive)}
              onClick={() => onChange({ method: m.value })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Only coupons active today - public or private - can be applied. */}
      <Field
        label="Coupon"
        helperText={
          coupon
            ? `${coupon.discount.value}% off${p ? ` · saves ${inr(p.discount)} · price ${inr(p.due)}` : ""} · valid till ${formatDay(coupon.validTo)}`
            : `Optional · ${coupons.length} active coupon${coupons.length === 1 ? "" : "s"}`
        }
      >
        <Select
          value={coupon?.id ?? ""}
          options={[{ value: "", label: "No coupon" }, ...coupons.map((c) => ({ value: c.id, label: couponLabel(c) }))]}
          onChange={(e) => onChange({ coupon: coupons.find((c) => c.id === e.target.value) ?? null })}
        />
      </Field>

      {/* For a transfer the reference is how the money is traced, so it comes first and is required. */}
      {needsReference && (
        <Field
          label="Transaction / Reference ID"
          required
          helperText={draft.method === "upi" ? "UPI transaction ID / UTR." : "Bank reference / UTR."}
          className={styles.prominent}
        >
          <Input value={draft.reference} placeholder="Enter reference" onChange={(e) => onChange({ reference: e.target.value })} />
        </Field>
      )}

      <div className={styles.grid2}>
        <Field label="Amount Received" required error={errors.amount}>
          <div className={styles.amountWrap}>
            <span className={styles.amountPrefix} aria-hidden="true">
              ₹
            </span>
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className={styles.amountInput}
              value={draft.amount}
              error={Boolean(errors.amount)}
              aria-label="Amount Received"
              onChange={(e) => onChange({ amount: e.target.value, amountTouched: true })}
            />
          </div>
        </Field>
        <Field label="Payment Date" required>
          <Input type="date" value={draft.paymentDate} onChange={(e) => onChange({ paymentDate: e.target.value })} />
        </Field>
      </div>

      {!needsReference && (
        <Field label={draft.method === "cash" ? "Receipt / Reference" : "Reference"}>
          <Input value={draft.reference} placeholder="Optional" onChange={(e) => onChange({ reference: e.target.value })} />
        </Field>
      )}

      <Field label="Notes">
        <Textarea value={draft.notes} rows={3} placeholder="Optional" onChange={(e) => onChange({ notes: e.target.value })} />
      </Field>
    </section>
  );
}

/** Plan price, coupon discount, price due vs. amount received - the difference spelled out. */
export function PaymentSummary({ draft }: { draft: Draft }) {
  const p = pricing(draft);
  const coupon = draft.coupon;
  const amount = parseAmount(draft.amount);
  const valid = amount !== null && !Number.isNaN(amount);
  const diff = p && valid ? amount - p.due : 0;
  return (
    <div className={styles.paymentSummary} aria-label="Payment summary">
      <Row label="Plan Price" value={p ? inr(p.price) : "—"} />
      {coupon && p && (
        <>
          <Row label={`Coupon ${coupon.code} (${coupon.discount.value}%)`} value={`−${inr(p.discount)}`} />
          <Row label="Price after Coupon" value={inr(p.due)} />
        </>
      )}
      <Row label="Amount Received" value={valid ? inr(amount) : "—"} />
      <Row label="Payment Method" value={methodLabel(draft.method)} />
      {p && valid && diff !== 0 && (
        <div className={cn(styles.summaryRow, styles.diff)} role="status">
          <span>{diff < 0 ? "Short by" : "Over by"}</span>
          <span>{inr(Math.abs(diff))}</span>
        </div>
      )}
    </div>
  );
}

// --- Step 4: Review --------------------------------------------------------------------

export function ReviewStep({ draft, onEdit }: { draft: Draft; onEdit: (step: StepIndex) => void }) {
  const { user, plan, coach, coupon } = draft;
  const p = pricing(draft);
  const amount = parseAmount(draft.amount);
  return (
    <section>
      <StepHeading title="Review Client" helper="Check everything before creating the client." />
      <div className={styles.review}>
        <ReviewSection title="Client" onEdit={() => onEdit(0)}>
          {user && (
            <div className={styles.userRow}>
              <Avatar name={userName(user)} src={resolveMediaUrl(user.profile.profilePicture) ?? undefined} size="md" />
              <UserText user={user} strong />
            </div>
          )}
        </ReviewSection>

        <ReviewSection title="Enrollment" onEdit={() => onEdit(1)}>
          <p className={styles.reviewPlan}>{plan?.name ?? "—"}</p>
          <p className="text-caption" style={{ marginBottom: 12 }}>
            Coach: {coach ? coachName(coach) : "—"}
          </p>
          <div className={styles.grid3}>
            <Pair label="Enrollment Date" value={formatDay(draft.enrollmentDate)} />
            <Pair label="Start Date" value={formatDay(draft.startDate)} />
            <Pair label="End Date" value={formatDay(draft.endDate)} />
          </div>
        </ReviewSection>

        <ReviewSection title="Payment" onEdit={() => onEdit(2)}>
          <div className={styles.grid3}>
            <Pair label="Plan Price" value={p ? inr(p.price) : "—"} />
            <Pair label="Coupon" value={coupon ? `${coupon.code} · ${coupon.discount.value}% off` : "—"} />
            <Pair label="Price after Coupon" value={coupon && p ? inr(p.due) : "—"} />
            <Pair label="Amount Received" value={amount !== null && !Number.isNaN(amount) ? inr(amount) : "—"} />
            <Pair label="Payment Method" value={methodLabel(draft.method)} />
            <Pair label="Reference" value={draft.reference.trim() || "—"} />
          </div>
          {draft.notes.trim() && (
            <div style={{ marginTop: 12 }}>
              <Pair label="Notes" value={draft.notes.trim()} />
            </div>
          )}
        </ReviewSection>
      </div>
    </section>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className={styles.reviewSection}>
      <div className={styles.reviewHead}>
        <span className={styles.reviewTitle}>{title}</span>
        <button type="button" className={styles.editLink} onClick={onEdit} aria-label={`Edit ${title}`}>
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

// --- shared bits ----------------------------------------------------------------------

function StepHeading({ title, helper }: { title: string; helper: string }) {
  return (
    <div className={styles.stepHeading}>
      <h2 className="text-title">{title}</h2>
      <p className="text-caption">{helper}</p>
    </div>
  );
}

export function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.pair}>
      <span className={styles.pairLabel}>{label}</span>
      <span className={styles.pairValue}>{value}</span>
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
