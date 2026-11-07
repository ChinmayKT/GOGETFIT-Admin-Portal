import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import styles from "./GlassDrawer.module.css";

interface GlassDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  /** A line under the title. */
  description?: ReactNode;
  /** Pinned under the scrolling body (actions). */
  footer?: ReactNode;
  /** Slide out before unmounting instead of disappearing at once. */
  animateExit?: boolean;
}

const EXIT_MS = 220;

export function GlassDrawer({ open, onClose, title, children, width = 440, description, footer, animateExit }: GlassDrawerProps) {
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  // Mounted while open, and for the slide-out after it closes.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted || !animateExit) return;
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, mounted, animateExit]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus moves into the drawer, and back to whatever opened it on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    return () => opener?.focus?.();
  }, [open]);

  if (!open && !(animateExit && mounted)) return null;

  return createPortal(
    <div className={`${styles.overlay} ${open ? "" : styles.closing}`} onMouseDown={onClose}>
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`${styles.drawer} ${open ? "" : styles.closing}`}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <IconButton icon={<X size={18} />} label="Close" onClick={onClose} />
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
