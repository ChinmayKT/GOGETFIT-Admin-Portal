import { Eye } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { formatDate } from "../../utils/format";
import type { Transformation, TransformationStatus } from "../../types/progress";
import styles from "./TransformationsPage.module.css";

export type TransformationActionKey = "approve" | "reject" | "requestChanges" | "publish" | "unpublish";

export const STATUS_TONE: Record<TransformationStatus, StatusTone> = {
  "Pending Review": "warning",
  Approved: "info",
  "Changes Requested": "orange",
  Rejected: "error",
  Published: "success",
};

export const TARGET_STATUS: Record<TransformationActionKey, TransformationStatus> = {
  approve: "Approved",
  reject: "Rejected",
  requestChanges: "Changes Requested",
  publish: "Published",
  unpublish: "Approved",
};

export const ACTION_CONFIG: Record<TransformationActionKey, { label: string; tone: "primary" | "danger" }> = {
  approve: { label: "Approve", tone: "primary" },
  reject: { label: "Reject", tone: "danger" },
  requestChanges: { label: "Request Changes", tone: "primary" },
  publish: { label: "Publish", tone: "primary" },
  unpublish: { label: "Unpublish", tone: "danger" },
};

export function actionsForStatus(status: TransformationStatus): TransformationActionKey[] {
  switch (status) {
    case "Pending Review":
      return ["approve", "requestChanges", "reject"];
    case "Approved":
      return ["publish", "reject"];
    case "Changes Requested":
      return ["approve", "reject"];
    case "Published":
      return ["unpublish"];
    default:
      return [];
  }
}

export function actionDescription(t: Transformation, action: TransformationActionKey): string {
  switch (action) {
    case "approve":
      return `Approve "${t.title}"? It will be ready to publish.`;
    case "reject":
      return `Reject "${t.title}"? The submission will be marked as rejected.`;
    case "requestChanges":
      return `Ask ${t.userName} to resubmit "${t.title}" with changes. It will be marked as changes requested.`;
    case "publish":
      return `Publish "${t.title}" so it becomes visible to users.`;
    case "unpublish":
      return `Unpublish "${t.title}"? It will no longer be visible to users.`;
    default:
      return "";
  }
}

interface Props {
  transformation: Transformation;
  onView: (t: Transformation) => void;
  onAction: (t: Transformation, action: TransformationActionKey) => void;
}

export function TransformationCard({ transformation: t, onView, onAction }: Props) {
  const actions = actionsForStatus(t.status);

  return (
    <GlassCard padding="none" className={styles.card}>
      <div className={styles.imagePair}>
        <div className={styles.imageSlot}>
          <img src={t.beforeImageUrl} alt={`${t.userName} before`} />
          <span className={styles.imageLabel}>Before</span>
        </div>
        <div className={styles.imageSlot}>
          <img src={t.afterImageUrl} alt={`${t.userName} after`} />
          <span className={styles.imageLabel}>After</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.headerRow}>
          <StatusBadge label={t.status} tone={STATUS_TONE[t.status]} />
          <IconButton icon={<Eye size={14} />} label="View details" size="sm" onClick={() => onView(t)} />
        </div>
        <p className={styles.title}>{t.title}</p>
        <p className={styles.description}>{t.description}</p>
        <div className={styles.meta}>
          <span>{t.userName} · {t.ggfId}</span>
          <span>{formatDate(t.submittedAt)}</span>
        </div>

        {actions.length > 0 && (
          <div className={styles.actionsRow}>
            {actions.map((a) => (
              <Button
                key={a}
                size="sm"
                variant={ACTION_CONFIG[a].tone === "danger" ? "danger" : "secondary"}
                onClick={() => onAction(t, a)}
              >
                {ACTION_CONFIG[a].label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
