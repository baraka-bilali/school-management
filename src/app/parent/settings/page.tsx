"use client"

import { useState } from "react"
import { User, LogOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "@/components/parent/parent-context"
import StudentLoading from "@/components/student/student-loading"

export default function ParentSettingsPage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const { parent, loading } = useParentMe()
  const [loggingOut, setLoggingOut] = useState(false)

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

  const fullName = parent
    ? `${parent.lastName} ${parent.middleName || ""} ${parent.firstName}`.replace(/\s+/g, " ").trim()
    : ""

  if (loading) return <StudentLoading variant="profile" />

  return (
    <div className="space-y-5">
      <div className="pt-2 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
          {parent?.firstName?.charAt(0)?.toUpperCase() || "P"}
        </div>
        <h1 className={cn("text-xl font-bold", text)}>{fullName || "Mon profil"}</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>Parent</p>
      </div>

      {parent ? (
        <div className={cn("rounded-2xl border p-5", card, border, shadow)}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className={cn("text-base font-bold", text)}>Informations</h2>
          </div>
          <div className="grid gap-4">
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Email</p>
              <p className={cn("mt-1 text-sm font-medium", text)}>{parent.email || "—"}</p>
            </div>
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Téléphone</p>
              <p className={cn("mt-1 text-sm font-medium", text)}>{parent.phone || "—"}</p>
            </div>
            {parent.school && (
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Établissement</p>
                <p className={cn("mt-1 text-sm font-medium", text)}>{parent.school}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
          <p className={textMuted}>Impossible de charger le profil.</p>
        </div>
      )}

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
