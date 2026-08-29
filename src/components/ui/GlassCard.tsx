import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./GlassCard.module.css";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  bright?: boolean;
  glow?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  bright,
  glow,
  interactive,
  padding = "md",
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        styles.root,
        bright && styles.bright,
        glow && styles.glow,
        interactive && styles.interactive,
        styles[`pad-${padding}`],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
