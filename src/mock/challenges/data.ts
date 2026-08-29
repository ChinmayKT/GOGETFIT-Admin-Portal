import type { Challenge } from "../../types/challenge";
import { CHALLENGE_NAMES, challengeDescription } from "./reference";
import { daysAgo, daysFromNow, randomInt } from "../shared/utils";

function offsetDateStr(days: number): string {
  return (days >= 0 ? daysFromNow(days) : daysAgo(-days)).slice(0, 10);
}

/**
 * Five hand-tuned (enrollmentLastDate, startDate, endDate) day-offset patterns, each built
 * with generous margins around the boundaries in status.ts so a few days of jitter can't
 * flip a challenge into an adjacent status. Cycling through them guarantees the seed data
 * exercises every one of the five computed statuses for visual QA.
 */
const PATTERNS: { enrollLast: number; start: number; end: number }[] = [
  { enrollLast: -260, start: -250, end: -200 }, // -> Archived (ended 200d ago)
  { enrollLast: -70, start: -60, end: -30 }, // -> Completed (ended 30d ago)
  { enrollLast: -15, start: -8, end: 15 }, // -> Active (in progress)
  { enrollLast: 15, start: 25, end: 55 }, // -> Upcoming (enrollment still open)
  { enrollLast: -5, start: 15, end: 45 }, // -> Draft (enrollment closed, not started)
];

function jitter(): number {
  return randomInt(-3, 3);
}

function makeChallenge(index: number): Challenge {
  const name = CHALLENGE_NAMES[index % CHALLENGE_NAMES.length];
  const pattern = PATTERNS[index % PATTERNS.length];

  return {
    id: `challenge_${index + 1}`,
    name,
    description: challengeDescription(name),
    enrollmentLastDate: offsetDateStr(pattern.enrollLast + jitter()),
    startDate: offsetDateStr(pattern.start + jitter()),
    endDate: offsetDateStr(pattern.end + jitter()),
    priority: index % 3 === 0,
    sampleVideoUrl: null,
    sampleVideoFileName: null,
    createdAt: daysAgo(randomInt(30, 400)),
  };
}

export const MOCK_CHALLENGES: Challenge[] = CHALLENGE_NAMES.map((_, i) => makeChallenge(i));
