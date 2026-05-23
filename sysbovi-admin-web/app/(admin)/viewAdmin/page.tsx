"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Users, TrendingDown, Activity } from "lucide-react"

const metrics = [
  { title: "MRR", value: "R$ 45.000", icon: DollarSign },
  { title: "DAU", value: "1.230", icon: Activity },
  { title: "Assinantes", value: "320", icon: Users },
  { title: "Churn Rate", value: "5%", icon: TrendingDown },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item) => {
          const Icon = item.icon

          return (
            <Card
              key={item.title}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {item.value}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}