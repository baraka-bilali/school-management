"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  HeartPulse,
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
  Users,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"

interface StudentInfo {
  lastName: string
  middleName: string
  firstName: string
  code: string
  gender: string
  birthDate: string
  birthPlace?: string
  nationality?: string
  address?: string
  parentName1?: string
  parentPhone1?: string
  parentJob1?: string
  parentEmail1?: string
  parentName2?: string
  parentPhone2?: string
  parentJob2?: string
  parentEmail2?: string
  bloodGroup?: string
  allergies?: string
  medicalNotes?: string
  emergencyContact?: string
  emergencyPhone?: string
  email: string
  class?: string
  year?: string
}

function InfoField({ label, value, className }: { label: string; value: string; className?: string }) {
  const { text, textMuted } = useStudentTheme()
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
  const { card, text, shadow, border } = useStudentTheme()
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

export default function StudentSettingsPage() {
  const router = useRouter()
  const { theme, isDark, toggleTheme, card, text, textMuted, shadow, border } = useStudentTheme()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [passwordError, setPasswordError] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch("/api/student/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setStudent(data.student)
        }
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchStudent()
  }, [])

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
      router.push("/login")
    } catch {
      setLoggingOut(false)
    }
  }

  const passwordOk =
    passwordForm.newPassword.length >= 6 &&
    passwordForm.confirmPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword

  const fullName = student
    ? `${student.lastName} ${student.middleName} ${student.firstName}`.replace(/\s+/g, " ").trim()
    : ""

  const genderLabel =
    student?.gender === "M" || student?.gender === "Masculin"
      ? "Masculin"
      : student?.gender === "F" || student?.gender === "Féminin"
        ? "Féminin"
        : student?.gender || "—"

  if (loadingProfile) return <StudentLoading />

  return (
    <div className="space-y-5">
      <div className="text-center pt-2">
        <h1 className={cn("text-xl font-bold", text)}>{fullName || "Mon profil"}</h1>
        {student?.class && <p className={cn("mt-1 text-sm", textMuted)}>{student.class}</p>}
      </div>

      {student ? (
        <>
          <SectionCard icon={User} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-600" title="Informations officielles">
            <div className="space-y-4">
              <InfoField label="Nom complet" value={fullName} />
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Code élève" value={student.code} />
                <InfoField label="Classe" value={student.class || "—"} />
              </div>
              <InfoField label="Email" value={student.email} />
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Genre" value={genderLabel} />
                <InfoField
                  label="Date de naissance"
                  value={student.birthDate ? new Date(student.birthDate).toLocaleDateString("fr-FR") : "—"}
                />
              </div>
              {student.year && <InfoField label="Année scolaire" value={student.year} />}
            </div>
          </SectionCard>

          <SectionCard icon={User} iconBg="bg-slate-50 dark:bg-slate-500/10" iconColor="text-slate-600" title="Informations personnelles">
            <div className="space-y-4">
              <InfoField label="Lieu de naissance" value={student.birthPlace || "—"} />
              <InfoField label="Nationalité" value={student.nationality || "—"} />
              <InfoField label="Adresse" value={student.address || "—"} />
            </div>
          </SectionCard>

          <SectionCard icon={Users} iconBg="bg-amber-50 dark:bg-amber-500/10" iconColor="text-amber-600" title="Parents / Tuteurs">
            <div className="space-y-4">
              <InfoField label="Parent / Tuteur principal" value={student.parentName1 || "—"} />
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Tél. parent 1" value={student.parentPhone1 || "—"} />
                <InfoField label="Email parent 1" value={student.parentEmail1 || "—"} />
              </div>
              {student.parentName2 && (
                <>
                  <InfoField label="Parent / Tuteur secondaire" value={student.parentName2} />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Tél. parent 2" value={student.parentPhone2 || "—"} />
                    <InfoField label="Email parent 2" value={student.parentEmail2 || "—"} />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Contact d'urgence" value={student.emergencyContact || "—"} />
                <InfoField label="Tél. urgence" value={student.emergencyPhone || "—"} />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={HeartPulse} iconBg="bg-pink-50 dark:bg-pink-500/10" iconColor="text-pink-500" title="Informations médicales">
            <div className="space-y-4">
              <InfoField label="Groupe sanguin" value={student.bloodGroup || "—"} />
              <InfoField label="Allergies" value={student.allergies || "Aucune"} />
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Notes médicales</p>
                <p className={cn("mt-1 text-sm italic", textMuted)}>{student.medicalNotes || "Aucune note renseignée"}</p>
              </div>
            </div>
          </SectionCard>

          <p className={cn("text-center text-xs", textMuted)}>
            Pour modifier les informations officielles, contactez votre administration.
          </p>
        </>
      ) : (
        <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
          <p className={textMuted}>Impossible de charger le profil.</p>
        </div>
      )}

      <SectionCard icon={Lock} iconBg="bg-orange-50 dark:bg-orange-500/10" iconColor="text-orange-500" title="Sécurité">
        <p className={cn("mb-4 text-sm", textMuted)}>Changer mon mot de passe</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
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
            <div className="mb-3 flex h-12 items-center justify-center rounded-xl bg-gray-900">
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10"
      >
        <LogOut className="h-5 w-5" />
        {loggingOut ? "Déconnexion..." : "Déconnexion"}
      </button>
    </div>
  )
}
