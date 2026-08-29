export interface NavItem {
  label: string;
  path: string;
  module: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ label: "Dashboard", path: "/dashboard", module: "dashboard" }],
  },
  {
    label: "People",
    items: [
      { label: "Users", path: "/users", module: "users" },
      { label: "Clients", path: "/users/clients", module: "users" },
      { label: "Coaches", path: "/coaches", module: "coaches" },
      { label: "Assignments", path: "/assignments", module: "coaches" },
    ],
  },
  {
    label: "Fitness",
    items: [
      { label: "Diet Plans", path: "/nutrition/diets", module: "nutrition" },
      { label: "Food Database", path: "/nutrition/foods", module: "nutrition" },
      { label: "Food Requests", path: "/nutrition/requests", module: "nutrition" },
      { label: "Food Log", path: "/nutrition/log", module: "nutrition" },
      { label: "Workouts", path: "/fitness/workouts", module: "workouts" },
      { label: "Challenges", path: "/challenges", module: "challenges" },
      { label: "Rewards", path: "/rewards", module: "rewards" },
    ],
  },
  {
    label: "Progress",
    items: [
      { label: "Transformations", path: "/progress/transformations", module: "progress" },
      { label: "Measurements", path: "/progress/measurements", module: "progress" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Articles", path: "/content/articles", module: "content" },
      { label: "Banners", path: "/content/banners", module: "content" },
      { label: "FAQs", path: "/content/faqs", module: "content" },
      { label: "Quotes", path: "/content/quotes", module: "content" },
      { label: "Media Library", path: "/content/media", module: "content" },
      { label: "GOGETFIT Plans", path: "/content/gogetfit-plans", module: "content" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Products", path: "/commerce/products", module: "commerce" },
      { label: "Packages", path: "/commerce/packages", module: "commerce" },
      { label: "Orders", path: "/commerce/orders", module: "commerce" },
      { label: "Coupons", path: "/commerce/coupons", module: "commerce" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", path: "/operations/notifications", module: "operations" },
      { label: "Analytics", path: "/operations/analytics", module: "analytics" },
    ],
  },
  {
    label: "Finance 🔒",
    items: [
      { label: "Overview", path: "/finance", module: "finance" },
      { label: "Payments", path: "/finance/payments", module: "finance" },
      { label: "Transactions", path: "/finance/transactions", module: "finance" },
      { label: "Refunds", path: "/finance/refunds", module: "finance" },
      { label: "Revenue", path: "/finance/revenue", module: "finance" },
      { label: "Subscriptions", path: "/finance/subscriptions", module: "finance" },
      { label: "Coach Performance", path: "/finance/coaches", module: "finance" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Admin Users", path: "/system/admin-users", module: "system" },
      { label: "Permissions", path: "/system/permissions", module: "system" },
      { label: "Audit Logs", path: "/system/audit-logs", module: "system" },
      { label: "Settings", path: "/system/settings", module: "system" },
      { label: "Feature Flags", path: "/system/feature-flags", module: "system" },
    ],
  },
];
