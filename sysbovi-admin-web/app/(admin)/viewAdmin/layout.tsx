"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutDashboard, Users, LifeBuoy, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace("/admin-login")
    else if (user.role !== "UA") router.replace("/login")
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "UA") {
    return (
      <div className="min-h-screen flex bg-background">
        <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-3">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </aside>
        <main className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4 flex flex-col">
        
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">SYSBOVI</h2>
          <p className="text-xs text-muted-foreground">Painel Admin</p>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => router.push("/viewAdmin")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname === "/viewAdmin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => router.push("/viewAdmin/viewClients")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname === "/viewAdmin/viewClients"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"}`}
          >
            <Users className="w-4 h-4" />
            Clientes
          </button>

          <button
            onClick={() => router.push("/viewAdmin/suporte")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname === "/viewAdmin/suporte"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"}`}
          >
            <LifeBuoy className="w-4 h-4" />
            Suporte
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}