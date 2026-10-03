import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { useToast } from "../../components/feedback/ToastProvider";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { createAdminUser, getAdminUser, updateAdminUser } from "../../api/adminUsers";
import { ApiError } from "../../api/client";
import { cn } from "../../utils/cn";
import {
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
  FOOD_TYPES,
  GENDER_OPTIONS,
  HEIGHT_FEET,
  PROFILE_LIMITS,
  feetToCm,
  ageInYears,
  computeBmr,
  computeBodyFatPercentage,
  computeTdee,
  type ActivityLevel,
  type FitnessGoal,
  type FoodType,
  type Gender,
} from "../../constants/fitnessProfile";
import styles from "./AddUserPage.module.css";

/**
 * Add User / Edit User - one form. Add onboards a NORMAL user (POST
 * /api/admin/users); Edit saves the same fields for an existing user (PATCH
 * /api/admin/users/:id) with the phone locked, since it is the login.
 *
 * No role/user-type choice: the account is always role "user". Age is derived
 * from DOB; body fat %, BMR and TDEE are shown as a preview with the app's own
 * formulas and recalculated by the server when the user is created.
 */

export interface UserFormState {
  phone: string;
  name: string;
  email: string;
  dateOfBirth: string;
  gender: Gender | "";
  city: string;
  /** Decimal feet as typed (the app's unit); converted to cm for saving. */
  height: string;
  weight: string;
  activityLevel: ActivityLevel | "";
  foodType: FoodType | "";
  goal: FitnessGoal | "";
}

const EMPTY: UserFormState = {
  phone: "",
  name: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  city: "",
  height: "",
  weight: "",
  activityLevel: "",
  foodType: "",
  goal: "",
};

type Errors = Partial<Record<keyof UserFormState, string>>;

/** The app's own email rule (lib/core/utils/validators.dart). Optional, as in Edit Profile. */
const APP_EMAIL_PATTERN = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

const num = (s: string) => (s.trim() === "" ? null : Number(s));

/** The height in cm the app would save for the feet typed, or null if it is not a valid height. */
export const heightCm = (feet: string): number | null => {
  const ft = num(feet);
  if (ft === null || Number.isNaN(ft) || ft < HEIGHT_FEET.min || ft > HEIGHT_FEET.max) return null;
  // The app's wheel moves in 0.1 ft steps.
  if (Math.abs(ft * 10 - Math.round(ft * 10)) > 1e-9) return null;
  return feetToCm(ft);
};

/**
 * Edit only: the user's stored height and weight are kept exactly unless the
 * admin changes them, so opening and saving never rounds an existing value.
 */
export interface FormContext {
  edit?: boolean;
  originalHeightCm?: number | null;
  heightTouched?: boolean;
}

/** Weight bounds: the app's wheel on add; on edit, the range the app's own save accepts. */
const weightLimits = (ctx: FormContext) => (ctx.edit ? { min: 10, max: 500 } : PROFILE_LIMITS.weight);

/** The height in cm that will be saved. */
export const effectiveHeightCm = (f: UserFormState, ctx: FormContext = {}) =>
  ctx.edit && !ctx.heightTouched && ctx.originalHeightCm ? ctx.originalHeightCm : heightCm(f.height);

/** cm → the app's decimal feet, for showing a stored height in the feet box. */
const cmToFeet = (cm: number | null) => (cm ? (cm / 30.48).toFixed(1) : "");

