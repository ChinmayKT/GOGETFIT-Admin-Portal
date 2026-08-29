export type PaymentStatus = "Success" | "Pending" | "Failed" | "Refunded" | "Partially Refunded";
export type PaymentMethod = "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Wallet";
export type PaymentKind = "Enrollment" | "Renewal" | "Challenge" | "Store";
export type BusinessType = "Coaching Plans" | "Renewals" | "Challenges" | "Other";

export interface Payment {
  id: string;
  paymentNumber: string;
  transactionRef: string;
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  packageId: string;
  packageName: string;
  kind: PaymentKind;
  businessType: BusinessType;
  originalAmount: number;
  discount: number;
  finalAmount: number;
  /** Portion of finalAmount actually refunded — 0 unless status is Refunded/Partially Refunded. */
  refundedAmount: number;
  /** finalAmount net of any refund — what actually counts toward recognized revenue. */
  netAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: string;
  createdAt: string;
}

export type TransactionType = "Payment" | "Refund" | "Adjustment" | "Renewal";

export interface FinanceTransaction {
  id: string;
  transactionNumber: string;
  paymentId: string | null;
  clientId: string;
  clientName: string;
  type: TransactionType;
  amount: number;
  status: "Success" | "Pending" | "Failed";
  gateway: string;
  createdAt: string;
}

export type RefundStatus = "Requested" | "Processing" | "Completed" | "Rejected";

export interface Refund {
  id: string;
  refundNumber: string;
  paymentId: string;
  clientId: string;
  clientName: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  requestedBy: string;
  status: RefundStatus;
  createdAt: string;
}

export type SubscriptionStatus = "Active" | "Expiring Soon" | "Expired" | "Renewed" | "Cancelled";

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  revenue: number;
}

export interface CoachPerformanceBreakdown {
  revenue: number;
  acquisition: number;
  retention: number;
  engagement: number;
}

export type CoachTier = "Excellent" | "Strong" | "Good" | "Needs Attention";

export interface CoachFinancialPerformance {
  coachId: string;
  coachName: string;
  level: number;
  activeClients: number;
  newClients: number;
  renewals: number;
  revenue: number;
  revenuePerClient: number;
  retentionPct: number;
  performanceScore: number;
  performanceBreakdown: CoachPerformanceBreakdown;
  tier: CoachTier;
  capacity: number;
  utilizationPct: number;
  pendingAssignments: number;
  rank: number;
}

export interface CoachAcquisition {
  coachId: string;
  coachName: string;
  newClientsAcquired: number;
  acquisitionRevenue: number;
  percentOfNewClients: number;
}

export interface CoachFunnelStage {
  stage: "Leads" | "Enrolled" | "Started" | "Active" | "Renewed" | "Completed";
  count: number;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  payments: number;
  enrollments: number;
  refunds: number;
}

export interface FinanceOverviewKpis {
  totalRevenue: number;
  revenueGrowthPct: number;
  thisMonthRevenue: number;
  thisMonthGrowthPct: number;
  successfulPayments: number;
  successRatePct: number;
  newEnrollments: number;
  newEnrollmentsGrowthPct: number;
  refundsTotal: number;
  refundsPctOfRevenue: number;
  averageOrderValue: number;
  aovGrowthPct: number;
}

export interface RevenueByCategory {
  label: BusinessType;
  value: number;
  pct: number;
}

export interface RevenueByPackage {
  packageId: string;
  packageName: string;
  revenue: number;
}

export interface BusinessHealth {
  clientGrowthPct: number;
  revenueGrowthPct: number;
  renewalRatePct: number;
  paymentSuccessPct: number;
  refundRatePct: number;
  coachUtilizationPct: number;
  overall: "Strong" | "Stable" | "Needs Attention";
}

export interface FinanceInsight {
  id: string;
  tone: "warning" | "success" | "info";
  message: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface SubscriptionsSummary {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  renewedCount: number;
  cancelledCount: number;
  upcomingRenewals: number;
  expectedRenewalRevenue: number;
  renewalRatePct: number;
  churnRatePct: number;
}
