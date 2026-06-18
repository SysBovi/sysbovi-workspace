"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Beef, Eye, EyeOff, Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const { loginAdmin, isLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) newErrors.email = "Email é obrigatório"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email inválido"

    if (!password) newErrors.password = "Senha é obrigatória"
    else if (password.length < 3) newErrors.password = "Mínimo 3 caracteres"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return

    const success = await loginAdmin(email, password)

    if (success) {
      toast.success("Login realizado!", { description: "Bem-vindo, Super Admin" })
      router.replace("/home")
    } else {
      toast.error("Falha no login", { description: "Email ou senha incorretos" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-linear-to-b from-primary/10 to-background">
      
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Beef className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">SYSBOVI</h1>
        <p className="text-muted-foreground text-center">Painel Administrativo</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border-0 overflow-hidden">
        <div className="p-6 pb-2 text-center">
          <h2 className="text-xl font-semibold text-foreground">Acesso Administrativo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Somente usuários autorizados
          </p>
        </div>

        <div className="p-6 space-y-5">

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@sysbovi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 h-12 ${errors.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && <span className="text-sm text-destructive">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 pr-12 h-12 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <span className="text-sm text-destructive">{errors.password}</span>}
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <><Spinner />Entrando...</> : "Entrar como Admin"}
          </button>

          {/* Voltar */}
          <div className="text-center mt-4">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Voltar para login padrão
            </button>
          </div>

          {/* Aviso */}
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Área restrita do sistema SYSBOVI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}