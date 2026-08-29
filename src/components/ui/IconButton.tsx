import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./IconButton.module.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "default" | "danger";
  size?: "sm" | "md";
}

export function IconButton({ icon, label, variant = "default", size = "md", className, ...rest }: IconButtonProps) {
  return (
    <button className={cn(styles.root, styles[variant], styles[size], className)} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  );
}
