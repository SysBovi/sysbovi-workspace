"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Beef } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    router.replace(user ? "/home" : "/login")
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-primary/10 to-background">
      <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-xl animate-pulse">
        <Beef className="w-14 h-14 text-primary-foreground" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-primary tracking-tight">SYSBOVI</h1>
      <p className="mt-2 text-muted-foreground">Carregando...</p>
    </div>
  )
}
