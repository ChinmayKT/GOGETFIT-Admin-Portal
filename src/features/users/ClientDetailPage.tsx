import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { ImageLightbox } from "../../components/ui/ImageLightbox";
import { resolveMediaUrl } from "../../api/media";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { Tabs } from "../../components/ui/Tabs";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getAdminUser } from "../../api/adminUsers";
import { listEnrolledClients, STATUS_LABELS, type EnrolledClientRow, type PaymentMethod } from "../../api/enrolledClients";
import { ApiError } from "../../api/client";
import { formatDate } from "../../utils/format";
import type { AdminUser } from "../../types/admin";
import { STATUS_TONE, dash, money } from "./clientFormat";
import { ClientQuestionnaires, useClientQuestionnaires } from "./ClientQuestionnaires";
import { ClientBodyMetrics, useClientBodyMetrics } from "./ClientBodyMetrics";
import styles from "./ClientDetailPage.module.css";

/**
 * Client detail - one member and every plan they have bought.
 *
 * The member comes from GET /api/admin/users/:id, the purchases from
 * GET /api/admin/enrolled-clients?userId=:id (newest first). Opened from the
 * Clients list; it never sends the admin to the generic user record.
 */

/** Manual (admin-recorded) payments carry a method; gateway/migrated ones do not. */
const METHOD_LABELS: Record<PaymentMethod, string> = { cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer", other: "Other" };

const day = (iso: string | null) => (iso ? formatDate(iso) : "—");

const coachName = (e: EnrolledClientRow) =>
  e.coach?.name ?? e.legacyCoachName ?? (e.legacyCoachId !== null ? `Legacy coach #${e.legacyCoachId}` : null);

const couponCode = (e: EnrolledClientRow) => e.coupon?.code ?? e.legacyCouponCode;

/** Sum per currency, so a mixed history is never added up as one number. */
const totalPaid = (rows: EnrolledClientRow[]) => {
  const byCurrency = new Map<string, number>();
  for (const r of rows) {
    if (r.amount === null || r.status === "deleted") continue;
    const key = r.currency ?? "";
    byCurrency.set(key, (byCurrency.get(key) ?? 0) + r.amount);
  }
  if (!byCurrency.size) return "—";
  return [...byCurrency].map(([currency, amount]) => money(amount, currency || null)).join(" + ");
};

export function ClientDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [enrollments, setEnrollments] = useState<EnrolledClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);
  const closePhoto = useCallback(() => setPhotoOpen(false), []);
  const [error, setError] = useState<ApiError | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");
  // Loaded with the page (not when the tab opens) so the tab can show its count;
  // a failure here only affects the Questionnaires tab.
  const questionnaires = useClientQuestionnaires(userId);
  const bodyMetrics = useClientBodyMetrics(userId);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([
      getAdminUser(userId),
      listEnrolledClients({ userId, pageSize: 100, sortKey: "enrollDate", sortDir: "desc" }),
    ])
      .then(([u, page]) => {
        if (cancelled) return;
        setUser(u);
        setEnrollments(page.rows);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
        else setError(cause instanceof ApiError ? cause : new ApiError(0, "UNKNOWN_ERROR", "Failed to load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const back = (
    <div className={styles.topRow}>
      <button className={styles.backLink} onClick={() => navigate("/users/clients")}>
        <ArrowLeft size={14} /> Back to Clients
      </button>
    </div>
  );

  if (loading) {
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  }

  if (notFound) {
    return (
      <>
        {back}
        <EmptyState title="Client not found" description="This client may have been removed." />
      </>
    );
  }

  if (error?.isForbidden) {
    return <EmptyState title="Not authorised" description="Your account does not have permission to view client records." />;
  }
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!user) return <EmptyState title="Client not found" description="This client may have been removed." />;

  const displayName = user.profile.name ?? user.profile.email ?? "Unnamed client";
  const photo = resolveMediaUrl(user.profile.profilePicture);
  const fitness = user.profile.fitnessProfile;
  const live = enrollments.filter((e) => e.status !== "deleted");
  const current = live.find((e) => e.status === "active") ?? null;
  const dated = live.filter((e) => e.enrollDate).map((e) => e.enrollDate as string).sort();
  const firstEnrolled = dated[0] ?? null;
  const latestEnrolled = dated[dated.length - 1] ?? null;
  const latestCoach = live.map(coachName).find((n) => n) ?? null;
  // Rows arrive newest first: the active plan, else the most recent purchase.
  const latest = current ?? live[0] ?? null;

  // Every coach this member has had, newest first, with the period they covered.
  const coachMap = new Map<
    string,
    { name: string; level: string | null; linked: boolean; photo: string | null; current: boolean; enrollments: EnrolledClientRow[] }
  >();
  for (const e of live) {
    const name = coachName(e);
    if (!name) continue;
    const c = coachMap.get(name) ?? { name, level: e.coach?.level ?? null, linked: Boolean(e.coach), photo: resolveMediaUrl(e.coach?.profilePicture ?? null), current: false, enrollments: [] };
    // Rows arrive newest first, so each coach's plans are listed newest first too.
    c.enrollments.push(e);
    if (current && e.id === current.id) c.current = true;
    coachMap.set(name, c);
  }
  const coaches = [...coachMap.values()];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "Profile" },
    { key: "plans", label: "Plans", count: enrollments.length },
    { key: "payments", label: "Payments", count: enrollments.filter((e) => e.amount !== null).length },
    { key: "coaches", label: "Coaches", count: coaches.length },
    {
      key: "questionnaires",
      label: "Questionnaires",
      count: questionnaires.state.status === "ready" ? questionnaires.state.rows.length : undefined,
    },
    {
      key: "bodyMetrics",
      label: "Body Metrics",
      count: bodyMetrics.state.status === "ready" ? bodyMetrics.state.rows.length : undefined,
    },
  ];

  const paymentColumns: Column<EnrolledClientRow>[] = [
    { key: "enrollDate", header: "Date", render: (e) => day(e.enrollDate) },
    { key: "plan", header: "Plan", render: (e) => dash(e.plan?.name ?? null) },
    { key: "amount", header: "Amount", render: (e) => money(e.amount, e.currency) },
    { key: "paymentStatus", header: "Payment", render: (e) => dash(e.paymentStatus) },
    { key: "method", header: "Method", render: (e) => dash(e.paymentMethod ? METHOD_LABELS[e.paymentMethod] : null) },
    { key: "coupon", header: "Coupon", render: (e) => dash(couponCode(e)) },
    { key: "transactionId", header: "Transaction / Reference", render: (e) => dash(e.transactionId ?? e.paymentReference ?? null) },
    { key: "status", header: "Plan Status", render: (e) => <StatusBadge label={STATUS_LABELS[e.status]} tone={STATUS_TONE[e.status]} /> },
  ];

  return (
    <>
      {back}

      <div className={styles.header}>
        {photo ? (
          // Same as User details: the photo opens full screen.
          <button type="button" className={styles.photoButton} onClick={() => setPhotoOpen(true)} aria-label={`View ${displayName}'s profile photo`}>
            <Avatar name={displayName} src={photo} size="xl" />
          </button>
        ) : (
          <Avatar name={displayName} size="xl" />
        )}
        {photo && <ImageLightbox open={photoOpen} src={photo} alt={`${displayName} - profile photo`} onClose={closePhoto} />}
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{displayName}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{dash(user.phone.normalized)}</span>
            <RoleBadges roles={user.roles} />
            {current ? <StatusBadge label="Active plan" tone="success" /> : <StatusBadge label="No active plan" tone="neutral" />}
            <span className="text-caption">Client since {day(firstEnrolled)}</span>
          </div>
        </div>
      </div>

      <div className={styles.tabsRow}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <>
          <GlassCard className={styles.summary}>
            <div className={styles.summaryGrid}>
              <Stat label="Plans Bought" value={String(live.length)} />
              <Stat label="Total Paid" value={totalPaid(live)} />
              <Stat label="Current Plan" value={dash(current?.plan?.name ?? null)} />
              <Stat label="Coach" value={dash(current ? coachName(current) : latestCoach)} />
              <Stat label="First Enrolled" value={day(firstEnrolled)} />
              <Stat label="Latest Enrollment" value={day(latestEnrolled)} />
            </div>
          </GlassCard>

          <div className={styles.sectionHead}>
            <p className="text-title">{current ? "Current Plan" : "Latest Plan"}</p>
          </div>
          {latest ? (
            <PurchaseCard e={latest} />
          ) : (
            <GlassCard>
              <EmptyState title="No plans bought" description="This member has no enrollment records." />
            </GlassCard>
          )}
        </>
      )}

      {tab === "profile" && (
        <GlassCard>
          <div className={styles.statGrid}>
            <Stat label="Email" value={dash(user.profile.email)} />
            <Stat label="Phone" value={dash(user.phone.normalized)} />
            <Stat label="Account" value={user.status ? user.status[0].toUpperCase() + user.status.slice(1) : "—"} />
            <Stat label="Age" value={user.profile.age === null ? "—" : `${user.profile.age} yrs`} />
            <Stat label="Gender" value={dash(user.profile.gender)} />
            <Stat label="City" value={dash(user.profile.city)} />
            <Stat label="Goal" value={dash(fitness.goal)} />
            <Stat label="Height" value={fitness.height === null ? "—" : `${fitness.height} cm`} />
            <Stat label="Weight" value={fitness.weight === null ? "—" : `${fitness.weight} kg`} />
            <Stat label="Activity Level" value={dash(fitness.activityLevel)} />
            <Stat label="Food Type" value={dash(fitness.foodType)} />
            <Stat label="Joined" value={day(user.createdAt)} />
            <Stat label="Legacy User ID" value={dash(user.legacy?.userId ?? null)} />
          </div>
        </GlassCard>
      )}

      {tab === "plans" &&
        (enrollments.length === 0 ? (
          <GlassCard>
            <EmptyState title="No plans bought" description="This member has no enrollment records." />
          </GlassCard>
        ) : (
          <div className={styles.purchases}>
            {enrollments.map((e) => (
              <PurchaseCard key={e.id} e={e} />
            ))}
          </div>
        ))}

      {tab === "payments" && (
        <>
          <div className={styles.sectionHead}>
            <p className="text-title">Payments</p>
            <span className="text-caption">Total paid {totalPaid(live)}</span>
          </div>
          <DataTable
            columns={paymentColumns}
            rows={enrollments}
            getRowId={(e) => e.id}
            emptyTitle="No payments"
            emptyDescription="This member has not paid for any plan."
          />
        </>
      )}

      {tab === "coaches" &&
        (coaches.length === 0 ? (
          <GlassCard>
            <EmptyState title="No coach recorded" description="None of this member's plans has a coach." />
          </GlassCard>
        ) : (
          <div className={styles.purchases}>
            {coaches.map((c) => (
              <GlassCard key={c.name}>
                <div className={styles.purchaseHead}>
                  <div className={styles.coachIdentity}>
                    {/* The coach's own photo; initials when there is none (always, for legacy coaches). */}
                    <Avatar name={c.name} src={c.photo ?? undefined} size="lg" />
                    <div>
                      <p className={styles.planName}>{c.name}</p>
                      <span className="text-caption">{c.level ?? (c.linked ? "Coach" : "Legacy coach")}</span>
                    </div>
                  </div>
                  {c.current && <StatusBadge label="Current coach" tone="success" />}
                </div>
                {/* Just which plan(s) this coach coached - the plan details live in the Plans tab. */}
                <div className={styles.coachPlans} aria-label={`Plans with ${c.name}`}>
                  <span className={styles.coachPlansLabel}>{c.enrollments.length === 1 ? "Plan" : "Plans"}</span>
                  {c.enrollments.map((e) => (
                    <span key={e.id} className={styles.coachPlanName}>
                      {dash(e.plan?.name ?? null)}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        ))}

      {tab === "questionnaires" && <ClientQuestionnaires state={questionnaires.state} onRetry={questionnaires.retry} />}
      {tab === "bodyMetrics" && <ClientBodyMetrics state={bodyMetrics.state} onRetry={bodyMetrics.retry} />}
    </>
  );
}

function PurchaseCard({ e }: { e: EnrolledClientRow }) {
  return (
    <GlassCard className={styles.purchase}>
      <div className={styles.purchaseHead}>
        <div>
          <p className={styles.planName}>{dash(e.plan?.name ?? null)}</p>
          <span className="text-caption">
            {[e.plan?.planType, e.plan?.durationWeeks ? `${e.plan.durationWeeks} weeks` : null].filter(Boolean).join(" · ") || "—"}
          </span>
        </div>
        <StatusBadge label={STATUS_LABELS[e.status]} tone={STATUS_TONE[e.status]} />
      </div>
      <div className={styles.statGrid}>
        <Stat label="Amount Paid" value={money(e.amount, e.currency)} />
        <Stat label="Payment Status" value={dash(e.paymentStatus)} />
        {e.paymentMethod && <Stat label="Payment Method" value={METHOD_LABELS[e.paymentMethod]} />}
        <Stat label="Coupon" value={dash(couponCode(e))} />
        <Stat label="Enrolled" value={day(e.enrollDate)} />
        <Stat label="Start Date" value={day(e.startDate)} />
        <Stat label="End Date" value={day(e.endDate)} />
        <Stat label="Coach" value={dash(coachName(e))} />
        {e.transactionId || !e.paymentReference ? (
          <Stat label="Transaction ID" value={dash(e.transactionId)} mono />
        ) : (
          <Stat label="Reference" value={e.paymentReference} mono />
        )}
        <Stat label="Legacy Enrollment ID" value={dash(e.legacyEnrollmentId)} />
      </div>
    </GlassCard>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={mono ? `${styles.statValue} ${styles.mono}` : styles.statValue}>{value}</span>
    </div>
  );
}
