"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ArrowLeft, Beef, Save } from "lucide-react"
import Link from "next/link"

export default function NovoBovino() {
  const router = useRouter()
  const { addBovino, pastos } = useData()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    brinco: "",
    raca: "Nelore",
    sexo: "M" as "M" | "F",
    peso: "",
    dataNascimento: "",
    loteId: "",
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.brinco) newErrors.brinco = "Código do brinco é obrigatório"
    if (!formData.peso || parseFloat(formData.peso) <= 0) newErrors.peso = "Peso deve ser maior que zero"
    if (!formData.dataNascimento) newErrors.dataNascimento = "Data de nascimento é obrigatória"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await addBovino({
        brinco: formData.brinco,
        raca: formData.raca,
        sexo: formData.sexo,
        dataNascimento: formData.dataNascimento,
        pesoEntrada: parseFloat(formData.peso),
        loteId: formData.loteId || undefined,
      })
      toast.success("Bovino cadastrado!", { description: `${formData.brinco} adicionado com sucesso` })
      router.push("/rebanho")
    } catch {
      toast.error("Erro ao cadastrar", { description: "Verifique os dados e tente novamente" })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `h-14 text-base ${errors[field] ? "border-destructive" : ""}`

  const selectClass = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-14 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/rebanho" className="p-2 rounded-xl hover:bg-accent transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Bovino</h1>
          <p className="text-muted-foreground">Cadastre um novo animal no rebanho</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Beef className="w-5 h-5 text-primary" />
            Dados do Animal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="brinco" className="text-sm font-medium text-foreground">Código do Brinco</label>
              <Input id="brinco" placeholder="Ex: BOV-009" value={formData.brinco}
                onChange={(e) => setFormData({ ...formData, brinco: e.target.value })}
                className={inputClass("brinco")} />
              {errors.brinco && <span className="text-sm text-destructive">{errors.brinco}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Raça</label>
                <select value={formData.raca} onChange={(e) => setFormData({ ...formData, raca: e.target.value })} className={selectClass}>
                  <option value="Nelore">Nelore</option>
                  <option value="Angus">Angus</option>
                  <option value="Brahman">Brahman</option>
                  <option value="Senepol">Senepol</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Sexo</label>
                <select value={formData.sexo} onChange={(e) => setFormData({ ...formData, sexo: e.target.value as "M" | "F" })} className={selectClass}>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="peso" className="text-sm font-medium text-foreground">Peso Atual (kg)</label>
              <Input id="peso" type="number" placeholder="Ex: 280" value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                className={inputClass("peso")} />
              {errors.peso && <span className="text-sm text-destructive">{errors.peso}</span>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dataNascimento" className="text-sm font-medium text-foreground">Data de Nascimento</label>
              <Input id="dataNascimento" type="date" value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                className={inputClass("dataNascimento")} />
              {errors.dataNascimento && <span className="text-sm text-destructive">{errors.dataNascimento}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Lote / Pasto (opcional)</label>
              <select value={formData.loteId} onChange={(e) => setFormData({ ...formData, loteId: e.target.value })} className={selectClass}>
                <option value="">Sem lote (chegando)</option>
                {pastos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.ocupacaoAtual}/{p.capacidade} cabeças)</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-14 text-lg font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {isLoading ? <><Spinner className="mr-2" />Salvando...</> : <><Save className="w-5 h-5" />Cadastrar Bovino</>}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
