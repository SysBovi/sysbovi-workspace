import * as React from "react"
import type { LucideIcon } from "lucide-react"

interface EmptyProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function Empty({ icon: Icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border p-10 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
