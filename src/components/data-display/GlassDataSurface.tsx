import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./GlassDataSurface.module.css";

interface GlassDataSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Restrained glass surface for tables/dense data — readability over decoration. */
export function GlassDataSurface({ children, className, ...rest }: GlassDataSurfaceProps) {
  return (
    <div className={cn(styles.root, className)} {...rest}>
      {children}
    </div>
  );
}
