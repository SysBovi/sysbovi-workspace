import * as React from "react"

export function Avatar({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "relative flex shrink-0 overflow-hidden rounded-full",
        className,
      ].join(" ")}
      {...props}
    />
  )
}

export function AvatarFallback({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className,
      ].join(" ")}
      {...props}
    />
  )
}
