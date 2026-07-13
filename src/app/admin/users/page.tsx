"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import React from "react"
import Portal from "@/components/portal"
import { Eye, Pencil, Check, X, Plus, KeyRound, Copy, Mail, User, Download, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Banner } from "@/components/ui/banner"
import { authFetch } from "@/lib/auth-fetch"
import { toDisplayCode } from "@/lib/student-fields"
import { StudentsSection, Toolbar, Pagination } from "./students-section"
import { CoursesSection } from "./courses-section"
import { TableLoadingBlock, TableLoadingRow } from "@/components/ui/table-loading"

import { STAFF_ROLES, STAFF_ROLES_CORE, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles"

type TabKey = "students" | "teachers" | "staff" | "courses"

const TAB_KEYS: TabKey[] = ["students", "teachers", "staff", "courses"]

function parseTab(value: string | null): TabKey {
  if (value && TAB_KEYS.includes(value as TabKey)) return value as TabKey
  return "students"
}

interface PaginationState {
  page: number
  pageSize: number
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams])
  const [tabVisible, setTabVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))

  const changeTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "students") {
      params.delete("tab")
      params.delete("view")
    } else {
      params.set("tab", next)
      if (next !== "courses") params.delete("view")
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/users?${qs}` : "/admin/users", { scroll: false })
  }

  // Gestion du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) {
        setTheme(newTheme)
      }
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)

    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  // Effet pour gérer le montage initial
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Effet pour gérer les transitions de tab
  useEffect(() => {
    if (!isMounted) return
    setTabVisible(false)
    const id = setTimeout(() => setTabVisible(true), 20)
    return () => clearTimeout(id)
  }, [tab, isMounted])

  // Variables de couleur basées sur le thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  return (
    <Layout>
      <div className="space-y-4 md:p-6">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Utilisateurs</h1>
          <p className={textSecondary}>Gestion des élèves, enseignants et personnel administratif.</p>
        </div>

        {/* Tabs */}
        <div className={`flex items-center space-x-2 border-b ${borderColor} overflow-x-auto scrollbar-hide`}>
          <button
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "students"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => changeTab("students")}
          >
            Élèves
          </button>
          <button
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "teachers"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => changeTab("teachers")}
          >
            Enseignants
          </button>
          <button
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "staff"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => changeTab("staff")}
          >
            Personnel
          </button>
          <button
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "courses"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => changeTab("courses")}
          >
            <span className="md:hidden">Cours</span>
            <span className="hidden md:inline">Cours &amp; Affectations</span>
          </button>
        </div>

        <div className={`transition-all duration-250 ease-out transform ${tabVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
          {tab === "students" && <StudentsSection theme={theme} />}
          {tab === "teachers" && <TeachersSection theme={theme} />}
          {tab === "staff" && <StaffSection theme={theme} />}
          {tab === "courses" && <CoursesSection theme={theme} />}
        </div>
      </div>
    </Layout>
  )
}

