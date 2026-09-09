"use client"

import { AlertCircle } from "lucide-react"

type Theme = "light" | "dark"

type Props = {
  theme?: Theme
  /** Affiche immédiatement Suspendu / Expiré depuis le cache client */
  blockedHint?: boolean
  statusLabel?: "Suspendu" | "Expiré" | null
  schoolName?: string | null
  dateFinAbonnement?: string | null
}

export default function SubscriptionSkeleton({
  theme = "light",
  blockedHint = false,
  statusLabel = null,
  schoolName = null,
  dateFinAbonnement = null,
}: Props) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const card = theme === "dark" ? "bg-gray-800" : "bg-white"
  const tabsBg = theme === "dark" ? "bg-gray-900" : "bg-gray-100"
  const text = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const label = statusLabel ?? (blockedHint ? "Suspendu" : null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className={`text-2xl md:text-3xl font-bold ${text}`}>Abonnement</h1>
        <p className={textSecondary}>Consultez l&apos;état de votre accès Kelasi 360</p>
      </div>

      <div className={`flex gap-1 rounded-xl p-1 ${tabsBg}`}>
        <div className={`h-10 flex-1 rounded-lg ${card} shadow flex items-center justify-center text-sm font-medium ${text}`}>
          Vue d&apos;ensemble
        </div>
        <div className={`h-10 flex-1 rounded-lg opacity-60 flex items-center justify-center text-sm ${textSecondary}`}>
          Journal des paiements
        </div>
      </div>

      <div className={`rounded-2xl border ${border} ${card} overflow-hidden`}>
        <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${border}`}>
          {schoolName ? (
            <h2 className={`text-base sm:text-lg font-semibold truncate ${text}`}>{schoolName}</h2>
          ) : (
            <div className="h-5 w-48 shimmer-bg rounded-md" />
          )}
          {label ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/15 text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              {label}
            </span>
          ) : (
            <div className="h-6 w-16 shimmer-bg rounded-full" />
          )}
        </div>
        <div className="flex items-center gap-5 px-5 py-6">
          <div
            className={`h-[88px] w-[88px] rounded-full shrink-0 flex items-center justify-center border-4 ${
              blockedHint
                ? "border-red-500/40 text-red-500"
                : "shimmer-bg border-transparent"
            }`}
          >
            {blockedHint ? (
              <AlertCircle className="h-7 w-7" />
            ) : null}
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <p className={`text-sm ${textSecondary}`}>Date d&apos;expiration</p>
            {dateFinAbonnement ? (
              <p className={`text-2xl font-semibold tracking-tight tabular-nums ${text}`}>
                {dateFinAbonnement.length >= 10 ? dateFinAbonnement.slice(0, 10) : dateFinAbonnement}
              </p>
            ) : (
              <div className="h-7 w-36 shimmer-bg rounded-md" />
            )}
            <div className="h-4 w-40 shimmer-bg rounded opacity-70" />
          </div>
        </div>
        <div className={`px-5 py-4 border-t ${border}`}>
          <div className="h-4 w-32 shimmer-bg rounded mb-2" />
          <div className="h-3 w-64 shimmer-bg rounded" />
        </div>
      </div>

      {blockedHint && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            theme === "dark" ? "bg-red-950/30 border-red-800/50" : "bg-red-50 border-red-200"
          }`}
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`text-sm font-semibold ${theme === "dark" ? "text-red-300" : "text-red-800"}`}>
              Accès aux fonctionnalités suspendu
            </p>
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-red-400" : "text-red-700"}`}>
              Contactez Kelasi 360 pour réactiver votre abonnement. Les paramètres restent accessibles.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
