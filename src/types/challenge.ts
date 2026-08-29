import type { Gender } from "./user";

export type ChallengeStatus = "Draft" | "Upcoming" | "Active" | "Completed" | "Archived";

export interface Challenge {
  id: string;
  name: string;
  description: string;
  /** yyyy-mm-dd — native <input type="date"> value format. */
  startDate: string;
  endDate: string;
  enrollmentLastDate: string;
  priority: boolean;

  sampleVideoUrl: string | null;
  sampleVideoFileName: string | null;

  createdAt: string;
}

export type ParticipantStatus = "enrolled" | "submitted" | "reviewed";
export type ReviewDecision = "pending" | "approved" | "rejected" | "changes_requested";

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  ggfId: string;
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;

  status: ParticipantStatus;
  joinedDate: string;

  /** Non-null once the participant has submitted their progress video (mock placeholder, no real media). */
  hasSubmittedVideo: boolean;

  reviewDecision: ReviewDecision;
  reviewNote: string | null;
}
