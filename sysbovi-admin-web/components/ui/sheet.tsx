"use client"

import * as React from "react"
import { X } from "lucide-react"

interface SheetProps {
  children: React.ReactNode
}

interface SheetContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType>({
  open: false,
  setOpen: () => {},
})

export function Sheet({ children }: SheetProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("keydown", handleKey)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

interface SheetTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export function SheetTrigger({ children, asChild, className = "" }: SheetTriggerProps) {
  const { setOpen } = React.useContext(SheetContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    })
  }

  return (
    <button className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

interface SheetContentProps {
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
}

export function SheetContent({ children, side = "right", className = "" }: SheetContentProps) {
  const { open, setOpen } = React.useContext(SheetContext)

  if (!open) return null

  const sideClasses = side === "left"
    ? "left-0 top-0 bottom-0 translate-x-0"
    : "right-0 top-0 bottom-0 translate-x-0"

  const hiddenClasses = side === "left" ? "-translate-x-full" : "translate-x-full"

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <div
        className={[
          "absolute h-full w-72 flex flex-col p-6 shadow-2xl",
          "animate-in slide-in-from-left duration-300",
          sideClasses,
          className,
        ].join(" ")}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex flex-col gap-1.5 mb-4", className].join(" ")} {...props} />
}

export function SheetTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={["text-lg font-semibold", className].join(" ")} {...props} />
}
