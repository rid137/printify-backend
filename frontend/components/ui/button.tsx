import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        variant === "primary" && "bg-harvest text-white hover:bg-harvest-hover",
        variant === "secondary" &&
          "border border-line bg-surface text-ink-text hover:bg-surface-muted",
        variant === "ghost" && "text-ink-text hover:bg-surface-muted",
        variant === "danger" && "bg-ink-text text-canvas hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
