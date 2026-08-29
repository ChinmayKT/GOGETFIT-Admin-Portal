import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { ProfileHeaderEditor } from "../../components/media/ProfileHeaderEditor";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getCoach, createCoach, updateCoach } from "../../mock/coaches/repository";
import { CITIES, LANGUAGES, SPECIALIZATIONS } from "../../mock/shared/reference";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  languages: string[];
  city: string;
  state: string;
  country: string;
  level: string;
  specialization: string;
  description: string;
  transformationsCount: string;
  availableSlots: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", gender: "Male", email: "", phone: "", languages: [], city: "", state: "", country: "India",
  level: "1", specialization: SPECIALIZATIONS[0], description: "", transformationsCount: "0", availableSlots: "10",
  facebook: "", instagram: "", linkedin: "",
};

export function CoachFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getCoach(id).then((c) => {
      if (!c) return;
      setForm({
        firstName: c.firstName, lastName: c.lastName, gender: c.gender, email: c.email, phone: c.phone,
        languages: c.languages, city: c.city, state: c.state, country: c.country, level: String(c.level),
        specialization: c.specialization, description: c.description, transformationsCount: String(c.transformationsCount),
        availableSlots: String(c.availableSlots), facebook: c.facebook ?? "", instagram: c.instagram ?? "", linkedin: c.linkedin ?? "",
      });
      setProfilePictureUrl(c.profilePicture);
      setCoverPhotoUrl(c.coverPhoto);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.gender) next.gender = "Gender is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName, lastName: form.lastName, gender: form.gender, email: form.email, phone: form.phone,
        languages: form.languages, city: form.city, state: form.state, country: form.country,
        level: Number(form.level) as 1 | 2 | 3 | 4 | 5, specialization: form.specialization, description: form.description,
        availableSlots: Number(form.availableSlots) || 0, status: "Active" as const,
        facebook: form.facebook || null, instagram: form.instagram || null, linkedin: form.linkedin || null,
        profilePicture: profilePictureUrl,
        coverPhoto: coverPhotoUrl,
      };
      if (isEdit && id) {
        await updateCoach(id, payload);
        show("Coach profile updated");
        navigate(`/coaches/${id}`);
      } else {
        const created = await createCoach({ ...payload, transformationsCount: 0 });
        show("Coach created successfully");
        navigate(`/coaches/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={8} /></GlassCard>;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Coach" : "Add Coach"}
        breadcrumb={[{ label: "People", path: "/coaches" }, { label: "Coaches", path: "/coaches" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard padding="none" style={{ paddingTop: 20, paddingLeft: 20, paddingRight: 20 }}>
          <p className="text-title" style={{ marginBottom: 20 }}>Profile & Cover Photo</p>
          <ProfileHeaderEditor
            name={`${form.firstName || "New"} ${form.lastName || "Coach"}`}
            coverUrl={coverPhotoUrl}
            avatarUrl={profilePictureUrl}
            onCoverChange={(file) => setCoverPhotoUrl(URL.createObjectURL(file))}
            onAvatarChange={(file) => setProfilePictureUrl(URL.createObjectURL(file))}
          />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Main Info</p>
          <div className={styles.grid}>
            <Field label="First Name" required error={errors.firstName}>
              <Input value={form.firstName} error={!!errors.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last Name">
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value as FormState["gender"])}
                options={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }]} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} error={!!errors.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Known Languages">
              <Select
                value={form.languages[0] ?? ""}
                onChange={(e) => set("languages", [e.target.value])}
                placeholder="Select language"
                options={LANGUAGES.map((l) => ({ label: l, value: l }))}
              />
            </Field>
            <Field label="City">
              <Select
                value={form.city}
                onChange={(e) => {
                  const loc = CITIES.find((c) => c.city === e.target.value);
                  set("city", e.target.value);
                  if (loc) set("state", loc.state);
                }}
                placeholder="Select city"
                options={CITIES.map((c) => ({ label: c.city, value: c.city }))}
              />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Coach Options</p>
          <div className={styles.grid}>
            <Field label="Coach Level" required>
              <Select value={form.level} onChange={(e) => set("level", e.target.value)}
                options={[1, 2, 3, 4, 5].map((l) => ({ label: `Level ${l}`, value: String(l) }))} />
            </Field>
            <Field label="Specialization">
              <Select value={form.specialization} onChange={(e) => set("specialization", e.target.value)}
                options={SPECIALIZATIONS.map((s) => ({ label: s, value: s }))} />
            </Field>
            <Field label="Available Slots">
              <Input type="number" value={form.availableSlots} onChange={(e) => set("availableSlots", e.target.value)} />
            </Field>
            <Field label="Facebook">
              <Input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/..." />
            </Field>
            <Field label="Instagram">
              <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="LinkedIn">
              <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Coach" : "Create Coach"}
          </Button>
        </div>
      </div>
    </>
  );
}
