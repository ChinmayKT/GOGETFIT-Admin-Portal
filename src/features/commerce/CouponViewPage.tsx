import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { ApiError } from "../../api/client";
import { getCoupon } from "../../api/coupons";
import { formatDateTime } from "../../utils/format";
import { adminName, couponDay, type Coupon } from "../../types/coupons";
import styles from "../users/UserDetailPage.module.css";

export function CouponViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let stale = false;
    setState("loading");
    getCoupon(id)
      .then((c) => {
        if (stale) return;
        setCoupon(c);
        setState("ready");
      })
      .catch((cause) => !stale && setState(cause instanceof ApiError && cause.status === 404 ? "notFound" : "error"));
    return () => {
      stale = true;
    };
  }, [id, attempt]);

  const back = (
    <button className={styles.backLink} onClick={() => navigate("/commerce/coupons")}>
      <ArrowLeft size={14} /> Back to Coupons
    </button>
  );

  if (state === "loading") return <GlassCard><SkeletonProfile /></GlassCard>;
  if (state === "notFound") return <>{back}<ErrorState title="Coupon not found" description="This coupon does not exist." /></>;
  if (state === "error" || !coupon) return <>{back}<ErrorState description="We couldn't load this coupon." onRetry={() => setAttempt((n) => n + 1)} /></>;

  const active = coupon.status === "active";
  return (
    <>
      <div className={styles.topRow}>
        {back}
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/commerce/coupons/${coupon.id}/edit`)}>Edit Coupon</Button>
      </div>

      <PageHeader title={coupon.code} breadcrumb={[{ label: "Commerce", path: "/commerce/coupons" }, { label: "Coupons", path: "/commerce/coupons" }, { label: coupon.code }]} />

      <GlassCard>
        <div className={styles.metaRow} style={{ marginBottom: 8 }}>
          <StatusBadge label={active ? "Active" : "Inactive"} tone={active ? "success" : "neutral"} />
          <StatusBadge label={coupon.visibility === "public" ? "Visible to All: Yes" : "Visible to All: No"} tone={coupon.visibility === "public" ? "info" : "neutral"} dot={false} />
        </div>
        <p className="text-caption" style={{ marginBottom: 6 }}>
          Status is automatically determined by the validity dates.
        </p>
        <p className="text-caption" style={{ marginBottom: 20 }}>
          {coupon.visibility === "public"
            ? "Visible to All: Yes — this coupon appears in the general checkout coupon list."
            : "Visible to All: No — this coupon is hidden from the general checkout list, but can still be used by entering the exact code while it is valid."}
        </p>
        <div className={styles.statGrid}>
          <Stat label="Discount" value={`${coupon.discount.value}%`} />
          <Stat label="Valid From" value={couponDay(coupon.validFrom)} />
          <Stat label="Valid To" value={couponDay(coupon.validTo)} />
          <Stat label="Description" value={coupon.description ?? "—"} />
          <Stat label="Created By" value={adminName(coupon.createdBy)} />
          <Stat label="Created At" value={coupon.createdAt ? formatDateTime(coupon.createdAt) : "—"} />
          <Stat label="Updated By" value={adminName(coupon.updatedBy)} />
          <Stat label="Updated At" value={coupon.updatedAt ? formatDateTime(coupon.updatedAt) : "—"} />
        </div>
      </GlassCard>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
