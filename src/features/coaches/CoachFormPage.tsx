import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, UserX, UserCheck } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { ApiError } from "../../api/client";
import {
  createCoach,
  getCoach,
  removeCoachImage,
  searchUserByPhone,
  updateCoach,
  uploadCoachImage,
  type CoachProfileInput,
} from "../../api/coaches";
import { resolveMediaUrl } from "../../api/media";
import {
  COACH_PROFILE_LEVELS,
  type CoachImageSlot,
  type CoachProfileLevel,
  type CoachProfileStatus,
  type CoachRecord,
  type CoachUserSummary,
} from "../../types/coach";
import { CoachUserCard, toCoachUserSummary } from "./CoachUserCard";
import { CoachImageField, type CoachImageBusy } from "./CoachImageField";
import { planCountLabel, useLevelPlans } from "./CoachLevelPlans";
import styles from "../users/UserFormPage.module.css";

/* Limits mirror the backend validator, which stays authoritative. */
const MAX_SPECIALIZATION = 200;
const MAX_DESCRIPTION = 2000;
const MAX_LANGUAGES = 20;
const MAX_LANGUAGE = 50;
const MAX_COUNTER = 100000;

interface ProfileForm {
  level: CoachProfileLevel | "";
  specialization: string;
  description: string;
  /** Comma-separated in the form; sent as a list. */
  languages: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  transformations: string;
  availableSlots: string;
  status: CoachProfileStatus;
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

const EMPTY_PROFILE: ProfileForm = {
  level: "",
  specialization: "",
  description: "",
  languages: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  transformations: "0",
  availableSlots: "0",
  status: "active",
};

const fromCoach = (coach: CoachRecord): ProfileForm => ({
  level: coach.profile.level,
  specialization: coach.profile.specialization ?? "",
  description: coach.profile.description ?? "",
  languages: coach.profile.languages.join(", "),
  facebook: coach.profile.facebook ?? "",
  instagram: coach.profile.instagram ?? "",
  linkedin: coach.profile.linkedin ?? "",
  transformations: String(coach.profile.transformations ?? 0),
  availableSlots: String(coach.profile.availableSlots ?? 0),
  status: coach.status,
});

const splitLanguages = (value: string) =>
  value
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function validateProfile(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!form.level) errors.level = "Coach level is required";
  if (form.specialization.trim().length > MAX_SPECIALIZATION) {
    errors.specialization = `At most ${MAX_SPECIALIZATION} characters`;
  }
  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `At most ${MAX_DESCRIPTION} characters`;
  }
  const languages = splitLanguages(form.languages);
  if (languages.length > MAX_LANGUAGES) errors.languages = `At most ${MAX_LANGUAGES} languages`;
  else if (languages.some((l) => l.length > MAX_LANGUAGE)) {
    errors.languages = `Each language must be at most ${MAX_LANGUAGE} characters`;
  }
  for (const key of ["facebook", "instagram", "linkedin"] as const) {
    const value = form[key].trim();
    if (value && !isHttpUrl(value)) errors[key] = "Enter a full link starting with https://";
  }
  for (const key of ["transformations", "availableSlots"] as const) {
    const value = form[key].trim();
    const n = Number(value);
    if (value === "" || !Number.isInteger(n) || n < 0 || n > MAX_COUNTER) {
      errors[key] = `Enter a whole number from 0 to ${MAX_COUNTER}`;
    }
  }
  return errors;
}

const toProfileInput = (form: ProfileForm): CoachProfileInput => ({
  level: form.level as CoachProfileLevel,
  specialization: form.specialization.trim() || null,
  description: form.description.trim() || null,
  languages: splitLanguages(form.languages),
  facebook: form.facebook.trim() || null,
  instagram: form.instagram.trim() || null,
  linkedin: form.linkedin.trim() || null,
  transformations: Number(form.transformations),
  availableSlots: Number(form.availableSlots),
});

const errorMessage = (cause: unknown, fallback: string) =>
  cause instanceof ApiError && cause.status !== 0 && cause.status < 500 ? cause.message : fallback;

const SLOT_LABELS: Record<CoachImageSlot, string> = {
  profilePicture: "Coach Profile Picture",
  coverPicture: "Coach Cover Picture",
};
const SLOTS: CoachImageSlot[] = ["profilePicture", "coverPicture"];

/** The two picture controls side by side: profile 1:1, cover 3:1. */
function CoachPicturesCard({ children }: { children: ReactNode }) {
  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 4 }}>Coach Pictures</p>
      <p className="text-caption" style={{ marginBottom: 20 }}>
        The coach's own photos, shown on the coach profile. Separate from the user's account picture.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 200px) minmax(0, 1fr)", gap: 24 }}>
        {children}
      </div>
    </GlassCard>
  );
}

