"use client"

import { useState } from "react"
import {
  User,
  Lock,
  Palette,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useStaffMe } from "@/components/staff/staff-context"
import StudentLoading from "@/components/student/student-loading"

function InfoField({ label, value, className }: { label: string; value: string; className?: string }) {
  const { text, textMuted } = useTeacherTheme()
  return (
    <div className={className}>
      <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{label}</p>
      <p className={cn("mt-1 text-sm font-medium break-words", text)}>{value}</p>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  children: React.ReactNode
}) {
  const { card, text, shadow, border } = useTeacherTheme()
  return (
    <div className={cn("rounded-2xl border p-5", card, border, shadow)}>
      <div className="mb-4 flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <h2 className={cn("text-base font-bold", text)}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function StaffSettingsPage() {
  const { theme, isDark, toggleTheme, card, text, textMuted, shadow, border } = useTeacherTheme()
  const { staff, loading } = useStaffMe()

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [passwordError, setPasswordError] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas")
      return
    }
    setChangingPassword(true)
    setPasswordStatus("idle")
    setPasswordError("")
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors du changement")
      setPasswordStatus("success")
      setPasswordForm({ newPassword: "", confirmPassword: "" })
      setTimeout(() => setPasswordStatus("idle"), 4000)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Erreur inconnue")
      setPasswordStatus("error")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      localStorage.removeItem("token")
      window.location.href = "/login"
    } catch {
      setLoggingOut(false)
    }
  }

  const passwordOk =
    passwordForm.newPassword.length >= 6 &&
    passwordForm.confirmPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword

  const fullName = staff
    ? `${staff.lastName} ${staff.firstName}`.replace(/\s+/g, " ").trim()
    : ""

  if (loading) return <StudentLoading variant="profile" />

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="pt-2 text-center lg:pt-4">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white lg:h-24 lg:w-24 lg:text-3xl">
          {staff?.firstName?.charAt(0)?.toUpperCase() || "P"}
        </div>
        <h1 className={cn("text-xl font-bold lg:text-2xl", text)}>{fullName || "Mon profil"}</h1>
        {staff?.roleLabel && <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>{staff.roleLabel}</p>}
        {staff?.year && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-indigo-600/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Session {staff.year}
            </span>
          </div>
        )}
      </div>

      {staff ? (
        <>
          <SectionCard icon={User} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-600" title="Informations">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoField label="Nom complet" value={fullName} className="sm:col-span-2" />
              <InfoField label="Email" value={staff.email || "—"} />
              <InfoField label="Téléphone" value={staff.phone || "—"} />
              <InfoField label="Fonction" value={staff.roleLabel} />
              {staff.school && <InfoField label="Établissement" value={staff.school} className="sm:col-span-2" />}
            </div>
          </SectionCard>

          <p className={cn("text-center text-xs lg:text-sm", textMuted)}>
            Pour modifier vos informations officielles, contactez l&apos;administration.
          </p>
        </>
      ) : (
        <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
          <p className={textMuted}>Impossible de charger le profil.</p>
        </div>
      )}

      <SectionCard icon={Lock} iconBg="bg-orange-50 dark:bg-orange-500/10" iconColor="text-orange-500" title="Sécurité">
        <p className={cn("mb-4 text-sm", textMuted)}>Changer mon mot de passe</p>
        <form onSubmit={handleChangePassword} className="space-y-4 lg:max-w-lg">
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>
              Nouveau mot de passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Au moins 6 caractères"
                className={cn("rounded-xl pr-10", isDark && "border-gray-700 bg-gray-800")}
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className={cn("absolute right-3 top-1/2 -translate-y-1/2", textMuted)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Retapez votre mot de passe"
                className={cn("rounded-xl pr-10", isDark && "border-gray-700 bg-gray-800")}
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={cn("absolute right-3 top-1/2 -translate-y-1/2", textMuted)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {passwordForm.newPassword && passwordForm.confirmPassword && !passwordOk && (
            <p className="text-sm text-red-500">Les mots de passe ne correspondent pas</p>
          )}
          {passwordStatus === "success" && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-500/10 dark:text-green-400">
              <Check className="h-4 w-4" /> Mot de passe modifié avec succès !
            </div>
          )}
          {passwordStatus === "error" && passwordError && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-500/10">{passwordError}</div>
          )}
          <button
            type="submit"
            disabled={!passwordOk || changingPassword}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {changingPassword ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>
      </SectionCard>

      <SectionCard icon={Palette} iconBg="bg-violet-50 dark:bg-violet-500/10" iconColor="text-violet-600" title="Apparence">
        <p className={cn("mb-4 text-sm", textMuted)}>Choisissez le thème de l&apos;interface</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toggleTheme("light")}
            className={cn("rounded-2xl border-2 p-4 text-left transition-all", theme === "light" ? "border-indigo-500 bg-indigo-50/50" : cn(card, border))}
          >
            <div className="mb-3 flex h-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <Sun className="h-6 w-6 text-amber-500" />
            </div>
            <p className={cn("text-sm font-semibold", theme === "light" ? "text-indigo-600" : text)}>Clair</p>
          </button>
          <button
            type="button"
            onClick={() => toggleTheme("dark")}
            className={cn("rounded-2xl border-2 p-4 text-left transition-all", theme === "dark" ? "border-indigo-500 bg-indigo-500/10" : cn(card, border))}
          >
            <div className="mb-3 flex h-12 items-center justify-center rounded-xl bg-gray-900 shadow-sm">
              <Moon className="h-6 w-6 text-indigo-300" />
            </div>
            <p className={cn("text-sm font-semibold", theme === "dark" ? "text-indigo-400" : text)}>Sombre</p>
          </button>
        </div>
      </SectionCard>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {loggingOut ? "Déconnexion..." : "Se déconnecter"}
      </button>
    </div>
  )
}
