import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-electric text-white shadow-glow hover:bg-electricSoft focus-visible:ring-electric",
  secondary:
    "bg-white/8 text-text hover:bg-white/12 focus-visible:ring-white/20 border border-white/10",
  ghost:
    "bg-transparent text-muted hover:bg-white/5 hover:text-text focus-visible:ring-white/20",
  danger:
    "bg-danger/15 text-danger hover:bg-danger/20 focus-visible:ring-danger/40 border border-danger/25"
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}
