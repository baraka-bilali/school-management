"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Vérifier l'authentification via l'API
        const res = await fetch("/api/auth/me", { credentials: "include" })
        
        if (res.ok) {
          const data = await res.json()
          const role = data.user?.role
          
          // Rediriger selon le rôle
          if (role === "SUPER_ADMIN") {
            router.replace("/super-admin")
          } else if (role === "ELEVE") {
            router.replace("/student")
          } else if (role === "ADMIN" || role === "COMPTABLE" || role === "DIRECTEUR_DISCIPLINE" || role === "DIRECTEUR_ETUDES") {
            router.replace("/admin")
          } else {
            router.replace("/login")
          }
        } else {
          // Non authentifié, rediriger vers login
          router.replace("/login")
        }
      } catch {
        // Fallback: essayer avec le token localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          router.replace("/login")
          return
        }
        
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
            localStorage.removeItem("token")
            router.replace("/login")
            return
          }
          
          // Rediriger selon le rôle
          if (payload.role === "SUPER_ADMIN") {
            router.replace("/super-admin")
          } else if (payload.role === "ELEVE") {
            router.replace("/student")
          } else {
            router.replace("/admin")
          }
        } catch {
          localStorage.removeItem("token")
          router.replace("/login")
        }
      } finally {
        setChecking(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  // Afficher un loader pendant la vérification
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return null
}
