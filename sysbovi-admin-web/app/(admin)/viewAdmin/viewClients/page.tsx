"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ShieldCheck, ShieldX } from "lucide-react"

export default function Clientes() {
  const [clientes, setClientes] = useState([
    { id: 1, nome: "Fazenda Boa Vista", plano: "Premium", status: "ativo" },
    { id: 2, nome: "Fazenda Santa Luzia", plano: "Comum", status: "bloqueado" },
  ])

  const toggleStatus = (id: number) => {
    setClientes(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === "ativo" ? "bloqueado" : "ativo" }
          : c
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie clientes e acessos do sistema
        </p>
      </div>

      <div className="space-y-3">
        {clientes.map((c) => (
          <Card
            key={c.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex items-center justify-between">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">{c.nome}</h3>
                  <p className="text-sm text-muted-foreground">{c.plano}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    c.status === "ativo"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }
                >
                  {c.status === "ativo" ? (
                    <ShieldCheck className="w-3 h-3 mr-1" />
                  ) : (
                    <ShieldX className="w-3 h-3 mr-1" />
                  )}
                  {c.status}
                </Badge>

                <button
                  onClick={() => toggleStatus(c.id)}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                >
                  Alternar
                </button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}