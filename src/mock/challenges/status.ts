import type { Challenge, ChallengeStatus } from "../../types/challenge";

/**
 * Derives a challenge's lifecycle status purely from today's date vs its three stored
 * dates — there is no separate "isPublished"/"isArchived" flag on the record.
 *
 * Rules (all boundaries inclusive of the earlier state):
 *  - endDate < today, more than 90 days ago  -> Archived (long finished, faded from view)
 *  - endDate < today, within the last 90 days -> Completed (recently finished)
 *  - startDate <= today <= endDate            -> Active
 *  - today < startDate:
 *      - today <= enrollmentLastDate          -> Upcoming (enrollment still open)
 *      - today >  enrollmentLastDate          -> Draft (enrollment window already closed
 *                                                 but the challenge hasn't started yet —
 *                                                 treated as not fully ready to go live)
 */
export function deriveChallengeStatus(challenge: Pick<Challenge, "startDate" | "endDate" | "enrollmentLastDate">, now: Date = new Date()): ChallengeStatus {
  const today = dateOnly(now);
  const start = dateOnly(new Date(challenge.startDate));
  const end = dateOnly(new Date(challenge.endDate));
  const enrollLast = dateOnly(new Date(challenge.enrollmentLastDate));

  if (today.getTime() > end.getTime()) {
    const daysSinceEnd = Math.round((today.getTime() - end.getTime()) / 86400000);
    return daysSinceEnd > 90 ? "Archived" : "Completed";
  }
  if (today.getTime() >= start.getTime()) return "Active";
  return today.getTime() <= enrollLast.getTime() ? "Upcoming" : "Draft";
}

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const CHALLENGE_STATUS_TONE: Record<ChallengeStatus, "success" | "warning" | "info" | "neutral" | "orange"> = {
  Draft: "neutral",
  Upcoming: "info",
  Active: "success",
  Completed: "orange",
  Archived: "neutral",
};
