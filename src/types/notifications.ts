export type NotificationAudienceType =
  | "All Users"
  | "Active Users"
  | "Inactive Users"
  | "Clients of Coach"
  | "Challenge Participants"
  | "Specific Users";

export type CampaignStatus = "Active" | "Completed" | "Scheduled" | "Paused" | "Sent" | "Failed";

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  imageUrl: string | null;
  deepLink: string | null;

  audienceType: NotificationAudienceType;
  /** Human-readable audience description shown in the Audience column, e.g. "Clients of Priya Sharma". */
  audienceLabel: string;
  audienceSize: number;

  status: CampaignStatus;

  sentCount: number;
  /** Percentage, 0-100, one decimal place. */
  openRate: number;
  deliveredCount: number;
  openedCount: number;
  failedCount: number;
  failureReason: string | null;

  /** ISO datetime. Set when status is Scheduled/Paused. */
  scheduledAt: string | null;
  /** ISO datetime. Set once the campaign has actually gone out. */
  sentAt: string | null;

  createdAt: string;
}

export type NotificationTemplateCategory = "Engagement" | "Promotional" | "Transactional" | "Reminder";

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  category: NotificationTemplateCategory;
  lastUsedAt: string | null;
  createdAt: string;
}
