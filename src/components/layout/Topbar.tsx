import { useState } from "react";
import { Search, ChevronDown, LogOut, UserCog } from "lucide-react";
import { CommandSearch } from "../ui/CommandSearch";
import { Dropdown } from "../ui/Dropdown";
import { Avatar } from "../ui/Avatar";
import { useAuth, useCurrentAdmin } from "../../app/providers/AuthProvider";
import { useRole } from "../../app/providers/RoleProvider";
import { useNavigate } from "react-router-dom";
import styles from "./Topbar.module.css";

export function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const admin = useCurrentAdmin();
  const { logout } = useAuth();
  const { role, roles, setRoleId } = useRole();
  const navigate = useNavigate();

  return (
    <header className={styles.root}>
      <button className={styles.searchTrigger} onClick={() => setSearchOpen(true)}>
        <Search size={15} />
        <span>Search users, coaches, plans, orders...</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>

      <div className={styles.right}>
        <Dropdown
          align="left"
          trigger={
            <button className={styles.roleTrigger}>
              <UserCog size={14} />
              {role.name}
              <ChevronDown size={13} />
            </button>
          }
          items={roles.map((r) => ({ label: r.name, onClick: () => setRoleId(r.id) }))}
        />

        <Dropdown
          trigger={
            <button className={styles.userTrigger}>
              <Avatar name={admin.name} size="sm" />
              <span className={styles.userInfo}>
                <span className={styles.userName}>{admin.name}</span>
                <span className={styles.userEmail}>{admin.email}</span>
              </span>
              <ChevronDown size={13} />
            </button>
          }
          items={[
            { label: "Profile settings", onClick: () => navigate("/system/settings") },
            {
              label: "Sign out",
              onClick: () => {
                logout();
                navigate("/login", { replace: true });
              },
              danger: true,
              icon: <LogOut size={14} />,
            },
          ]}
        />
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
