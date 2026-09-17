"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import KelasiLogo from "@/components/kelasi-logo"
import LoginAmbientBackground from "@/components/login-ambient-background"
import { Mail, Lock, Eye, EyeOff, LogIn, LifeBuoy, MessageCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"

export default function SuperAdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Thème calqué sur les préférences de l'appareil (comme /login)
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = (dark: boolean) => {
      setIsDark(dark)
      document.documentElement.classList.toggle("dark", dark)
    }
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur inconnue")
      if (data.token) {
        localStorage.setItem("token", data.token)
        localStorage.removeItem("schoolName")
        const payload = JSON.parse(atob(data.token.split(".")[1]))
        if (payload.role !== "SUPER_ADMIN") {
          setError("Accès réservé au Super Admin")
          setLoading(false)
          return
        }
        localStorage.setItem("user", JSON.stringify({
          name: payload.name || data.user?.nom || "Super Admin",
          email: payload.email || "",
        }))
        await new Promise(resolve => setTimeout(resolve, 800))
        router.push("/super-admin")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
<<<<<<< Updated upstream
    <div className="login-shell relative isolate flex w-full items-center justify-center overflow-hidden bg-gray-50 px-6 py-8">
      <div className="w-full max-w-md min-w-0">
        <div className="flex flex-col items-center mb-4">
          <div className="mb-3">
            <KelasiLogo variant="light" priority className="h-36 w-36 sm:h-44 sm:w-44 object-contain drop-shadow-md" />
=======
    <div className="login-shell relative isolate flex w-full items-center justify-center overflow-hidden bg-[#eef2f9] px-6 py-8 transition-colors dark:bg-gray-900">
      <LoginAmbientBackground isDark={isDark} />
      <div className="relative z-10 w-full max-w-md min-w-0">
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-2">
            <KelasiLogo variant="light" priority className="h-28 w-28 object-contain drop-shadow-md sm:h-32 sm:w-32" />
>>>>>>> Stashed changes
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Super Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connexion réservée —{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">Kelasi 360</span>
          </p>
        </div>

        <Card theme={isDark ? "dark" : "light"} className="shadow-lg backdrop-blur-[2px]">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    type="email"
                    name="email"
                    placeholder="vous@exemple.com"
                    className="pl-10"
                    required
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              )}
              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-6 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <LifeBuoy className="h-3.5 w-3.5" />
              Support technique
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href="https://wa.me/243980139630"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                +243 980 139 630
              </a>
              <a
                href="https://wa.me/243826245169"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                +243 826 245 169
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Créé par{" "}
            <a
              href="https://digicreateam.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              digicreateam
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
