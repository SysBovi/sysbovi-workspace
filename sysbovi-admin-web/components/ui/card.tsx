import * as React from "react"

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["rounded-xl bg-card text-card-foreground shadow-sm p-4", className].join(" ")}
      {...props}
    />
  )
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex flex-col space-y-1.5 p-6", className].join(" ")} {...props} />
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={["text-lg font-semibold leading-none tracking-tight", className].join(" ")}
      {...props}
    />
  )
}

export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={["text-sm text-muted-foreground", className].join(" ")} {...props} />
  )
}

export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["py-6 pt-0", className].join(" ")} {...props} />
}

export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["flex items-center p-4 pt-0", className].join(" ")} {...props} />
  )
}
