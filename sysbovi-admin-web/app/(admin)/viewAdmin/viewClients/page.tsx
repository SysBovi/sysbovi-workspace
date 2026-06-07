"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Users, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react"

type StatusConta = "ATIVA" | "INADIMPLENTE" | "BLOQUEADA"

interface TenantItem {
  id: string
  nomeFazenda: string
  statusConta: StatusConta
  dataCriacao: string
  plano: { nome: string; precoMensal: number }
}

const STATUS_CONFIG: Record<StatusConta, { label: string; className: string; Icon: any }> = {
  ATIVA:        { label: "Ativa",        className: "bg-primary/10 text-primary border-primary/20",           Icon: ShieldCheck },
  INADIMPLENTE: { label: "Inadimplente", className: "bg-warning/10 text-warning-foreground border-warning/20", Icon: ShieldAlert },
  BLOQUEADA:    { label: "Bloqueada",    className: "bg-destructive/10 text-destructive border-destructive/20", Icon: ShieldX },
}

const NEXT_STATUS: Record<StatusConta, StatusConta> = {
  ATIVA:        "BLOQUEADA",
  INADIMPLENTE: "ATIVA",
  BLOQUEADA:    "ATIVA",
}

const NEXT_LABEL: Record<StatusConta, string> = {
  ATIVA:        "Bloquear",
  INADIMPLENTE: "Reativar",
  BLOQUEADA:    "Reativar",
}

export default function Clientes() {
  const [clientes, setClientes] = useState<TenantItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    api.get<TenantItem[]>("/admin/tenants")
      .then(data => setClientes(data))
      .catch(() => toast.error("Erro ao carregar clientes"))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleToggleStatus(tenant: TenantItem) {
    const novoStatus = NEXT_STATUS[tenant.statusConta]
    setToggling(tenant.id)
    try {
      await api.patch(`/admin/tenants/${tenant.id}/status`, { statusConta: novoStatus })
      setClientes(prev => prev.map(c => c.id === tenant.id ? { ...c, statusConta: novoStatus } : c))
      toast.success(`Conta ${novoStatus === "ATIVA" ? "reativada" : "bloqueada"}`, {
        description: tenant.nomeFazenda,
      })
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao alterar status")
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Gerencie clientes e acessos do sistema</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div>
                </div>
                <Skeleton className="h-8 w-24 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map(c => {
            const cfg = STATUS_CONFIG[c.statusConta]
            const StatusIcon = cfg.Icon
            return (
              <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.nomeFazenda}</h3>
                      <p className="text-sm text-muted-foreground">
                        {c.plano?.nome ?? "—"} · desde {new Date(c.dataCriacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={cfg.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </Badge>
                    <button
                      onClick={() => handleToggleStatus(c)}
                      disabled={toggling === c.id}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50 transition-colors"
                    >
                      {toggling === c.id ? "..." : NEXT_LABEL[c.statusConta]}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
