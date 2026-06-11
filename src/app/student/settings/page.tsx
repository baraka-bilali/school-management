"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Settings, User, Lock, Bell, Palette, Check, Eye, EyeOff, KeyRound, Loader2, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"

interface StudentInfo {
  id: number
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
  parentEmail1?: string
  parentName2?: string
  parentPhone2?: string
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

export default function StudentSettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Password change
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "success" | "error">("idle")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }
    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

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

  const handleThemeToggle = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    window.dispatchEvent(new Event("themeChange"))
  }

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

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-100" : ""
  const infoBg = theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"

  const passwordOk =
    passwordForm.newPassword.length >= 6 &&
    passwordForm.confirmPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Paramètres</h1>
          <p className={textSecondary}>Gérez vos préférences et votre compte</p>
        </div>

        {/* Mon profil */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={`w-6 h-6 animate-spin ${textSecondary}`} />
              </div>
            ) : student ? (
              <div className="space-y-5">
                {/* Admin-set fields */}
                <div>
                  <p className={`text-xs font-semibold uppercase ${textSecondary} mb-2`}>Informations officielles</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Nom complet", value: `${student.lastName} ${student.middleName} ${student.firstName}` },
                      { label: "Code élève", value: student.code },
                      { label: "Email", value: student.email },
                      { label: "Classe", value: student.class || "—" },
                      { label: "Genre", value: student.gender === "M" || student.gender === "Masculin" ? "Masculin" : student.gender === "F" || student.gender === "Féminin" ? "Féminin" : student.gender || "—" },
                      { label: "Date de naissance", value: student.birthDate ? new Date(student.birthDate).toLocaleDateString("fr-FR") : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className={`p-3 rounded-lg ${infoBg}`}>
                        <p className={`text-xs ${textSecondary} mb-0.5`}>{label}</p>
                        <p className={`text-sm font-medium ${textColor} break-words`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal fields */}
                <div>
                  <p className={`text-xs font-semibold uppercase ${textSecondary} mb-2`}>Informations personnelles</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Lieu de naissance", value: student.birthPlace || "—" },
                      { label: "Nationalité", value: student.nationality || "—" },
                      { label: "Adresse", value: student.address || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className={`p-3 rounded-lg ${infoBg}`}>
                        <p className={`text-xs ${textSecondary} mb-0.5`}>{label}</p>
                        <p className={`text-sm font-medium ${textColor} break-words`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parents */}
                <div>
                  <p className={`text-xs font-semibold uppercase ${textSecondary} mb-2`}>Parents / Tuteurs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Parent / Tuteur principal", value: student.parentName1 || "—" },
                      { label: "Tél. parent 1", value: student.parentPhone1 || "—" },
                      { label: "Email parent 1", value: student.parentEmail1 || "—" },
                      { label: "Parent / Tuteur secondaire", value: student.parentName2 || "—" },
                      { label: "Tél. parent 2", value: student.parentPhone2 || "—" },
                      { label: "Email parent 2", value: student.parentEmail2 || "—" },
                      { label: "Contact d'urgence", value: student.emergencyContact || "—" },
                      { label: "Tél. urgence", value: student.emergencyPhone || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className={`p-3 rounded-lg ${infoBg}`}>
                        <p className={`text-xs ${textSecondary} mb-0.5`}>{label}</p>
                        <p className={`text-sm font-medium ${textColor} break-words`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical */}
                {(student.bloodGroup || student.allergies || student.medicalNotes) && (
                  <div>
                    <p className={`text-xs font-semibold uppercase ${textSecondary} mb-2 flex items-center gap-1`}>
                      <Heart className="w-3.5 h-3.5 text-rose-400" /> Informations médicales
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Groupe sanguin", value: student.bloodGroup || "—" },
                        { label: "Allergies", value: student.allergies || "—" },
                        { label: "Notes médicales", value: student.medicalNotes || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className={`p-3 rounded-lg ${infoBg}`}>
                          <p className={`text-xs ${textSecondary} mb-0.5`}>{label}</p>
                          <p className={`text-sm font-medium ${textColor} break-words`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className={`text-xs ${textSecondary} mt-2`}>
                  Pour modifier les informations officielles, contactez votre administration.
                </p>
              </div>
            ) : (
              <p className={`text-sm ${textSecondary}`}>Impossible de charger le profil.</p>
            )}
          </CardContent>
        </Card>

        {/* Sécurité - Changement de mot de passe */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Sécurité — Changer mon mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Au moins 6 caractères"
                    className={`pr-10 ${inputBg}`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:text-gray-900 dark:hover:text-gray-100`}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Retapez votre mot de passe"
                    className={`pr-10 ${inputBg}`}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:text-gray-900 dark:hover:text-gray-100`}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordForm.newPassword && passwordForm.confirmPassword && !passwordOk && (
                <p className="text-sm text-red-500">Les mots de passe ne correspondent pas</p>
              )}

              {passwordStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-3 py-2 rounded-lg">
                  <Check className="w-4 h-4" /> Mot de passe modifié avec succès !
                </div>
              )}
              {passwordStatus === "error" && passwordError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{passwordError}</div>
              )}

              <button
                type="submit"
                disabled={!passwordOk || changingPassword}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {changingPassword ? "Enregistrement..." : "Changer le mot de passe"}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className={`text-sm ${textSecondary}`}>Choisissez le thème de l'interface</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleThemeToggle("light")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "light" ? "border-indigo-500 bg-indigo-50" : `${borderColor} ${cardBg} hover:border-gray-400`
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm"></div>
                    {theme === "light" && <Check className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <p className={`font-medium ${theme === "light" ? "text-indigo-700" : textColor}`}>Clair</p>
                </button>
                <button
                  onClick={() => handleThemeToggle("dark")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "dark" ? "border-indigo-500 bg-indigo-500/10" : `${borderColor} ${cardBg} hover:border-gray-400`
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg"></div>
                    {theme === "dark" && <Check className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <p className={`font-medium ${theme === "dark" ? "text-indigo-400" : textColor}`}>Sombre</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
