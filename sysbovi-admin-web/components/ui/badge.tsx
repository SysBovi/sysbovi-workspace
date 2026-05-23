import * as React from "react"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-white",
  outline: "border border-border text-foreground bg-transparent",
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    />
  )
}
