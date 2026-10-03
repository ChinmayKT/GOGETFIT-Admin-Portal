import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { ImageLightbox } from "../../components/ui/ImageLightbox";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { listUserBodyMetrics, type SubmittedBodyMetrics } from "../../api/adminUsers";
import { resolveMediaUrl } from "../../api/media";
import { formatDate } from "../../utils/format";
import { dash } from "./clientFormat";
import { BodyHologram } from "./BodyHologram";
import styles from "./ClientDetailPage.module.css";

export type BodyMetricsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: SubmittedBodyMetrics[] };

/** The 11 measurements in the app's form order, with their stored units. */
const MEASUREMENTS: { key: string; label: string; unit: string }[] = [
  { key: "age", label: "Age", unit: "yrs" },
  { key: "height", label: "Height", unit: "cm" },
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "neck", label: "Neck", unit: "cm" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "rightArm", label: "Right Arm", unit: "cm" },
  { key: "leftArm", label: "Left Arm", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "rightThigh", label: "Right Thigh", unit: "cm" },
  { key: "leftThigh", label: "Left Thigh", unit: "cm" },
];

const PHOTOS = [
  { slot: "front", label: "Front" },
  { slot: "side", label: "Side" },
  { slot: "back", label: "Back" },
] as const;

/** Loads a member's submitted Body Metrics with the page, for the tab's count. */
export function useClientBodyMetrics(userId: string | undefined) {
  const [state, setState] = useState<BodyMetricsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setState({ status: "loading" });
    listUserBodyMetrics(userId)
      .then((res) => {
        if (stale) return;
        setState(Array.isArray(res?.bodyMetrics) ? { status: "ready", rows: res.bodyMetrics } : { status: "error" });
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [userId, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

/**
 * The Body Metrics the member SUBMITTED in the app - one per enrollment - as
 * an accordion, newest first: plan, coach and dates, the 11 measurements, the
 * three photos (full screen on click) and the video when there is one.
 */
export function ClientBodyMetrics({ state, onRetry }: { state: BodyMetricsState; onRetry: () => void }) {
  const latestId = state.status === "ready" ? (state.rows[0]?.bodyMetricsId ?? null) : null;
  const [openId, setOpenId] = useState<string | null>(latestId);
  useEffect(() => setOpenId(latestId), [latestId]);
  const [viewing, setViewing] = useState<{ src: string; alt: string } | null>(null);
  const close = useCallback(() => setViewing(null), []);

  if (state.status === "loading")
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  if (state.status === "error") return <ErrorState onRetry={onRetry} />;
  if (state.rows.length === 0) {
    return (
      <GlassCard>
        <EmptyState title="No Body Metrics submitted" description="This member has not submitted Body Metrics in the app." />
      </GlassCard>
    );
  }

  const total = state.rows.length;
  return (
    <div className={styles.purchases}>
      {state.rows.map((b, i) => {
        // Newest first; numbered from the first plan bought.
        const n = total - i;
        const isOpen = openId === b.bodyMetricsId;
        const panelId = `body-metrics-panel-${b.bodyMetricsId}`;
        const video = resolveMediaUrl(b.media.video?.url);
        return (
          <GlassCard key={b.bodyMetricsId} padding="none">
            <button
              type="button"
              className={styles.accordionHead}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : b.bodyMetricsId)}
            >
              <div className={styles.accordionTitle}>
                <p className={styles.planName}>
                  Body Metrics {n}
                  {i === 0 && total > 1 && <span className={styles.latestTag}>Latest</span>}
                </p>
                <span className="text-caption">
                  {[
                    `Plan ${n}: ${dash(b.plan?.name ?? null)}`,
                    b.coach?.name ? `Coach ${b.coach.name}` : null,
                    b.coach?.level ?? null,
                    b.enrollment?.enrollDate ? `Enrolled ${formatDate(b.enrollment.enrollDate)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className={styles.questionnaireMeta}>
                <span className="text-caption">Submitted {b.submittedAt ? formatDate(b.submittedAt) : "—"}</span>
                <ChevronDown size={18} className={isOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron} aria-hidden />
              </div>
            </button>
            {isOpen && (
              <div id={panelId} className={styles.accordionBody}>
                <p className={styles.qaSectionTitle}>Measurements</p>
                <dl className={styles.statGrid} aria-label="Measurements">
                  {MEASUREMENTS.map((m) => {
                    const value = b.measurements[m.key];
                    return (
                      <div key={m.key} className={styles.stat}>
                        <dt className={styles.statLabel}>{m.label}</dt>
                        <dd className={styles.statValue} style={{ margin: 0 }}>
                          {value === null || value === undefined ? "—" : `${value} ${m.unit}`}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {/* The app's Body Report body, with the eight body measurements on it. */}
                <p className={styles.qaSectionTitle} style={{ marginTop: 24 }}>Body Report</p>
                <div className={styles.bmHologram}>
                  <BodyHologram measurements={b.measurements} />
                </div>

                <p className={styles.qaSectionTitle} style={{ marginTop: 24 }}>Progress Photos</p>
                <div className={styles.bmPhotos}>
                  {PHOTOS.map(({ slot, label }) => {
                    const src = resolveMediaUrl(b.media[slot]?.url);
                    const alt = `${label} photo`;
                    return (
                      <figure key={slot} className={styles.bmPhoto}>
                        {src ? (
                          <button type="button" onClick={() => setViewing({ src, alt })} aria-label={`View ${label.toLowerCase()} photo`}>
                            <img src={src} alt={alt} />
                          </button>
                        ) : (
                          <div className={styles.bmPhotoEmpty} role="img" aria-label={`No ${label.toLowerCase()} photo`}>
                            —
                          </div>
                        )}
                        <figcaption className="text-caption">{label}</figcaption>
                      </figure>
                    );
                  })}
                </div>

                {video && (
                  <>
                    <p className={styles.qaSectionTitle} style={{ marginTop: 24 }}>Progress Video</p>
                    <video className={styles.bmVideo} src={video} controls preload="metadata" aria-label="Progress video" />
                  </>
                )}
              </div>
            )}
          </GlassCard>
        );
      })}
      <ImageLightbox open={viewing !== null} src={viewing?.src ?? ""} alt={viewing?.alt ?? ""} onClose={close} />
    </div>
  );
}
