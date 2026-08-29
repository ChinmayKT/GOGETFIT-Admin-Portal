import type { ChallengeParticipant, ParticipantStatus, ReviewDecision } from "../../types/challenge";
import { MOCK_CHALLENGES } from "./data";
import { MOCK_USERS } from "../users/data";
import { pickMany, randomInt, nextId } from "../shared/utils";
import { age } from "../../utils/format";

const REJECT_NOTES = [
  "Video doesn't clearly show the full range of motion — please re-submit.",
  "Submission is missing the required starting pose. Please retake and upload again.",
];
const CHANGES_NOTES = [
  "Good effort — please trim the video to under 60 seconds and resubmit.",
  "Please film in landscape orientation so the coach can verify form correctly.",
];

function randomDateBetween(fromISO: string, toISO: string): string {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return new Date(from).toISOString();
  const t = from + Math.random() * (to - from);
  return new Date(t).toISOString();
}

function makeParticipants(challengeId: string, createdAt: string, enrollmentLastDate: string, count: number): ChallengeParticipant[] {
  const users = pickMany(MOCK_USERS, count);
  return users.map((user, i) => {
    const statusRoll = (i + count) % 10;
    const status: ParticipantStatus = statusRoll < 4 ? "enrolled" : statusRoll < 7 ? "submitted" : "reviewed";
    const hasSubmittedVideo = status !== "enrolled";

    let reviewDecision: ReviewDecision = "pending";
    let reviewNote: string | null = null;
    if (status === "reviewed") {
      const decisionRoll = i % 3;
      reviewDecision = decisionRoll === 0 ? "approved" : decisionRoll === 1 ? "rejected" : "changes_requested";
      if (reviewDecision === "rejected") reviewNote = REJECT_NOTES[i % REJECT_NOTES.length];
      if (reviewDecision === "changes_requested") reviewNote = CHANGES_NOTES[i % CHANGES_NOTES.length];
    }

    return {
      id: nextId("participant"),
      challengeId,
      userId: user.id,
      ggfId: user.ggfId,
      name: `${user.firstName} ${user.lastName}`,
      gender: user.gender,
      age: age(user.dob),
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      status,
      joinedDate: randomDateBetween(createdAt, enrollmentLastDate),
      hasSubmittedVideo,
      reviewDecision,
      reviewNote,
    };
  });
}

export const MOCK_PARTICIPANTS: ChallengeParticipant[] = MOCK_CHALLENGES.flatMap((challenge) =>
  makeParticipants(challenge.id, challenge.createdAt, challenge.enrollmentLastDate, randomInt(15, 40)),
);
