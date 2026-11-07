import { useEffect, useState } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getCoachCapacity, type CoachCapacity } from "../../api/coaches";
import { formatDate } from "../../utils/format";
import styles from "../users/UserDetailPage.module.css";

const STATUS = {
  available: { label: "Accepting bookings", tone: "success" },
  fully_booked: { label: "Fully booked", tone: "error" },
  not_configured: { label: "Monthly slots not set", tone: "neutral" },
} as const;

/** This month's capacity and today's release, exactly as the backend reports them. */
export function CoachCapacityCard({ coachId }: { coachId: string }) {
  const [capacity, setCapacity] = useState<CoachCapacity | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    getCoachCapacity(coachId)
      .then((c) => {
        if (cancelled) return;
        setCapacity(c ?? null);
        setState(c ? "ready" : "error");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [coachId]);

  if (state === "loading") return <GlassCard><p className="text-caption">Loading monthly slots...</p></GlassCard>;
  if (state === "error" || !capacity) {
    return <GlassCard><p className="text-caption" role="status">Could not load this coach's monthly slots.</p></GlassCard>;
  }

  const status = STATUS[capacity.status];
  const configured = capacity.monthlyCapacity !== null;
  const stats: [string, string][] = [
    ["Monthly Slots", configured ? String(capacity.monthlyCapacity) : "Not set"],
    ["Confirmed This Month", String(capacity.confirmedBookings)],
    ["Remaining This Month", configured ? String(capacity.remainingCapacity) : "No limit"],
    ["Booked Today", String(capacity.bookedToday)],
    ["Current Batch", configured ? String(capacity.currentBatch) : "—"],
    ["Available To Customers Now", configured ? String(capacity.availableSlots) : "—"],
  ];

  return (
    <GlassCard>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        <p className="text-title">Monthly Slots · {capacity.month}</p>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>
      <p className="text-caption" style={{ marginBottom: 16 }}>
        Customers see {capacity.firstBatchSize} slots at the start of each day, then {capacity.nextBatchSize} more each time a batch sells out.
      </p>
      <div className={styles.statGrid}>
        {stats.map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue}>{value}</span>
          </div>
        ))}
      </div>
      {capacity.history.length > 0 && (
        <>
          <p className="text-title" style={{ margin: "20px 0 8px" }}>History</p>
          {capacity.history.map((entry) => (
            <div key={entry.month} style={{ marginBottom: 8 }}>
              <p className="text-secondary">
                {entry.month}: {entry.confirmedBookings} booked of {entry.capacity}
              </p>
              {entry.changes.map((change) => (
                <p key={change.at} className="text-caption">
                  Changed from {change.from ?? "not set"} to {change.to} on {formatDate(change.at)}
                </p>
              ))}
            </div>
          ))}
        </>
      )}
    </GlassCard>
  );
}
