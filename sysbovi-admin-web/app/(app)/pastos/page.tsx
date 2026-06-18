"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { MapPin, AlertTriangle, Users, Calendar, Maximize, Plus, Pencil, Trash2, DollarSign } from "lucide-react"
import type { Pasto } from "@/lib/data-context"

const EMPTY_FORM = { nome: "", area: "", capacidade: "", diasDescanso: "30" }

export default function PastosPage() {
  const { pastos, addPasto, updatePasto, removePasto, setCustoDiarioPasto, getCustoDiarioPasto } = useData()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pasto | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Custo diário
  const [custoPastoId, setCustoPastoId] = useState<string | null>(null)
  const [custoValor, setCustoValor] = useState("")
  const [salvandoCusto, setSalvandoCusto] = useState(false)
  const [custosMap, setCustosMap] = useState<Record<string, number | null>>({})

  const [deleteTarget, setDeleteTarget] = useState<Pasto | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (pastos.length === 0) return
    Promise.all(pastos.map(p => getCustoDiarioPasto(p.id).then(v => ({ id: p.id, v })).catch(() => ({ id: p.id, v: null }))))
      .then(results => {
        const map: Record<string, number | null> = {}
        results.forEach(r => { map[r.id] = r.v })
        setCustosMap(map)
      })
  }, [pastos.length])

  async function handleSalvarCusto() {
    if (!custoPastoId || !custoValor || Number(custoValor) < 0) return
    setSalvandoCusto(true)
    try {
      const valorSalvo = await setCustoDiarioPasto(custoPastoId, Number(custoValor))
      setCustosMap(prev => ({ ...prev, [custoPastoId]: valorSalvo }))
      toast.success("Custo diário atualizado!", {
        description: `R$ ${valorSalvo.toFixed(2)}/cabeça/dia`,
      })
      setCustoPastoId(null)
      setCustoValor("")
    } catch (e: any) {
      toast.error("Erro ao salvar custo diário", {
        description: e?.message ?? "Verifique sua conexão e tente novamente",
      })
    } finally {
      setSalvandoCusto(false)
    }
  }

  const superlotados = pastos.filter(p => p.status === "Superlotado")
  const disponiveis  = pastos.filter(p => p.status === "Disponível")

  const statusColor = (s: string) => ({
    "Normal":      "bg-primary/10 text-primary border-primary/20",
    "Superlotado": "bg-destructive/10 text-destructive border-destructive/20",
    "Disponível":  "bg-chart-4/10 text-chart-4 border-chart-4/20",
  }[s] ?? "bg-muted text-muted-foreground")

  const barColor = (occ: number, cap: number) => {
    const pct = (occ / cap) * 100
    if (pct >= 100) return "bg-destructive"
    if (pct >= 80)  return "bg-warning"
    return "bg-primary"
  }

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(pasto: Pasto) {
    setEditTarget(pasto)
    setForm({
      nome:         pasto.nome,
      area:         String(pasto.area),
      capacidade:   String(pasto.capacidade),
      diasDescanso: String(pasto.diasDescanso),
    })
    setErrors({})
    setDialogOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nome.trim())                    e.nome = "Nome é obrigatório"
    if (!form.area || Number(form.area) <= 0) e.area = "Área deve ser maior que zero"
    if (!form.capacidade || Number(form.capacidade) <= 0) e.capacidade = "Capacidade deve ser maior que zero"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        nome:         form.nome.trim(),
        areaHectares: Number(form.area),
        capacidade:   Number(form.capacidade),
        diasDescanso: Number(form.diasDescanso) || 30,
      }
      if (editTarget) {
        await updatePasto(editTarget.id, payload)
        toast.success("Pasto atualizado com sucesso")
      } else {
        await addPasto(payload)
        toast.success("Pasto cadastrado com sucesso")
      }
      setDialogOpen(false)
    } catch {
      toast.error("Erro ao salvar pasto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removePasto(deleteTarget.id)
      toast.success(`Pasto "${deleteTarget.nome}" removido`)
      setDeleteTarget(null)
    } catch {
      toast.error("Erro ao remover pasto")
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = (field: string) =>
    `h-12 text-base ${errors[field] ? "border-destructive focus-visible:ring-destructive" : ""}`

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1,2,3,4].map(i => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pastos</h1>
          <p className="text-muted-foreground">{pastos.length} áreas cadastradas</p>
        </div>
        <button onClick={openCreate}
          className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md">
          <Plus className="w-7 h-7" />
          <span className="sr-only">Novo Pasto</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${superlotados.length > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                <AlertTriangle className={`w-6 h-6 ${superlotados.length > 0 ? "text-destructive" : "text-primary"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Superlotados</p>
                <p className={`text-2xl font-bold ${superlotados.length > 0 ? "text-destructive" : "text-foreground"}`}>{superlotados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-foreground">{disponiveis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta superlotação */}
      {superlotados.length > 0 && (
        <div className="rounded-xl shadow-md bg-destructive/5 border-l-4 border-l-destructive p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Alerta de Superlotação</h3>
            <p className="text-sm text-muted-foreground">
              {superlotados.length === 1
                ? "1 pasto está superlotado e precisa de remanejamento"
                : `${superlotados.length} pastos estão superlotados e precisam de remanejamento`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {superlotados.map(p => (
                <Badge key={p.id} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{p.nome}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {pastos.length === 0 ? (
        <Empty icon={MapPin} title="Nenhum pasto cadastrado" description="Adicione áreas de pastagem ao sistema"
          action={
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />Novo Pasto
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pastos.map(pasto => {
            const pctOcc  = (pasto.ocupacaoAtual / pasto.capacidade) * 100
            const iconBg  = pasto.status === "Superlotado" ? "bg-destructive/10" : pasto.status === "Disponível" ? "bg-chart-4/10" : "bg-primary/10"
            const iconClr = pasto.status === "Superlotado" ? "text-destructive" : pasto.status === "Disponível" ? "text-chart-4" : "text-primary"
            return (
              <Card key={pasto.id} className={`border-0 shadow-sm ${pasto.status === "Superlotado" ? "ring-2 ring-destructive/20" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <MapPin className={`w-6 h-6 ${iconClr}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{pasto.nome}</h3>
                        <Badge variant="outline" className={statusColor(pasto.status)}>{pasto.status}</Badge>
                      </div>
                    </div>
                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(pasto)}
                        className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        title="Editar pasto">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(pasto)}
                        className="h-9 w-9 rounded-lg border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 transition-colors text-destructive"
                        title="Remover pasto">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ocupação */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4" />Ocupação</span>
                      <span className={`font-bold ${pasto.status === "Superlotado" ? "text-destructive" : "text-foreground"}`}>
                        {pasto.ocupacaoAtual}/{pasto.capacidade}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor(pasto.ocupacaoAtual, pasto.capacidade)}`}
                        style={{ width: `${Math.min(pctOcc, 100)}%` }} />
                    </div>
                    {pctOcc > 100 && (
                      <p className="text-xs text-destructive mt-1 font-medium">{(pctOcc - 100).toFixed(0)}% acima da capacidade</p>
                    )}
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Maximize className="w-4 h-4" /><span>{pasto.area} ha</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span>{pasto.diasDescanso}d descanso</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Último rodízio: {pasto.ultimoRodizio ? new Date(pasto.ultimoRodizio).toLocaleDateString("pt-BR") : "Não registrado"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        {custosMap[pasto.id] != null ? (
                          <span className="text-sm font-semibold text-foreground">
                            R$ {Number(custosMap[pasto.id]).toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground">/cab/dia</span>
                          </span>
                        ) : (
                          <span className="text-xs text-warning-foreground font-medium bg-warning/10 px-2 py-0.5 rounded-full">
                            Custo não definido
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => { setCustoPastoId(pasto.id); setCustoValor(custosMap[pasto.id] != null ? String(custosMap[pasto.id]) : "") }}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog criar / editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Pasto" : "Novo Pasto"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Atualize as informações da área de pastagem." : "Preencha os dados para cadastrar uma nova área."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome</label>
              <Input placeholder="Ex: Pasto A1 - Braquiária" value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className={inputCls("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Área (ha)</label>
                <Input type="number" placeholder="Ex: 50" value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  className={inputCls("area")} />
                {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Capacidade (cab.)</label>
                <Input type="number" placeholder="Ex: 30" value={form.capacidade}
                  onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))}
                  className={inputCls("capacidade")} />
                {errors.capacidade && <p className="text-xs text-destructive">{errors.capacidade}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dias de descanso</label>
              <Input type="number" placeholder="30" value={form.diasDescanso}
                onChange={e => setForm(f => ({ ...f, diasDescanso: e.target.value }))}
                className="h-12" />
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving ? <><Spinner className="w-4 h-4" />Salvando...</> : editTarget ? "Salvar alterações" : "Cadastrar pasto"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pasto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.nome}</strong>?
              Os bovinos vinculados a este pasto perderão a associação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-destructive hover:bg-destructive/90">
              {deleting ? <><Spinner className="w-4 h-4 mr-1" />Removendo...</> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog custo diário */}
      <Dialog open={!!custoPastoId} onOpenChange={open => { if (!open) setCustoPastoId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" />Custo Diário por Cabeça</DialogTitle>
            <DialogDescription>Informe o custo médio diário por animal neste pasto (R$/cabeça/dia).</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-1">
            <label className="text-sm font-medium text-foreground">Valor (R$/cabeça/dia)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={custoValor}
              onChange={e => setCustoValor(e.target.value)}
              placeholder="Ex: 4.50"
              className="mt-1.5 h-14 text-xl font-bold text-center"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button onClick={() => setCustoPastoId(null)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleSalvarCusto} disabled={!custoValor || salvandoCusto} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {salvandoCusto ? <><Spinner className="w-4 h-4 mr-1" />Salvando...</> : "Salvar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}