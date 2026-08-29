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
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getUser, createUser, updateUser } from "../../mock/users/repository";
import { GOALS, CITIES } from "../../mock/shared/reference";
import styles from "./UserFormPage.module.css";

interface FormState {
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  userType: "User" | "Admin";
  dob: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  address: string;
  heightCm: string;
  weightKg: string;
  waistCm: string;
  neckCm: string;
  hipsCm: string;
  bodyFatPct: string;
  bmr: string;
  tdee: string;
  goal: string;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", gender: "Male", userType: "User", dob: "", email: "", phone: "",
  city: "", state: "", country: "India", zipCode: "", address: "",
  heightCm: "", weightKg: "", waistCm: "", neckCm: "", hipsCm: "", bodyFatPct: "", bmr: "", tdee: "", goal: "General Fitness",
};

export function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getUser(id).then((u) => {
      if (!u) return;
      setForm({
        firstName: u.firstName, lastName: u.lastName, gender: u.gender, userType: u.userType, dob: u.dob.slice(0, 10),
        email: u.email, phone: u.phone, city: u.city, state: u.state, country: u.country, zipCode: u.zipCode,
        address: u.address, heightCm: String(u.heightCm), weightKg: String(u.weightKg), waistCm: String(u.waistCm),
        neckCm: String(u.neckCm), hipsCm: String(u.hipsCm), bodyFatPct: String(u.bodyFatPct), bmr: String(u.bmr),
        tdee: String(u.tdee), goal: u.goal,
      });
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
        ...form,
        heightCm: Number(form.heightCm) || 0,
        weightKg: Number(form.weightKg) || 0,
        waistCm: Number(form.waistCm) || 0,
        neckCm: Number(form.neckCm) || 0,
        hipsCm: Number(form.hipsCm) || 0,
        bodyFatPct: Number(form.bodyFatPct) || 0,
        bmr: Number(form.bmr) || 0,
        tdee: Number(form.tdee) || 0,
        goal: form.goal as never,
      };
      if (isEdit && id) {
        await updateUser(id, payload);
        show("User updated successfully");
        navigate(`/users/${id}`);
      } else {
        const created = await createUser(payload);
        show("User created successfully");
        navigate(`/users/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <GlassCard>
        <SkeletonForm fields={8} />
      </GlassCard>
    );
  }

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit User" : "Add User"}
        breadcrumb={[{ label: "People", path: "/users" }, { label: "Users", path: "/users" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
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
              <Select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as FormState["gender"])}
                options={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }]}
              />
            </Field>
            <Field label="User Type" required>
              <Select
                value={form.userType}
                onChange={(e) => set("userType", e.target.value as FormState["userType"])}
                options={[{ label: "User", value: "User" }, { label: "Admin", value: "Admin" }]}
              />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} error={!!errors.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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
            <Field label="Zip Code">
              <Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Address">
              <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Fitness Information</p>
          <div className={styles.grid}>
            <Field label="Height (cm)">
              <Input type="number" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
            </Field>
            <Field label="Weight (kg)">
              <Input type="number" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
            </Field>
            <Field label="Waist (cm)">
              <Input type="number" value={form.waistCm} onChange={(e) => set("waistCm", e.target.value)} />
            </Field>
            <Field label="Neck (cm)">
              <Input type="number" value={form.neckCm} onChange={(e) => set("neckCm", e.target.value)} />
            </Field>
            <Field label="Hips (cm)">
              <Input type="number" value={form.hipsCm} onChange={(e) => set("hipsCm", e.target.value)} />
            </Field>
            <Field label="Fat (%)">
              <Input type="number" value={form.bodyFatPct} onChange={(e) => set("bodyFatPct", e.target.value)} />
            </Field>
            <Field label="BMR (cal/day)">
              <Input type="number" value={form.bmr} onChange={(e) => set("bmr", e.target.value)} />
            </Field>
            <Field label="TDEE (cal/day)">
              <Input type="number" value={form.tdee} onChange={(e) => set("tdee", e.target.value)} />
            </Field>
            <Field label="Goal">
              <Select value={form.goal} onChange={(e) => set("goal", e.target.value)} options={GOALS.map((g) => ({ label: g, value: g }))} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </div>
    </>
  );
}
