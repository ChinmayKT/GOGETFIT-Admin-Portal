export type AmbassadorStatus = "Active" | "Inactive";
export type ReferralStatus = "Successful" | "Pending";
/** The order's own payment status, as the backend stores it ("Success" today). */
export type ReferralPaymentStatus = string;
export type PayoutStatus = "Paid" | "Processing" | "Pending";

export interface Ambassador {
  id: string;
  name: string | null;
  userId: string;
  email: string | null;
  mobile: string | null;
  couponCode: string;
  status: AmbassadorStatus;
  registeredAt: string;
  /** Friends' discount on this ambassador's code. */
  discountPercent: number;
  /** Commission rate for this ambassador (5–10). */
  commissionPercent: number;
  /** Confirmed referrals with a successful payment. */
  successfulReferrals: number;
  /** Sum of what referred customers paid, confirmed referrals only. */
  salesAmount: number;
  commissionEarned: number;
}

export interface AmbassadorDetail extends Ambassador {
  discountsGiven: number;
  commissionPaid: number;
  commissionPayable: number;
}

export interface ReferralOrder {
  id: string;
  ambassadorId: string;
  ambassadorName: string | null;
  customerName: string | null;
  customerUserId: string;
  email: string | null;
  mobile: string | null;
  couponCode: string;
  planName: string | null;
  planId: string;
  orderId: string;
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  paidAmount: number;
  currency: string;
  paymentId: string | null;
  gatewayReference: string | null;
  paymentStatus: ReferralPaymentStatus;
  /** 'simulated' until a payment gateway exists: the app's own purchase call marked it paid. */
  paymentVerification: "simulated" | "gateway";
  referralStatus: ReferralStatus;
  commissionPercent: number;
  grossCommission: number;
  tdsAmount: number;
  netCommission: number;
  commissionStatus: "pending" | "paid";
  purchasedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AmbassadorPayout {
  id: string;
  /** yyyy-mm, what recording a payout is keyed on. */
  periodKey: string;
  period: string;
  eligibleOrderValue: number;
  commissionPercent: number;
  grossCommission: number;
  tdsPercent: number;
  tds: number;
  netPayable: number;
  status: PayoutStatus;
  /** What the admin recorded as paid for this month, if anything. */
  amountPaid: number | null;
  transactionReference: string | null;
  paidAt: string | null;
  /** The month has ended and something in it is still unpaid. */
  canRecord: boolean;
}

export interface PayoutInput {
  period: string;
  amount: number;
  /** yyyy-mm-dd */
  paidAt: string;
  reference: string;
  status: "Paid" | "Processing";
}

export interface AmbassadorActivity {
  id: string;
  at: string;
  action: string;
  detail: string;
  actor: string;
}

export interface AmbassadorSummary {
  totalAmbassadors: number;
  totalReferrals: number;
  totalSales: number;
  totalCommissionPayable: number;
}
