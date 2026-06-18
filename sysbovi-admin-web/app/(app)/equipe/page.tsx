"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Users, UserPlus, Trash2, Stethoscope, GraduationCap, Leaf, Wrench, Phone, Mail } from "lucide-react"
import type { MembroEquipe, TipoMembro } from "@/lib/data-context"

const TIPO_ICONS: Record<TipoMembro, any> = {
  VETERINARIO: Stethoscope,
  ZOOTECNISTA: GraduationCap,
  AGRONOMO:    Leaf,
  TECNICO:     Wrench,
}

const TIPO_LABELS: Record<TipoMembro, string> = {
  VETERINARIO: "Veterinário",
  ZOOTECNISTA: "Zootecnista",
  AGRONOMO:    "Agrônomo",
  TECNICO:     "Técnico",
}

const TIPO_COLORS: Record<TipoMembro, string> = {
  VETERINARIO: "bg-primary/10 text-primary border-primary/20",
  ZOOTECNISTA: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  AGRONOMO:    "bg-chart-3/10 text-chart-3 border-chart-3/20",
  TECNICO:     "bg-chart-4/10 text-chart-4 border-chart-4/20",
}

const TIPOS: TipoMembro[] = ["VETERINARIO", "ZOOTECNISTA", "AGRONOMO", "TECNICO"]

const EMPTY_FORM = { nome: "", email: "", tipo: "VETERINARIO" as TipoMembro, telefone: "" }

export default function EquipePage() {
  const { user, canAccessEquipe } = useAuth()
  const router = useRouter()
  const { membrosEquipe, adicionarMembroEquipe, removerMembroEquipe } = useData()

  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({})
  const [saving, setSaving] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<MembroEquipe | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (user && !canAccessEquipe) { router.replace("/home"); return }
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [user, canAccessEquipe, router])

  function validar() {
    const e: Partial<typeof EMPTY_FORM> = {}
    if (!form.nome.trim())  e.nome  = "Nome obrigatório"
    if (!form.email.trim()) e.email = "Email obrigatório"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleAdicionar() {
    if (!validar()) return
    setSaving(true)
    try {
      await adicionarMembroEquipe({
        nome:     form.nome.trim(),
        email:    form.email.trim(),
        tipo:     form.tipo,
        telefone: form.telefone.trim() || undefined,
      })
      toast.success("Membro adicionado!", { description: `${form.nome} foi adicionado à equipe` })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setErrors({})
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao adicionar membro")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemover() {
    if (!removeConfirm) return
    setRemoving(true)
    try {
      await removerMembroEquipe(removeConfirm.id)
      toast.success("Membro removido", { description: `${removeConfirm.nome} foi removido da equipe` })
      setRemoveConfirm(null)
    } catch {
      toast.error("Erro ao remover membro")
    } finally {
      setRemoving(false)
    }
  }

  if (!canAccessEquipe) return null

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-14 w-14 rounded-xl" />
      </div>
      {[1, 2].map(i => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></div>
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">{membrosEquipe.length} {membrosEquipe.length === 1 ? "membro" : "membros"} na equipe</p>
        </div>
        {(user?.role === "UP" || user?.role === "UE") && (
          <button
            className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            onClick={() => setShowAdd(true)}
          >
            <UserPlus className="w-7 h-7" />
          </button>
        )}
      </div>

      {membrosEquipe.length === 0 ? (
        <Empty
          icon={Users}
          title="Nenhum membro na equipe"
          description="Adicione veterinários, zootecnistas e outros profissionais"
          action={
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              onClick={() => setShowAdd(true)}
            >
              <UserPlus className="w-4 h-4" />Adicionar Membro
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {membrosEquipe.map(membro => {
            const Icon = TIPO_ICONS[membro.tipo]
            return (
              <Card key={membro.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
                      {membro.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground">{membro.nome}</h3>
                        <Badge variant="outline" className={TIPO_COLORS[membro.tipo]}>
                          <Icon className="w-3 h-3 mr-1" />{TIPO_LABELS[membro.tipo]}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{membro.email}</span>
                        {membro.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{membro.telefone}</span>}
                      </div>
                    </div>
                    {user?.role === "UP" && (
                      <button
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => setRemoveConfirm(membro)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Adicionar */}
      <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) { setForm(EMPTY_FORM); setErrors({}) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Adicionar Membro</DialogTitle>
            <DialogDescription>Cadastre um novo profissional na equipe da fazenda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 px-1">
            <div>
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <Input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Dr. João Silva"
                className={`mt-1.5 h-11 ${errors.nome ? "border-destructive" : ""}`}
              />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="joao@clinicavet.com"
                className={`mt-1.5 h-11 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoMembro }))}
                  className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <Input
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(65) 99999-9999"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAdd(false)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleAdicionar} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <><Spinner className="mr-1" />Salvando...</> : "Adicionar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de remoção */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removeConfirm?.nome}</strong> da equipe?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemover} disabled={removing} className="bg-destructive hover:bg-destructive/90">
              {removing ? <><Spinner className="mr-1" />Removendo...</> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
