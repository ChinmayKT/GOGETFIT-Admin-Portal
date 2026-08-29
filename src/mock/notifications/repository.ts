import type {
  NotificationAudienceType,
  NotificationCampaign,
  NotificationTemplate,
} from "../../types/notifications";
import { MOCK_CAMPAIGNS, MOCK_TEMPLATES } from "./data";
import { MOCK_USERS } from "../users/data";
import { MOCK_COACHES } from "../coaches/data";
import { MOCK_CHALLENGES } from "../challenges/data";
import { MOCK_PARTICIPANTS } from "../challenges/participantsData";
import { delay, matchesQuery, nextId, paginate, sortRows } from "../shared/utils";

let campaignStore: NotificationCampaign[] = [...MOCK_CAMPAIGNS];
let templateStore: NotificationTemplate[] = [...MOCK_TEMPLATES];

interface ListParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

function baseFilter(rows: NotificationCampaign[], query: string) {
  return rows.filter((c) => matchesQuery([c.title, c.audienceLabel, c.message], query));
}

/** "Campaigns" tab — the overview of already sent/currently active campaigns. */
export async function listCampaigns(params: ListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;
  let rows = campaignStore.filter((c) => c.status === "Active" || c.status === "Completed");
  rows = baseFilter(rows, query);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

/** "Scheduled" tab — queued for future send. */
export async function listScheduledCampaigns(params: ListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "scheduledAt", sortDir = "asc" } = params;
  let rows = campaignStore.filter((c) => c.status === "Scheduled" || c.status === "Paused");
  rows = baseFilter(rows, query);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

/** "Sent" tab — historical log of sent campaigns with delivery metrics. */
export async function listSentCampaigns(params: ListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "sentAt", sortDir = "desc" } = params;
  let rows = campaignStore.filter((c) => c.status === "Sent" || c.status === "Completed");
  rows = baseFilter(rows, query);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

/** "Failed" tab. */
export async function listFailedCampaigns(params: ListParams = {}) {
  const { query = "", page = 1, pageSize = 10, sortKey = "createdAt", sortDir = "desc" } = params;
  let rows = campaignStore.filter((c) => c.status === "Failed");
  rows = baseFilter(rows, query);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

export async function cancelScheduledCampaign(id: string) {
  campaignStore = campaignStore.map((c) => (c.id === id ? { ...c, status: "Paused" } : c));
  return delay(true, 400);
}

export async function retryFailedCampaign(id: string) {
  campaignStore = campaignStore.map((c) => {
    if (c.id !== id) return c;
    const delivered = Math.max(0, Math.round(c.audienceSize * 0.97));
    const opened = Math.round(delivered * (0.3 + Math.random() * 0.25));
    const failed = Math.max(0, c.audienceSize - delivered);
    const openRate = c.audienceSize > 0 ? Math.round((opened / c.audienceSize) * 1000) / 10 : 0;
    return {
      ...c,
      status: "Sent",
      failureReason: null,
      sentAt: new Date().toISOString(),
      sentCount: c.audienceSize,
      deliveredCount: delivered,
      openedCount: opened,
      failedCount: failed,
      openRate,
    };
  });
  return delay(true, 500);
}

// ---- Templates ----

interface TemplateListParams {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}

export async function listTemplates(params: TemplateListParams = {}) {
  const { query = "", category, page = 1, pageSize = 10, sortKey = "name", sortDir = "asc" } = params;
  let rows = templateStore.filter((t) => matchesQuery([t.name, t.title, t.message], query));
  if (category) rows = rows.filter((t) => t.category === category);
  rows = sortRows(rows, sortKey, sortDir);
  return delay(paginate(rows, page, pageSize));
}

export async function createTemplate(input: Omit<NotificationTemplate, "id" | "createdAt" | "lastUsedAt">) {
  const template: NotificationTemplate = {
    ...input,
    id: nextId("notiftpl"),
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  };
  templateStore = [template, ...templateStore];
  return delay(template, 500);
}

export async function updateTemplate(id: string, patch: Partial<NotificationTemplate>) {
  templateStore = templateStore.map((t) => (t.id === id ? { ...t, ...patch } : t));
  return delay(templateStore.find((t) => t.id === id)!, 500);
}

export async function deleteTemplate(id: string) {
  templateStore = templateStore.filter((t) => t.id !== id);
  return delay(true, 400);
}

// ---- Audience helpers ----

export function coachAudienceOptions() {
  return MOCK_COACHES.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));
}

