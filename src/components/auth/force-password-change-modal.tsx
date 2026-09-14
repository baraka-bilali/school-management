"use client"

import { useState } from "react"
import { KeyRound, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import Portal from "@/components/portal"
import KelasiLogo from "@/components/kelasi-logo"
import {
  PasswordChangeFields,
  passwordsMatch,
  type PasswordChangeValues,
} from "@/components/auth/password-change-fields"
import { roleWelcomeLabel } from "@/lib/password-strength"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  userName?: string
  /** Rôle JWT (ELEVE, PROFESSEUR, ADMIN…) */
  role?: string
  /** Bouton Retour (ex. choix élève) */
  onBack?: () => void
  /** Après succès API — le parent gère la suite */
  onSuccess: () => void | Promise<void>
  className?: string
}

/**
 * Modale de changement de mot de passe (1ʳᵉ connexion / reset).
 * Utilisable pour tous les rôles.
 */
export function ForcePasswordChangeModal({
  open,
  userName,
  role,
  onBack,
  onSuccess,
  className,
}: Props) {
  const [values, setValues] = useState<PasswordChangeValues>({
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const isStudent = role === "ELEVE"
  const title = isStudent ? "Créez votre mot de passe" : "Sécurisez votre compte"
  const subtitle = userName
    ? `Bonjour ${userName} — première connexion à ${roleWelcomeLabel(role)}`
    : `Première connexion à ${roleWelcomeLabel(role)}`
  const canSubmit = passwordsMatch(values) && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordsMatch(values)) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      })
      let data: { error?: string } = {}
      try {
        data = await res.json()
      } catch {
        throw new Error("Erreur de communication")
      }
      if (!res.ok) throw new Error(data.error || "Erreur lors du changement")
      setValues({ newPassword: "", confirmPassword: "" })
      await onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Portal>
      <div
        className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-password-title"
      >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[32%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/35 blur-3xl"
        />

        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-white shadow-[0_28px_80px_-18px_rgba(67,56,202,0.55)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-sky-500 px-6 pb-7 pt-6 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.4), transparent 42%), radial-gradient(circle at 88% 8%, rgba(255,255,255,0.22), transparent 38%)",
              }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">
                    <Sparkles className="h-3 w-3" />
                    Kelasi 360
                  </p>
                  <h2 id="force-password-title" className="text-xl font-bold leading-tight">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-indigo-100/95">{subtitle}</p>
                </div>
              </div>
              <div className="hidden shrink-0 rounded-xl bg-white/95 p-1.5 shadow-sm sm:block">
                <KelasiLogo className="h-8 w-8 object-contain" />
              </div>
            </div>

            <div className="relative mt-5 flex items-start gap-2.5 rounded-2xl bg-white/10 px-3.5 py-3 text-sm text-indigo-50 ring-1 ring-white/15 backdrop-blur-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
              <p>
                Pour protéger votre espace scolaire, choisissez un mot de passe personnel avant de
                continuer.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <PasswordChangeFields values={values} onChange={setValues} variant="light" />

            <div className="flex gap-3 pt-1">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  Retour
                </button>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {loading ? "Enregistrement…" : "Enregistrer mon mot de passe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
