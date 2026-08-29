import { MOCK_PAYMENTS, MOCK_FINANCE_TRANSACTIONS, MOCK_REFUNDS, MOCK_SUBSCRIPTIONS } from "./data";
import {
  financeOverviewKpis, revenueTrend, revenueByBusinessType, revenueByPackage,
  coachFinancialPerformanceList, coachAcquisitionList, coachFunnel, subscriptionsSummary,
  businessHealth, financeInsights,
} from "./aggregates";
import { delay, matchesQuery, paginate, sortRows } from "../shared/utils";
import type { Payment } from "../../types/finance";

export interface PaymentListParams {
  query?: string;
  status?: string;
  method?: string;
  coachId?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listPayments(params: PaymentListParams = {}) {
  const { query = "", status, method, coachId, page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;
  let rows = MOCK_PAYMENTS.filter((p) => matchesQuery([p.paymentNumber, p.clientName, p.transactionRef, p.coachName], query));
  if (status) rows = rows.filter((p) => p.status === status);
  if (method) rows = rows.filter((p) => p.method === method);
  if (coachId) rows = rows.filter((p) => p.coachId === coachId);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

export async function getPayment(id: string): Promise<Payment | null> {
  return delay(MOCK_PAYMENTS.find((p) => p.id === id) ?? null);
}

export interface TransactionListParams {
  query?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export async function listTransactions(params: TransactionListParams = {}) {
  const { query = "", type, page = 1, pageSize = 10 } = params;
  let rows = MOCK_FINANCE_TRANSACTIONS.filter((t) => matchesQuery([t.transactionNumber, t.clientName, t.paymentId ?? ""], query));
  if (type) rows = rows.filter((t) => t.type === type);
  rows = sortRows(rows, "createdAt", "desc");
  return delay(paginate(rows, page, pageSize));
}

export interface RefundListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listRefunds(params: RefundListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10 } = params;
  let rows = MOCK_REFUNDS.filter((r) => matchesQuery([r.refundNumber, r.clientName, r.reason], query));
  if (status) rows = rows.filter((r) => r.status === status);
  rows = sortRows(rows, "createdAt", "desc");
  return delay(paginate(rows, page, pageSize));
}

export function refundKpis() {
  const totalRefundAmount = MOCK_REFUNDS.filter((r) => r.status === "Completed").reduce((s, r) => s + r.refundAmount, 0);
  const pendingRefunds = MOCK_REFUNDS.filter((r) => r.status === "Requested" || r.status === "Processing").length;
  const completedRefunds = MOCK_REFUNDS.filter((r) => r.status === "Completed").length;
  const refundRatePct = MOCK_PAYMENTS.length > 0 ? (MOCK_REFUNDS.filter((r) => r.status === "Completed").length / MOCK_PAYMENTS.length) * 100 : 0;
  return { totalRefundAmount, pendingRefunds, completedRefunds, refundRatePct };
}

export interface SubscriptionListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listSubscriptions(params: SubscriptionListParams = {}) {
  const { query = "", status, page = 1, pageSize = 10 } = params;
  let rows = MOCK_SUBSCRIPTIONS.filter((s) => matchesQuery([s.clientName, s.coachName, s.packageName], query));
  if (status) rows = rows.filter((s) => s.status === status);
  rows = sortRows(rows, "endDate", "asc");
  return delay(paginate(rows, page, pageSize));
}

export async function financeOverview() {
  return delay({
    kpis: financeOverviewKpis(),
    trend: revenueTrend(6),
    byBusinessType: revenueByBusinessType(),
    byPackage: revenueByPackage().slice(0, 6),
    health: businessHealth(),
    insights: financeInsights(),
  }, 500);
}

export async function coachPerformanceOverview() {
  return delay({ coaches: coachFinancialPerformanceList(), acquisition: coachAcquisitionList() }, 500);
}

export async function coachFinanceDetail(coachId: string) {
  const all = coachFinancialPerformanceList();
  const coach = all.find((c) => c.coachId === coachId) ?? null;
  const clients = MOCK_SUBSCRIPTIONS.filter((s) => s.coachId === coachId);
  return delay({ coach, funnel: coachFunnel(coachId), clients, trend: revenueTrend(12) }, 500);
}

export async function subscriptionsOverview() {
  return delay({ summary: subscriptionsSummary(), rows: MOCK_SUBSCRIPTIONS }, 400);
}

export { revenueTrend, revenueByBusinessType, revenueByPackage, coachFinancialPerformanceList, coachAcquisitionList, coachFunnel };
