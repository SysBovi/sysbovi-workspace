import * as React from "react"

export function FieldGroup({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex w-full flex-col gap-5", className].join(" ")} {...props} />
}

export function Field({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex w-full flex-col gap-1.5", className].join(" ")} {...props} />
}

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function FieldLabel({ className = "", ...props }: FieldLabelProps) {
  return (
    <label
      className={["text-sm font-medium text-foreground leading-snug", className].join(" ")}
      {...props}
    />
  )
}
