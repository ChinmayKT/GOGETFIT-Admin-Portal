import type {
  Payment, FinanceTransaction, Refund, Subscription, PaymentMethod, BusinessType,
} from "../../types/finance";
import { MOCK_CLIENTS } from "../users/clientsData";
import { MOCK_PACKAGES } from "../commerce/packageData";
import { MOCK_ADMIN_USERS } from "../system/adminUserData";
import { randomInt, pick, daysAgo, nextId } from "../shared/utils";

const METHODS: PaymentMethod[] = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"];
const GATEWAYS = ["Razorpay", "PayU", "Cashfree"];
const REFUND_REASONS = [
  "Client requested cancellation",
  "Duplicate payment",
  "Coach reassignment issue",
  "Service not as expected",
  "Billing error",
  "Medical reasons",
];

function businessTypeFor(kind: Payment["kind"], planType: "Enrollment" | "Challenge"): BusinessType {
  if (kind === "Renewal") return "Renewals";
  if (planType === "Challenge") return "Challenges";
  if (kind === "Store") return "Other";
  return "Coaching Plans";
}

const payments: Payment[] = [];
const transactions: FinanceTransaction[] = [];
const refunds: Refund[] = [];
const subscriptions: Subscription[] = [];

let paymentSeq = 100000;
let txnSeq = 500000;
let refundSeq = 900000;

function makePayment(input: {
  client: (typeof MOCK_CLIENTS)[number];
  kind: Payment["kind"];
  createdAt: string;
}): Payment {
  const pkg = MOCK_PACKAGES[Math.abs(hash(input.client.id + input.kind)) % MOCK_PACKAGES.length];
  const originalAmount = pkg.basePrice;
  const hasDiscount = !!input.client.couponCode;
  const discount = hasDiscount ? Math.round(originalAmount * (randomInt(10, 20) / 100)) : 0;
  const finalAmount = originalAmount - discount;

  // ~5% of payments end up refunded/partially refunded; the rest succeed, with a small
  // pending/failed sliver so the Payments list and success-rate KPI feel real.
  const roll = Math.abs(hash(input.client.id + input.kind + "roll")) % 100;
  let status: Payment["status"] = "Success";
  let refundedAmount = 0;
  if (roll < 3) status = "Refunded";
  else if (roll < 5) status = "Partially Refunded";
  else if (roll < 7) status = "Pending";
  else if (roll < 9) status = "Failed";

  if (status === "Refunded") refundedAmount = finalAmount;
  if (status === "Partially Refunded") refundedAmount = Math.round(finalAmount * (randomInt(30, 60) / 100));

  const netAmount = status === "Success" || status === "Partially Refunded" ? finalAmount - refundedAmount : 0;

  const payment: Payment = {
    id: nextId("payment"),
    paymentNumber: `PAY-${paymentSeq++}`,
    transactionRef: `TXN${randomInt(100000000, 999999999)}`,
    clientId: input.client.userId,
    clientName: input.client.clientName,
    coachId: input.client.coachId,
    coachName: input.client.coachName,
    packageId: pkg.id,
    packageName: pkg.planName,
    kind: input.kind,
    businessType: businessTypeFor(input.kind, pkg.planType),
    originalAmount,
    discount,
    finalAmount,
    refundedAmount,
    netAmount,
    method: pick(METHODS),
    status,
    gateway: pick(GATEWAYS),
    createdAt: input.createdAt,
  };
  return payment;
}

