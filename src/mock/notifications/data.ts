import type { CampaignStatus, NotificationCampaign, NotificationTemplate, NotificationTemplateCategory } from "../../types/notifications";
import { MOCK_USERS } from "../users/data";
import { MOCK_COACHES } from "../coaches/data";
import { MOCK_CHALLENGES } from "../challenges/data";
import { MOCK_PARTICIPANTS } from "../challenges/participantsData";
import { daysAgo, daysFromNow, randomInt } from "../shared/utils";

const ACTIVE_USER_COUNT = MOCK_USERS.filter((u) => u.status === "Active").length;
const INACTIVE_USER_COUNT = MOCK_USERS.filter((u) => u.status === "Inactive").length;

function coachName(index: number): string {
  const coach = MOCK_COACHES[index % MOCK_COACHES.length];
  return `${coach.firstName} ${coach.lastName}`;
}

function coachClientCount(coachId: string): number {
  return MOCK_USERS.filter((u) => u.coachId === coachId).length;
}

function challengeParticipantCount(challengeId: string): number {
  return MOCK_PARTICIPANTS.filter((p) => p.challengeId === challengeId).length;
}

interface Seed {
  title: string;
  message: string;
  deepLink: string | null;
  hasImage: boolean;
}

const CAMPAIGN_SEEDS: Seed[] = [
  { title: "Don't break your streak!", message: "You're 2 days away from a 30-day streak. Log today's workout to keep it alive.", deepLink: "gogetfit://home/streak", hasImage: false },
  { title: "New Challenge: Summer Shred", message: "A brand-new 6-week challenge just opened for enrollment. Grab a spot before it fills up!", deepLink: "gogetfit://challenges/12", hasImage: true },
  { title: "Your coach just replied", message: "Your coach left feedback on your latest progress video. Tap to view their notes.", deepLink: "gogetfit://coach/messages", hasImage: false },
  { title: "Flash Sale: 30% off packages", message: "For the next 48 hours, all coaching packages are 30% off. Don't miss this one.", deepLink: "gogetfit://store/packages", hasImage: true },
  { title: "Weekly progress report is ready", message: "Your weight, measurements and streak summary for this week are ready to view.", deepLink: "gogetfit://progress", hasImage: false },
  { title: "Time to log your meals", message: "You haven't logged any meals today. A quick log helps your coach adjust your plan.", deepLink: "gogetfit://nutrition/log", hasImage: false },
  { title: "Congrats on your transformation!", message: "Your before/after photos were just approved. Share your progress with the community.", deepLink: "gogetfit://progress/transformations", hasImage: true },
  { title: "New badge unlocked", message: "You just earned the '100 Workouts' badge. Check your rewards page to see it.", deepLink: "gogetfit://rewards/badges", hasImage: false },
  { title: "Reminder: Renew your plan", message: "Your coaching plan expires in 5 days. Renew now to avoid a break in your program.", deepLink: "gogetfit://commerce/orders", hasImage: false },
  { title: "Weekend workout challenge", message: "Complete 3 workouts this weekend for bonus reward points. Let's go!", deepLink: "gogetfit://challenges", hasImage: true },
  { title: "We miss you!", message: "It's been a while since your last workout. Jump back in — your plan is waiting.", deepLink: "gogetfit://home", hasImage: false },
  { title: "New diet plan assigned", message: "Your coach just assigned a new diet plan tailored to your latest goals.", deepLink: "gogetfit://nutrition/diets", hasImage: false },
  { title: "Leaderboard update", message: "You've moved up 4 spots on this month's leaderboard. Keep pushing!", deepLink: "gogetfit://rewards/leaderboard", hasImage: false },
  { title: "App update available", message: "Version 4.2 brings a faster workout logger and bug fixes. Update today.", deepLink: null, hasImage: false },
  { title: "Refer a friend, earn points", message: "Invite a friend to GoGetFit and both of you get 500 reward points.", deepLink: "gogetfit://rewards", hasImage: true },
  { title: "Challenge submission window closing", message: "Only 2 days left to submit your challenge video. Don't miss the deadline.", deepLink: "gogetfit://challenges/8/participants", hasImage: false },
  { title: "Your order has shipped", message: "The supplements you ordered are on their way. Track your order for updates.", deepLink: "gogetfit://commerce/orders", hasImage: false },
  { title: "Coupon just for you", message: "Here's a 15% off coupon on your next package renewal, valid for 3 days.", deepLink: "gogetfit://commerce/coupons", hasImage: true },
];

const FAILURE_REASONS = ["Invalid device tokens", "Rate limit exceeded", "Payload too large", "Push service timeout"];

function audienceFor(index: number): { type: NotificationCampaign["audienceType"]; label: string; size: number } {
  const roll = index % 6;
  if (roll === 0) return { type: "All Users", label: "All Users", size: MOCK_USERS.length };
  if (roll === 1) return { type: "Active Users", label: "Active Users", size: ACTIVE_USER_COUNT };
  if (roll === 2) return { type: "Inactive Users", label: "Inactive Users", size: INACTIVE_USER_COUNT };
  if (roll === 3) {
    const coach = MOCK_COACHES[index % MOCK_COACHES.length];
    return { type: "Clients of Coach", label: `Clients of ${coachName(index)}`, size: coachClientCount(coach.id) };
  }
  if (roll === 4) {
    const challenge = MOCK_CHALLENGES[index % MOCK_CHALLENGES.length];
    return { type: "Challenge Participants", label: `Participants: ${challenge.name}`, size: challengeParticipantCount(challenge.id) };
  }
  const size = randomInt(3, 25);
  return { type: "Specific Users", label: `${size} specific users`, size };
}