export function validateUserForm(f: UserFormState, today = new Date(), ctx: FormContext = {}): Errors {
  const e: Errors = {};
  if (!ctx.edit && !/^\+?[\d\s-]{10,16}$/.test(f.phone.trim())) e.phone = "Enter a valid mobile number.";
  if (f.name.trim().length < 2) e.name = "Enter the user's name.";
  if (f.email.trim() !== "" && !APP_EMAIL_PATTERN.test(f.email.trim())) e.email = "Enter a valid email address.";
  const age = f.dateOfBirth ? ageInYears(f.dateOfBirth, today) : null;
  if (!f.dateOfBirth) e.dateOfBirth = "Select the date of birth.";
  else if (age === null || age < PROFILE_LIMITS.minAge || age > PROFILE_LIMITS.maxAge) {
    e.dateOfBirth = `Age must be between ${PROFILE_LIMITS.minAge} and ${PROFILE_LIMITS.maxAge}.`;
  }
  if (!f.gender) e.gender = "Select a gender.";
  if (f.city.trim() === "") e.city = "Enter a city.";
  if (effectiveHeightCm(f, ctx) === null) e.height = `Height must be ${HEIGHT_FEET.min.toFixed(1)}–${HEIGHT_FEET.max.toFixed(1)} ft, in 0.1 steps.`;
  const w = num(f.weight);
  const wl = weightLimits(ctx);
  if (w === null || Number.isNaN(w) || w < wl.min || w > wl.max) e.weight = `Weight must be ${wl.min}–${wl.max} kg.`;
  if (!f.activityLevel) e.activityLevel = "Select an activity level.";
  if (!f.foodType) e.foodType = "Select a food type.";
  if (!f.goal) e.goal = "Select a goal.";
  return e;
}

/** The app's figures for the form as it stands; null until their inputs exist. */
export function previewFigures(f: UserFormState, today = new Date(), ctx: FormContext = {}) {
  const age = f.dateOfBirth ? ageInYears(f.dateOfBirth, today) : null;
  const h = effectiveHeightCm(f, ctx);
  const w = num(f.weight);
  if (age === null || age < 0 || !f.gender || !h || !w || Number.isNaN(h) || Number.isNaN(w)) {
    return { age, bodyFat: null, bmr: null, tdee: null };
  }
  const bmr = computeBmr(f.gender, w, h, age);
  return {
    age,
    bodyFat: computeBodyFatPercentage(f.gender, w, h, age),
    bmr,
    tdee: f.activityLevel ? computeTdee(bmr, f.activityLevel) : null,
  };
}

const pick = <T extends string>(value: string | null | undefined, allowed: readonly { value: T }[]): T | "" =>
  (allowed.find((o) => o.value === value)?.value ?? "") as T | "";

