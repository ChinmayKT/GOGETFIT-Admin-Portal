export interface NavItem {
  label: string;
  path: string;
  module: string;
  /**
   * Whether this module is actually built. Everything else is shown dimmed in
   * the sidebar, so the nav reads as a map of what exists rather than a
   * promise of screens that are still placeholders.
   */
  built?: boolean;
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
      { label: "Users", path: "/users", module: "users", built: true },
      { label: "Clients", path: "/users/clients", module: "users", built: true },
      { label: "Coaches", path: "/coaches", module: "coaches", built: true },
      { label: "Assignments", path: "/assignments", module: "coaches" },
    ],
  },
  {
    label: "Fitness",
    items: [
      { label: "Free Diet Plans", path: "/nutrition/freediets", module: "nutrition", built: true },
      { label: "Food Database", path: "/nutrition/foods", module: "nutrition", built: true },
      { label: "Workouts", path: "/fitness/workouts", module: "workouts", built: true },
      { label: "Food Requests", path: "/nutrition/requests", module: "nutrition" },
      { label: "Food Log", path: "/nutrition/log", module: "nutrition" },
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
      { label: "GOGETFIT Plans", path: "/content/gogetfit-plans", module: "content", built: true },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Products", path: "/commerce/products", module: "commerce" },
      { label: "Packages", path: "/commerce/packages", module: "commerce" },
      { label: "Orders", path: "/commerce/orders", module: "commerce" },
      { label: "Coupons", path: "/commerce/coupons", module: "commerce", built: true },
      { label: "In cart", path: "/commerce/in-cart", module: "commerce", built: true },
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
