/**
 * THE date format of the portal: DD/MM/YYYY, everywhere a date is shown.
 *
 * `timeZone` is only for values stored as a calendar day at UTC midnight
 * (coupon validity); everything else is shown in the viewer's local time.
 */
export function formatDate(iso: string | null | undefined, options: { timeZone?: "UTC" } = {}): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: options.timeZone }).format(date);
}

/** DD/MM/YYYY, HH:mm (24-hour). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

/** A calendar day typed as yyyy-mm-dd (a date input's value) as DD/MM/YYYY, never shifted by timezone. */
export function formatCalendarDay(day: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function age(dob: string): number {
  return new Date().getFullYear() - new Date(dob).getFullYear();
}
