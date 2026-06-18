"use client"

import { useState } from "react"
import { useData } from "@/lib/data-context"
import type { Insumo, HistoricoUsoItem } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  Package, AlertTriangle, Plus, Calendar, Syringe, Pill,
  Leaf, MoreVertical, Pencil, Trash2, Droplets, History,
  FlaskConical,
} from "lucide-react"

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS = ["VACINA", "SUPLEMENTO", "MEDICAMENTO", "MINERAL"] as const
type TipoApi = typeof TIPOS[number]

const TIPO_LABEL: Record<TipoApi, string> = {
  VACINA: "Vacina",
  SUPLEMENTO: "Suplemento",
  MEDICAMENTO: "Medicamento",
  MINERAL: "Mineral",
}

const UNIDADES = ["mL", "L", "g", "kg", "unidade", "dose", "comprimido", "sachê"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColor = (s: string) =>
  ({ Normal: "bg-primary/10 text-primary", Baixo: "bg-warning/10 text-warning-foreground", "Crítico": "bg-destructive/10 text-destructive" }[s] ?? "bg-muted text-muted-foreground")

const statusBarColor = (s: string) =>
  ({ Normal: "bg-primary", Baixo: "bg-warning", "Crítico": "bg-destructive" }[s] ?? "bg-muted")

function TipoIcon({ tipo }: { tipo: string }) {
  const Icon = { Vacina: Syringe, Medicamento: Pill, Suplemento: Leaf, Mineral: FlaskConical }[tipo] ?? Package
  return <Icon className="w-6 h-6" />
}

const EMPTY_FORM = {
  nome: "", tipo: "VACINA" as TipoApi, unidade: "mL",
  quantidadeAtual: "", custoUnitario: "", nivelMinimo: "", validade: "",
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EstoquePage() {
  const {
    insumos, isLoading, pastos,
    criarInsumo, editarInsumo, removerInsumo,
    adicionarEstoqueInsumo, usarInsumo, getHistoricoInsumo,
  } = useData()

  const [modalCadastro, setModalCadastro] = useState(false)
  const [insumoEdit, setInsumoEdit] = useState<Insumo | null>(null)
  const [insumoAdicionar, setInsumoAdicionar] = useState<Insumo | null>(null)
  const [insumoUsar, setInsumoUsar] = useState<Insumo | null>(null)
  const [insumoHistorico, setInsumoHistorico] = useState<Insumo | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({})
  const [saving, setSaving] = useState(false)

  const [qtdAdicionar, setQtdAdicionar] = useState("")
  const [addingStock, setAddingStock] = useState(false)

  const [loteIdUsar, setLoteIdUsar] = useState("")
  const [qtdUsar, setQtdUsar] = useState("")
  const [usando, setUsando] = useState(false)

  const [historico, setHistorico] = useState<HistoricoUsoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  const insumosEmAlerta = insumos.filter(i => i.status === "Crítico" || i.status === "Baixo")

  // ── Cadastro / Edição ────────────────────────────────────────────────────

  function abrirCadastro() {
    setForm(EMPTY_FORM)
    setErrors({})
    setModalCadastro(true)
  }

  function abrirEdicao(insumo: Insumo) {
    const tipoApi = (Object.entries(TIPO_LABEL).find(([, v]) => v === insumo.tipo)?.[0] ?? "VACINA") as TipoApi
    setForm({
      nome: insumo.nome,
      tipo: tipoApi,
      unidade: insumo.unidade,
      quantidadeAtual: "",
      custoUnitario: "",
      nivelMinimo: String(insumo.nivelMinimo),
      validade: "",
    })
    setErrors({})
    setInsumoEdit(insumo)
    setMenuAberto(null)
  }

  function validar(isEdit: boolean) {
    const e: Partial<typeof EMPTY_FORM> = {}
    if (!form.nome.trim()) e.nome = "Nome obrigatório"
    if (!form.unidade.trim()) e.unidade = "Unidade obrigatória"
    if (!isEdit) {
      if (!form.quantidadeAtual || Number(form.quantidadeAtual) < 0) e.quantidadeAtual = "Quantidade inválida"
      if (!form.custoUnitario || Number(form.custoUnitario) <= 0) e.custoUnitario = "Custo inválido"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSalvar(isEdit: boolean) {
    if (!validar(isEdit)) return
    setSaving(true)
    try {
      if (isEdit && insumoEdit) {
        await editarInsumo(insumoEdit.id, {
          nome: form.nome.trim(),
          tipo: form.tipo,
          unidade: form.unidade,
          nivelMinimo: form.nivelMinimo ? Number(form.nivelMinimo) : undefined,
          validade: form.validade || null,
        })
        toast.success("Insumo atualizado!")
        setInsumoEdit(null)
      } else {
        await criarInsumo({
          nome: form.nome.trim(),
          tipo: form.tipo,
          unidade: form.unidade,
          quantidadeAtual: Number(form.quantidadeAtual),
          custoUnitario: Number(form.custoUnitario),
          nivelMinimo: form.nivelMinimo ? Number(form.nivelMinimo) : 0,
          validade: form.validade || undefined,
        })
        toast.success("Insumo cadastrado!")
        setModalCadastro(false)
      }
    } catch {
      toast.error("Erro ao salvar insumo")
    } finally {
      setSaving(false)
    }
  }

  // ── Excluir ──────────────────────────────────────────────────────────────

  async function handleExcluir(insumo: Insumo) {
    setMenuAberto(null)
    if (!confirm(`Excluir "${insumo.nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      await removerInsumo(insumo.id)
      toast.success("Insumo removido!")
    } catch {
      toast.error("Erro ao remover insumo")
    }
  }

  // ── Reposição ────────────────────────────────────────────────────────────

  async function handleAdicionar() {
    if (!insumoAdicionar || !qtdAdicionar || Number(qtdAdicionar) <= 0) return
    setAddingStock(true)
    try {
      await adicionarEstoqueInsumo(insumoAdicionar.id, Number(qtdAdicionar))
      toast.success("Estoque reposto!", { description: `+${qtdAdicionar} ${insumoAdicionar.unidade} de ${insumoAdicionar.nome}` })
      setInsumoAdicionar(null)
      setQtdAdicionar("")
    } catch {
      toast.error("Erro ao repor estoque")
    } finally {
      setAddingStock(false)
    }
  }

  // ── Usar insumo ──────────────────────────────────────────────────────────

  async function handleUsar() {
    if (!insumoUsar || !loteIdUsar || !qtdUsar || Number(qtdUsar) <= 0) return
    setUsando(true)
    try {
      await usarInsumo(insumoUsar.id, { loteId: loteIdUsar, quantidadeUtilizada: Number(qtdUsar) })
      toast.success("Insumo aplicado!", { description: "Custo rateado entre os bovinos do lote." })
      setInsumoUsar(null)
      setLoteIdUsar("")
      setQtdUsar("")
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aplicar insumo")
    } finally {
      setUsando(false)
    }
  }

  // ── Histórico ────────────────────────────────────────────────────────────

  async function abrirHistorico(insumo: Insumo) {
    setMenuAberto(null)
    setInsumoHistorico(insumo)
    setLoadingHistorico(true)
    setHistorico([])
    try {
      const data = await getHistoricoInsumo(insumo.id)
      setHistorico(data)
    } catch {
      toast.error("Erro ao carregar histórico")
    } finally {
      setLoadingHistorico(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-24 w-full rounded-xl" />
      {[1, 2, 3].map(i => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">{insumos.length} {insumos.length === 1 ? "item cadastrado" : "itens cadastrados"}</p>
        </div>
        <button
          onClick={abrirCadastro}
          className="flex items-center gap-2 h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Insumo
        </button>
      </div>

      {/* Alerta */}
      {insumosEmAlerta.length > 0 && (
        <div className="rounded-xl shadow-md bg-destructive/5 border-l-4 border-l-destructive p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Atenção: Estoque Baixo</h3>
            <p className="text-sm text-muted-foreground">
              {insumosEmAlerta.length} {insumosEmAlerta.length === 1 ? "item precisa" : "itens precisam"} de reposição
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {insumosEmAlerta.map(i => (
                <Badge key={i.id} variant="outline" className={statusColor(i.status)}>{i.nome}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {insumos.length === 0 ? (
        <Empty icon={Package} title="Nenhum insumo cadastrado" description="Clique em Novo Insumo para começar" />
      ) : (
        <div className="space-y-3">
          {insumos.map(insumo => {
            const pct = insumo.nivelMinimo > 0
              ? Math.min((insumo.quantidadeAtual / insumo.nivelMinimo) * 100, 100)
              : 100
            const iconBg = insumo.status === "Crítico" ? "bg-destructive/10" : insumo.status === "Baixo" ? "bg-warning/10" : "bg-primary/10"
            const iconColor = insumo.status === "Crítico" ? "text-destructive" : insumo.status === "Baixo" ? "text-warning-foreground" : "text-primary"

            return (
              <Card key={insumo.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                      <TipoIcon tipo={insumo.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{insumo.nome}</h3>
                          <Badge variant="outline" className={`${statusColor(insumo.status)} shrink-0`}>{insumo.status}</Badge>
                        </div>
                        {/* Menu de ações */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setMenuAberto(menuAberto === insumo.id ? null : insumo.id)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {menuAberto === insumo.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-lg py-1 z-20">
                              <button
                                onClick={() => { setInsumoAdicionar(insumo); setQtdAdicionar(""); setMenuAberto(null) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <Plus className="w-4 h-4" /> Repor Estoque
                              </button>
                              <button
                                onClick={() => { setInsumoUsar(insumo); setLoteIdUsar(""); setQtdUsar(""); setMenuAberto(null) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <Droplets className="w-4 h-4" /> Usar Insumo
                              </button>
                              <button
                                onClick={() => abrirHistorico(insumo)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <History className="w-4 h-4" /> Histórico
                              </button>
                              <div className="my-1 h-px bg-border mx-2" />
                              <button
                                onClick={() => abrirEdicao(insumo)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <Pencil className="w-4 h-4" /> Editar
                              </button>
                              <button
                                onClick={() => handleExcluir(insumo)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {insumo.tipo} · {insumo.quantidadeAtual} {insumo.unidade}
                        {insumo.nivelMinimo > 0 && ` (mínimo: ${insumo.nivelMinimo} ${insumo.unidade})`}
                      </p>

                      {insumo.nivelMinimo > 0 && (
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${statusBarColor(insumo.status)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Validade: {insumo.validade ? new Date(insumo.validade).toLocaleDateString("pt-BR") : "Sem data"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Dialog: Cadastrar ──────────────────────────────────────────────── */}
      <Dialog open={modalCadastro} onOpenChange={setModalCadastro}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Novo Insumo</DialogTitle>
            <DialogDescription>Preencha os dados do insumo a ser cadastrado.</DialogDescription>
          </DialogHeader>
          <InsumoForm form={form} setForm={setForm} errors={errors} isEdit={false} />
          <DialogFooter>
            <button onClick={() => setModalCadastro(false)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={() => handleSalvar(false)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <><Spinner className="mr-2" />Salvando...</> : "Cadastrar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar ─────────────────────────────────────────────────── */}
      <Dialog open={!!insumoEdit} onOpenChange={() => setInsumoEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5" />Editar Insumo</DialogTitle>
            <DialogDescription>{insumoEdit?.nome}</DialogDescription>
          </DialogHeader>
          <InsumoForm form={form} setForm={setForm} errors={errors} isEdit={true} />
          <DialogFooter>
            <button onClick={() => setInsumoEdit(null)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={() => handleSalvar(true)} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <><Spinner className="mr-2" />Salvando...</> : "Salvar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Repor estoque ──────────────────────────────────────────── */}
      <Dialog open={!!insumoAdicionar} onOpenChange={() => setInsumoAdicionar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Repor Estoque</DialogTitle>
            <DialogDescription>{insumoAdicionar?.nome} — Atual: {insumoAdicionar?.quantidadeAtual} {insumoAdicionar?.unidade}</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-1">
            <label className="text-sm font-medium text-foreground">Quantidade a adicionar ({insumoAdicionar?.unidade})</label>
            <Input
              type="number" min="0.01" step="0.01"
              value={qtdAdicionar}
              onChange={e => setQtdAdicionar(e.target.value)}
              placeholder="Ex: 50"
              className="mt-1.5 h-14 text-xl font-bold text-center"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button onClick={() => setInsumoAdicionar(null)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdicionar} disabled={!qtdAdicionar || Number(qtdAdicionar) <= 0 || addingStock} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {addingStock ? <><Spinner className="mr-2" />Salvando...</> : "Adicionar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Usar insumo ───────────────────────────────────────────── */}
      <Dialog open={!!insumoUsar} onOpenChange={() => setInsumoUsar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplets className="w-5 h-5" />Usar Insumo</DialogTitle>
            <DialogDescription>{insumoUsar?.nome} — Disponível: {insumoUsar?.quantidadeAtual} {insumoUsar?.unidade}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 px-1">
            <div>
              <label className="text-sm font-medium text-foreground">Lote / Pasto</label>
              <select
                value={loteIdUsar}
                onChange={e => setLoteIdUsar(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione um lote</option>
                {pastos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.ocupacaoAtual} cabeças)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Quantidade utilizada ({insumoUsar?.unidade})</label>
              <Input
                type="number" min="0.01" step="0.01"
                value={qtdUsar}
                onChange={e => setQtdUsar(e.target.value)}
                placeholder="Ex: 10"
                className="mt-1.5 h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              O custo será calculado e distribuído automaticamente entre os bovinos do lote selecionado.
            </p>
          </div>
          <DialogFooter>
            <button onClick={() => setInsumoUsar(null)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleUsar} disabled={!loteIdUsar || !qtdUsar || Number(qtdUsar) <= 0 || usando} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {usando ? <><Spinner className="mr-2" />Aplicando...</> : "Aplicar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Histórico ─────────────────────────────────────────────── */}
      <Dialog open={!!insumoHistorico} onOpenChange={() => setInsumoHistorico(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" />Histórico de Uso</DialogTitle>
            <DialogDescription>{insumoHistorico?.nome}</DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {loadingHistorico ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : historico.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum uso registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {historico.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.loteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.dataUso).toLocaleDateString("pt-BR")} · {r.quantidadeUtilizada} {insumoHistorico?.unidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">R$ {r.custoTotal.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">R$ {r.valorUnitario.toFixed(2)}/{insumoHistorico?.unidade}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setInsumoHistorico(null)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay para fechar menu ao clicar fora */}
      {menuAberto && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(null)} />
      )}
    </div>
  )
}

// ─── Sub-componente: formulário ───────────────────────────────────────────────

interface InsumoFormProps {
  form: typeof EMPTY_FORM
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>
  errors: Partial<typeof EMPTY_FORM>
  isEdit: boolean
}

function InsumoForm({ form, setForm, errors, isEdit }: InsumoFormProps) {
  const f = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const inputCls = (field: keyof typeof EMPTY_FORM) =>
    `h-11 ${errors[field] ? "border-destructive focus-visible:ring-destructive" : ""}`

  return (
    <div className="space-y-3 py-2 px-1">
      <div>
        <label className="text-sm font-medium text-foreground">Nome *</label>
        <Input
          value={form.nome}
          onChange={e => f("nome")(e.target.value)}
          placeholder="Ex: Ivermectina 1%"
          className={`mt-1.5 ${inputCls("nome")}`}
        />
        {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">Tipo *</label>
          <select
            value={form.tipo}
            onChange={e => f("tipo")(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Unidade *</label>
          <select
            value={form.unidade}
            onChange={e => f("unidade")(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground">Qtd. inicial *</label>
            <Input
              type="number" min="0" step="0.01"
              value={form.quantidadeAtual}
              onChange={e => f("quantidadeAtual")(e.target.value)}
              placeholder="0"
              className={`mt-1.5 ${inputCls("quantidadeAtual")}`}
            />
            {errors.quantidadeAtual && <p className="text-xs text-destructive mt-1">{errors.quantidadeAtual}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Custo unitário (R$) *</label>
            <Input
              type="number" min="0.01" step="0.01"
              value={form.custoUnitario}
              onChange={e => f("custoUnitario")(e.target.value)}
              placeholder="0,00"
              className={`mt-1.5 ${inputCls("custoUnitario")}`}
            />
            {errors.custoUnitario && <p className="text-xs text-destructive mt-1">{errors.custoUnitario}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">Nível mínimo</label>
          <Input
            type="number" min="0" step="0.01"
            value={form.nivelMinimo}
            onChange={e => f("nivelMinimo")(e.target.value)}
            placeholder="0"
            className="mt-1.5 h-11"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Validade</label>
          <Input
            type="date"
            value={form.validade}
            onChange={e => f("validade")(e.target.value)}
            className="mt-1.5 h-11"
          />
        </div>
      </div>
    </div>
  )
}
