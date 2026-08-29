import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, Award, Link2, Utensils, Apple, Inbox, ClipboardList,
  Dumbbell, Trophy, Gift, Sparkles, Ruler, FileText, Image, HelpCircle, Quote, Folder,
  Package, Boxes, ShoppingCart, Ticket, Bell, BarChart3, UserCog, ShieldCheck, History,
  Settings, ToggleLeft,
  Wallet, CreditCard, ArrowLeftRight, RotateCcw, TrendingUp, RefreshCw, Crown, Tag,
} from "lucide-react";
import logo from "../../assets/brand/gogetfit-logo-transparent.png";
import favicon from "../../assets/brand/favicon.png";
import { NAV_GROUPS } from "../../constants/navigation";

// A nav path like "/finance" must only be marked active for an exact match —
// otherwise NavLink also treats it as active on every one of its own sibling
// routes ("/finance/payments", "/finance/coaches", ...), lighting up two items
// at once. Only paths that are themselves a prefix of another nav path need
// `end`; leaf paths (e.g. "/coaches") should stay non-`end` so they keep
// highlighting on their own un-listed detail routes ("/coaches/:id").
const ALL_NAV_PATHS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path));
const EXACT_MATCH_PATHS = new Set(ALL_NAV_PATHS.filter((path) => ALL_NAV_PATHS.some((other) => other !== path && other.startsWith(`${path}/`))));
import { useRole } from "../../app/providers/RoleProvider";
import { cn } from "../../utils/cn";
import styles from "./Sidebar.module.css";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/users": Users,
  "/users/clients": UserCheck,
  "/coaches": Award,
  "/assignments": Link2,
  "/nutrition/diets": Utensils,
  "/nutrition/foods": Apple,
  "/nutrition/requests": Inbox,
  "/nutrition/log": ClipboardList,
  "/fitness/workouts": Dumbbell,
  "/challenges": Trophy,
  "/rewards": Gift,
  "/progress/transformations": Sparkles,
  "/progress/measurements": Ruler,
  "/content/articles": FileText,
  "/content/banners": Image,
  "/content/faqs": HelpCircle,
  "/content/quotes": Quote,
  "/content/media": Folder,
  "/content/gogetfit-plans": Tag,
  "/commerce/products": Package,
  "/commerce/packages": Boxes,
  "/commerce/orders": ShoppingCart,
  "/commerce/coupons": Ticket,
  "/operations/notifications": Bell,
  "/operations/analytics": BarChart3,
  "/finance": Wallet,
  "/finance/payments": CreditCard,
  "/finance/transactions": ArrowLeftRight,
  "/finance/refunds": RotateCcw,
  "/finance/revenue": TrendingUp,
  "/finance/subscriptions": RefreshCw,
  "/finance/coaches": Crown,
  "/system/admin-users": UserCog,
  "/system/permissions": ShieldCheck,
  "/system/audit-logs": History,
  "/system/settings": Settings,
  "/system/feature-flags": ToggleLeft,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { can } = useRole();

  return (
    <aside className={cn(styles.root, collapsed && styles.collapsed)}>
      <button
        type="button"
        className={styles.brand}
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <span className={styles.brandMark}>
            <img src={favicon} alt="GoGetFit" className={styles.faviconImg} />
          </span>
        ) : (
          <span className={styles.brandStack}>
            <span className={styles.logoChip}>
              <img src={logo} alt="GoGetFit" className={styles.logoImg} />
            </span>
            <small className={styles.brandCaption}>ADMIN PORTAL</small>
          </span>
        )}
      </button>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => can(item.module as never, "view"));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className={styles.group}>
              {!collapsed && <span className={styles.groupLabel}>{group.label}</span>}
              {visibleItems.map((item) => {
                const Icon = ICONS[item.path] ?? LayoutDashboard;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={EXACT_MATCH_PATHS.has(item.path)}
                    className={({ isActive }) => cn(styles.item, isActive && styles.active)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
