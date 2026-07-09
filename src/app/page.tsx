"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SplashScreen, { SPLASH_SESSION_KEY } from "@/components/splash-screen"

/** Durée minimale d'affichage de l'animation de démarrage. */
const MIN_SPLASH_MS = 2600
/** Durée du fondu de sortie (doit correspondre à .splash-leaving dans globals.css). */
const SPLASH_FADE_MS = 450

export default function Home() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [splashDone, setSplashDone] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const resolveTarget = async (): Promise<string> => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          const role = data.user?.role
          if (role === "SUPER_ADMIN") return "/super-admin"
          if (role === "ELEVE") return "/student"
          if (role === "PROFESSEUR") return "/teacher"
          if (
            role === "ADMIN" ||
            role === "COMPTABLE" ||
            role === "DIRECTEUR_DISCIPLINE" ||
            role === "DIRECTEUR_ETUDES" ||
            role === "CAISSIER"
          ) {
            return "/admin"
          }
          return "/login"
        }
        return "/login"
      } catch {
        const token = localStorage.getItem("token")
        if (!token) return "/login"
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
            localStorage.removeItem("token")
            return "/login"
          }
          if (payload.role === "SUPER_ADMIN") return "/super-admin"
          if (payload.role === "ELEVE") return "/student"
          if (payload.role === "PROFESSEUR") return "/teacher"
          return "/admin"
        } catch {
          localStorage.removeItem("token")
          return "/login"
        }
      }
    }

    void resolveTarget().then(setRedirectTo)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!redirectTo || !splashDone) return
    setLeaving(true)
    // L'animation a déjà été vue : la page login ne la rejouera pas.
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "1")
    } catch {}
    const timer = setTimeout(() => router.replace(redirectTo), SPLASH_FADE_MS)
    return () => clearTimeout(timer)
  }, [redirectTo, splashDone, router])

  return <SplashScreen leaving={leaving} />
}
