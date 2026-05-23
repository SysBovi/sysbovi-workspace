"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Beef, Eye, EyeOff, User, Lock } from "lucide-react"

export default function LoginPage() {
  const { login, isLoading } = useAuth()
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
    else if (password.length < 6) newErrors.password = "Senha deve ter pelo menos 6 caracteres"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const success = await login(email, password)
    if (success) {
      toast.success("Login realizado!", { description: "Bem-vindo ao SYSBOVI" })
      router.replace("/home")
    } else {
      toast.error("Falha no login", { description: "Email ou senha incorretos" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-primary/10 to-background">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Beef className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">SYSBOVI</h1>
        <p className="text-muted-foreground text-center">Gestão Inteligente de Gado de Corte</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border-0 overflow-hidden">
        <div className="p-6 pb-2 text-center">
          <h2 className="text-xl font-semibold text-foreground">Entrar no Sistema</h2>
          <p className="text-sm text-muted-foreground mt-1">Use suas credenciais de acesso</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-12 text-base ${errors.email ? "border-destructive" : ""}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="text-sm text-destructive">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-12 h-12 text-base ${errors.password ? "border-destructive" : ""}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <span className="text-sm text-destructive">{errors.password}</span>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <><Spinner className="mr-2" />Entrando...</> : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = "/admin-login"}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Acesso administrativo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
