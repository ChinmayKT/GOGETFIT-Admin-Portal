import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./controls.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className, ...rest }: InputProps) {
  return <input className={cn(styles.control, error && styles.errorState, className)} {...rest} />;
}
