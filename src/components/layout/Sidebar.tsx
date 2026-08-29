import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, Award, Link2, Utensils, Apple, Inbox, ClipboardList,
  Dumbbell, Trophy, Gift, Sparkles, Ruler, FileText, Image, HelpCircle, Quote, Folder,
  Package, Boxes, ShoppingCart, Ticket, Bell, BarChart3, UserCog, ShieldCheck, History,
  Settings, ToggleLeft, ChevronsLeft, ChevronsRight,
  Wallet, CreditCard, ArrowLeftRight, RotateCcw, TrendingUp, RefreshCw, Crown,
} from "lucide-react";
import logo from "../../assets/brand/gogetfit-logo-transparent.png";
import favicon from "../../assets/brand/favicon.png";
import { NAV_GROUPS } from "../../constants/navigation";
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
      <div className={styles.brand}>
        {collapsed ? (
          <span className={styles.brandMark}>
            <img src={favicon} alt="GoGetFit" className={styles.faviconImg} />
          </span>
        ) : (
          <>
            <span className={styles.logoChip}>
              <img src={logo} alt="GoGetFit" className={styles.logoImg} />
            </span>
            <span className={styles.brandText}>
              <small>ADMIN PORTAL</small>
            </span>
          </>
        )}
      </div>

      <button className={styles.collapseBtn} onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
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
