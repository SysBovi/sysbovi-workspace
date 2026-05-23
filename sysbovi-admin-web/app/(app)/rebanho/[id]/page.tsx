"use client"

import { useParams } from "next/navigation"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, Beef, Scale, Calendar, MapPin, Heart, TrendingUp, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"

interface AvaliaVendaItem {
  bovinoId: string
  arrobasVendaveis: number
  custoAcumulado: number
  lucroEstimado: number
  margemLucro: number
  diasParaObjetivo: number | null
  recomendacao: "VENDER_AGORA" | "AGUARDAR_ENGORDA"
}

const PRECO_ARROBA = 285

const STATUS_COLOR: Record<string, string> = {
  "Saudável":      "bg-primary/10 text-primary",
  "Em Tratamento": "bg-destructive/10 text-destructive",
  "Observação":    "bg-warning/10 text-warning-foreground",
}

export default function BovinoDetalhePage() {
  const params = useParams()
  const { bovinos } = useData()
  const { canAccessVendas } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [avaliaVenda, setAvaliaVenda] = useState<AvaliaVendaItem | null>(null)

  const bovino = bovinos.find(b => b.id === params.id)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!canAccessVendas || !params.id) return
    api.get<AvaliaVendaItem[]>("/avalia-venda")
      .then(data => setAvaliaVenda(data.find(i => i.bovinoId === params.id) ?? null))
      .catch(() => {})
  }, [canAccessVendas, params.id])

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-48" /></div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )

  if (!bovino) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rebanho" className="p-2 rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Animal não encontrado</h1>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-8 text-center">
          <Beef className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">O animal solicitado não foi encontrado no sistema.</p>
          <Link href="/rebanho" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium mt-4">Voltar ao Rebanho</Link>
        </CardContent>
      </Card>
    </div>
  )

  const statusColor = (s: string) => STATUS_COLOR[s] ?? "bg-muted text-muted-foreground"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rebanho" className="p-2 rounded-xl hover:bg-accent transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{bovino.brinco}</h1>
          <p className="text-muted-foreground">{bovino.raca} - {bovino.sexo}</p>
        </div>
        <Badge variant="outline" className={`${statusColor(bovino.statusSaude)} text-sm px-3 py-1`}>{bovino.statusSaude}</Badge>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"><Beef className="w-10 h-10 text-primary" /></div>
            <div><p className="text-4xl font-bold text-primary">{bovino.pesoAtual} kg</p><p className="text-muted-foreground">Peso atual</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Scale,    label: "Peso Entrada", value: `${bovino.pesoEntrada} kg` },
              { icon: TrendingUp, label: "Ganho Total", value: `+${(bovino.pesoAtual - bovino.pesoEntrada).toFixed(1)} kg`, green: true },
              { icon: Calendar, label: "Idade",        value: `${bovino.idadeEmMeses} meses` },
              { icon: MapPin,   label: "Pasto Atual",  value: bovino.pastoAtual },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                <item.icon className={`w-5 h-5 ${item.green ? "text-primary" : "text-muted-foreground"}`} />
                <div><p className="text-sm text-muted-foreground">{item.label}</p><p className={`font-semibold ${item.green ? "text-primary" : ""}`}>{item.value}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-destructive" />Informações de Saúde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Status de Saúde", value: <Badge className={statusColor(bovino.statusSaude)}>{bovino.statusSaude}</Badge> },
              { label: "Lote",            value: bovino.lote || "Sem lote" },
              { label: "Última Pesagem",  value: bovino.ultimaPesagem ? new Date(bovino.ultimaPesagem).toLocaleDateString("pt-BR") : "Sem registro" },
              { label: "Data de Entrada", value: new Date(bovino.dataEntrada).toLocaleDateString("pt-BR") },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-2 ${i < 3 ? "border-b border-border" : ""}`}>
                <span className="text-muted-foreground">{row.label}</span>
                {typeof row.value === "string" ? <span className="font-medium">{row.value}</span> : row.value}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {canAccessVendas && avaliaVenda && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" />Análise Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Custo Acumulado",   value: `R$ ${avaliaVenda.custoAcumulado.toLocaleString("pt-BR")}` },
                { label: "Arrobas Vendáveis", value: `${avaliaVenda.arrobasVendaveis.toFixed(1)} @` },
                { label: "Preço por Arroba",  value: `R$ ${PRECO_ARROBA}` },
                { label: "Lucro Estimado",    value: `R$ ${avaliaVenda.lucroEstimado.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, colored: avaliaVenda.lucroEstimado >= 0 ? "text-primary" : "text-destructive" },
                { label: "Margem de Lucro",   value: `${avaliaVenda.margemLucro.toFixed(1)}%`, colored: avaliaVenda.margemLucro >= 25 ? "text-primary" : "text-warning-foreground" },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center py-2 ${i < 4 ? "border-b border-border" : ""}`}>
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-bold ${row.colored || ""}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className={`mt-6 p-4 rounded-xl text-center ${avaliaVenda.recomendacao === "VENDER_AGORA" ? "bg-primary/10" : "bg-warning/10"}`}>
              <p className="text-sm text-muted-foreground mb-1">Recomendação</p>
              <p className={`text-2xl font-bold ${avaliaVenda.recomendacao === "VENDER_AGORA" ? "text-primary" : "text-warning-foreground"}`}>
                {avaliaVenda.recomendacao === "VENDER_AGORA" ? "Vender Agora" : "Aguardar Engorda"}
              </p>
              {avaliaVenda.diasParaObjetivo != null && avaliaVenda.diasParaObjetivo > 0 && (
                <p className="text-sm text-muted-foreground mt-1">Aprox. {avaliaVenda.diasParaObjetivo} dias para peso ideal</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
