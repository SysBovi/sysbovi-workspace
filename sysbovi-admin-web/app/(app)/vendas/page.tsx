"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, DollarSign, TrendingUp, Beef, Scale, ChevronRight, BadgeCheck, Clock } from "lucide-react"
import Link from "next/link"

const PRECO_ARROBA = 285

interface AvaliaVendaItem {
  bovinoId: string
  brinco: string
  raca: string
  idadeMeses: number
  pesoAtualKg: number
  arrobasVendaveis: number
  custoAcumulado: number
  receitaEstimada: number
  lucroEstimado: number
  margemLucro: number
  diasParaObjetivo: number | null
  custoFuturoProjetado: number
  recomendacao: "VENDER_AGORA" | "AGUARDAR_ENGORDA"
}

export default function VendasPage() {
  const { user, canAccessVendas } = useAuth()
  const [items, setItems] = useState<AvaliaVendaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRec, setFilterRec] = useState("todos")
  const [selected, setSelected] = useState<AvaliaVendaItem | null>(null)

  useEffect(() => {
    if (!canAccessVendas) { setIsLoading(false); return }
    api.get<AvaliaVendaItem[]>("/avalia-venda")
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false))
  }, [canAccessVendas])

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch =
      item.brinco.toLowerCase().includes(search.toLowerCase()) ||
      item.raca.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterRec === "todos" ||
      (filterRec === "vender" && item.recomendacao === "VENDER_AGORA") ||
      (filterRec === "aguardar" && item.recomendacao === "AGUARDAR_ENGORDA")
    return matchSearch && matchFilter
  }), [items, search, filterRec])

  const totalVenda   = useMemo(() => items.filter(i => i.recomendacao === "VENDER_AGORA").length, [items])
  const totalAguarda = useMemo(() => items.filter(i => i.recomendacao === "AGUARDAR_ENGORDA").length, [items])
  const lucroTotal   = useMemo(() => items.filter(i => i.recomendacao === "VENDER_AGORA").reduce((acc, i) => acc + i.lucroEstimado, 0), [items])

  if (!canAccessVendas) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">AvaliaVenda</h1>
        <div className="rounded-xl border-0 shadow-md bg-card p-8 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">O módulo AvaliaVenda está disponível apenas para planos Premium e Empresarial.</p>
          <Link href="/planos" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
            Ver Planos
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-32" /></div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">AvaliaVenda</h1>
        <p className="text-muted-foreground">Análise inteligente de venda do rebanho</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md bg-linear-to-br from-primary to-primary/80">
          <CardContent className="p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center"><BadgeCheck className="w-6 h-6" /></div>
              <div><p className="text-sm opacity-90">Prontos p/ Venda</p><p className="text-2xl font-bold">{totalVenda}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center"><Clock className="w-6 h-6 text-warning-foreground" /></div>
              <div><p className="text-sm text-muted-foreground">Aguardando</p><p className="text-2xl font-bold text-foreground">{totalAguarda}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Lucro Total Estimado (Prontos p/ Venda)</p><p className="text-3xl font-bold text-primary">R$ {lucroTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p></div>
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-7 h-7 text-primary" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input type="search" placeholder="Buscar por brinco ou raça..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-14 text-base rounded-xl" />
      </div>

      <div className="flex gap-2">
        {[
          { key: "todos",   label: `Todos (${items.length})` },
          { key: "vender",  label: `Vender (${totalVenda})` },
          { key: "aguardar",label: `Aguardar (${totalAguarda})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterRec(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterRec === f.key ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon={DollarSign} title="Nenhum animal encontrado" description="Ajuste os filtros ou cadastre mais bovinos" />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <Card key={item.bovinoId} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(item)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Beef className="w-7 h-7 text-primary" /></div>
                    <div>
                      <h3 className="font-bold text-foreground">{item.brinco}</h3>
                      <p className="text-sm text-muted-foreground">{item.pesoAtualKg} kg — {item.raca}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={item.recomendacao === "VENDER_AGORA" ? "bg-primary text-primary-foreground" : "bg-warning/20 text-warning-foreground border border-warning/30"}>
                      {item.recomendacao === "VENDER_AGORA" ? "Vender" : "Aguardar"}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Beef className="w-5 h-5 text-primary" />{selected.brinco}</DialogTitle>
                <DialogDescription>{selected.raca} — {selected.idadeMeses} meses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 px-6">
                <div className={`p-6 rounded-2xl text-center ${selected.recomendacao === "VENDER_AGORA" ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground" : "bg-linear-to-br from-warning/20 to-warning/10"}`}>
                  <p className={`text-sm mb-1 ${selected.recomendacao === "VENDER_AGORA" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Recomendação</p>
                  <p className={`text-3xl font-bold ${selected.recomendacao === "VENDER_AGORA" ? "text-primary-foreground" : "text-warning-foreground"}`}>
                    {selected.recomendacao === "VENDER_AGORA" ? "Vender Agora" : "Aguardar Engorda"}
                  </p>
                  {selected.diasParaObjetivo != null && selected.diasParaObjetivo > 0 && (
                    <p className="text-sm mt-2 opacity-80">Aprox. {selected.diasParaObjetivo} dias para peso ideal</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  {[
                    { label: "Peso Atual",       value: `${selected.pesoAtualKg} kg`, icon: Scale },
                    { label: "Arrobas Vendáveis", value: `${selected.arrobasVendaveis.toFixed(1)} @` },
                    { label: "Preço por Arroba",  value: `R$ ${PRECO_ARROBA}` },
                    { label: "Custo Acumulado",   value: `- R$ ${selected.custoAcumulado.toLocaleString("pt-BR")}`, red: true },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{row.label}</span>
                      <span className={`font-bold text-sm ${row.red ? "text-destructive" : ""}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-semibold">Lucro Estimado</span>
                    <span className={`text-xl font-bold ${selected.lucroEstimado >= 0 ? "text-primary" : "text-destructive"}`}>
                      R$ {selected.lucroEstimado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Margem de Lucro</span>
                    <Badge className={selected.margemLucro >= 25 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground"}>
                      {selected.margemLucro.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 px-6 pb-6">
                <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors" onClick={() => setSelected(null)}>Fechar</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