function TeachersSection({ theme }: { theme: "light" | "dark" }) {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 })
  const [q, setQ] = useState("")
  const [years, setYears] = useState<Array<{ id: number; name: string }>>([])
  const [currentYearName, setCurrentYearName] = useState<string>("-")
  const [banner, setBanner] = useState<{
    message?: string;
    email?: string;
    password?: string;
    type?: 'success' | 'error';
    notificationType?: 'create' | 'update';
  } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    specialty: "",
    phone: "",
  })
  const [showTeacherResetModal, setShowTeacherResetModal] = useState(false)
  const [selectedTeacherForReset, setSelectedTeacherForReset] = useState<any>(null)
  const [newTeacherPasswordGenerated, setNewTeacherPasswordGenerated] = useState("")
  const [resettingTeacherPassword, setResettingTeacherPassword] = useState(false)
  const [teacherPasswordCopied, setTeacherPasswordCopied] = useState(false)
  const [teacherEmailCopied, setTeacherEmailCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    ;(async () => {
      setLoading(true)
      // Logging de performance pour mesurer la vitesse réelle
      const perfLabel = `[PERF] Teachers fetch (q=${q || 'none'}, page=${pagination.page})`
      console.time(perfLabel)
      
      try {
        const r = await authFetch(`/api/admin/teachers?${params.toString()}`)
        const text = await r.text()
        const res = text ? JSON.parse(text) : { items: [], total: 0 }
        setItems(res.items || [])
        setTotal(res.total || 0)
        
        console.timeEnd(perfLabel)
        console.log(`[PERF] Loaded ${res.items?.length || 0} teachers out of ${res.total || 0} total`)
      } catch (e) {
        console.error(e)
        console.timeEnd(perfLabel)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    })()
  }, [pagination, q])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await authFetch("/api/admin/meta")
        const text = await r.text()
        const res = text ? JSON.parse(text) : { years: [], currentYearId: null }
        setYears(res.years || [])
        const cy = (res.years || []).find((y: any) => y.id === res.currentYearId)
        setCurrentYearName(cy?.name || "-")
      } catch (e) {
        console.error(e)
        setYears([])
        setCurrentYearName("-")
      }
    })()
  }, [])

  // Variables de couleur basées sur le thème
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgInput = theme === "dark" ? "bg-gray-700" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"

  const handleSaveEditTeacher = async (teacherId: number) => {
    // Empêcher les soumissions multiples
    if (submitting) return

    const teacher = items.find(t => t.id === teacherId)
    if (!teacher) return

    try {
      setSubmitting(true)

      // Vérifier si des changements ont été effectués
      const changed = (
        teacher.lastName !== editForm.lastName ||
        teacher.middleName !== editForm.middleName ||
        teacher.firstName !== editForm.firstName ||
        teacher.gender !== editForm.gender ||
        (teacher.birthDate ? teacher.birthDate.split('T')[0] : '') !== editForm.birthDate ||
        (teacher.specialty || '') !== editForm.specialty ||
        (teacher.phone || '') !== editForm.phone
      )

      if (!changed) {
        setEditingId(null)
        setSubmitting(false)
        setBanner({ message: "Aucune modification détectée.", type: 'success', notificationType: 'update' })
        setTimeout(() => setBanner(null), 2500)
        return
      }

      const res = await authFetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: editForm.lastName,
          middleName: editForm.middleName,
          firstName: editForm.firstName,
          gender: editForm.gender,
          birthDate: editForm.birthDate,
          specialty: editForm.specialty,
          phone: editForm.phone,
        }),
      })

      const text = await res.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        data = { error: text }
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || text || 'Erreur lors de la modification')
      }

      // Mettre à jour la liste localement avec les nouvelles données
      setItems(items.map(item => item.id === teacherId ? { 
        ...item,
        lastName: editForm.lastName,
        middleName: editForm.middleName,
        firstName: editForm.firstName,
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        specialty: editForm.specialty,
        phone: editForm.phone,
        ...(data.teacher || {})
      } : item))
      
      setEditingId(null)
      setSubmitting(false)
      setBanner({ 
        message: "L'enseignant a été mis à jour avec succès", 
        type: 'success',
        notificationType: 'update'
      })
      setTimeout(() => setBanner(null), 3000)
    } catch (err) {
      setSubmitting(false)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setBanner({ 
        message: `Une erreur est survenue lors de la modification de l'enseignant: ${errorMessage}`, 
        type: 'error',
        notificationType: 'update'
      })
      setTimeout(() => setBanner(null), 5000)
    }
  }

  const handleResetTeacherPassword = (teacher: any) => {
    setSelectedTeacherForReset(teacher)
    setShowTeacherResetModal(true)
    setNewTeacherPasswordGenerated("")
    setTeacherPasswordCopied(false)
    setTeacherEmailCopied(false)
  }

  const handleConfirmResetTeacherPassword = async () => {
    if (!selectedTeacherForReset) return
    try {
      setResettingTeacherPassword(true)
      const res = await authFetch(`/api/admin/teachers/${selectedTeacherForReset.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        setNewTeacherPasswordGenerated(data.newPassword)
        setSelectedTeacherForReset({ ...selectedTeacherForReset, email: data.teacher.email })
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Erreur lors de la réinitialisation")
        setShowTeacherResetModal(false)
      }
    } catch {
      toast.error("Une erreur est survenue")
      setShowTeacherResetModal(false)
    } finally {
      setResettingTeacherPassword(false)
    }
  }

  const closeTeacherResetModal = () => {
    setShowTeacherResetModal(false)
    setSelectedTeacherForReset(null)
    setNewTeacherPasswordGenerated("")
    setTeacherPasswordCopied(false)
    setTeacherEmailCopied(false)
  }

  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle>Enseignants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              email={banner.email}
              password={banner.password}
              notificationType={banner.notificationType}
              onClose={() => setBanner(null)}
            />
          )}
        <Toolbar
          placeholder="Rechercher par nom, spécialité ou téléphone"
          onCreate={() => setShowCreate(true)}
          onSearch={setQ}
          theme={theme}
          isSearching={loading}
        />

        <div>
          {/* Mobile: compact expandable cards for teachers */}
          <div className="md:hidden space-y-2.5">
            {loading && (
              <TableLoadingBlock textClassName={textSecondary} message="Chargement..." />
            )}
            {!loading && items.map((t) => {
              const fullName = [t.lastName, t.middleName, t.firstName].filter(Boolean).join(" ")
              const initials = `${(t.firstName?.[0] || "").toUpperCase()}${(t.lastName?.[0] || "").toUpperCase()}` || "?"
              const open = mobileExpandedId === t.id
              return (
                <div key={`mobile-teacher-${t.id}`} className={`overflow-hidden rounded-2xl border ${borderColor} ${bgCard} shadow-sm`}>
                  <button
                    type="button"
                    onClick={() => setMobileExpandedId(open ? null : t.id)}
                    className={`flex w-full items-center gap-3 p-3.5 text-left ${hoverBg}`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[15px] font-semibold ${textColor}`}>{fullName || "—"}</div>
                      <div className={`mt-0.5 truncate text-xs ${textSecondary}`}>{t.specialty || "Spécialité non définie"}</div>
                    </div>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme === "dark" ? "bg-gray-700/60 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                      <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                    </span>
                  </button>
                  {open && (
                    <div className={`border-t ${borderColor} px-3.5 py-3 space-y-2.5`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className={textSecondary}>Téléphone</span>
                        <span className={`font-medium ${textColor}`}>{t.phone || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={textSecondary}>Sexe</span>
                        <span className={`font-medium ${textColor}`}>{t.gender || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={textSecondary}>Naissance</span>
                        <span className={`font-medium ${textColor}`}>{t.birthDate ? new Date(t.birthDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleResetTeacherPassword(t) }}
                        className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${theme === "dark" ? "bg-orange-500/15 text-orange-400 hover:bg-orange-500/25" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}
                      >
                        <KeyRound className="h-4 w-4" />
                        Réinitialiser le mot de passe
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {!loading && items.length === 0 && (
              <div className={`px-3 py-8 text-center ${textSecondary}`}>Aucun enseignant trouvé.</div>
            )}
          </div>

          {/* Desktop/tablet: keep existing table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead className={theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}>
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nom</th>
                <th className="px-3 py-2 text-left font-medium">Post-nom</th>
                <th className="px-3 py-2 text-left font-medium">Prénom</th>
                <th className="px-3 py-2 text-left font-medium">Sexe</th>
                <th className="px-3 py-2 text-left font-medium">Naissance</th>
                <th className="px-3 py-2 text-left font-medium">Spécialité</th>
                <th className="px-3 py-2 text-left font-medium">Téléphone</th>
                <th className="px-3 py-2 text-left font-medium">Année</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className={theme === "dark" ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
              {loading && (
                <TableLoadingRow colSpan={9} textClassName={textSecondary} cellClassName={textSecondary} />
              )}
              {!loading && items.map((t) => {
                const isOpen = false // no separate expanded id for teachers; could reuse editingId but keep closed by default
                return (
                  <React.Fragment key={t.id}>
                    <tr className={cn(
                      theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50",
                      editingId === t.id ? (theme === "dark" ? "bg-blue-900/30" : "bg-blue-50") : "",
                      textColor
                    )}>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
                      ) : t.lastName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.middleName} onChange={(e) => setEditForm(prev => ({ ...prev, middleName: e.target.value }))} />
                      ) : t.middleName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
                      ) : t.firstName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <select className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.gender} onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}>
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                      ) : t.gender}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input type="date" className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.birthDate} onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))} />
                      ) : new Date(t.birthDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.specialty} onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))} />
                      ) : t.specialty || "-"}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`} value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                      ) : t.phone || "-"}</td>
                      <td className="px-3 py-2">{currentYearName}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {editingId === t.id ? (
                            <>
                              <button 
                                disabled={submitting}
                                className={`transition-colors cursor-pointer relative group ${
                                  submitting 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-green-600 hover:text-green-700'
                                }`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  if (!submitting) handleSaveEditTeacher(t.id);
                                }}
                              >
                                {submitting ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-600"></div>
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  {submitting ? 'Enregistrement...' : 'Valider'}
                                </span>
                              </button>
                              <button 
                                disabled={submitting}
                                className={`transition-colors cursor-pointer relative group ${
                                  submitting
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600 hover:text-red-700'
                                }`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  if (!submitting) {
                                    setEditingId(null);
                                    setSubmitting(false);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  Annuler
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer relative group`} onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditForm({
                                lastName: t.lastName || "",
                                middleName: t.middleName || "",
                                firstName: t.firstName || "",
                                gender: t.gender || "M",
                                birthDate: t.birthDate ? t.birthDate.split('T')[0] : "",
                                specialty: t.specialty || "",
                                phone: t.phone || "",
                              })}}>
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer relative group`} onClick={(e) => { e.stopPropagation(); }}>
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                className={`${textSecondary} hover:text-orange-500 transition-colors cursor-pointer relative group`}
                                onClick={(e) => { e.stopPropagation(); handleResetTeacherPassword(t) }}
                                title="Réinitialiser le mot de passe"
                              >
                                <KeyRound className="h-4 w-4" />
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  Réinit. mot de passe
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* expanded details row for teachers (animated) */}
                    <tr key={`${t.id}-expanded`} className={theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}>
                      <td colSpan={9} className="px-3 py-0">
                        <div className={cn(
                          "overflow-hidden transition-all duration-300",
                          editingId === t.id ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm py-3">
                            <div><span className={textSecondary}>Nom</span><div className={`font-medium ${textColor}`}>{t.lastName}</div></div>
                            <div><span className={textSecondary}>Post-nom</span><div className={`font-medium ${textColor}`}>{t.middleName}</div></div>
                            <div><span className={textSecondary}>Prénom</span><div className={`font-medium ${textColor}`}>{t.firstName}</div></div>
                            <div><span className={textSecondary}>Sexe</span><div className={`font-medium ${textColor}`}>{t.gender}</div></div>
                            <div><span className={textSecondary}>Naissance</span><div className={`font-medium ${textColor}`}>{t.birthDate ? new Date(t.birthDate).toLocaleDateString() : "-"}</div></div>
                            <div><span className={textSecondary}>Spécialité</span><div className={`font-medium ${textColor}`}>{t.specialty || "-"}</div></div>
                            <div><span className={textSecondary}>Téléphone</span><div className={`font-medium ${textColor}`}>{t.phone || "-"}</div></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className={`px-3 py-8 text-center ${textSecondary}`}>Aucun enseignant trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        <Pagination state={pagination} setState={setPagination} total={total} />
        <CreateTeacherModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          theme={theme}
          onCreated={(payload) => {
            setShowCreate(false)
            setBanner({
              email: payload.email,
              password: payload.plaintextPassword,
              type: "success",
              notificationType: "create",
            })
            setLoading(true)
            setPagination((p) => ({ ...p }))
          }}
        />

        {/* Modal confirmation reset MDP enseignant */}
        {showTeacherResetModal && !newTeacherPasswordGenerated && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTeacherResetModal} />
              <div className={`relative ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border shadow-2xl w-full max-w-md transform transition-all duration-200`}>
                <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <h3 className={`text-xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"} flex items-center gap-2`}>
                    <KeyRound className="w-5 h-5 text-orange-500" />
                    Réinitialiser le mot de passe
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                      {selectedTeacherForReset?.firstName?.charAt(0)}{selectedTeacherForReset?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {selectedTeacherForReset?.lastName} {selectedTeacherForReset?.middleName} {selectedTeacherForReset?.firstName}
                      </p>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {selectedTeacherForReset?.specialty || "Enseignant"}
                      </p>
                    </div>
                  </div>
                  <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-2`}>
                    Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet enseignant ?
                  </p>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Un nouveau mot de passe temporaire sera généré. L'enseignant pourra le changer lors de sa prochaine connexion.
                  </p>
                </div>
                <div className={`p-6 flex gap-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    onClick={closeTeacherResetModal}
                    disabled={resettingTeacherPassword}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600" : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"} disabled:opacity-50`}
                  >
                    <X className="w-4 h-4" />Annuler
                  </button>
                  <button
                    onClick={handleConfirmResetTeacherPassword}
                    disabled={resettingTeacherPassword}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    {resettingTeacherPassword ? "Réinitialisation..." : "Réinitialiser"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Modal affichage identifiants enseignant */}
        {newTeacherPasswordGenerated && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeTeacherResetModal} />
              <div className={`relative ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border shadow-2xl w-full max-w-lg transform transition-all duration-200`}>
                <div className={`p-6 border-b ${theme === "dark" ? "border-green-500/20 bg-green-500/5" : "border-green-200 bg-green-50"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <KeyRound className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Identifiants de Connexion</h2>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Mot de passe réinitialisé avec succès</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className={`${theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50"} border ${theme === "dark" ? "border-yellow-500/30" : "border-yellow-200"} rounded-lg p-4`}>
                    <p className={`${theme === "dark" ? "text-yellow-400" : "text-yellow-700"} text-sm font-medium flex items-start gap-2`}>
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <span><strong>Important :</strong> Copiez ces identifiants maintenant ! Ils ne seront plus affichés après la fermeture.</span>
                    </p>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>{selectedTeacherForReset?.lastName} {selectedTeacherForReset?.firstName}</p>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{selectedTeacherForReset?.specialty || "Enseignant"}</p>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2 flex items-center gap-1.5`}><Mail className="w-3.5 h-3.5" />Adresse email</label>
                    <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} border-2 ${teacherEmailCopied ? "border-green-500" : theme === "dark" ? "border-gray-600" : "border-gray-200"} rounded-lg p-3 flex items-center justify-between hover:border-indigo-500 transition-all`}>
                      <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-100" : "text-gray-900"} select-all`}>{selectedTeacherForReset?.email}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(selectedTeacherForReset?.email || ""); setTeacherEmailCopied(true); setTimeout(() => setTeacherEmailCopied(false), 2000) }} className={`transition-colors p-1.5 rounded ${teacherEmailCopied ? "text-green-500 bg-green-500/20" : "text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10"}`}>
                        {teacherEmailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2 flex items-center gap-1.5`}><KeyRound className="w-3.5 h-3.5" />Nouveau mot de passe</label>
                    <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} border-2 ${teacherPasswordCopied ? "border-green-500" : theme === "dark" ? "border-gray-600" : "border-gray-200"} rounded-lg p-3 flex items-center justify-between hover:border-orange-500 transition-all`}>
                      <span className={`font-mono text-lg font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"} select-all`}>{newTeacherPasswordGenerated}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(newTeacherPasswordGenerated); setTeacherPasswordCopied(true); setTimeout(() => setTeacherPasswordCopied(false), 2000) }} className={`transition-colors p-1.5 rounded ${teacherPasswordCopied ? "text-green-500 bg-green-500/20" : "text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"}`}>
                        {teacherPasswordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`p-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button onClick={closeTeacherResetModal} className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${teacherPasswordCopied && teacherEmailCopied ? theme === "dark" ? "bg-green-500/30 hover:bg-green-500/40 text-green-300 border border-green-500/70" : "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300" : theme === "dark" ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50" : "bg-green-50 hover:bg-green-100 text-green-600 border border-green-200"}`}>
                    <Check className="w-4 h-4" />
                    {teacherPasswordCopied && teacherEmailCopied ? "✓ Identifiants copiés !" : "J'ai copié les identifiants"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

      </CardContent>
    </Card>
  )
}

function CreateTeacherModal({
  open,
  onClose,
  onCreated,
  theme = "light",
}: {
  open: boolean
  onClose: () => void
  onCreated: (payload: { email: string; plaintextPassword: string }) => void
  theme?: "light" | "dark"
}) {
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    specialty: "",
    phone: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }

    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [open])

  // reset teacher form when opening the modal
  useEffect(() => {
    if (open) {
      setForm({
        lastName: "",
        middleName: "",
        firstName: "",
        gender: "M",
        birthDate: "",
        specialty: "",
        phone: "",
      })
      setSubmitting(false)
    }
  }, [open])

  if (!mounted) return null

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onCreated({ email: data.user.email, plaintextPassword: data.plaintextPassword })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!visible}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl transform transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} role="dialog" aria-modal="true">
          <div className={`sticky top-0 z-10 flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} px-4 py-3`}>
            <div className={`text-lg font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Créer un enseignant</div>
            <button className={`${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`} onClick={onClose}>×</button>
          </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Nom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Post-nom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Prénom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Sexe</label>
            <select className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Date de naissance</label>
            <input type="date" className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Spécialité</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Téléphone</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className={`flex items-center justify-end gap-2 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
          <button className={`rounded-md border ${theme === "dark" ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"} px-4 py-2`} onClick={onClose}>Annuler</button>
          <button disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60" onClick={submit}>
            {submitting ? "Création..." : "Créer"}
          </button>
        </div>
        </div>
      </div>
    </Portal>
  )
}

function StaffSection({ theme }: { theme: "light" | "dark" }) {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 })
  const [q, setQ] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState<StaffRole[]>(STAFF_ROLES_CORE)
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [credentialsMode, setCredentialsMode] = useState<"create" | "reset">("reset")
  const [resetting, setResetting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [togglingEnrollId, setTogglingEnrollId] = useState<number | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const r = await authFetch(`/api/admin/staff?${params.toString()}`)
        const res = await r.json()
        if (!r.ok) throw new Error(res.error || "Erreur")
        setItems(res.items || [])
        setTotal(res.total || 0)
        if (Array.isArray(res.availableRoles) && res.availableRoles.length > 0) {
          setAvailableRoles(res.availableRoles as StaffRole[])
        }
      } catch (e) {
        console.error(e)
        setLoadError((e as Error).message || "Impossible de charger le personnel")
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    })()
  }, [pagination, q])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"

  const handleResetPassword = (staff: any) => {
    setSelectedStaff(staff)
    setCredentialsMode("reset")
    setShowResetModal(true)
    setNewPassword("")
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  const handleToggleEnrollPermission = async (staff: any) => {
    setTogglingEnrollId(staff.id)
    try {
      const res = await authFetch(`/api/admin/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canEnrollStudents: !staff.canEnrollStudents }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setItems((prev) => prev.map((s) => (s.id === staff.id ? { ...s, canEnrollStudents: data.user.canEnrollStudents } : s)))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTogglingEnrollId(null)
    }
  }

  const handleToggleActive = async (staff: any) => {
    setTogglingId(staff.id)
    try {
      const res = await authFetch(`/api/admin/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staff.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setItems((prev) => prev.map((s) => (s.id === staff.id ? { ...s, isActive: data.user.isActive } : s)))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTogglingId(null)
    }
  }

  const copyText = (text: string, type: "email" | "password") => {
    navigator.clipboard?.writeText(text)
    if (type === "email") {
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    } else {
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  const handleConfirmReset = async () => {
    if (!selectedStaff) return
    try {
      setResetting(true)
      const res = await authFetch(`/api/admin/staff/${selectedStaff.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setNewPassword(data.newPassword)
      setCredentialsMode("reset")
    } catch (e) {
      alert((e as Error).message)
      setShowResetModal(false)
    } finally {
      setResetting(false)
    }
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setSelectedStaff(null)
    setNewPassword("")
    setCredentialsMode("reset")
  }

  return (
    <Card theme={theme}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou fonction..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
            className={`flex-1 rounded-xl border ${borderColor} ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"} px-4 py-2 text-sm`}
          />
          <button
            onClick={() => setShowCreate(true)}
            aria-label="Créer"
            title="Créer un membre du personnel"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 p-2.5 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {loadError}
          </div>
        )}

        {/* Mobile: cartes avec tous les paramètres + accès visibles */}
        <div className="md:hidden space-y-2.5">
          {loading ? (
            <TableLoadingBlock textClassName={textSecondary} message="Chargement..." />
          ) : items.length === 0 ? (
            <div className={`px-3 py-8 text-center ${textSecondary}`}>Aucun membre du personnel trouvé.</div>
          ) : (
            items.map((s) => {
              const fullName = [s.nom, s.prenom].filter(Boolean).join(" ")
              const initials = `${(s.prenom?.[0] || "").toUpperCase()}${(s.nom?.[0] || "").toUpperCase()}` || "?"
              return (
                <div key={`mobile-staff-${s.id}`} className={`rounded-2xl border ${borderColor} ${theme === "dark" ? "bg-gray-800" : "bg-white"} p-3.5 shadow-sm space-y-3`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[15px] font-semibold ${textColor}`}>{fullName || "—"}</div>
                      <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {STAFF_ROLE_LABELS[s.role as StaffRole] || s.role}
                      </span>
                    </div>
                    <button
                      className={`shrink-0 rounded-full p-2 ${textSecondary} hover:text-orange-500 ${hoverBg}`}
                      onClick={() => handleResetPassword(s)}
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`${textSecondary} shrink-0`}>Email</span>
                      <span className={`font-mono text-xs ${textColor} break-all text-right`}>{s.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={textSecondary}>Téléphone</span>
                      <span className={`font-medium ${textColor}`}>{s.telephone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={textSecondary}>Fonction</span>
                      <span className={`font-medium ${textColor} text-right`}>{s.fonction || "—"}</span>
                    </div>
                  </div>

                  <div className={`space-y-2.5 border-t ${borderColor} pt-3`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${textColor}`}>Accès actif</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.isActive}
                        disabled={togglingId === s.id}
                        onClick={() => handleToggleActive(s)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                          s.isActive ? "bg-green-500" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                        )}
                      >
                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5", s.isActive ? "translate-x-5" : "translate-x-0.5")} />
                      </button>
                    </div>
                    {s.role === "CAISSIER" && (
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${textColor}`}>Autoriser les inscriptions</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={s.canEnrollStudents}
                          disabled={togglingEnrollId === s.id}
                          onClick={() => handleToggleEnrollPermission(s)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                            s.canEnrollStudents ? "bg-indigo-500" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                          )}
                        >
                          <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5", s.canEnrollStudents ? "translate-x-5" : "translate-x-0.5")} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop/tablet: tableau complet */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}>
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nom</th>
                <th className="px-3 py-2 text-left font-medium">Prénom</th>
                <th className="px-3 py-2 text-left font-medium">Rôle</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Téléphone</th>
                <th className="px-3 py-2 text-left font-medium">Fonction</th>
                <th className="px-3 py-2 text-left font-medium">Actif</th>
                <th className="px-3 py-2 text-left font-medium">Inscription</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading ? (
                <TableLoadingRow colSpan={9} textClassName={textSecondary} cellClassName={textSecondary} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`px-3 py-8 text-center ${textSecondary}`}>Aucun membre du personnel trouvé.</td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className={hoverBg}>
                    <td className={`px-3 py-2 ${textColor}`}>{s.nom || "—"}</td>
                    <td className={`px-3 py-2 ${textColor}`}>{s.prenom || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {STAFF_ROLE_LABELS[s.role as StaffRole] || s.role}
                      </span>
                    </td>
                    <td className={`px-3 py-2 ${textSecondary} font-mono text-xs`}>{s.email}</td>
                    <td className={`px-3 py-2 ${textSecondary}`}>{s.telephone || "—"}</td>
                    <td className={`px-3 py-2 ${textSecondary}`}>{s.fonction || "—"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.isActive}
                        disabled={togglingId === s.id}
                        onClick={() => handleToggleActive(s)}
                        title={s.isActive ? "Désactiver l'accès" : "Réactiver l'accès"}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                          s.isActive ? "bg-green-500" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5",
                            s.isActive ? "translate-x-5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      {s.role === "CAISSIER" ? (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={s.canEnrollStudents}
                          disabled={togglingEnrollId === s.id}
                          onClick={() => handleToggleEnrollPermission(s)}
                          title={s.canEnrollStudents ? "Retirer la permission inscription" : "Autoriser les inscriptions"}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                            s.canEnrollStudents ? "bg-indigo-500" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5",
                              s.canEnrollStudents ? "translate-x-5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      ) : (
                        <span className={`text-xs ${textSecondary}`}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className={`${textSecondary} hover:text-orange-500 transition-colors`}
                        onClick={() => handleResetPassword(s)}
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination state={pagination} setState={setPagination} total={total} />

        <CreateStaffModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          theme={theme}
          availableRoles={availableRoles}
          onCreated={(payload) => {
            setShowCreate(false)
            setSelectedStaff(payload.user)
            setNewPassword(payload.plaintextPassword)
            setCredentialsMode("create")
            setPasswordCopied(false)
            setEmailCopied(false)
            setShowResetModal(true)
            setPagination((p) => ({ ...p }))
          }}
        />

        {showResetModal && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeResetModal} />
              <div className={`relative ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border shadow-2xl w-full max-w-lg`}>
                <div className={`p-6 border-b ${theme === "dark" ? "border-green-500/20 bg-green-500/5" : "border-green-200 bg-green-50"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <KeyRound className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${textColor}`}>
                        {newPassword ? "Identifiants de connexion" : "Réinitialiser le mot de passe"}
                      </h2>
                      <p className={`text-xs ${textSecondary}`}>
                        {credentialsMode === "create" ? "Compte créé avec succès" : "Mot de passe réinitialisé"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {!newPassword ? (
                    <>
                      <p className={`${textSecondary} mb-2`}>
                        Réinitialiser le mot de passe de <strong>{selectedStaff?.nom} {selectedStaff?.prenom}</strong> ?
                      </p>
                      <p className={`text-sm ${textSecondary}`}>Un nouveau mot de passe temporaire sera généré.</p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className={`${theme === "dark" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"} border rounded-lg p-3`}>
                        <p className={`text-sm ${theme === "dark" ? "text-yellow-400" : "text-yellow-700"}`}>
                          <strong>Important :</strong> Copiez ces identifiants maintenant. Ils ne seront plus affichés après fermeture.
                        </p>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${textColor}`}>{selectedStaff?.nom} {selectedStaff?.prenom}</p>
                          <p className={`text-xs ${textSecondary}`}>{STAFF_ROLE_LABELS[selectedStaff?.role as StaffRole] || selectedStaff?.role}</p>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold ${textSecondary} mb-2 flex items-center gap-1.5`}><Mail className="w-3.5 h-3.5" />Email</label>
                        <div className={`flex items-center justify-between rounded-lg border-2 p-3 ${emailCopied ? "border-green-500" : borderColor}`}>
                          <span className="font-mono text-sm select-all">{selectedStaff?.email}</span>
                          <button type="button" onClick={() => copyText(selectedStaff?.email || "", "email")} className="text-indigo-500 p-1.5">
                            {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold ${textSecondary} mb-2 flex items-center gap-1.5`}><KeyRound className="w-3.5 h-3.5" />Mot de passe</label>
                        <div className={`flex items-center justify-between rounded-lg border-2 p-3 ${passwordCopied ? "border-green-500" : borderColor}`}>
                          <span className="font-mono text-lg font-bold select-all">{newPassword}</span>
                          <button type="button" onClick={() => copyText(newPassword, "password")} className="text-orange-500 p-1.5">
                            {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`p-6 flex gap-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button type="button" onClick={closeResetModal} className={`flex-1 px-4 py-2.5 rounded-lg border ${borderColor} ${textColor} text-sm font-medium`}>
                    {newPassword ? (passwordCopied && emailCopied ? "✓ Identifiants copiés" : "Fermer") : "Annuler"}
                  </button>
                  {!newPassword && (
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      disabled={resetting}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {resetting ? "..." : "Réinitialiser"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}
      </CardContent>
    </Card>
  )
}

function CreateStaffModal({
  open,
  onClose,
  onCreated,
  theme = "light",
  availableRoles = STAFF_ROLES_CORE,
}: {
  open: boolean
  onClose: () => void
  onCreated: (payload: { email: string; plaintextPassword: string; user: Record<string, unknown> }) => void
  theme?: "light" | "dark"
  availableRoles?: StaffRole[]
}) {
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    role: "CAISSIER" as StaffRole,
    phone: "",
    fonction: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }
    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (open) {
      setForm({
        lastName: "",
        middleName: "",
        firstName: "",
        role: availableRoles[0] ?? "CAISSIER",
        phone: "",
        fonction: "",
      })
      setSubmitting(false)
    }
  }, [open, availableRoles])

  if (!mounted) return null

  const inputCls = `w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`
  const labelCls = `block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`

  const submit = async () => {
    if (!form.lastName.trim() || !form.firstName.trim()) {
      alert("Nom et prénom sont obligatoires")
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onCreated({ email: data.user.email, plaintextPassword: data.plaintextPassword, user: data.user })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl transform transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className={`sticky top-0 z-10 flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} px-4 py-3`}>
            <div className={`text-lg font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Créer un membre du personnel</div>
            <button type="button" className={`${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`} onClick={onClose}>×</button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <label className={labelCls}>Nom *</label>
              <input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Post-nom</label>
              <input className={inputCls} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Prénom *</label>
              <input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Rôle *</label>
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>{STAFF_ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Fonction / description</label>
              <input className={inputCls} placeholder="Ex: Caissière principale" value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} />
            </div>
          </div>
          <p className={`px-4 pb-2 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            L&apos;email et le mot de passe seront générés automatiquement après la création.
          </p>
          <div className={`flex items-center justify-end gap-2 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
            <button type="button" className={`rounded-md border ${theme === "dark" ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"} px-4 py-2`} onClick={onClose}>Annuler</button>
            <button type="button" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60" onClick={submit}>
              {submitting ? "Création..." : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}