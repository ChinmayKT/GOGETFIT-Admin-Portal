import type { StatusTone } from "../../components/ui/StatusBadge";
import type { PayoutStatus, ReferralPaymentStatus, ReferralStatus } from "../../types/ambassador";

const PAYMENT_TONES: Record<string, StatusTone> = { Success: "success", Pending: "warning", Refunded: "error", Failed: "error" };
/** Any other value the order holds shows neutral rather than breaking the badge. */
export const paymentTone = (status: ReferralPaymentStatus | null): StatusTone => PAYMENT_TONES[status ?? ""] ?? "neutral";
export const REFERRAL_TONE: Record<ReferralStatus, StatusTone> = { Successful: "success", Pending: "warning" };
export const PAYOUT_TONE: Record<PayoutStatus, StatusTone> = { Paid: "success", Processing: "info", Pending: "warning" };