export function challengeAudienceOptions() {
  return MOCK_CHALLENGES.map((c) => ({ id: c.id, name: c.name }));
}

export interface AudienceSelection {
  coachId?: string;
  challengeId?: string;
  specificIds?: string;
}

export function estimateAudienceSize(type: NotificationAudienceType | "", selection: AudienceSelection): number {
  switch (type) {
    case "All Users":
      return MOCK_USERS.length;
    case "Active Users":
      return MOCK_USERS.filter((u) => u.status === "Active").length;
    case "Inactive Users":
      return MOCK_USERS.filter((u) => u.status === "Inactive").length;
    case "Clients of Coach": {
      if (!selection.coachId) return 0;
      return MOCK_USERS.filter((u) => u.coachId === selection.coachId).length;
    }
    case "Challenge Participants": {
      if (!selection.challengeId) return 0;
      return MOCK_PARTICIPANTS.filter((p) => p.challengeId === selection.challengeId).length;
    }
    case "Specific Users": {
      if (!selection.specificIds?.trim()) return 0;
      const ids = new Set(
        selection.specificIds
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
      );
      return MOCK_USERS.filter((u) => ids.has(u.ggfId.toUpperCase())).length;
    }
    default:
      return 0;
  }
}

export function audienceLabelFor(type: NotificationAudienceType | "", selection: AudienceSelection): string {
  switch (type) {
    case "All Users":
    case "Active Users":
    case "Inactive Users":
      return type;
    case "Clients of Coach": {
      const coach = MOCK_COACHES.find((c) => c.id === selection.coachId);
      return coach ? `Clients of ${coach.firstName} ${coach.lastName}` : "Clients of Coach";
    }
    case "Challenge Participants": {
      const challenge = MOCK_CHALLENGES.find((c) => c.id === selection.challengeId);
      return challenge ? `Participants: ${challenge.name}` : "Challenge Participants";
    }
    case "Specific Users": {
      const size = estimateAudienceSize(type, selection);
      return `${size} specific user${size === 1 ? "" : "s"}`;
    }
    default:
      return "";
  }
}

export interface CreateCampaignInput {
  title: string;
  message: string;
  imageUrl: string | null;
  deepLink: string | null;
  audienceType: NotificationAudienceType;
  audienceLabel: string;
  audienceSize: number;
  sendNow: boolean;
  /** ISO datetime, required when sendNow is false. */
  scheduledAt: string | null;
}

export async function createCampaign(input: CreateCampaignInput): Promise<NotificationCampaign> {
  const now = new Date().toISOString();
  const shared = {
    id: nextId("campaign"),
    title: input.title,
    message: input.message,
    imageUrl: input.imageUrl,
    deepLink: input.deepLink,
    audienceType: input.audienceType,
    audienceLabel: input.audienceLabel,
    audienceSize: input.audienceSize,
    createdAt: now,
  };

  let campaign: NotificationCampaign;
  if (input.sendNow) {
    const delivered = Math.max(0, Math.round(input.audienceSize * (0.93 + Math.random() * 0.06)));
    const opened = Math.round(delivered * (0.25 + Math.random() * 0.35));
    const failed = Math.max(0, input.audienceSize - delivered);
    const openRate = input.audienceSize > 0 ? Math.round((opened / input.audienceSize) * 1000) / 10 : 0;
    campaign = {
      ...shared,
      status: "Sent",
      sentCount: input.audienceSize,
      openRate,
      deliveredCount: delivered,
      openedCount: opened,
      failedCount: failed,
      failureReason: null,
      scheduledAt: null,
      sentAt: now,
    };
  } else {
    campaign = {
      ...shared,
      status: "Scheduled",
      sentCount: 0,
      openRate: 0,
      deliveredCount: 0,
      openedCount: 0,
      failedCount: 0,
      failureReason: null,
      scheduledAt: input.scheduledAt,
      sentAt: null,
    };
  }

  campaignStore = [campaign, ...campaignStore];
  return delay(campaign, 700);
}
