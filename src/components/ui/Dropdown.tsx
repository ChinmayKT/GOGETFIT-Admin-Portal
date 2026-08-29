import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Dropdown.module.css";

interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, align = "right" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className={styles.root} ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cn(styles.menu, align === "left" ? styles.alignLeft : styles.alignRight)}>
          {items.map((item, i) => (
            <button
              key={i}
              className={cn(styles.item, item.danger && styles.danger)}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
