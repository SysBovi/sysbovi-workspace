"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, Beef, Save } from "lucide-react"
import Link from "next/link"

type StatusSaudeApi = "SAUDAVEL" | "EM_TRATAMENTO" | "OBSERVACAO"

const STATUS_DISPLAY: Record<StatusSaudeApi, string> = {
  SAUDAVEL:      "Saudável",
  EM_TRATAMENTO: "Em Tratamento",
  OBSERVACAO:    "Observação",
}

const DISPLAY_TO_API: Record<string, StatusSaudeApi> = {
  "Saudável":      "SAUDAVEL",
  "Em Tratamento": "EM_TRATAMENTO",
  "Observação":    "OBSERVACAO",
}

export default function EditarBovino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { bovinos, pastos, updateBovino } = useData()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const bovino = bovinos.find(b => b.id === id)

  const [formData, setFormData] = useState({
    brinco:      "",
    raca:        "Nelore",
    statusSaude: "SAUDAVEL" as StatusSaudeApi,
    loteId:      null as string | null,
  })

  useEffect(() => {
    if (bovino) {
      setFormData({
        brinco:      bovino.brinco,
        raca:        bovino.raca,
        statusSaude: DISPLAY_TO_API[bovino.statusSaude] ?? "SAUDAVEL",
        loteId:      bovino.loteId ?? null,
      })
    }
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [bovino])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.brinco.trim()) e.brinco = "Código do brinco é obrigatório"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !bovino) return
    setIsSaving(true)
    try {
      await updateBovino(bovino.id, {
        brinco:      formData.brinco.trim(),
        raca:        formData.raca,
        statusSaude: formData.statusSaude,
        loteId:      formData.loteId,
      })
      toast.success("Bovino atualizado!", { description: `${formData.brinco} foi atualizado com sucesso` })
      router.push("/rebanho")
    } catch {
      toast.error("Erro ao atualizar bovino")
    } finally {
      setIsSaving(false)
    }
  }

  const selectClass = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-14 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <Card className="border-0 shadow-md"><CardContent className="p-6 space-y-4">
          <Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" />
        </CardContent></Card>
      </div>
    )
  }

  if (!bovino) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rebanho" className="p-2 rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-foreground">Bovino não encontrado</h1>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rebanho" className="p-2 rounded-xl hover:bg-accent transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Bovino</h1>
          <p className="text-muted-foreground">Altere os dados de {bovino.brinco}</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg"><Beef className="w-5 h-5 text-primary" />Dados do Animal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label htmlFor="brinco" className="text-sm font-medium text-foreground">Código do Brinco</label>
              <Input id="brinco" placeholder="Ex: BOV-009" value={formData.brinco}
                onChange={e => setFormData({ ...formData, brinco: e.target.value })}
                className={`h-14 text-base ${errors.brinco ? "border-destructive" : ""}`} />
              {errors.brinco && <span className="text-sm text-destructive">{errors.brinco}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Raça</label>
              <select value={formData.raca} onChange={e => setFormData({ ...formData, raca: e.target.value })} className={selectClass}>
                <option value="Nelore">Nelore</option>
                <option value="Angus">Angus</option>
                <option value="Brahman">Brahman</option>
                <option value="Senepol">Senepol</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status de Saúde</label>
              <select value={formData.statusSaude}
                onChange={e => setFormData({ ...formData, statusSaude: e.target.value as StatusSaudeApi })}
                className={selectClass}>
                {(Object.keys(STATUS_DISPLAY) as StatusSaudeApi[]).map(k => (
                  <option key={k} value={k}>{STATUS_DISPLAY[k]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Pasto / Lote</label>
              <select value={formData.loteId ?? ""}
                onChange={e => setFormData({ ...formData, loteId: e.target.value || null })}
                className={selectClass}>
                <option value="">Sem pasto atribuído</option>
                {pastos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.ocupacaoAtual}/{p.capacidade} cabeças)
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={isSaving}
              className="w-full h-14 text-lg font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isSaving ? <><Spinner className="mr-2" />Salvando...</> : <><Save className="w-5 h-5" />Salvar Alterações</>}
            </button>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