export function AddUserPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { show } = useToast();
  const [form, setForm] = useState<UserFormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [originalHeightCm, setOriginalHeightCm] = useState<number | null>(null);
  const [heightTouched, setHeightTouched] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);

  // Edit: load the user into the same form.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getAdminUser(id)
      .then((u) => {
        if (cancelled) return;
        const fp = u.profile.fitnessProfile;
        setForm({
          phone: u.phone.normalized ?? "",
          name: u.profile.name ?? "",
          email: u.profile.email ?? "",
          dateOfBirth: u.profile.dateOfBirth ?? "",
          gender: u.profile.gender ?? "",
          city: u.profile.city ?? "",
          height: cmToFeet(fp.height),
          weight: fp.weight === null ? "" : String(fp.weight),
          activityLevel: pick(fp.activityLevel, ACTIVITY_LEVELS),
          foodType: pick(fp.foodType, FOOD_TYPES),
          goal: pick(fp.goal, FITNESS_GOALS),
        });
        setOriginalHeightCm(fp.height);
        setHeightTouched(false);
        setEmailLocked(u.profile.isEmailVerified);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const ctx: FormContext = { edit: isEdit, originalHeightCm, heightTouched };
  const [touched, setTouched] = useState<Partial<Record<keyof UserFormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const errors = useMemo(() => validateUserForm(form, new Date(), ctx), [form, isEdit, originalHeightCm, heightTouched]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const figures = useMemo(() => previewFigures(form, new Date(), ctx), [form, isEdit, originalHeightCm, heightTouched]);
  const savedHeightCm = effectiveHeightCm(form, ctx);
  const shown = (k: keyof UserFormState) => (submitted || touched[k] ? errors[k] : undefined);

  const set = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerError(null);
    if (key === "phone") setPhoneError(null);
    if (key === "height") setHeightTouched(true);
  };
  const touch = (key: keyof UserFormState) => setTouched((t) => ({ ...t, [key]: true }));

  const submit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || saving) return;
    setSaving(true);
    setServerError(null);
    const profile = {
      name: form.name.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      dateOfBirth: form.dateOfBirth,
      gender: form.gender as Gender,
      city: form.city.trim(),
      fitnessProfile: {
        height: savedHeightCm!,
        weight: Number(form.weight),
        activityLevel: form.activityLevel as ActivityLevel,
        foodType: form.foodType as FoodType,
        goal: form.goal as FitnessGoal,
      },
    };
    try {
      if (isEdit && id) {
        await updateAdminUser(id, profile);
        show("User updated successfully");
        navigate(`/users/${id}`);
      } else {
        const { user } = await createAdminUser({ phone: form.phone.trim(), ...profile });
        show("User created successfully");
        navigate(`/users/${user.id}`);
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "PHONE_ALREADY_REGISTERED") setPhoneError("A user with this phone number already exists.");
      else if (cause instanceof ApiError && cause.code === "INVALID_PHONE") setPhoneError("This phone number is not valid.");
      else setServerError(cause instanceof ApiError ? cause.message : `Could not ${isEdit ? "save" : "create"} the user. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const fixed = (n: number | null, digits: number) => (n === null ? null : n.toFixed(digits));
  const phoneMessage = phoneError ?? shown("phone");

  const back = isEdit && id ? `/users/${id}` : "/users";
  const header = (
    <>
      <button className={styles.backLink} onClick={() => navigate(back)}>
        <ArrowLeft size={14} /> {isEdit ? "Back to User" : "Back to Users"}
      </button>
      <PageHeader
        title={isEdit ? "Edit User" : "Add User"}
        description={isEdit ? "Update the user's profile. Phone is the login and cannot be changed here." : "Onboard a new user with the same profile the app collects."}
        breadcrumb={[{ label: "People", path: "/users" }, { label: "Users", path: "/users" }, { label: isEdit ? "Edit" : "Add" }]}
      />
    </>
  );

  if (loading) {
    return (
      <>
        {header}
        <GlassCard>
          <SkeletonForm fields={8} />
        </GlassCard>
      </>
    );
  }
  if (notFound) {
    return (
      <>
        {header}
        <EmptyState title="User not found" description="This user may have been removed." />
      </>
    );
  }

  return (
    <>
      {header}

      <GlassCard className={styles.card}>
        <div className={styles.grid}>
          <Field label="Phone" required error={phoneMessage} helperText={isEdit ? "The login - cannot be changed here." : "The number the user signs in with."}>
            <Input
              type="tel"
              disabled={isEdit}
              value={form.phone}
              placeholder="98765 43210"
              error={Boolean(phoneMessage)}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => touch("phone")}
            />
          </Field>
          <Field label="Name" required error={shown("name")}>
            <Input value={form.name} placeholder="Full name" error={Boolean(shown("name"))} onChange={(e) => set("name", e.target.value)} onBlur={() => touch("name")} />
          </Field>

          <Field label="Email" error={shown("email")} helperText={emailLocked ? "Verified by the user - cannot be changed" : "Optional · the user verifies it in the app"}>
            <Input
              type="email"
              disabled={emailLocked}
              value={form.email}
              placeholder="name@example.com"
              error={Boolean(shown("email"))}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => touch("email")}
            />
          </Field>

          <Field label="Gender" required error={shown("gender")} htmlFor="add-user-gender">
            <div id="add-user-gender" className={styles.segmented} role="radiogroup" aria-label="Gender">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  role="radio"
                  aria-checked={form.gender === g.value}
                  className={cn(styles.segment, form.gender === g.value && styles.segmentActive)}
                  onClick={() => set("gender", g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Date of Birth" required error={shown("dateOfBirth")} htmlFor="add-user-dob">
            <div className={styles.withChip}>
              <Input
                id="add-user-dob"
                type="date"
                value={form.dateOfBirth}
                error={Boolean(shown("dateOfBirth"))}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                onBlur={() => touch("dateOfBirth")}
              />
              <span className={styles.chip} aria-label="Age (from date of birth)">
                Age {figures.age !== null && figures.age >= 0 ? figures.age : "—"}
              </span>
            </div>
          </Field>

          <Field label="City" required error={shown("city")}>
            <Input value={form.city} placeholder="e.g. Bengaluru" error={Boolean(shown("city"))} onChange={(e) => set("city", e.target.value)} onBlur={() => touch("city")} />
          </Field>
          <Field label="Height" required error={shown("height")} htmlFor="add-user-height">
            <div className={styles.withChip}>
              <div className={styles.unitWrap}>
                <Input
                  id="add-user-height"
                  type="number"
                  step="0.1"
                  min={HEIGHT_FEET.min}
                  max={HEIGHT_FEET.max}
                  placeholder="5.6"
                  value={form.height}
                  error={Boolean(shown("height"))}
                  onChange={(e) => set("height", e.target.value)}
                  onBlur={() => touch("height")}
                />
                <span className={styles.unit}>ft</span>
              </div>
              <span className={styles.chip} aria-label="Converted height (cm)">
                {savedHeightCm !== null ? `${savedHeightCm} cm` : "— cm"}
              </span>
            </div>
          </Field>
            <Field label="Weight" required error={shown("weight")} htmlFor="add-user-weight">
              <div className={styles.unitWrap}>
                <Input
                  id="add-user-weight"
                  type="number"
                  step="0.1"
                  min={PROFILE_LIMITS.weight.min}
                  max={PROFILE_LIMITS.weight.max}
                  value={form.weight}
                  error={Boolean(shown("weight"))}
                  onChange={(e) => set("weight", e.target.value)}
                  onBlur={() => touch("weight")}
                />
                <span className={styles.unit}>kg</span>
              </div>
            </Field>

          <Field
            label="Activity Level"
            required
            error={shown("activityLevel")}
            helperText={ACTIVITY_LEVELS.find((a) => a.value === form.activityLevel)?.description}
          >
            <Select
              value={form.activityLevel}
              placeholder="Select activity level"
              options={ACTIVITY_LEVELS.map((a) => ({ value: a.value, label: a.label }))}
              error={Boolean(shown("activityLevel"))}
              onChange={(e) => set("activityLevel", e.target.value as ActivityLevel)}
            />
          </Field>
          <Field label="Food Type" required error={shown("foodType")}>
            <Select
              value={form.foodType}
              placeholder="Select food type"
              options={FOOD_TYPES.map((f) => ({ value: f.value, label: f.label }))}
              error={Boolean(shown("foodType"))}
              onChange={(e) => set("foodType", e.target.value as FoodType)}
            />
          </Field>
          <Field label="Goal" required error={shown("goal")}>
            <Select
              value={form.goal}
              placeholder="Select goal"
              options={FITNESS_GOALS.map((g) => ({ value: g.value, label: g.label }))}
              error={Boolean(shown("goal"))}
              onChange={(e) => set("goal", e.target.value as FitnessGoal)}
            />
          </Field>
        </div>

        {/* Calculated, never typed: the app's own formulas, recalculated by the server on save. */}
        <div className={styles.calculated} aria-label="Calculated from the profile">
          <Readout label="Body Fat %" value={fixed(figures.bodyFat, 2)} suffix="%" hint="Needs gender, date of birth, height and weight" />
          <Readout label="BMR" value={fixed(figures.bmr, 0)} suffix="kcal/day" hint="Needs gender, date of birth, height and weight" />
          <Readout label="TDEE" value={fixed(figures.tdee, 0)} suffix="kcal/day" hint="Needs the activity level too" />
        </div>

        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}

        <div className={styles.footer}>
          <p className={cn("text-caption", styles.calcNote)}>
            Calculated automatically, the same way as the app. The free diet plan is assigned from these when the user is {isEdit ? "saved" : "created"}.
          </p>
          <Button variant="ghost" disabled={saving} onClick={() => navigate(back)}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {isEdit ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </GlassCard>
    </>
  );
}

function Readout({ label, value, suffix, hint }: { label: string; value: string | null; suffix: string; hint: string }) {
  return (
    <div className={styles.readout} aria-label={label}>
      <span className={styles.readoutLabel}>
        {label} <span className={styles.badge}>Calculated</span>
      </span>
      {value === null ? (
        <span className={styles.readoutEmpty}>{hint}</span>
      ) : (
        <span className={styles.readoutValue}>
          {value} <span className="text-caption">{suffix}</span>
        </span>
      )}
    </div>
  );
}
