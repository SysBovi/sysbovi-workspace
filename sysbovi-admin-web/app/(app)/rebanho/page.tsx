"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import Link from "next/link"
import { Search, Plus, Pencil, Beef, ChevronRight, Truck } from "lucide-react"

function BovinoCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function RebanhoPage() {
  const { bovinos } = useData()
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const STATUS_COLOR: Record<string, string> = {
    "Saudável":      "bg-primary/10 text-primary border-primary/20",
    "Em Tratamento": "bg-destructive/10 text-destructive border-destructive/20",
    "Observação":    "bg-warning/10 text-warning-foreground border-warning/20",
  }

  const FILTER_OPTIONS = [
    { label: "Todos",          value: "todos" },
    { label: "Saudável",       value: "Saudável" },
    { label: "Em Tratamento",  value: "Em Tratamento" },
    { label: "Observação",     value: "Observação" },
  ]

  const filtered = bovinos.filter(b => {
    const matchS = b.brinco.toLowerCase().includes(search.toLowerCase()) || b.raca.toLowerCase().includes(search.toLowerCase())
    const matchF = filterStatus === "todos" || b.statusSaude === filterStatus
    return matchS && matchF
  })

  const statusColor = (s: string) => STATUS_COLOR[s] ?? "bg-muted text-muted-foreground"

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full" />
      <div className="space-y-3">
        <BovinoCardSkeleton /><BovinoCardSkeleton /><BovinoCardSkeleton />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rebanho</h1>
          <p className="text-muted-foreground">{bovinos.length} animais cadastrados</p>
        </div>
        <Link href="/rebanho/novo"
          className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="w-7 h-7" />
          <span className="sr-only">Novo Bovino</span>
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input type="search" placeholder="Buscar por brinco ou raça..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-12 h-14 text-base rounded-xl" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(({ label, value }) => (
          <button key={value} onClick={() => setFilterStatus(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === value
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-accent text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Empty icon={Beef} title="Nenhum animal encontrado"
          description={search ? "Tente ajustar sua busca" : "Cadastre seu primeiro bovino"}
          action={
            <Link href="/rebanho/novo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />Novo Bovino
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(bovino => (
            <Card key={bovino.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/rebanho/${bovino.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Beef className="w-7 h-7 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-foreground">{bovino.brinco}</h3>
                          <Badge variant="outline" className={statusColor(bovino.statusSaude)}>{bovino.statusSaude}</Badge>
                          {bovino.pastoAtual === "Chegando" && (
                            <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
                              <Truck className="w-3 h-3 mr-1" />Chegando
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{bovino.raca} - {bovino.sexo}</p>
                        <p className="text-sm font-semibold text-primary">{bovino.pesoAtual} kg</p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/rebanho/${bovino.id}/editar`}
                      className="h-12 w-12 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors">
                      <Pencil className="w-5 h-5" />
                      <span className="sr-only">Editar</span>
                    </Link>
                    <Link href={`/rebanho/${bovino.id}`}>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
