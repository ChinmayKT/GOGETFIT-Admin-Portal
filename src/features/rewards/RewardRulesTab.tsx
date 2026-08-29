import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { IconButton } from "../../components/ui/IconButton";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonRows } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { listRules, updateRule } from "../../mock/rewards/repository";
import type { RewardRule } from "../../types/rewards";

export function RewardRulesTab() {
  const { show } = useToast();
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<RewardRule | null>(null);
  const [form, setForm] = useState({ name: "", points: "", description: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listRules().then((r) => {
      setRules(r);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(rule: RewardRule) {
    setEditTarget(rule);
    setForm({ name: rule.name, points: String(rule.points), description: rule.description });
  }

  async function handleSave() {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateRule(editTarget.id, { name: form.name, points: Number(form.points) || 0, description: form.description });
      show("Reward rule updated");
      setEditTarget(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <GlassCard>
        <SkeletonRows rows={8} columns={1} />
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard padding="none">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rules.map((rule, i) => (
            <div
              key={rule.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 20px",
                borderBottom: i < rules.length - 1 ? "1px solid var(--glass-border)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-md)",
                    background: "var(--ggf-orange-dim)",
                    color: "var(--ggf-orange)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "var(--fs-label)",
                  }}
                >
                  +{rule.points}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-primary" style={{ fontWeight: 600 }}>{rule.name}</div>
                  <div className="text-caption">{rule.description}</div>
                </div>
              </div>
              <IconButton icon={<Pencil size={15} />} label="Edit rule" size="sm" onClick={() => openEdit(rule)} />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Reward Rule"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Rule Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Points" required>
            <Input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
      </GlassModal>
    </>
  );
}
