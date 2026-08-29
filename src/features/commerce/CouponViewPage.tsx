import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getCoupon } from "../../mock/commerce/couponRepository";
import { formatDate } from "../../utils/format";
import type { Coupon } from "../../types/commerce";
import styles from "../users/UserFormPage.module.css";

const AUDIENCE_TONE: Record<string, StatusTone> = { Everyone: "info", "Specific Users": "warning" };

export function CouponViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCoupon(id).then((c) => setCoupon(c ?? null)).catch(() => setError(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!coupon) return <EmptyState title="Coupon not found" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className={styles.backLink} onClick={() => navigate("/commerce/coupons")} style={{ marginBottom: 0 }}>
          <ArrowLeft size={14} /> Back to List
        </button>
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/commerce/coupons/${coupon.id}/edit`)}>
          Edit
        </Button>
      </div>

      <GlassCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 className="text-title" style={{ fontSize: "var(--fs-headline)" }}>{coupon.name}</h1>
          <StatusBadge label={coupon.audience} tone={AUDIENCE_TONE[coupon.audience]} />
        </div>

        <div className={styles.grid}>
          <Row label="Coupon Code" value={coupon.code} />
          <Row label="Discount" value={`${coupon.discountPercent}%`} />
          <Row label="Valid From" value={formatDate(coupon.validFrom)} />
          <Row label="Valid To" value={formatDate(coupon.validTo)} />
          <Row label="Audience" value={coupon.audience} />
        </div>

        {coupon.audience === "Specific Users" && (
          <div style={{ marginTop: 8 }}>
            <Row label="Applicable User IDs" value={coupon.userIds.length ? coupon.userIds.join(", ") : "—"} />
          </div>
        )}
      </GlassCard>
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
