"use client"

import { AuthProvider } from "@/lib/auth-context"
import { DataProvider } from "@/lib/data-context"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  )
}
