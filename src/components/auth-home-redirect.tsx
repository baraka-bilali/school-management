"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

function targetForRole(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin"
    case "ELEVE":
      return "/student"
    case "PROFESSEUR":
      return "/teacher"
    case "PARENT":
      return "/parent"
    case "ADMIN":
    case "CAISSIER":
      return "/admin"
    case "COMPTABLE":
    case "DIRECTEUR_DISCIPLINE":
    case "DIRECTEUR_ETUDES":
    case "DIRECTEUR_ADJOINT":
    case "SECRETAIRE":
    case "INTENDANT":
    case "SURVEILLANT_GENERAL":
    case "BIBLIOTHECAIRE":
    case "INFIRMIER":
    case "CONSEILLER_PEDAGOGIQUE":
      return "/staff"
    default:
      return "/login"
  }
}

/**
 * Si l'utilisateur est déjà connecté, redirige vers son espace.
 * N'affecte pas le HTML SSR (Google voit toujours la landing).
 */
export default function AuthHomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        const role = data.user?.role as string | undefined
        if (!role) return
        router.replace(targetForRole(role))
      } catch {
        /* stay on landing */
      }
    }
    void run()
  }, [router])

  return null
}
