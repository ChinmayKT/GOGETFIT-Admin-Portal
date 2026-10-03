import type { StatusTone } from "../../components/ui/StatusBadge";
import type { EnrollmentStatus } from "../../api/enrolledClients";

/** Shared by the Clients list and the Client detail page. */
export const STATUS_TONE: Record<EnrollmentStatus, StatusTone> = {
  active: "success",
  inactive: "neutral",
  not_started: "warning",
  deleted: "error",
};

export const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

export const money = (amount: number | null, currency: string | null) =>
  amount === null ? "—" : `${currency === "INR" ? "₹" : `${currency ?? ""} `}${amount.toLocaleString()}`;
