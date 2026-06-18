"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

// Context para comunicar valor e handler aos filhos
const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: "", onValueChange: () => {} })

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <SelectInner value={value} onValueChange={onValueChange} disabled={disabled}>
        {children}
      </SelectInner>
    </SelectContext.Provider>
  )
}

function SelectInner({
  value,
  onValueChange,
  children,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  // Collect options from SelectContent > SelectItem children
  const [options, setOptions] = React.useState<{ value: string; label: string }[]>([])
  const selectRef = React.useRef<HTMLSelectElement>(null)

  return (
    <SelectContextCollector onOptions={setOptions}>
      <div className="relative w-full">
        <select
          ref={selectRef}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          className={[
            "flex w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors text-foreground",
          ].join(" ")}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      {/* Hidden children to collect options */}
      <div className="hidden">{children}</div>
    </SelectContextCollector>
  )
}

// Context collector to gather options from children
const OptionsCollectorContext = React.createContext<{
  addOption: (value: string, label: string) => void
} | null>(null)

function SelectContextCollector({
  children,
  onOptions,
}: {
  children: React.ReactNode
  onOptions: (opts: { value: string; label: string }[]) => void
}) {
  const optionsRef = React.useRef<{ value: string; label: string }[]>([])
  const scheduledRef = React.useRef(false)

  const addOption = React.useCallback((value: string, label: string) => {
    const exists = optionsRef.current.find((o) => o.value === value)
    if (!exists) {
      optionsRef.current = [...optionsRef.current, { value, label }]
    }
    if (!scheduledRef.current) {
      scheduledRef.current = true
      setTimeout(() => {
        onOptions([...optionsRef.current])
        scheduledRef.current = false
      }, 0)
    }
  }, [onOptions])

  return (
    <OptionsCollectorContext.Provider value={{ addOption }}>
      {children}
    </OptionsCollectorContext.Provider>
  )
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string
}

// SelectTrigger is a no-op since we use native select; kept for API compatibility
export function SelectTrigger({ children, className = "", id }: SelectTriggerProps) {
  return null
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return null
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
  const ctx = React.useContext(OptionsCollectorContext)

  React.useEffect(() => {
    if (ctx) {
      // Extract text from children
      const label = extractText(children)
      ctx.addOption(value, label)
    }
  }, [value, children, ctx])

  return null
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    return extractText(props.children)
  }
  return ""
}
