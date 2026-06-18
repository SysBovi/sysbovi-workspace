"use client"

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  onClose?: () => void
}

export function DialogContent({ children, className = "", onClose, ...props }: DialogContentProps) {
  return (
    <div
      className={[
        "relative z-10 w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "max-h-[90vh] overflow-y-auto",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex flex-col gap-1.5 p-6 pb-4", className].join(" ")} {...props} />
}

export function DialogTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={["text-lg font-semibold text-foreground", className].join(" ")} {...props} />
}

export function DialogDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm text-muted-foreground", className].join(" ")} {...props} />
}

export function DialogFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-4", className].join(" ")}
      {...props}
    />
  )
}

// AlertDialog
interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {children}
    </div>
  )
}

export function AlertDialogContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "relative z-10 w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border p-6",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className,
      ].join(" ")}
      {...props}
    />
  )
}

export function AlertDialogHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex flex-col gap-2 mb-4", className].join(" ")} {...props} />
}

export function AlertDialogTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={["text-lg font-semibold text-foreground", className].join(" ")} {...props} />
}

export function AlertDialogDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm text-muted-foreground", className].join(" ")} {...props} />
}

export function AlertDialogFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4", className].join(" ")}
      {...props}
    />
  )
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function AlertDialogAction({ className = "", ...props }: AlertDialogActionProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      ].join(" ")}
      {...props}
    />
  )
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function AlertDialogCancel({ className = "", ...props }: AlertDialogCancelProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        "border border-border bg-background hover:bg-accent transition-colors",
        className,
      ].join(" ")}
      {...props}
    />
  )
}
