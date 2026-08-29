import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import styles from "./controls.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...rest }: TextareaProps) {
  return <textarea className={cn(styles.textarea, error && styles.errorState, className)} {...rest} />;
}
