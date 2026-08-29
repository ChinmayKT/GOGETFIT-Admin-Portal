import type { ModuleKey } from "../../types/permissions";
import type { AuditAction, AuditLogEntry } from "../../types/system";
import { MOCK_ADMIN_USERS } from "./adminUserData";
import { daysAgo, randomInt } from "../shared/utils";

const ADMINS = MOCK_ADMIN_USERS.filter((a) => a.status === "Active").slice(0, 9);

interface Template {
  action: AuditAction;
  module: ModuleKey;
  objectName: string;
  diffs?: { field: string; before: string; after: string }[];
}

// A hand-varied set of realistic event kinds spanning every module. Roughly half carry a
// before -> after diff (edits to numeric/config fields); creates, deletes and publishes
// typically don't.
const TEMPLATES: Template[] = [
  { action: "Updated", module: "nutrition", objectName: "Diet Plan: Fat Loss — Advanced", diffs: [{ field: "Calories", before: "1800", after: "1700" }] },
  { action: "Created", module: "nutrition", objectName: "Diet Plan: Muscle Gain — Intermediate" },
  { action: "Updated", module: "nutrition", objectName: "Food Item: Grilled Chicken Breast", diffs: [{ field: "Protein (g)", before: "28", after: "31" }] },
  { action: "Deleted", module: "nutrition", objectName: "Food Item: Instant Noodles (Duplicate)" },
  { action: "Updated", module: "nutrition", objectName: "Diet Plan: General Fitness — Foundation", diffs: [{ field: "Range To", before: "2200 kcal", after: "2100 kcal" }] },
  { action: "Approved", module: "nutrition", objectName: "Food Request: Sprouted Moong Salad" },
  { action: "Created", module: "content", objectName: "Banner: Summer Sale" },
  { action: "Published", module: "content", objectName: "Article: 5 Tips for Better Sleep" },
  { action: "Updated", module: "content", objectName: "FAQ: How do I cancel my subscription?", diffs: [{ field: "Category", before: "Billing", after: "Account" }] },
  { action: "Deleted", module: "content", objectName: "Banner: Diwali Offer (Expired)" },
  { action: "Created", module: "content", objectName: "Quote: Discipline is the bridge" },
  { action: "Published", module: "content", objectName: "Article: Understanding Macros" },
  { action: "Updated", module: "coaches", objectName: "Coach: Vikram Rao", diffs: [{ field: "Level", before: "Level 2", after: "Level 3" }] },
  { action: "Created", module: "coaches", objectName: "Coach: Ananya Iyer" },
  { action: "Deactivated", module: "coaches", objectName: "Coach: Suresh Bhat" },
  { action: "Approved", module: "coaches", objectName: "Coach Application: Radhika Nair" },
  { action: "Updated", module: "coaches", objectName: "Coach: Karthik Menon", diffs: [{ field: "Available Slots", before: "6", after: "12" }] },
  { action: "Created", module: "workouts", objectName: "Workout: Push Pull Legs — Week 3" },
  { action: "Updated", module: "workouts", objectName: "Workout: Beginner Full Body", diffs: [{ field: "Duration (min)", before: "40", after: "50" }] },
  { action: "Deleted", module: "workouts", objectName: "Workout: Old HIIT Circuit v1" },
  { action: "Published", module: "workouts", objectName: "Workout: Mobility & Recovery Flow" },
  { action: "Created", module: "challenges", objectName: "Challenge: 30-Day Squat Streak" },
  { action: "Updated", module: "challenges", objectName: "Challenge: Summer Shred", diffs: [{ field: "Max Participants", before: "500", after: "750" }] },
  { action: "Published", module: "challenges", objectName: "Challenge: New Year Reset" },
  { action: "Deleted", module: "challenges", objectName: "Challenge: Test Challenge (Internal)" },
  { action: "Updated", module: "rewards", objectName: "Reward Rule: Points per Workout", diffs: [{ field: "Points", before: "10", after: "15" }] },
  { action: "Updated", module: "rewards", objectName: "Reward Rule: Points per Referral", diffs: [{ field: "Points", before: "100", after: "150" }] },
  { action: "Created", module: "rewards", objectName: "Badge: 100-Day Streak" },
  { action: "Updated", module: "commerce", objectName: "Product: Whey Protein — 1kg", diffs: [{ field: "Price", before: "₹2,499", after: "₹2,299" }] },
  { action: "Created", module: "commerce", objectName: "Coupon: WELCOME20" },
  { action: "Deleted", module: "commerce", objectName: "Coupon: EXPIRED10" },
  { action: "Updated", module: "commerce", objectName: "Package: 6-Month Transformation", diffs: [{ field: "Duration (days)", before: "180", after: "200" }] },
  { action: "Updated", module: "commerce", objectName: "Order #GGF-88213", diffs: [{ field: "Status", before: "Pending", after: "Shipped" }] },
  { action: "Created", module: "commerce", objectName: "Product: Resistance Band Set" },
  { action: "Updated", module: "users", objectName: "Client: Priya Sharma", diffs: [{ field: "Status", before: "Trial", after: "Active" }] },
  { action: "Deactivated", module: "users", objectName: "Client: Rohan Gupta" },
  { action: "Created", module: "users", objectName: "Client: Meera Kapoor" },
  { action: "Updated", module: "progress", objectName: "Transformation: Aman Singh", diffs: [{ field: "Review Status", before: "Pending", after: "Approved" }] },
  { action: "Approved", module: "progress", objectName: "Transformation: Divya Reddy" },
  { action: "Deleted", module: "progress", objectName: "Measurement Entry: Duplicate submission" },
  { action: "Updated", module: "system", objectName: "Role: Support", diffs: [{ field: "Users — Edit", before: "Off", after: "On" }] },
  { action: "Created", module: "system", objectName: "Admin User: Nikhil Chopra" },
  { action: "Deactivated", module: "system", objectName: "Admin User: Swati Desai" },
  { action: "Updated", module: "system", objectName: "Feature Flag: New Macro Calculator", diffs: [{ field: "Enabled", before: "Off", after: "On" }] },
  { action: "Updated", module: "system", objectName: "Settings: Plan Rules", diffs: [{ field: "Renewal Grace Period", before: "5 days", after: "7 days" }] },
  { action: "Updated", module: "operations", objectName: "Notification Template: Payment Reminder", diffs: [{ field: "Send Time", before: "09:00", after: "10:30" }] },
  { action: "Created", module: "operations", objectName: "Notification: App Update Available" },
  { action: "Published", module: "operations", objectName: "Notification: New Challenge Live" },
];

function makeEntry(index: number, tpl: Template): AuditLogEntry {
  const admin = ADMINS[(index * 7 + tpl.objectName.length) % ADMINS.length];
  return {
    id: `audit_${index + 1}`,
    timestamp: daysAgo(randomInt(0, 90)),
    adminId: admin.id,
    adminName: admin.name,
    action: tpl.action,
    module: tpl.module,
    objectName: tpl.objectName,
    diffs: tpl.diffs,
  };
}

// Cycle through the templates twice (with fresh admins/timestamps each pass) to comfortably
// clear ~60 realistic, non-identical-looking entries.
const EXPANDED = [...TEMPLATES, ...TEMPLATES.slice(0, 15)];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = EXPANDED.map((tpl, i) => makeEntry(i, tpl)).sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);
