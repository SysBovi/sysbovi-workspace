"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { api } from "@/lib/api"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"

import Link from "next/link"

import {
  Beef,
  TrendingUp,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Package,
  DollarSign,
} from "lucide-react"

import { useState, useEffect } from "react"

function AdminHomePage({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground">Bem-vindo, {user?.name?.split(" ")[0]}. Você está conectado como Super Admin.</p>
      </div>
      <div className="rounded-xl border-l-4 border-l-primary bg-primary/5 p-4 space-y-1">
        <p className="font-semibold text-foreground">Acesso Global (UA)</p>
        <p className="text-sm text-muted-foreground">
          O Super Admin gerencia planos, tenants e usuários pelo backoffice. Use o menu lateral para acessar as áreas disponíveis.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Email", value: user?.email },
          { label: "Perfil", value: "Super Admin (UA)" },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-card shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="font-medium text-foreground text-sm">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, canAccessVendas } = useAuth()

  const { bovinos, insumos, pastos } = useData()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  /* =========================================================
     LOADING
  ========================================================= */

  useEffect(() => {
    if (user?.role === 'UA') { setIsLoading(false); return }
    api.get("/dashboard/stats")
      .then(res => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false))
  }, [user?.role])


  /* =========================================================
     ALERTAS
  ========================================================= */

  const alertas = [
    ...insumos
      .filter((i) => i.status === "Crítico")
      .map((i) => ({
        id: `insumo-${i.id}`,
        titulo: `Estoque Crítico: ${i.nome}`,
        descricao: `Apenas ${i.quantidadeAtual} ${i.unidade} restantes`,
        href: "/estoque",
        severity: "critical" as const,
      })),

    ...insumos
      .filter((i) => i.status === "Baixo")
      .map((i) => ({
        id: `insumo-low-${i.id}`,
        titulo: `Estoque Baixo: ${i.nome}`,
        descricao: `${i.quantidadeAtual} ${i.unidade} (mínimo: ${i.nivelMinimo})`,
        href: "/estoque",
        severity: "warning" as const,
      })),

    ...pastos
      .filter((p) => p.status === "Superlotado")
      .map((p) => ({
        id: `pasto-${p.id}`,
        titulo: `Pasto Superlotado: ${p.nome}`,
        descricao: `${p.ocupacaoAtual}/${p.capacidade} cabeças`,
        href: "/pastos",
        severity: "critical" as const,
      })),
  ]

  /* =========================================================
     LOADING UI
  ========================================================= */

  if (user?.role === 'UA') return <AdminHomePage user={user} />

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  /* =========================================================
     CARDS
  ========================================================= */

  const statCards = [
    {
      icon: Beef,
      label: "Total de Cabeças",
      value: stats.totalCabecas,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },

    {
      icon: TrendingUp,
      label: "GMD Médio",
      value: `${stats.gmd} kg`,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },

    {
      icon: Package,
      label: "Estoque Crítico",
      value: stats.insumosEmAlerta,

      iconBg:
        stats.insumosEmAlerta > 0
          ? "bg-destructive/10"
          : "bg-chart-3/10",

      iconColor:
        stats.insumosEmAlerta > 0
          ? "text-destructive"
          : "text-chart-3",

      valueColor:
        stats.insumosEmAlerta > 0
          ? "text-destructive"
          : "text-foreground",
    },

    {
      icon: MapPin,
      label: "Pastos em Alerta",
      value: stats.pastosSuperlotados,

      iconBg:
        stats.pastosSuperlotados > 0
          ? "bg-destructive/10"
          : "bg-chart-4/10",

      iconColor:
        stats.pastosSuperlotados > 0
          ? "text-destructive"
          : "text-chart-4",

      valueColor:
        stats.pastosSuperlotados > 0
          ? "text-destructive"
          : "text-foreground",
    },
  ]

  return (
    <div className="space-y-6">

      {/* SAUDAÇÃO */}

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user?.name?.split(" ")[0] ?? "Usuário"}!
        </h1>

        <p className="text-muted-foreground">
          {user?.fazenda?.nome ?? "Fazenda"} — Resumo do dia
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4">

              <div className="flex items-center gap-3">

                <div
                  className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center`}
                >
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    {s.label}
                  </p>

                  <p
                    className={`text-2xl font-bold ${
                      (s as any).valueColor || "text-foreground"
                    }`}
                  >
                    {s.value}
                  </p>
                </div>

              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* AVALIA VENDA */}

      {canAccessVendas && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary to-primary/80">
          <CardContent className="p-5">

            <Link
              href="/vendas"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-primary-foreground" />
                </div>

                <div className="text-primary-foreground">
                  <h3 className="font-bold text-lg">
                    AvaliaVenda
                  </h3>

                  <p className="text-primary-foreground/80 text-sm">
                    Análise inteligente de venda do seu rebanho
                  </p>
                </div>

              </div>

              <ChevronRight className="w-6 h-6 text-primary-foreground" />
            </Link>

          </CardContent>
        </Card>
      )}

      {/* ALERTAS */}
      {/* ... mantém igual ... */}

      {/* RESUMO FINANCEIRO */}

      {canAccessVendas && (
        <Card className="border-0 shadow-md">

          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Resumo Financeiro
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">

              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Custo Total Acumulado
                </p>

                <p className="text-xl font-bold text-foreground">
                  R$ {
                    bovinos
                      .reduce((acc, b) => acc + b.custoAcumulado, 0)
                      .toLocaleString("pt-BR")
                  }
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  Peso Médio
                </p>

                <p className="text-xl font-bold text-foreground">
                  {stats.pesoMedio} kg
                </p>
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}