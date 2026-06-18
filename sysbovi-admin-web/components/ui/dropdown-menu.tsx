"use client"

import * as React from "react"

interface DropdownMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType>({
  open: false,
  setOpen: () => {},
})

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    })
  }

  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  )
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center"
}

export function DropdownMenuContent({ children, className = "", align = "start", ...props }: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext)

  if (!open) return null

  const alignClasses = align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"

  return (
    <div
      className={[
        "absolute top-full mt-1 z-50 min-w-48 rounded-xl border border-border bg-card shadow-lg py-1",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        alignClasses,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["px-3 py-2 text-sm font-semibold text-foreground", className].join(" ")}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["my-1 h-px bg-border mx-2", className].join(" ")} {...props} />
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

export function DropdownMenuItem({ className = "", asChild, children, onClick, ...props }: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string; onClick?: () => void }>, {
      className: [
        "flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg mx-1 transition-colors cursor-pointer",
        (children as React.ReactElement<{ className?: string }>).props.className ?? "",
      ].join(" "),
      onClick: () => setOpen(false),
    })
  }

  return (
    <button
      className={[
        "flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer",
        className,
      ].join(" ")}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
