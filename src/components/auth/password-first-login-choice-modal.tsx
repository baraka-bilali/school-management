"use client"

import { ChevronRight, KeyRound, Lock, Shield, Sparkles } from "lucide-react"
import Portal from "@/components/portal"
import KelasiLogo from "@/components/kelasi-logo"

type Props = {
  open: boolean
  userName?: string
  onChooseChange: () => void
  onKeepCurrent: () => void
}

/** Première connexion élève : créer un MDP ou conserver le temporaire. */
export function PasswordFirstLoginChoiceModal({
  open,
  userName,
  onChooseChange,
  onKeepCurrent,
}: Props) {
  if (!open) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-choice-title"
      >
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/30 blur-3xl"
        />

        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-white shadow-[0_28px_80px_-18px_rgba(67,56,202,0.5)]">
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
                  <h2 id="password-choice-title" className="text-xl font-bold leading-tight">
                    Première connexion
                  </h2>
                  <p className="mt-1 text-sm text-indigo-100/95">
                    Bienvenue{userName ? `, ${userName}` : ""} !
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 rounded-xl bg-white/95 p-1.5 shadow-sm sm:block">
                <KelasiLogo className="h-8 w-8 object-contain" />
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6">
            <p className="text-sm leading-relaxed text-slate-600">
              Un mot de passe temporaire vous a été attribué par votre école. Vous pouvez le
              personnaliser maintenant, ou continuer et le modifier plus tard dans Paramètres.
            </p>

            <button
              type="button"
              onClick={onChooseChange}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 px-4 py-4 text-left transition hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 transition group-hover:bg-indigo-200">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Créer mon propre mot de passe</p>
                  <p className="text-xs text-slate-500">Recommandé pour votre sécurité</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-indigo-400 transition group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={onKeepCurrent}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/80 transition group-hover:bg-slate-200">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Garder le mot de passe actuel</p>
                  <p className="text-xs text-slate-500">Modifiable plus tard dans Paramètres</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
