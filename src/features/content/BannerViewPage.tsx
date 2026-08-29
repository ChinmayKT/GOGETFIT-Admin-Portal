import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getBanner } from "../../mock/content/bannerRepository";
import { formatDate } from "../../utils/format";
import type { Banner } from "../../types/content";
import styles from "../users/UserFormPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral" };

export function BannerViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBanner(id).then((b) => setBanner(b)).catch(() => setError(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!banner) return <EmptyState title="Banner not found" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className={styles.backLink} onClick={() => navigate("/content/banners")} style={{ marginBottom: 0 }}>
          <ArrowLeft size={14} /> Back to List
        </button>
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/content/banners/${banner.id}/edit`)}>
          Edit
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 20 }}>
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h1 className="text-title" style={{ fontSize: "var(--fs-headline)" }}>{banner.name}</h1>
            <StatusBadge label={banner.status} tone={STATUS_TONE[banner.status]} />
          </div>

          <Row label="Description" value={banner.description} />
          <Row label="Redirect To" value={banner.redirectTarget === "External URL" ? `External URL — ${banner.redirectUrl}` : banner.redirectTarget} />
          <Row label="From" value={formatDate(banner.fromDate)} />
          <Row label="To" value={formatDate(banner.toDate)} />
          <Row label="Last Updated" value={formatDate(banner.updatedAt)} />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 12 }}>Banner Image</p>
          {banner.imageUrl ? (
            <img src={banner.imageUrl} alt={banner.name} style={{ width: "100%", borderRadius: 10, display: "block" }} />
          ) : (
            <p className="text-caption">No image uploaded.</p>
          )}
        </GlassCard>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="text-caption" style={{ marginBottom: 4 }}>{label}</div>
      <div className="text-secondary" style={{ lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}
