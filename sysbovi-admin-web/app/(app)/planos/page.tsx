"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Crown, Check, Building2, Sparkles, DollarSign, Beef, MapPin, Package, TrendingUp } from "lucide-react"

interface TenantMe {
  plano: { nome: string; precoMensal: number }
}

const planos = [
  {
    id: "PREMIUM", nome: "Premium", preco: "R$ 149", periodo: "/mês",
    descricao: "Para fazendas de pequeno e médio porte",
    icon: Crown, color: "from-primary to-primary/80", popular: true,
    beneficios: [
      { texto: "Gestão completa do rebanho", icon: Beef },
      { texto: "Controle de estoque ilimitado", icon: Package },
      { texto: "Módulo AvaliaVenda", icon: DollarSign, destaque: true },
      { texto: "Gestão de pastos", icon: MapPin },
      { texto: "Relatórios básicos", icon: TrendingUp },
      { texto: "Suporte por email", icon: Check },
    ],
  },
  {
    id: "EMPRESARIAL", nome: "Empresarial", preco: "R$ 349", periodo: "/mês",
    descricao: "Para grandes fazendas e grupos",
    icon: Building2, color: "from-chart-3 to-chart-3/80", popular: false,
    beneficios: [
      { texto: "Tudo do Premium", icon: Check },
      { texto: "Multi-fazendas", icon: Building2 },
      { texto: "Relatórios avançados", icon: TrendingUp, destaque: true },
      { texto: "Integração com balanças", icon: Sparkles },
      { texto: "API de integração", icon: Check },
      { texto: "Suporte prioritário 24/7", icon: Check },
      { texto: "Treinamento da equipe", icon: Check },
    ],
  },
]

export default function PlanosPage() {
  const { user } = useAuth()
  const [planoAtual, setPlanoAtual] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.fazenda) return
    api.get<TenantMe>("/tenants/me")
      .then(res => setPlanoAtual(res.plano?.nome?.toUpperCase() ?? null))
      .catch(() => {})
  }, [user?.fazenda])

  const handleUpgrade = async (planoId: string) => {
    setLoadingPlan(planoId)
    try {
      await api.post("/tenants/me/solicitar-upgrade", { planoDesejado: planoId })
      toast.success("Solicitação enviada!", {
        description: "Nossa equipe entrará em contato em até 24h para concluir a migração.",
      })
    } catch {
      toast.error("Erro ao enviar solicitação", { description: "Tente novamente ou contate o suporte." })
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrent = (id: string) => planoAtual === id

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Planos SYSBOVI</h1>
        <p className="text-muted-foreground mt-1">Escolha o plano ideal para sua fazenda</p>
        {planoAtual && (
          <Badge variant="outline" className="mt-3 bg-primary/5">
            Plano atual: {planoAtual.charAt(0) + planoAtual.slice(1).toLowerCase()}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {planos.map(plano => {
          const Icon = plano.icon
          const current = isCurrent(plano.id)
          return (
            <Card key={plano.id} className={`border-0 shadow-lg relative overflow-hidden ${plano.popular ? "ring-2 ring-primary" : ""}`}>
              {plano.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">Mais Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plano.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plano.preco}</span>
                  <span className="text-muted-foreground">{plano.periodo}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plano.beneficios.map((b, i) => {
                    const BIcon = b.icon
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${b.destaque ? "bg-primary/10" : "bg-muted"}`}>
                          <BIcon className={`w-4 h-4 ${b.destaque ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={b.destaque ? "font-semibold text-foreground" : "text-muted-foreground"}>{b.texto}</span>
                      </li>
                    )
                  })}
                </ul>
                <button
                  disabled={current || loadingPlan === plano.id}
                  onClick={() => handleUpgrade(plano.id)}
                  className={`w-full h-14 text-lg font-semibold rounded-md flex items-center justify-center gap-2 transition-all disabled:pointer-events-none disabled:opacity-60 ${
                    current
                      ? "border border-border bg-background text-foreground"
                      : `bg-gradient-to-r ${plano.color} text-primary-foreground hover:opacity-90`
                  }`}
                >
                  {loadingPlan === plano.id
                    ? <><Spinner className="mr-2" />Enviando...</>
                    : current ? "Plano Atual" : "Fazer Upgrade"}
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-md bg-muted/30 max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">Precisa de ajuda para escolher?</h3>
          <p className="text-muted-foreground text-sm mb-4">Nossa equipe pode ajudar a encontrar o plano perfeito para sua operação</p>
          <button className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors text-sm font-medium">
            Falar com um Especialista
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
