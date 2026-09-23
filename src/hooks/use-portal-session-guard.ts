"use client"

import { useEffect } from "react"
import { getStoredTokenExpiryMs, redirectToLogin } from "@/lib/redirect-to-login"

const PORTAL_ROLES = new Set(["ELEVE", "PROFESSEUR", "PARENT"])

/**
 * Enseignant / élève / parent : dès que le JWT expire ou que
 * l'abonnement de l'école est terminé, retour automatique au login
 * (même si l'utilisateur reste sur la page sans naviguer).
 */
export function usePortalSessionGuard() {
  useEffect(() => {
    let cancelled = false
    let expiryTimer: number | undefined

    const kickIfTokenExpired = () => {
      const exp = getStoredTokenExpiryMs()
      if (exp == null) return false
      if (Date.now() >= exp) {
        redirectToLogin()
        return true
      }
      return false
    }

    const scheduleExpiry = () => {
      const exp = getStoredTokenExpiryMs()
      if (exp == null) return
      window.clearTimeout(expiryTimer)
      const delay = Math.max(0, exp - Date.now() + 200)
      expiryTimer = window.setTimeout(() => {
        if (!cancelled) redirectToLogin()
      }, delay)
    }

    const checkSession = async () => {
      if (cancelled) return
      if (kickIfTokenExpired()) return
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        })
        if (cancelled) return
        if (res.status === 401) {
          redirectToLogin()
          return
        }
        if (!res.ok) return
        const data = (await res.json()) as {
          user?: { role?: string }
          subscription?: { expired?: boolean }
        }
        const role = data.user?.role
        if (role && PORTAL_ROLES.has(role) && data.subscription?.expired === true) {
          redirectToLogin()
        }
      } catch {
        /* réseau : ne pas déconnecter */
      }
    }

    scheduleExpiry()
    void checkSession()

    const interval = window.setInterval(() => {
      void checkSession()
    }, 20_000)

    const onVisible = () => {
      if (document.visibilityState === "visible") void checkSession()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)

    return () => {
      cancelled = true
      window.clearTimeout(expiryTimer)
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [])
}
