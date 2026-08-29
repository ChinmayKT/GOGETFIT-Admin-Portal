import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getAdminUser, createAdminUser, updateAdminUser } from "../../mock/system/adminUserRepository";
import { ROLES } from "../../mock/system/roles";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  name: string;
  email: string;
  roleId: string;
  status: "Active" | "Inactive";
}

const EMPTY: FormState = { name: "", email: "", roleId: ROLES[0].id, status: "Active" };

export function AdminUserFormPage() {
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
    getAdminUser(id).then((a) => {
      if (!a) return;
      setForm({ name: a.name, email: a.email, roleId: a.roleId, status: a.status });
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.roleId) next.roleId = "Role is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateAdminUser(id, form);
        show("Admin user updated");
      } else {
        await createAdminUser(form);
        show("Admin user created successfully");
      }
      navigate("/system/admin-users");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={4} /></GlassCard>;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Admin User" : "Add Admin User"}
        breadcrumb={[
          { label: "System", path: "/system/admin-users" },
          { label: "Admin Users", path: "/system/admin-users" },
          { label: isEdit ? "Edit" : "Add" },
        ]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Admin Details</p>
          <div className={styles.grid}>
            <Field label="Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input type="email" value={form.email} error={!!errors.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Role" required error={errors.roleId}>
              <Select
                value={form.roleId}
                error={!!errors.roleId}
                onChange={(e) => set("roleId", e.target.value)}
                options={ROLES.map((r) => ({ label: r.name, value: r.id }))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as FormState["status"])}
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
              />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Admin" : "Create Admin"}
          </Button>
        </div>
      </div>
    </>
  );
}
