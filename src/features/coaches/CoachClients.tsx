import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { getCoachClients, type CoachClientsSummary, type CoachEnrollmentRow } from "../../api/coaches";
import { STATUS_LABELS } from "../../api/enrolledClients";
import { STATUS_TONE } from "../users/clientFormat";
import { formatDate } from "../../utils/format";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; summary: CoachClientsSummary; rows: CoachEnrollmentRow[] };

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));
const day = (iso: string | null) => (iso ? formatDate(iso) : "—");

/**
 * The coach's clients, from their real enrollments (EnrolledClient.coachId):
 * summary cards and one row per enrollment. A member with several cycles has
 * several rows; Unique Clients counts the people. Legacy ids are shown for
 * reference only.
 */
export function CoachClients({ coachId }: { coachId: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;
    setState({ status: "loading" });
    getCoachClients(coachId)
      .then((res) => {
        if (stale) return;
        // Anything that is not the expected shape is an error, never a crash.
        if (!res?.summary || !Array.isArray(res.enrollments)) setState({ status: "error" });
        else setState({ status: "ready", summary: res.summary, rows: res.enrollments });
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [coachId, attempt]);

  const columns: Column<CoachEnrollmentRow>[] = [
    {
      key: "client",
      header: "Client",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dash(r.user.name)}</div>
          {r.user.email && <div className="text-caption">{r.user.email}</div>}
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (r) => dash(r.user.phone) },
    {
      key: "legacy",
      header: "Legacy ID",
      // The member's legacy user id; the enrollment's own legacy id underneath.
      render: (r) => (
        <div>
          <div>{dash(r.user.legacyUserId)}</div>
          {r.legacyEnrollmentId !== null && <div className="text-caption">Enrollment {r.legacyEnrollmentId}</div>}
        </div>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => dash(r.plan.name) },
    { key: "enrollDate", header: "Enrolled", render: (r) => day(r.enrollDate) },
    { key: "startDate", header: "Start", render: (r) => day(r.startDate) },
    { key: "endDate", header: "End", render: (r) => day(r.endDate) },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={STATUS_LABELS[r.status]} tone={STATUS_TONE[r.status]} /> },
  ];

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 4 }}>
        Clients
      </p>
      <p className="text-caption" style={{ marginBottom: 16 }}>
        Every enrollment with this coach. A member who enrolled more than once appears once per enrollment.
      </p>

      {state.status === "loading" && (
        <p className="text-caption" role="status">
          Loading clients...
        </p>
      )}
      {state.status === "error" && (
        <p className="text-caption" role="alert">
          Could not load this coach&apos;s clients.{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} style={{ color: "var(--ggf-orange)", cursor: "pointer" }}>
            Retry
          </button>
        </p>
      )}
      {state.status === "ready" && (
        <>
          <div aria-label="Client statistics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            <SummaryCard label="Total Enrollments" value={state.summary.totalEnrollments} />
            <SummaryCard label="Unique Clients" value={state.summary.uniqueClients} />
            <SummaryCard label="Active Clients" value={state.summary.activeClients} />
            <SummaryCard label="Pending Clients" value={state.summary.pendingClients} />
          </div>
          <DataTable
            columns={columns}
            rows={state.rows}
            getRowId={(r) => r.enrollmentId}
            onRowClick={(r) => navigate(`/users/clients/${r.user.id}`)}
            emptyTitle="No clients yet"
            emptyDescription="No enrollment is assigned to this coach."
          />
        </>
      )}
    </GlassCard>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      aria-label={label}
      style={{ padding: "12px 14px", border: "1px solid var(--glass-border)", borderRadius: 12, background: "var(--glass-fill)" }}
    >
      <div className="text-caption">{label}</div>
      <div style={{ fontSize: "var(--fs-headline)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
