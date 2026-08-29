import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Select } from "../../components/forms/Select";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { useToast } from "../../components/feedback/ToastProvider";
import { getOrder, updateOrderStatus } from "../../mock/orders/repository";
import { formatCurrencyINR } from "../../utils/format";
import type { Order, OrderStatus } from "../../types/order";
import styles from "../users/UserDetailPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = { Booked: "warning", Sent: "info", Delivered: "success" };

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>("Booked");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(id)
      .then((o) => {
        setOrder(o);
        if (o) setStatus(o.status);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdate() {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrder(updated);
      show("Order updated successfully");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!order) return <EmptyState title="Order not found" />;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate("/commerce/orders")} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={14} /> Back to Orders
      </button>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{order.orderNumber}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{order.itemName}</span>
            <StatusBadge label={order.status} tone={STATUS_TONE[order.status]} />
          </div>
        </div>
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Order Info</p>
        <div className={styles.statGrid}>
          <Stat label="User Name" value={order.userName} />
          <Stat label="Order" value={order.orderNumber} />
          <Stat label="Email" value={order.email} />
          <Stat label="Phone" value={order.phone} />
          <Stat label="User ID" value={order.userId} />
          <Stat label="Address" value={order.address} />
          <Stat label="Item" value={order.itemName} />
          <Stat label="Amount" value={formatCurrencyINR(order.amount)} />
        </div>
      </GlassCard>

      <GlassCard style={{ marginTop: "var(--space-5)" }}>
        <p className="text-title" style={{ marginBottom: 16 }}>Update Status</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={[
                  { label: "Booked", value: "Booked" },
                  { label: "Sent", value: "Sent" },
                  { label: "Delivered", value: "Delivered" },
                ]}
              />
            </Field>
          </div>
          <Button variant="primary" loading={saving} onClick={handleUpdate}>
            Update Order
          </Button>
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