function makeSentMetrics(audienceSize: number) {
  const delivered = Math.max(0, Math.round(audienceSize * (0.92 + Math.random() * 0.07)));
  const opened = Math.round(delivered * (0.25 + Math.random() * 0.35));
  const failed = Math.max(0, audienceSize - delivered);
  const openRate = audienceSize > 0 ? Math.round((opened / audienceSize) * 1000) / 10 : 0;
  return { delivered, opened, failed, openRate };
}

function makeCampaign(index: number, status: CampaignStatus): NotificationCampaign {
  const seed = CAMPAIGN_SEEDS[index % CAMPAIGN_SEEDS.length];
  const audience = audienceFor(index);
  const createdAt = daysAgo(randomInt(2, 260));

  const base: Omit<NotificationCampaign, "status" | "sentCount" | "openRate" | "deliveredCount" | "openedCount" | "failedCount" | "failureReason" | "scheduledAt" | "sentAt"> = {
    id: `campaign_${index + 1}`,
    title: seed.title,
    message: seed.message,
    imageUrl: seed.hasImage ? `https://picsum.photos/seed/ggfnotif${index}/400/220` : null,
    deepLink: seed.deepLink,
    audienceType: audience.type,
    audienceLabel: audience.label,
    audienceSize: audience.size,
    createdAt,
  };

  if (status === "Scheduled" || status === "Paused") {
    return {
      ...base,
      status,
      sentCount: 0,
      openRate: 0,
      deliveredCount: 0,
      openedCount: 0,
      failedCount: 0,
      failureReason: null,
      scheduledAt: daysFromNow(randomInt(1, 21)),
      sentAt: null,
    };
  }

  if (status === "Failed") {
    return {
      ...base,
      status,
      sentCount: 0,
      openRate: 0,
      deliveredCount: 0,
      openedCount: 0,
      failedCount: audience.size,
      failureReason: FAILURE_REASONS[index % FAILURE_REASONS.length],
      scheduledAt: null,
      sentAt: null,
    };
  }

  // Active, Completed, Sent all represent campaigns that have actually gone out.
  const metrics = makeSentMetrics(audience.size);
  return {
    ...base,
    status,
    sentCount: audience.size,
    openRate: metrics.openRate,
    deliveredCount: metrics.delivered,
    openedCount: metrics.opened,
    failedCount: metrics.failed,
    failureReason: null,
    scheduledAt: null,
    sentAt: daysAgo(randomInt(1, 200)),
  };
}

function buildSeed(): NotificationCampaign[] {
  const rows: NotificationCampaign[] = [];
  let i = 0;

  for (let n = 0; n < 5; n++, i++) rows.push(makeCampaign(i, "Active"));
  for (let n = 0; n < 6; n++, i++) rows.push(makeCampaign(i, "Completed"));
  for (let n = 0; n < 4; n++, i++) rows.push(makeCampaign(i, "Scheduled"));
  for (let n = 0; n < 2; n++, i++) rows.push(makeCampaign(i, "Paused"));
  for (let n = 0; n < 10; n++, i++) rows.push(makeCampaign(i, "Sent"));
  for (let n = 0; n < 5; n++, i++) rows.push(makeCampaign(i, "Failed"));

  return rows;
}

export const MOCK_CAMPAIGNS: NotificationCampaign[] = buildSeed();

const TEMPLATE_SEEDS: { name: string; title: string; message: string; category: NotificationTemplateCategory }[] = [
  { name: "Streak Reminder", title: "Don't break your streak!", message: "You're close to a new streak milestone. Log your workout today to keep it going.", category: "Reminder" },
  { name: "Missed Workout", title: "We miss you at the gym!", message: "It's been a few days since your last workout. Your plan is ready whenever you are.", category: "Reminder" },
  { name: "New Challenge Launch", title: "A new challenge just dropped!", message: "Enrollment is now open for our latest challenge. Limited spots — join today.", category: "Engagement" },
  { name: "Flash Sale", title: "Flash Sale — 30% off", message: "For a limited time, get 30% off all coaching packages. Offer ends soon.", category: "Promotional" },
  { name: "Coupon Reminder", title: "Your coupon expires soon", message: "You have an unused discount coupon expiring in 3 days. Use it before it's gone.", category: "Promotional" },
  { name: "Plan Renewal Due", title: "Your plan expires soon", message: "Your coaching plan is expiring shortly. Renew now to avoid any interruption.", category: "Transactional" },
  { name: "Order Shipped", title: "Your order is on its way", message: "Good news — your recent order has shipped and is on its way to you.", category: "Transactional" },
  { name: "Weekly Progress Digest", title: "Your weekly report is ready", message: "Check out your weight, measurements and workout summary for this week.", category: "Engagement" },
  { name: "Coach Feedback", title: "Your coach left you feedback", message: "New notes from your coach are waiting on your latest submission.", category: "Engagement" },
];

export const MOCK_TEMPLATES: NotificationTemplate[] = TEMPLATE_SEEDS.map((seed, i) => ({
  id: `notiftpl_${i + 1}`,
  name: seed.name,
  title: seed.title,
  message: seed.message,
  category: seed.category,
  lastUsedAt: i % 3 === 0 ? null : daysAgo(randomInt(1, 90)),
  createdAt: daysAgo(randomInt(30, 400)),
}));
