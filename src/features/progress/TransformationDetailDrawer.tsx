import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDate } from "../../utils/format";
import { STATUS_TONE } from "./TransformationCard";
import type { Transformation } from "../../types/progress";

interface Props {
  target: Transformation | null;
  onClose: () => void;
}

export function TransformationDetailDrawer({ target, onClose }: Props) {
  return (
    <GlassDrawer open={!!target} onClose={onClose} title={target?.title ?? "Transformation"} width={480}>
      {target && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <img src={target.beforeImageUrl} alt="Before" style={{ width: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
              <div className="text-caption" style={{ textAlign: "center", marginTop: 6 }}>Before</div>
            </div>
            <div style={{ flex: 1 }}>
              <img src={target.afterImageUrl} alt="After" style={{ width: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
              <div className="text-caption" style={{ textAlign: "center", marginTop: 6 }}>After</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <StatusBadge label={target.status} tone={STATUS_TONE[target.status]} />
            <span className="text-caption">Submitted {formatDate(target.submittedAt)}</span>
          </div>

          <div>
            <div className="text-caption" style={{ marginBottom: 4 }}>Submitted By</div>
            <div className="text-primary">{target.userName} · {target.ggfId}</div>
          </div>

          <div>
            <div className="text-caption" style={{ marginBottom: 4 }}>Description</div>
            <div className="text-primary" style={{ fontSize: "var(--fs-body)" }}>{target.description}</div>
          </div>

          {target.reviewNote && (
            <div>
              <div className="text-caption" style={{ marginBottom: 4 }}>Review Note</div>
              <div className="text-primary" style={{ fontSize: "var(--fs-body)" }}>{target.reviewNote}</div>
            </div>
          )}
        </div>
      )}
    </GlassDrawer>
  );
}
