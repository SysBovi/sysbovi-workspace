"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Bug, KeyRound, Settings } from "lucide-react"

export default function Suporte() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        <p className="text-muted-foreground">
          Ferramentas administrativas e diagnósticos
        </p>
      </div>

      {/* Logs */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Logs de erro</h2>
          </div>

          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Erro API - 14:32</li>
            <li>Falha login - 13:10</li>
          </ul>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Reset de senha</h2>
          </div>

          <Input placeholder="Email do usuário" />
          <button className="w-fit px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
            Resetar senha
          </button>
        </CardContent>
      </Card>

      {/* Parâmetros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Parâmetros</h2>
          </div>

          <Input placeholder="Curva Nelore" />
        </CardContent>
      </Card>

    </div>
  )
}