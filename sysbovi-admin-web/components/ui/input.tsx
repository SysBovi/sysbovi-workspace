import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className,
      ].join(" ")}
      {...props}
    />
  )
}
