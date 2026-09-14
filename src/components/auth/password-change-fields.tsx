"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getPasswordStrength } from "@/lib/password-strength"

export type PasswordChangeValues = {
  newPassword: string
  confirmPassword: string
}

type Props = {
  values: PasswordChangeValues
  onChange: (next: PasswordChangeValues) => void
  /** Surfaces claires (modale login) vs thèmes sombre possibles (paramètres) */
  variant?: "light" | "themed"
  className?: string
  idPrefix?: string
}

export function passwordsMatch(values: PasswordChangeValues) {
  return (
    values.newPassword.length >= 6 &&
    values.confirmPassword.length >= 6 &&
    values.newPassword === values.confirmPassword
  )
}

export function PasswordChangeFields({
  values,
  onChange,
  variant = "light",
  className,
  idPrefix = "pwd",
}: Props) {
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const strength = useMemo(() => getPasswordStrength(values.newPassword), [values.newPassword])
  const match =
    values.confirmPassword.length > 0 && values.newPassword === values.confirmPassword
  const mismatch =
    values.confirmPassword.length > 0 && values.newPassword !== values.confirmPassword

  const labelCls =
    variant === "light"
      ? "mb-2 block text-sm font-medium text-slate-700"
      : "mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400"
  const hintCls =
    variant === "light" ? "text-xs text-slate-500" : "text-xs text-gray-500 dark:text-gray-400"
  const eyeCls =
    variant === "light"
      ? "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600"
      : "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-indigo-500"

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <label htmlFor={`${idPrefix}-new`} className={labelCls}>
          Nouveau mot de passe <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input
            id={`${idPrefix}-new`}
            lightSurface={variant === "light"}
            type={showNew ? "text" : "password"}
            value={values.newPassword}
            onChange={(e) => onChange({ ...values, newPassword: e.target.value })}
            className={cn(
              "w-full rounded-xl pr-10",
              variant === "themed" && "dark:border-gray-700 dark:bg-gray-800"
            )}
            placeholder="Au moins 6 caractères"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className={eyeCls}
            aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {values.newPassword.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
              <div
                className={cn("h-full rounded-full transition-all duration-300", strength.barClass)}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <p className={cn("text-xs font-medium", strength.colorClass)}>
              Sécurité : {strength.label}
            </p>
            <ul className={cn("grid grid-cols-1 gap-1 sm:grid-cols-2", hintCls)}>
              <Hint ok={values.newPassword.length >= 6}>6 caractères minimum</Hint>
              <Hint ok={/[A-Z]/.test(values.newPassword) && /[a-z]/.test(values.newPassword)}>
                Majuscules et minuscules
              </Hint>
              <Hint ok={/\d/.test(values.newPassword)}>Au moins un chiffre</Hint>
              <Hint ok={/[^A-Za-z0-9]/.test(values.newPassword)}>Un caractère spécial</Hint>
            </ul>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-confirm`} className={labelCls}>
          Confirmer le mot de passe <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input
            id={`${idPrefix}-confirm`}
            lightSurface={variant === "light"}
            type={showConfirm ? "text" : "password"}
            value={values.confirmPassword}
            onChange={(e) => onChange({ ...values, confirmPassword: e.target.value })}
            className={cn(
              "w-full rounded-xl pr-10",
              match && "border-emerald-400 focus-visible:ring-emerald-500/30",
              mismatch && "border-rose-400 focus-visible:ring-rose-500/30",
              variant === "themed" && "dark:border-gray-700 dark:bg-gray-800"
            )}
            placeholder="Retapez votre mot de passe"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className={eyeCls}
            aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mismatch && (
          <p className="mt-1.5 text-sm text-rose-600">Les mots de passe ne correspondent pas</p>
        )}
        {match && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-3.5 w-3.5" /> Les mots de passe correspondent
          </p>
        )}
      </div>
    </div>
  )
}

function Hint({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={cn("flex items-center gap-1.5", ok ? "text-emerald-600" : undefined)}>
      {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0 opacity-40" />}
      <span>{children}</span>
    </li>
  )
}