export function CoachFormPage() {
  const { id } = useParams();
  return id ? <EditCoach id={id} /> : <AddCoach />;
}

/* ------------------------------------------------------------------ Add */

type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "notFound" }
  | { kind: "error" }
  | { kind: "alreadyCoach"; user: CoachUserSummary; coachId: string }
  | { kind: "found"; user: CoachUserSummary };

function AddCoach() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [search, setSearch] = useState<SearchState>({ kind: "idle" });
  const [selected, setSelected] = useState<CoachUserSummary | null>(null);
  // Chosen before the coach exists; uploaded right after it is created.
  const [pending, setPending] = useState<Partial<Record<CoachImageSlot, File>>>({});
  const previews = useMemo(() => {
    const out: Partial<Record<CoachImageSlot, string>> = {};
    for (const slot of SLOTS) {
      const file = pending[slot];
      if (file) out[slot] = URL.createObjectURL(file);
    }
    return out;
  }, [pending]);
  useEffect(
    () => () => Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url)),
    [previews],
  );

  async function runSearch() {
    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    if (digits.length < 10 || digits.length > 15) {
      setPhoneError("Enter a valid phone number");
      return;
    }
    setPhoneError(undefined);
    setSearch({ kind: "searching" });
    try {
      const result = await searchUserByPhone(phone);
      const user = toCoachUserSummary(result.user);
      setSearch(result.coach ? { kind: "alreadyCoach", user, coachId: result.coach.id } : { kind: "found", user });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "USER_NOT_FOUND") setSearch({ kind: "notFound" });
      else if (cause instanceof ApiError && cause.code === "INVALID_PHONE") {
        setPhoneError("Enter a valid phone number");
        setSearch({ kind: "idle" });
      } else setSearch({ kind: "error" });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch();
  }

  function reset() {
    setPhone("");
    setPhoneError(undefined);
    setSearch({ kind: "idle" });
  }

  const header = (
    <>
      <button className={styles.backLink} onClick={() => (selected ? setSelected(null) : navigate("/coaches"))}>
        <ArrowLeft size={14} /> {selected ? "Back to Find User" : "Back to Coaches"}
      </button>
      <PageHeader
        title={selected ? "Create Coach" : "Add New Coach"}
        breadcrumb={[{ label: "People", path: "/coaches" }, { label: "Coaches", path: "/coaches" }, { label: "Add" }]}
        description={
          selected
            ? "Step 2 of 2 — complete the coach profile."
            : "Step 1 of 2 — only an existing user can become a coach. Find them by phone number."
        }
      />
    </>
  );

  if (selected) {
    return (
      <>
        {header}
        <CoachProfileEditor
          user={selected}
          initial={EMPTY_PROFILE}
          submitLabel="Create Coach"
          savingLabel="Creating Coach..."
          onCancel={() => setSelected(null)}
          pictures={
            <CoachPicturesCard>
              {SLOTS.map((slot) => (
                <CoachImageField
                  key={slot}
                  label={SLOT_LABELS[slot]}
                  shape={slot === "profilePicture" ? "avatar" : "cover"}
                  imageUrl={previews[slot] ?? null}
                  onSelect={(file) => setPending((p) => ({ ...p, [slot]: file }))}
                  onRemove={() => setPending((p) => ({ ...p, [slot]: undefined }))}
                />
              ))}
            </CoachPicturesCard>
          }
          onSubmit={async (form) => {
            const coach = await createCoach(selected.id, toProfileInput(form));
            // The coach exists now, so the pictures can go to its own endpoints.
            const failed: string[] = [];
            for (const slot of SLOTS) {
              const file = pending[slot];
              if (!file) continue;
              try {
                await uploadCoachImage(coach.id, slot, file);
              } catch {
                failed.push(SLOT_LABELS[slot].replace("Coach ", "").toLowerCase());
              }
            }
            if (failed.length > 0) {
              show(`Coach created, but the ${failed.join(" and ")} could not be uploaded. Try again here.`, "error");
              navigate(`/coaches/${coach.id}/edit`);
              return;
            }
            show("Coach created successfully.");
            navigate(`/coaches/${coach.id}`);
          }}
          errorFallback="Could not create the coach. Please try again."
          onConflict={() => show("This user is already a coach.", "error")}
        />
      </>
    );
  }

  const searching = search.kind === "searching";

  return (
    <>
      {header}
      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Find User</p>
          <form onSubmit={onSubmit} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", maxWidth: 360 }}>
              <Field label="Phone Number" required error={phoneError} helperText="With or without +91">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  placeholder="+91 98765 43210"
                  error={!!phoneError}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (search.kind !== "searching") setSearch({ kind: "idle" });
                  }}
                />
              </Field>
            </div>
            <div style={{ paddingTop: 26 }}>
              <Button type="submit" variant="primary" icon={<Search size={15} />} loading={searching}>
                {searching ? "Searching..." : "Search User"}
              </Button>
            </div>
          </form>
        </GlassCard>

        {search.kind === "notFound" && (
          <GlassCard>
            <div role="status" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <UserX size={22} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-title">User not found</p>
                <p className="text-caption" style={{ margin: "6px 0 16px" }}>
                  Only existing users can be added as coaches.
                </p>
                <Button variant="secondary" onClick={reset}>Try Another Number</Button>
              </div>
            </div>
          </GlassCard>
        )}

        {search.kind === "error" && (
          <GlassCard>
            <div role="alert">
              <p className="text-title">Unable to search user.</p>
              <p className="text-caption" style={{ margin: "6px 0 16px" }}>
                The server could not be reached. Check your connection and try again.
              </p>
              <Button variant="secondary" onClick={() => void runSearch()}>Retry</Button>
            </div>
          </GlassCard>
        )}

        {search.kind === "alreadyCoach" && (
          <CoachUserCard
            user={search.user}
            title="Already a Coach"
            footer={
              <>
                <p className="text-caption" role="status" style={{ width: "100%", marginBottom: 4 }}>
                  This user is already a coach.
                </p>
                <Button variant="secondary" onClick={() => navigate(`/coaches/${search.coachId}`)}>View Coach</Button>
                <Button variant="primary" onClick={() => navigate(`/coaches/${search.coachId}/edit`)}>Edit Coach</Button>
              </>
            }
          />
        )}

        {search.kind === "found" && (
          <CoachUserCard
            user={search.user}
            title="User Found"
            footer={
              <Button variant="primary" icon={<UserCheck size={15} />} onClick={() => setSelected(search.user)}>
                Continue
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Edit */

function EditCoach({ id }: { id: string }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [coach, setCoach] = useState<CoachRecord | null>(null);
  const [loadError, setLoadError] = useState<"notFound" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<Record<CoachImageSlot, CoachImageBusy>>({ profilePicture: null, coverPicture: null });
  const [imageErrors, setImageErrors] = useState<Partial<Record<CoachImageSlot, string | null>>>({});

  /**
   * Pictures save immediately through their own endpoints, so they never touch
   * the other coach fields (or the unsaved edits in the form below).
   */
  async function changeImage(slot: CoachImageSlot, file: File | null) {
    setBusy((b) => ({ ...b, [slot]: file ? "uploading" : "removing" }));
    setImageErrors((e) => ({ ...e, [slot]: null }));
    try {
      const updated = file ? await uploadCoachImage(id, slot, file) : await removeCoachImage(id, slot);
      setCoach((current) =>
        current ? { ...current, profile: { ...current.profile, [slot]: updated.profile[slot] } } : updated,
      );
      show(file ? `${SLOT_LABELS[slot]} updated.` : `${SLOT_LABELS[slot]} removed.`);
    } catch (cause) {
      setImageErrors((e) => ({
        ...e,
        [slot]: errorMessage(cause, file ? "Could not upload the picture. Please try again." : "Could not remove the picture. Please try again."),
      }));
    } finally {
      setBusy((b) => ({ ...b, [slot]: null }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    getCoach(id)
      .then((c) => !cancelled && setCoach(c))
      .catch((cause) => {
        if (cancelled) return;
        setLoadError(cause instanceof ApiError && cause.status === 404 ? "notFound" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const header = (
    <>
      <button className={styles.backLink} onClick={() => navigate(`/coaches/${id}`)}>
        <ArrowLeft size={14} /> Back to Coach
      </button>
      <PageHeader
        title="Edit Coach"
        breadcrumb={[{ label: "People", path: "/coaches" }, { label: "Coaches", path: "/coaches" }, { label: "Edit" }]}
      />
    </>
  );

  if (loadError === "notFound") {
    return (
      <>
        {header}
        <ErrorState title="Coach not found" description="This coach profile does not exist." />
      </>
    );
  }
  if (loadError) {
    return (
      <>
        {header}
        <ErrorState description="We couldn't load this coach." onRetry={() => setAttempt((n) => n + 1)} />
      </>
    );
  }
  if (!coach) return <GlassCard><SkeletonForm fields={8} /></GlassCard>;

  return (
    <>
      {header}
      <CoachProfileEditor
        user={coach.user}
        initial={fromCoach(coach)}
        showStatus
        pictures={
          <CoachPicturesCard>
            {SLOTS.map((slot) => (
              <CoachImageField
                key={slot}
                label={SLOT_LABELS[slot]}
                shape={slot === "profilePicture" ? "avatar" : "cover"}
                imageUrl={resolveMediaUrl(coach.profile[slot]?.url)}
                busy={busy[slot]}
                error={imageErrors[slot]}
                onSelect={(file) => void changeImage(slot, file)}
                onRemove={() => void changeImage(slot, null)}
              />
            ))}
          </CoachPicturesCard>
        }
        submitLabel="Save Changes"
        savingLabel="Saving..."
        onCancel={() => navigate(`/coaches/${id}`)}
        onSubmit={async (form) => {
          // userId is never sent: the User <-> Coach link is fixed at creation.
          await updateCoach(id, { profile: toProfileInput(form), status: form.status });
          show("Coach updated successfully.");
          navigate(`/coaches/${id}`);
        }}
        errorFallback="Could not save the coach. Please try again."
      />
    </>
  );
}

/* ------------------------------------------------------------------ Shared form */

function CoachProfileEditor({
  user,
  initial,
  showStatus = false,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
  errorFallback,
  onConflict,
  pictures,
}: {
  pictures?: ReactNode;
  user: CoachUserSummary | null;
  initial: ProfileForm;
  showStatus?: boolean;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (form: ProfileForm) => Promise<void>;
  onCancel: () => void;
  errorFallback: string;
  onConflict?: () => void;
}) {
  const [form, setForm] = useState<ProfileForm>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // The level decides which GoGetFit Plans the coach offers; show that live.
  const levelPlans = useLevelPlans(form.level || null);
  const levelHelp =
    !form.level
      ? "Decides which GoGetFit Plans this coach offers."
      : levelPlans?.status === "ready"
        ? `Offers ${planCountLabel(levelPlans.total, form.level)}.`
        : levelPlans?.status === "error"
          ? "Decides which GoGetFit Plans this coach offers."
          : "Checking plans for this level...";

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const next = validateProfile(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(form);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "COACH_ALREADY_EXISTS") onConflict?.();
      setFormError(errorMessage(cause, errorFallback));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.sections}>
      {user ? (
        <CoachUserCard user={user} />
      ) : (
        <GlassCard>
          <p className="text-caption">The user linked to this coach could not be loaded.</p>
        </GlassCard>
      )}

      {pictures}

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 20 }}>Coach Profile</p>
        <div className={styles.grid}>
          <Field label="Coach Level" required error={errors.level} helperText={levelHelp}>
            <Select
              value={form.level}
              error={!!errors.level}
              placeholder="Select level"
              onChange={(e) => set("level", e.target.value as CoachProfileLevel)}
              options={COACH_PROFILE_LEVELS.map((l) => ({ label: l, value: l }))}
            />
          </Field>
          <Field label="Specialization" error={errors.specialization}>
            <Input
              value={form.specialization}
              error={!!errors.specialization}
              placeholder="e.g. Fat loss, Strength"
              onChange={(e) => set("specialization", e.target.value)}
            />
          </Field>
          <Field label="Known Languages" error={errors.languages} helperText="Separate with commas">
            <Input
              value={form.languages}
              error={!!errors.languages}
              placeholder="English, Hindi, Kannada"
              onChange={(e) => set("languages", e.target.value)}
            />
          </Field>
          <Field label="Transformations" required error={errors.transformations}>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.transformations}
              error={!!errors.transformations}
              onChange={(e) => set("transformations", e.target.value)}
            />
          </Field>
          <Field label="Available Slots" required error={errors.availableSlots}>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.availableSlots}
              error={!!errors.availableSlots}
              onChange={(e) => set("availableSlots", e.target.value)}
            />
          </Field>
          {showStatus && (
            <Field label="Coach Status" helperText="Deactivating keeps the user's account and coach role.">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as CoachProfileStatus)}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </Field>
          )}
          <Field label="Facebook" error={errors.facebook}>
            <Input value={form.facebook} error={!!errors.facebook} placeholder="https://facebook.com/..."
              onChange={(e) => set("facebook", e.target.value)} />
          </Field>
          <Field label="Instagram" error={errors.instagram}>
            <Input value={form.instagram} error={!!errors.instagram} placeholder="https://instagram.com/..."
              onChange={(e) => set("instagram", e.target.value)} />
          </Field>
          <Field label="LinkedIn" error={errors.linkedin}>
            <Input value={form.linkedin} error={!!errors.linkedin} placeholder="https://linkedin.com/in/..."
              onChange={(e) => set("linkedin", e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Description" error={errors.description} helperText={`${form.description.length}/${MAX_DESCRIPTION}`}>
            <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      </GlassCard>

      {formError && (
        <p role="alert" style={{ color: "var(--status-error, #e5484d)" }}>{formError}</p>
      )}

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="primary" loading={saving} onClick={handleSubmit}>
          {saving ? savingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}
