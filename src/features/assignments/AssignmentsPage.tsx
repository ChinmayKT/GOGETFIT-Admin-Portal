import { useEffect, useState } from "react";
import { UserPlus, ArrowRightLeft, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { GlassModal } from "../../components/ui/GlassModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field } from "../../components/forms/Field";
import { Select } from "../../components/forms/Select";
import { SkeletonTable } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import {
  listAssignments, listAssignmentHistory, coachCapacitySummary, assignClient, reassignClient, removeAssignment,
} from "../../mock/assignments/repository";
import { coachOptions } from "../../mock/coaches/repository";
import { MOCK_USERS } from "../../mock/users/data";
import { PLAN_NAMES } from "../../mock/shared/reference";
import { formatDate } from "../../utils/format";
import type { Assignment, AssignmentHistoryEntry } from "../../types/assignment";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assignments", label: "Assignments" },
  { key: "history", label: "History" },
];

export function AssignmentsPage() {
  const [tab, setTab] = useState("dashboard");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [history, setHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<Assignment | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Assignment | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(PLAN_NAMES[0]);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const coaches = coachOptions();
  const unassignedUsers = MOCK_USERS.filter((u) => !u.coachId);

  function refresh() {
    setLoading(true);
    Promise.all([listAssignments(), listAssignmentHistory()]).then(([a, h]) => {
      setAssignments(a);
      setHistory(h);
      setLoading(false);
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  const capacity = coachCapacitySummary();

  const capacityColumns: Column<ReturnType<typeof coachCapacitySummary>[number]>[] = [
    { key: "coachName", header: "Coach" },
    { key: "level", header: "Level", render: (c) => `Level ${c.level}` },
    { key: "activeClients", header: "Current Clients" },
    { key: "availableSlots", header: "Available Slots" },
    {
      key: "capacity",
      header: "Capacity",
      render: (c) => {
        const pct = Math.min(100, Math.round((c.activeClients / (c.activeClients + c.availableSlots || 1)) * 100));
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--glass-fill-bright)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: pct > 85 ? "var(--color-error)" : "var(--ggf-orange)" }} />
            </div>
            <span className="text-caption">{pct}%</span>
          </div>
        );
      },
    },
  ];

  const assignmentColumns: Column<Assignment>[] = [
    { key: "clientName", header: "Client" },
    { key: "coachName", header: "Coach" },
    { key: "planName", header: "Plan" },
    { key: "assignedDate", header: "Assigned", render: (a) => formatDate(a.assignedDate) },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={a.status} tone={a.status === "Active" ? "success" : "neutral"} /> },
  ];

  const historyColumns: Column<AssignmentHistoryEntry>[] = [
    { key: "actionedAt", header: "Date", render: (h) => formatDate(h.actionedAt) },
    { key: "action", header: "Action" },
    { key: "clientName", header: "Client" },
    { key: "coachName", header: "Coach", render: (h) => (h.previousCoachName ? `${h.previousCoachName} → ${h.coachName}` : h.coachName) },
    { key: "planName", header: "Plan" },
  ];

  async function handleAssign() {
    const client = MOCK_USERS.find((u) => u.id === selectedClient);
    const coach = coaches.find((c) => c.id === selectedCoach);
    if (!client || !coach) return;
    setSaving(true);
    try {
      await assignClient(client.id, `${client.firstName} ${client.lastName}`, coach.id, coach.name, selectedPlan);
      show("Client assigned successfully");
      setAssignOpen(false);
      setSelectedClient("");
      setSelectedCoach("");
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleReassign(newCoachId: string) {
    if (!reassignTarget) return;
    const coach = coaches.find((c) => c.id === newCoachId);
    if (!coach) return;
    setSaving(true);
    try {
      await reassignClient(reassignTarget.id, coach.id, coach.name);
      show("Client reassigned");
      setReassignTarget(null);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setSaving(true);
    try {
      await removeAssignment(removeTarget.id);
      show("Assignment removed", "info");
      setRemoveTarget(null);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Coach ↔ Client Assignments"
        breadcrumb={[{ label: "People" }, { label: "Assignments" }]}
        description="Assign, reassign and track coach capacity across the client roster."
        actions={
          <Button variant="primary" icon={<UserPlus size={15} />} onClick={() => setAssignOpen(true)}>
            Assign Client
          </Button>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {loading ? (
        <GlassCard><SkeletonTable /></GlassCard>
      ) : (
        <>
          {tab === "dashboard" && (
            <DataTable columns={capacityColumns} rows={capacity} getRowId={(c) => c.coachId} emptyTitle="No coaches available" />
          )}

          {tab === "assignments" && (
            <DataTable
              columns={assignmentColumns}
              rows={assignments}
              getRowId={(a) => a.id}
              emptyTitle="No active assignments"
              rowActions={(a) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <IconButton icon={<ArrowRightLeft size={15} />} label="Reassign" size="sm" onClick={() => setReassignTarget(a)} />
                  <IconButton icon={<Trash2 size={15} />} label="Remove" size="sm" variant="danger" onClick={() => setRemoveTarget(a)} />
                </div>
              )}
            />
          )}

          {tab === "history" && (
            <DataTable columns={historyColumns} rows={history} getRowId={(h) => `${h.id}-${h.actionedAt}`} emptyTitle="No history yet" />
          )}
        </>
      )}

      <GlassModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} disabled={!selectedClient || !selectedCoach} onClick={handleAssign}>
              Assign
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Client" required>
            <Select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              placeholder="Select an unassigned client"
              options={unassignedUsers.map((u) => ({ label: `${u.firstName} ${u.lastName} (${u.ggfId})`, value: u.id }))}
            />
          </Field>
          <Field label="Coach" required>
            <Select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              placeholder="Select a coach"
              options={coaches.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Field>
          <Field label="Plan">
            <Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} options={PLAN_NAMES.map((p) => ({ label: p, value: p }))} />
          </Field>
        </div>
      </GlassModal>

      <GlassModal
        open={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        title={`Reassign ${reassignTarget?.clientName ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReassignTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => handleReassign(selectedCoach)} disabled={!selectedCoach}>
              Reassign
            </Button>
          </>
        }
      >
        <Field label="New Coach" required>
          <Select
            value={selectedCoach}
            onChange={(e) => setSelectedCoach(e.target.value)}
            placeholder="Select a coach"
            options={coaches.filter((c) => c.name !== reassignTarget?.coachName).map((c) => ({ label: c.name, value: c.id }))}
          />
        </Field>
      </GlassModal>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove assignment?"
        description={`${removeTarget?.clientName ?? ""} will be unassigned from ${removeTarget?.coachName ?? ""}. This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        loading={saving}
      />
    </>
  );
}
