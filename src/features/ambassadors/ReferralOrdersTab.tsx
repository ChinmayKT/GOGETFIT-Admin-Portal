import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { Input } from "../../components/forms/Input";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { exportReferralOrders, getReferralPlanOptions, listReferralOrders, type ReferralListParams } from "../../api/ambassadors";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import { downloadCsv } from "../../utils/csv";
import type { Ambassador, ReferralOrder } from "../../types/ambassador";
import { ReferralDetailDrawer } from "./ReferralDetailDrawer";
import { REFERRAL_TONE, paymentTone } from "./tones";
import styles from "./Ambassadors.module.css";

/** Everyone who bought with this ambassador's code, with the full order. */
export function ReferralOrdersTab({ ambassador }: { ambassador: Ambassador }) {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [planId, setPlanId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [referralStatus, setReferralStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<ReferralOrder | null>(null);
  const [planOptions, setPlanOptions] = useState<{ label: string; value: string }[]>([]);
  const pageSize = 10;

  useEffect(() => {
    let live = true;
    getReferralPlanOptions(ambassador.id)
      .then((o) => live && setPlanOptions(o))
      .catch(() => live && setPlanOptions([]));
    return () => {
      live = false;
    };
  }, [ambassador.id]);

  const params = useMemo<ReferralListParams>(
    () => ({
      query,
      planId: planId || undefined,
      paymentStatus: paymentStatus || undefined,
      referralStatus: referralStatus || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize,
    }),
    [query, planId, paymentStatus, referralStatus, from, to, page],
  );
  const fetcher = useMemo(() => (p: ReferralListParams) => listReferralOrders(ambassador.id, p), [ambassador.id]);
  const { rows, total, loading, error, retry } = usePagedQuery(fetcher, params);
  const reset = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };

  const exportCsv = async () => {
    const all = await exportReferralOrders(ambassador.id, params);
    downloadCsv(
      `referrals-${ambassador.couponCode}.csv`,
      ["Customer", "User ID", "Email", "Mobile", "Coupon", "Plan", "Plan ID", "Order ID", "Original", "Discount", "Paid", "Payment ID", "Payment Status", "Referral Status", "Purchased"],
      all.map((o) => [o.customerName, o.customerUserId, o.email, o.mobile, o.couponCode, o.planName, o.planId, o.orderId, o.originalAmount, o.discountAmount, o.paidAmount, o.paymentId, o.paymentStatus, o.referralStatus, formatDate(o.purchasedAt)]),
    );
    show(`Exported ${all.length} referrals`, "success");
  };

  const columns: Column<ReferralOrder>[] = [
    { key: "customerName", header: "Customer", render: (o) => <span className={styles.nowrap}>{o.customerName}</span> },
    { key: "customerUserId", header: "User ID" , render: (o) => <span className={styles.nowrap}>{o.customerUserId}</span> },
    { key: "email", header: "Email" , render: (o) => <span className={styles.nowrap}>{o.email}</span> },
    { key: "mobile", header: "Mobile", render: (o) => <span className={styles.nowrap}>{o.mobile}</span> },
    { key: "couponCode", header: "Coupon", render: (o) => <span className={styles.code}>{o.couponCode}</span> },
    { key: "planName", header: "Plan", render: (o) => <span className={styles.nowrap}>{o.planName}</span> },
    { key: "planId", header: "Plan ID" , render: (o) => <span className={styles.nowrap}>{o.planId}</span> },
    { key: "orderId", header: "Order ID" , render: (o) => <span className={styles.nowrap}>{o.orderId}</span> },
    { key: "originalAmount", header: "Plan Amount", align: "right", render: (o) => formatCurrencyINR(o.originalAmount) },
    { key: "discountAmount", header: "Discount", align: "right", render: (o) => formatCurrencyINR(o.discountAmount) },
    { key: "paidAmount", header: "Paid", align: "right", render: (o) => formatCurrencyINR(o.paidAmount) },
    { key: "paymentId", header: "Payment ID" , render: (o) => <span className={styles.nowrap}>{o.paymentId}</span> },
    { key: "paymentStatus", header: "Payment", render: (o) => <StatusBadge label={o.paymentStatus ?? "—"} tone={paymentTone(o.paymentStatus)} /> },
    { key: "referralStatus", header: "Referral", render: (o) => <StatusBadge label={o.referralStatus} tone={REFERRAL_TONE[o.referralStatus]} /> },
    { key: "purchasedAt", header: "Purchased", render: (o) => <span className={styles.nowrap}>{formatDate(o.purchasedAt)}</span> },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query} onChange={reset(setQuery)} placeholder="Search customer, user ID, email, order or payment ID..." />
        <Select aria-label="Plan" value={planId} onChange={(e) => reset(setPlanId)(e.target.value)} options={[{ label: "All plans", value: "" }, ...planOptions]} />
        <Select
          aria-label="Payment status"
          value={paymentStatus}
          onChange={(e) => reset(setPaymentStatus)(e.target.value)}
          options={[{ label: "All payments", value: "" }, { label: "Success", value: "Success" }, { label: "Pending", value: "Pending" }, { label: "Refunded", value: "Refunded" }]}
        />
        <Select
          aria-label="Referral status"
          value={referralStatus}
          onChange={(e) => reset(setReferralStatus)(e.target.value)}
          options={[{ label: "All referrals", value: "" }, { label: "Successful", value: "Successful" }, { label: "Pending", value: "Pending" }]}
        />
        <div className={styles.dateField}>
          <Input type="date" aria-label="From date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} />
        </div>
        <div className={styles.dateField}>
          <Input type="date" aria-label="To date" value={to} onChange={(e) => reset(setTo)(e.target.value)} />
        </div>
        <Button className={styles.toolbarEnd} icon={<Download size={15} />} onClick={exportCsv} disabled={loading || total === 0}>
          Export
        </Button>
      </FilterBar>

      <DataTable
        rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(o) => o.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={setOpen}
        emptyTitle="No referral orders"
        emptyDescription="Purchases made with this ambassador's code will show up here."
      />
      {!loading && !error && rows.length > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />}

      <ReferralDetailDrawer referral={open} ambassador={ambassador} onClose={() => setOpen(null)} />
    </>
  );
}
