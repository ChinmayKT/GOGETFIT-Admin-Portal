import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { LiquidBackground } from "./LiquidBackground";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "../../utils/cn";
import styles from "./AppShell.module.css";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth <= 1024);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={styles.root}>
      <LiquidBackground />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={cn(styles.main, collapsed && styles.mainCollapsed)}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
