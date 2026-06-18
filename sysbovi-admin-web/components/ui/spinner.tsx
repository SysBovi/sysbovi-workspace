import { Loader2 } from "lucide-react"
import * as React from "react"

export function Spinner({ className = "", ...props }: React.SVGAttributes<SVGElement>) {
  return (
    <Loader2
      role="status"
      aria-label="Carregando"
      className={["size-4 animate-spin", className].join(" ")}
      {...props}
    />
  )
}