/** Deterministic string hash so the same client always maps to the same package/roll across reloads within a session. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

MOCK_CLIENTS.forEach((client, i) => {
  const enrollmentPayment = makePayment({ client, kind: "Enrollment", createdAt: client.startDate });
  payments.push(enrollmentPayment);

  const isRenewalCandidate = client.status === "Active" || client.status === "Pending Renewal";
  const getsRenewal = isRenewalCandidate && i % 3 === 0;
  if (getsRenewal) {
    const renewalDate = daysAgo(Math.max(1, randomInt(5, 60)));
    payments.push(makePayment({ client, kind: "Renewal", createdAt: renewalDate }));
  }
});

// Transactions: one per payment (Payment or Renewal type), plus a handful of manual adjustments.
payments.forEach((p) => {
  transactions.push({
    id: nextId("txn"),
    transactionNumber: `TXN-${txnSeq++}`,
    paymentId: p.id,
    clientId: p.clientId,
    clientName: p.clientName,
    type: p.kind === "Renewal" ? "Renewal" : "Payment",
    amount: p.finalAmount,
    status: p.status === "Pending" ? "Pending" : p.status === "Failed" ? "Failed" : "Success",
    gateway: p.gateway,
    createdAt: p.createdAt,
  });
});

// Refund records for every Refunded/Partially Refunded payment (status already resolved).
payments
  .filter((p) => p.status === "Refunded" || p.status === "Partially Refunded")
  .forEach((p) => {
    refunds.push({
      id: nextId("refund"),
      refundNumber: `REF-${refundSeq++}`,
      paymentId: p.id,
      clientId: p.clientId,
      clientName: p.clientName,
      originalAmount: p.finalAmount,
      refundAmount: p.refundedAmount,
      reason: pick(REFUND_REASONS),
      requestedBy: pick(MOCK_ADMIN_USERS).name,
      status: "Completed",
      createdAt: daysAgo(randomInt(1, 20)),
    });
    transactions.push({
      id: nextId("txn"),
      transactionNumber: `TXN-${txnSeq++}`,
      paymentId: p.id,
      clientId: p.clientId,
      clientName: p.clientName,
      type: "Refund",
      amount: p.refundedAmount,
      status: "Success",
      gateway: p.gateway,
      createdAt: daysAgo(randomInt(1, 20)),
    });
  });

// A handful of open refund requests still in flight (Success payment, refund not yet applied to it).
const openRefundCandidates = payments.filter((p) => p.status === "Success").slice(0, 9);
const OPEN_STATUSES: Refund["status"][] = ["Requested", "Processing", "Requested", "Processing", "Rejected"];
openRefundCandidates.forEach((p, i) => {
  refunds.push({
    id: nextId("refund"),
    refundNumber: `REF-${refundSeq++}`,
    paymentId: p.id,
    clientId: p.clientId,
    clientName: p.clientName,
    originalAmount: p.finalAmount,
    refundAmount: Math.round(p.finalAmount * (randomInt(50, 100) / 100)),
    reason: pick(REFUND_REASONS),
    requestedBy: pick(MOCK_ADMIN_USERS).name,
    status: OPEN_STATUSES[i % OPEN_STATUSES.length],
    createdAt: daysAgo(randomInt(0, 5)),
  });
});

// A few manual ledger adjustments, for realism in the Transactions list only.
for (let i = 0; i < 8; i++) {
  const client = MOCK_CLIENTS[randomInt(0, MOCK_CLIENTS.length - 1)];
  transactions.push({
    id: nextId("txn"),
    transactionNumber: `TXN-${txnSeq++}`,
    paymentId: null,
    clientId: client.userId,
    clientName: client.clientName,
    type: "Adjustment",
    amount: randomInt(-500, 500),
    status: "Success",
    gateway: "Manual",
    createdAt: daysAgo(randomInt(1, 90)),
  });
}

// Subscriptions: one row per client, mapped from the client's actual status + whether they've renewed.
const renewedClientIds = new Set(payments.filter((p) => p.kind === "Renewal" && p.status !== "Failed").map((p) => p.clientId));
MOCK_CLIENTS.forEach((client) => {
  const daysToEnd = Math.ceil((new Date(client.endDate).getTime() - Date.now()) / 86400000);
  let status: Subscription["status"];
  if (client.status === "Cancelled") status = "Cancelled";
  else if (client.status === "Expired") status = "Expired";
  else if (renewedClientIds.has(client.userId)) status = "Renewed";
  else if (client.status === "Pending Renewal" || daysToEnd <= 14) status = "Expiring Soon";
  else status = "Active";

  const clientRevenue = payments
    .filter((p) => p.clientId === client.userId)
    .reduce((sum, p) => sum + p.netAmount, 0);

  subscriptions.push({
    id: nextId("sub"),
    clientId: client.userId,
    clientName: client.clientName,
    coachId: client.coachId,
    coachName: client.coachName,
    packageName: client.planName,
    startDate: client.startDate,
    endDate: client.endDate,
    status,
    revenue: clientRevenue,
  });
});

export const MOCK_PAYMENTS = payments;
export const MOCK_FINANCE_TRANSACTIONS = transactions;
export const MOCK_REFUNDS = refunds;
export const MOCK_SUBSCRIPTIONS = subscriptions;
