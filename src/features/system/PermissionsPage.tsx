import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/forms/Checkbox";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonRows } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { listEditableRoles, updateRolePermissions, createRole } from "../../mock/system/rolesRepository";
import { countAdminUsersByRole } from "../../mock/system/adminUserRepository";
import { MODULE_KEYS, MODULE_LABELS, PERMISSION_ACTIONS, ACTION_LABELS } from "../../types/system";
import type { PermissionMatrix, Role } from "../../types/permissions";

function emptyMatrix(): PermissionMatrix {
  return MODULE_KEYS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as PermissionMatrix);
}

export function PermissionsPage() {
  const { show } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrix>(emptyMatrix());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  function load(selectId?: string) {
    setLoading(true);
    listEditableRoles().then((list) => {
      setRoles(list);
      const target = list.find((r) => r.id === (selectId ?? selectedId)) ?? list[0];
      if (target) {
        setSelectedId(target.id);
        setMatrix({ ...target.permissions });
      }
      setDirty(false);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectRole(role: Role) {
    setSelectedId(role.id);
    setMatrix({ ...role.permissions });
    setDirty(false);
  }

  function toggle(module: (typeof MODULE_KEYS)[number], action: (typeof PERMISSION_ACTIONS)[number]) {
    setMatrix((m) => {
      const current = m[module] ?? [];
      const has = current.includes(action);
      return { ...m, [module]: has ? current.filter((a) => a !== action) : [...current, action] };
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateRolePermissions(selectedId, matrix);
      show("Permissions saved");
      setDirty(false);
      load(selectedId);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole() {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const role = await createRole({ name: createForm.name, description: createForm.description, permissions: emptyMatrix() });
      show("Role created");
      setCreateOpen(false);
      setCreateForm({ name: "", description: "" });
      load(role.id);
    } finally {
      setCreating(false);
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        breadcrumb={[{ label: "System" }, { label: "Roles & Permissions" }]}
        description="Define what each role can view, create, edit, delete and publish across every module."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            Create Role
          </Button>
        }
      />

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <GlassCard padding="none" style={{ flex: "0 0 300px" }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              <SkeletonRows rows={6} columns={1} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {roles.map((role, i) => (
                <button
                  key={role.id}
                  onClick={() => selectRole(role)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    textAlign: "left",
                    padding: "14px 18px",
                    background: role.id === selectedId ? "var(--ggf-orange-dim)" : "transparent",
                    borderLeft: `3px solid ${role.id === selectedId ? "var(--ggf-orange)" : "transparent"}`,
                    borderBottom: i < roles.length - 1 ? "1px solid var(--glass-border)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{role.name}</span>
                  <span className="text-caption">{role.description}</span>
                  <span className="text-caption" style={{ color: "var(--ggf-orange)" }}>
                    {countAdminUsersByRole(role.id)} {countAdminUsersByRole(role.id) === 1 ? "user" : "users"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard style={{ flex: 1, minWidth: 0 }}>
          {!selectedRole || loading ? (
            <SkeletonRows rows={8} columns={1} />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p className="text-title">{selectedRole.name}</p>
                  <p className="text-caption">{selectedRole.description}</p>
                </div>
                <Button variant="primary" loading={saving} disabled={!dirty} onClick={handleSave}>
                  Save Changes
                </Button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-muted)", fontSize: "var(--fs-caption)", fontWeight: 600 }}>
                        Module
                      </th>
                      {PERMISSION_ACTIONS.map((action) => (
                        <th
                          key={action}
                          style={{ textAlign: "center", padding: "8px 12px", color: "var(--text-muted)", fontSize: "var(--fs-caption)", fontWeight: 600 }}
                        >
                          {ACTION_LABELS[action]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_KEYS.map((module) => (
                      <tr key={module} style={{ borderTop: "1px solid var(--glass-border)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{MODULE_LABELS[module]}</td>
                        {PERMISSION_ACTIONS.map((action) => (
                          <td key={action} style={{ textAlign: "center", padding: "10px 12px" }}>
                            <Checkbox
                              checked={matrix[module]?.includes(action) ?? false}
                              onChange={() => toggle(module, action)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <GlassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Role"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreateRole} icon={<ShieldCheck size={15} />}>
              Create Role
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Role Name" required>
            <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Regional Manager" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this role is responsible for..." />
          </Field>
          <p className="text-caption">New roles start with every permission unchecked — you can turn them on afterwards.</p>
        </div>
      </GlassModal>
    </>
  );
}
