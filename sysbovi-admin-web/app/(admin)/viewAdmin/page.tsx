"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Users, TrendingDown, ShieldCheck } from "lucide-react"

interface BackofficeDashboard {
  totalTenants: number
  ativos: number
  inadimplentes: number
  mrr: number
}

function formatMrr(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export default function Dashboard() {
  const [data, setData] = useState<BackofficeDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<BackofficeDashboard>("/admin/dashboard")
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [])

  const metrics = data ? [
    { title: "MRR",             value: formatMrr(data.mrr),        icon: DollarSign },
    { title: "Total de Clientes", value: String(data.totalTenants), icon: Users },
    { title: "Contas Ativas",   value: String(data.ativos),         icon: ShieldCheck },
    { title: "Inadimplentes",   value: String(data.inadimplentes),  icon: TrendingDown },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : metrics.map(item => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              )
            })
        }
      </div>
    </div>
  )
}
