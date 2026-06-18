"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Home, Beef, TrendingUp, Package, MapPin, Bell, LogOut, Menu, Crown, Users, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/rebanho", label: "Rebanho", icon: Beef },
  { href: "/vendas", label: "Avalia Venda", icon: TrendingUp, requiresVendas: true },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/pastos", label: "Pastos", icon: MapPin },
  { href: "/equipe", label: "Equipe", icon: Users, requiresUE: true },
]



function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
      <main className="p-4 pb-24">
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, getRoleName, canAccessVendas, canAccessEquipe } = useAuth()
  const { insumos, pastos } = useData()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresVendas && !canAccessVendas) return false
    if (item.requiresUE && !canAccessEquipe) return false
    return true
  })

  const alertCount =
    insumos.filter(i => i.status === "Crítico" || i.status === "Baixo").length +
    pastos.filter(p => p.status === "Superlotado").length

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login")
  }, [user, isLoading, router])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-user-menu]")) setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [userMenuOpen])

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  if (isLoading || !user) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 shadow-md">
        <div className="flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-xl text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/home" className="flex items-center gap-2">
              <Beef className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight hidden sm:inline">SYSBOVI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Alerts */}
            <button
              className="relative p-2 rounded-xl text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              onClick={() => router.push("/home")}
            >
              <Bell className="w-6 h-6" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative" data-user-menu>
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-semibold">
                  {user.avatar ||
                  user.name?.slice(0, 2).toUpperCase() ||
                  "US"}
                </div>
                <span className="hidden sm:inline font-medium">{user.name?.split(" ")[0] ?? "Usuário"}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">Perfil: {getRoleName()}</p>
                  </div>
                  <Link
                    href="/planos"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    Ver Planos
                  </Link>
                  <div className="my-1 h-px bg-border mx-2" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-sidebar-foreground">
                <Beef className="w-6 h-6" />
                <span className="text-lg font-bold">SYSBOVI</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              <div className="border-t border-sidebar-border my-3" />
              <Link
                href="/planos"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  pathname === "/planos" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                }`}
              >
                <Crown className="w-5 h-5" />
                <span className="font-medium">Planos</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:flex lg:flex-col lg:pt-16 lg:bg-sidebar lg:border-r lg:border-sidebar-border">
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
          <div className="border-t border-sidebar-border my-3" />
          <Link
            href="/planos"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              pathname === "/planos"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Crown className="w-5 h-5" />
            <span className="font-medium">Planos</span>
          </Link>
        </nav>
      </div>

      {/* Main */}
      <main className="lg:pl-64 pb-24 lg:pb-8">
        <div className="p-4 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-14 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
