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
import { getFaq, createFaq, updateFaq, nextFaqOrder } from "../../mock/faqs/repository";
import { FAQ_CATEGORIES } from "../../mock/faqs/data";
import type { FaqCategory, FaqStatus } from "../../types/faq";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  question: string;
  answer: string;
  category: FaqCategory;
  status: FaqStatus;
  order: string;
}

const EMPTY: FormState = {
  question: "",
  answer: "",
  category: "General",
  status: "Published",
  order: "1",
};

export function FaqFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (id) {
      getFaq(id).then((f) => {
        if (!f) return;
        setForm({
          question: f.question,
          answer: f.answer,
          category: f.category,
          status: f.status,
          order: String(f.order),
        });
        setLoading(false);
      });
    } else {
      nextFaqOrder().then((order) => {
        setForm((f) => ({ ...f, order: String(order) }));
      });
    }
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.question.trim()) next.question = "Question is required";
    if (!form.answer.trim()) next.answer = "Answer is required";
    if (!form.order.trim() || Number.isNaN(Number(form.order))) next.order = "Enter a valid order number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category,
        status: form.status,
        order: Number(form.order) || 1,
      };
      if (isEdit && id) {
        await updateFaq(id, payload);
        show("FAQ updated");
      } else {
        await createFaq(payload);
        show("FAQ created");
      }
      navigate("/content/faqs");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={5} /></GlassCard>;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit FAQ" : "Add FAQ"}
        breadcrumb={[{ label: "Content", path: "/content/faqs" }, { label: "FAQs", path: "/content/faqs" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>FAQ Details</p>
          <Field label="Question" required error={errors.question}>
            <Textarea rows={2} value={form.question} error={!!errors.question} onChange={(e) => set("question", e.target.value)} />
          </Field>
          <div style={{ marginTop: 16 }}>
            <Field label="Answer" required error={errors.answer}>
              <Textarea rows={5} value={form.answer} error={!!errors.answer} onChange={(e) => set("answer", e.target.value)} />
            </Field>
          </div>
          <div className={styles.grid} style={{ marginTop: 16 }}>
            <Field label="Category" required>
              <Select
                value={form.category}
                onChange={(e) => set("category", e.target.value as FaqCategory)}
                options={FAQ_CATEGORIES.map((c) => ({ label: c, value: c }))}
              />
            </Field>
            <Field label="Status" required>
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as FaqStatus)}
                options={[
                  { label: "Published", value: "Published" },
                  { label: "Archived", value: "Archived" },
                ]}
              />
            </Field>
            <Field label="Order" required error={errors.order} helperText="Controls display order in the help center">
              <Input type="number" value={form.order} error={!!errors.order} onChange={(e) => set("order", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update FAQ" : "Create FAQ"}
          </Button>
        </div>
      </div>
    </>
  );
}
