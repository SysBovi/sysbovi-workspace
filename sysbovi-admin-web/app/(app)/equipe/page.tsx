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
import { Users, UserPlus, Search, Trash2, Stethoscope, GraduationCap, Leaf, Wrench, Phone, Mail } from "lucide-react"
import type { Especialista } from "@/lib/data-context"

const tipoIcons: Record<string, any> = {
  Veterinario: Stethoscope, Zootecnista: GraduationCap, Agronomo: Leaf, Tecnico: Wrench,
}
const tipoColors: Record<string, string> = {
  Veterinario: "bg-primary/10 text-primary border-primary/20",
  Zootecnista: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  Agronomo: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  Tecnico: "bg-chart-4/10 text-chart-4 border-chart-4/20",
}

export default function EquipePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { especialistasVinculados, especialistasDisponiveis, vincularEspecialista, desvincularEspecialista } = useData()
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<Especialista | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (user && user.role !== "UE" && user.role !== "UA") { router.replace("/home"); return }
    const t = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(t)
  }, [user, router])

  const filtered = especialistasDisponiveis.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.tipo.toLowerCase().includes(search.toLowerCase())
  )

  const handleVincular = (esp: Especialista) => {
    setIsAdding(true)
    vincularEspecialista(esp.id)
    toast.success("Especialista vinculado!", { description: `${esp.nome} foi adicionado à sua equipe` })
    setIsAdding(false)
    setShowAdd(false)
    setSearch("")
  }

  const handleDesvincular = () => {
    if (!removeConfirm) return
    setIsRemoving(true)
    desvincularEspecialista(removeConfirm.id)
    toast.success("Vínculo removido", { description: `${removeConfirm.nome} foi removido da sua equipe` })
    setIsRemoving(false)
    setRemoveConfirm(null)
  }

  if (user?.role !== "UE" && user?.role !== "UA") return null

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-32" /></div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      {[1,2].map(i => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex items-center gap-4"><Skeleton className="w-14 h-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></div><Skeleton className="w-10 h-10 rounded-lg" /></div>
      </CardContent></Card>)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">{especialistasVinculados.length} especialistas vinculados</p>
        </div>
        <button className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors" onClick={() => setShowAdd(true)}>
          <UserPlus className="w-7 h-7" />
        </button>
      </div>

      {especialistasVinculados.length === 0 ? (
        <Empty icon={Users} title="Nenhum especialista vinculado" description="Adicione especialistas para colaborar na gestão da sua fazenda"
          action={<button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium" onClick={() => setShowAdd(true)}><UserPlus className="w-4 h-4" />Adicionar Especialista</button>} />
      ) : (
        <div className="space-y-3">
          {especialistasVinculados.map((esp) => {
            const Icon = tipoIcons[esp.tipo]
            return (
              <Card key={esp.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
                      {esp.avatar || esp.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground">{esp.nome}</h3>
                        <Badge variant="outline" className={tipoColors[esp.tipo]}>
                          <Icon className="w-3 h-3 mr-1" />{esp.tipo}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{esp.email}</span>
                        {esp.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{esp.telefone}</span>}
                      </div>
                    </div>
                    <button className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setRemoveConfirm(esp)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal adicionar */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Adicionar Especialista</DialogTitle>
            <DialogDescription>Busque e vincule especialistas cadastrados no sistema</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email ou tipo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum especialista disponível</p>
                </div>
              ) : filtered.map((esp) => {
                const Icon = tipoIcons[esp.tipo]
                return (
                  <div key={esp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                      {esp.avatar || esp.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{esp.nome}</span>
                        <Badge variant="outline" className={`text-xs ${tipoColors[esp.tipo]}`}><Icon className="w-3 h-3 mr-1" />{esp.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{esp.email}</p>
                    </div>
                    <button onClick={() => handleVincular(esp)} disabled={isAdding}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1">
                      {isAdding ? <Spinner className="w-4 h-4" /> : "Vincular"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAdd(false)} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-accent transition-colors">Fechar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de remoção */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover {removeConfirm?.nome} da sua equipe? Esta ação não deleta o usuário do sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesvincular} disabled={isRemoving}
              className="bg-destructive text-white hover:bg-destructive/90">
              {isRemoving ? <><Spinner className="mr-2" />Removendo...</> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
