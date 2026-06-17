"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import React from "react"
import Portal from "@/components/portal"
import { Eye, Pencil, Check, X, Plus, KeyRound, Copy, Mail, User, Download } from "lucide-react"
import { toast } from "sonner"
import { Banner } from "@/components/ui/banner"
import { authFetch } from "@/lib/auth-fetch"

import { STAFF_ROLES, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles"

type TabKey = "students" | "teachers" | "staff"

interface PaginationState {
  page: number
  pageSize: number
}

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>("students")
  const [tabVisible, setTabVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

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
      <div className="p-6 space-y-4">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Utilisateurs</h1>
          <p className={textSecondary}>Gestion des élèves, enseignants et personnel administratif.</p>
        </div>

        {/* Tabs */}
        <div className={`flex items-center space-x-2 border-b ${borderColor}`}>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "students"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => setTab("students")}
          >
            Élèves
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "teachers"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => setTab("teachers")}
          >
            Enseignants
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "staff"
                ? "border-indigo-600 text-indigo-700"
                : `border-transparent ${textSecondary} hover:${textColor}`
            )}
            onClick={() => setTab("staff")}
          >
            Personnel
          </button>
        </div>

        <div className={`transition-all duration-250 ease-out transform ${tabVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
          {tab === "students" && <StudentsSection theme={theme} />}
          {tab === "teachers" && <TeachersSection theme={theme} />}
          {tab === "staff" && <StaffSection theme={theme} />}
        </div>
      </div>
    </Layout>
  )
}

function CreateStudentModal({
  open,
  onClose,
  classes,
  years,
  defaultYearId,
  onCreated,
  theme = "light",
}: {
  open: boolean
  onClose: () => void
  classes: Array<{ id: number; name: string }>
  years: Array<{ id: number; name: string }>
  defaultYearId?: number
  onCreated: (payload: { email: string; plaintextPassword: string }) => void
  theme?: "light" | "dark"
}) {
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    code: "",
    classId: "",
    academicYearId: defaultYearId ? String(defaultYearId) : "",
  })
  const [autoCode, setAutoCode] = useState(false)
  const [autoCodeLoading, setAutoCodeLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (defaultYearId) setForm((f) => ({ ...f, academicYearId: String(defaultYearId) }))
  }, [defaultYearId])

  // reset form when opening the modal so previous inputs are cleared
  useEffect(() => {
    if (open) {
      setForm({
        lastName: "",
        middleName: "",
        firstName: "",
        gender: "M",
        birthDate: "",
        code: "",
        classId: "",
        academicYearId: defaultYearId ? String(defaultYearId) : "",
      })
      setAutoCode(false)
      setSubmitting(false)
    }
  }, [open, defaultYearId])

  // Auto-fetch next code when autoCode is on and classId changes
  useEffect(() => {
    if (!autoCode || !form.classId) return
    let cancelled = false
    setAutoCodeLoading(true)
    const params = new URLSearchParams({ classId: form.classId })
    if (form.academicYearId) params.set("yearId", form.academicYearId)
    authFetch(`/api/admin/students/next-code?${params}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setForm(f => ({ ...f, code: String(data.nextCode ?? 1) }))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAutoCodeLoading(false) })
    return () => { cancelled = true }
  }, [autoCode, form.classId, form.academicYearId])

  // manage mount/visibility so opening animates smoothly
  useEffect(() => {
    if (open) {
      setMounted(true)
      // allow the element to mount first, then set visible to trigger CSS transition
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }

    // closing: animate out first then unmount
    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  const toUpper = (v: string) => v.toUpperCase()

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classId: Number(form.classId),
          academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        }),
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
      {/* overlay */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!visible}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* dialog */}
        <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} role="dialog" aria-modal="true">
          <div className={`flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
            <div className={`text-lg font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Créer un élève</div>
            <button className={`${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`} onClick={onClose} aria-label="Fermer">×</button>
          </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Nom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2 uppercase`} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: toUpper(e.target.value) })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Post-nom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2 uppercase`} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: toUpper(e.target.value) })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Prénom</label>
            <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2 uppercase`} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: toUpper(e.target.value) })} />
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
            <div className="flex items-center justify-between mb-1">
              <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Code</label>
              <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                <input
                  type="checkbox"
                  checked={autoCode}
                  onChange={(e) => {
                    setAutoCode(e.target.checked)
                    if (!e.target.checked) setForm(f => ({ ...f, code: "" }))
                  }}
                  className="rounded"
                />
                Auto-incrémenter
              </label>
            </div>
            {autoCode ? (
              <div className={`relative w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-400" : "border-gray-300 bg-gray-50 text-gray-500"} px-3 py-2 flex items-center`}>
                <span className="flex-1 font-mono">
                  {autoCodeLoading ? "..." : (form.code || (form.classId ? "Sélectionnez une classe" : "—"))}
                </span>
                {autoCodeLoading && <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin ml-2" />}
              </div>
            ) : (
              <input className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Optionnel — auto si vide" />
            )}
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Classe</label>
            <select className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Sélectionner</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Année académique</label>
            <select className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`} value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">Sélectionner</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
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

function Toolbar({
  placeholder,
  onCreate,
  rightContent,
  onSearch,
  theme,
  isSearching = false,
}: {
  placeholder: string
  onCreate: () => void
  rightContent?: React.ReactNode
  onSearch: (q: string) => void
  theme?: "light" | "dark"
  isSearching?: boolean
}) {
  const [q, setQ] = useState("")
  useEffect(() => {
    // Augmentation du debounce à 500ms pour réduire les appels API pendant la saisie
    const id = setTimeout(() => onSearch(q), 500)
    return () => clearTimeout(id)
  }, [q])

  const bgInput = theme === "dark" ? "bg-gray-700" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-1 flex items-center gap-2 relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={`w-full sm:max-w-sm rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        )}
        {rightContent}
      </div>
      <button
        onClick={onCreate}
        aria-label="Créer"
        title="Créer"
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function Pagination({ state, setState, total }: { state: PaginationState; setState: (s: PaginationState) => void; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize))
  const isFirstPage = state.page === 1
  const isLastPage = state.page >= totalPages
  
  const startItem = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1
  const endItem = Math.min(state.page * state.pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Info et sélecteur de taille */}
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="font-medium">
          {total === 0 ? "Aucun résultat" : `${startItem}-${endItem} sur ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Afficher:</span>
          <select
            value={state.pageSize}
            onChange={(e) => setState({ ...state, pageSize: Number(e.target.value), page: 1 })}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={20}>20</option>
            <option value={40}>40</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setState({ ...state, page: Math.max(1, state.page - 1) })}
          disabled={isFirstPage}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-colors",
            isFirstPage
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          Précédent
        </button>
        
        <div className="px-3 py-2 text-sm font-medium text-gray-700">
          Page {state.page} / {totalPages}
        </div>

        <button
          onClick={() => setState({ ...state, page: Math.min(totalPages, state.page + 1) })}
          disabled={isLastPage}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-colors",
            isLastPage
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

function StudentsSection({ theme, enrollmentOnly = false }: { theme: "light" | "dark"; enrollmentOnly?: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 })
  const [filters, setFilters] = useState<{ q?: string; classId?: string; yearId?: string; sort?: string }>({ sort: "name_asc" })
  const [searchInput, setSearchInput] = useState("")
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([])
  const [years, setYears] = useState<Array<{ id: number; name: string; current: boolean }>>([])
  const [currentYearId, setCurrentYearId] = useState<number | null>(null)
  const [banner, setBanner] = useState<{
    message?: string;
    email?: string;
    password?: string;
    type?: 'success' | 'error';
    notificationType: 'create' | 'update';
  } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    code: "",
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    classId: "",
  })

  // États pour la réinitialisation de mot de passe
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<any>(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newPasswordGenerated, setNewPasswordGenerated] = useState("")
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  // Debounce pour la recherche - applique le filtre après 500ms
  useEffect(() => {
    const timerId = setTimeout(() => {
      setFilters(f => ({ ...f, q: searchInput }))
    }, 500)
    return () => clearTimeout(timerId)
  }, [searchInput])

  // Gestionnaire pour réinitialiser le mot de passe
  const handleResetPassword = (student: any) => {
    setSelectedStudentForReset(student)
    setShowResetPasswordModal(true)
    setNewPasswordGenerated("")
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  // Confirmer la réinitialisation
  const handleConfirmResetPassword = async () => {
    if (!selectedStudentForReset) return
    
    try {
      setResettingPassword(true)
      const res = await authFetch(`/api/admin/students/${selectedStudentForReset.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        setNewPasswordGenerated(data.newPassword)
        // Mettre à jour les infos de l'élève avec l'email retourné
        setSelectedStudentForReset({
          ...selectedStudentForReset,
          email: data.student.email
        })
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Erreur lors de la réinitialisation du mot de passe')
        setShowResetPasswordModal(false)
      }
    } catch (e: any) {
      console.error('Erreur reset password:', e)
      toast.error('Une erreur est survenue')
      setShowResetPasswordModal(false)
    } finally {
      setResettingPassword(false)
    }
  }

  // Fermer le modal de réinitialisation
  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false)
    setSelectedStudentForReset(null)
    setNewPasswordGenerated("")
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  const handleEdit = (student: any) => {
    setEditingId(student.id)
    setEditForm({
      code: student.code,
      lastName: student.lastName,
      middleName: student.middleName,
      firstName: student.firstName,
      gender: student.gender,
      birthDate: student.birthDate.split('T')[0],
      classId: student.enrollments?.[0]?.classId?.toString() || "",
    })
  }

  const handleSaveEdit = async (studentId: number) => {
    // Empêcher les soumissions multiples
    if (submitting) return
    
    try {
      setSubmitting(true)
      
      // avoid sending update when nothing changed
      const original = items.find((it) => it.id === studentId)
      const originalClassId = original?.enrollments?.[0]?.classId?.toString() || ""
      const changed = (
        original?.code !== editForm.code ||
        original?.lastName !== editForm.lastName ||
        original?.middleName !== editForm.middleName ||
        original?.firstName !== editForm.firstName ||
        original?.gender !== editForm.gender ||
        (original?.birthDate?.split?.('T')?.[0] || '') !== editForm.birthDate ||
        originalClassId !== (editForm.classId || '')
      )

      if (!changed) {
        setEditingId(null)
        setSubmitting(false)
        setBanner({ message: "Aucune modification détectée.", type: "success", notificationType: "update" })
        setTimeout(() => setBanner(null), 2500)
        return
      }

      const response = await authFetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          classId: editForm.classId ? Number(editForm.classId) : undefined,
        }),
      })

      // handle JSON or non-JSON responses gracefully
      const text = await response.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        data = { error: text }
      }

      if (!response.ok) {
        throw new Error(data.error || text || 'Erreur lors de la modification')
      }

      // Trouver le nom de la classe sélectionnée
      const selectedClass = classes.find(c => c.id === Number(editForm.classId))

      // Mettre à jour la liste des étudiants LOCALEMENT avec les nouvelles données
      setItems(items.map(item => {
        if (item.id === studentId) {
          return {
            ...item,
            code: editForm.code,
            lastName: editForm.lastName,
            middleName: editForm.middleName,
            firstName: editForm.firstName,
            gender: editForm.gender,
            birthDate: editForm.birthDate,
            enrollments: item.enrollments.map((enr, idx) => 
              idx === 0 ? {
                ...enr,
                classId: editForm.classId ? Number(editForm.classId) : enr.classId,
                class: selectedClass ? { ...enr.class, name: selectedClass.name } : enr.class
              } : enr
            ),
          }
        }
        return item
      }))

      setEditingId(null)
      setSubmitting(false)
      setBanner({ 
        message: "L'étudiant a été mis à jour avec succès", 
        type: "success",
        notificationType: "update"
      })
      setTimeout(() => setBanner(null), 3000)
    } catch (error) {
      setSubmitting(false)
      setBanner({ 
        message: "Une erreur est survenue lors de la modification de l'étudiant", 
        type: "error",
        notificationType: "update"
      })
      setTimeout(() => setBanner(null), 3000)
      console.error(error)
    }
  }

  // Load filter data (classes and academic years)
  useEffect(() => {
    authFetch("/api/admin/meta")
      .then((r) => r.json())
      .then((res) => {
        setClasses(res.classes || [])
        setYears(res.years || [])
        if (res.currentYearId) {
          setCurrentYearId(res.currentYearId)
          setFilters((f) => ({ ...f, yearId: String(res.currentYearId) }))
        }
      })
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Logging de performance pour mesurer la vitesse réelle
      const perfLabel = `[PERF] Students fetch (q=${filters.q || 'none'}, page=${pagination.page})`
      console.time(perfLabel)
      
      try {
        const params = new URLSearchParams()
        if (filters.q) params.set("q", filters.q)
        if (filters.classId) params.set("classId", filters.classId)
        if (filters.yearId) params.set("yearId", filters.yearId)
        if (filters.sort) params.set("sort", filters.sort)
        params.set("page", String(pagination.page))
        params.set("pageSize", String(pagination.pageSize))
        
        const response = await authFetch(`/api/admin/students?${params.toString()}`)
        const res = await response.json()
        setItems(res.items || [])
        setTotal(res.total || 0)
        
        console.timeEnd(perfLabel)
        console.log(`[PERF] Loaded ${res.items?.length || 0} students out of ${res.total || 0} total`)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        console.timeEnd(perfLabel)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pagination, filters])

  // Variables de couleur basées sur le thème
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgInput = theme === "dark" ? "bg-gray-700" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"

  const exportStudents = () => {
    if (!items.length) return
    const selectedYear = years.find((y) => String(y.id) === filters.yearId)
    const yearLabel = selectedYear?.name || "annee-inconnue"
    const date = new Date().toISOString().slice(0, 10)
    const BOM = "\uFEFF"
    const header = ["Code", "Nom", "Post-nom", "Prénom", "Sexe", "Date naissance", "Classe", "Année", "Statut"]
    const rows = items.map((s) => {
      const enr = s.enrollments?.[0]
      return [
        s.code ?? "",
        s.lastName ?? "",
        s.middleName ?? "",
        s.firstName ?? "",
        s.gender ?? "",
        s.birthDate ? new Date(s.birthDate).toLocaleDateString("fr-FR") : "",
        enr?.class?.name ?? "",
        enr?.year?.name ?? "",
        enr?.status ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")
    })
    const csv = BOM + [header.join(";"), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `eleves-${yearLabel.replace(/\s+/g, "-")}-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle>Élèves</CardTitle>
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
        {/* Barre de recherche par mots clés */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Rechercher par nom, post-nom ou code"
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
              </div>
            )}
          </div>
          {!enrollmentOnly && (
          <button
            onClick={exportStudents}
            aria-label="Télécharger CSV"
            title="Télécharger la liste en CSV"
            className="inline-flex items-center justify-center rounded-full bg-green-600 p-2 text-white hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            aria-label="Ajouter"
            title="Ajouter"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Filtres en dessous */}
        <div className="space-y-3">
          {/* Version mobile : Filtres en colonne */}
          <div className="md:hidden flex flex-col gap-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              <select
                className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
                value={filters.classId || ""}
                onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value || undefined }))}
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
                value={filters.yearId || "all"}
                onChange={(e) => setFilters((f) => ({ ...f, yearId: e.target.value === "all" ? "all" : e.target.value }))}
              >
                <option value="all">Toutes les années</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}{y.current ? " (en cours)" : ""}</option>
                ))}
              </select>
            </div>
            <select
              className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="name_asc">Nom (A→Z)</option>
              <option value="name_desc">Nom (Z→A)</option>
              <option value="class">Classe</option>
            </select>
          </div>

          {/* Version desktop : Filtres en ligne */}
          <div className="hidden md:flex items-center gap-2">
            <select
              className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
              value={filters.classId || ""}
              onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value || undefined }))}
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
              value={filters.yearId || "all"}
              onChange={(e) => setFilters((f) => ({ ...f, yearId: e.target.value === "all" ? "all" : e.target.value }))}
            >
              <option value="all">Toutes les années</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.current ? " (en cours)" : ""}</option>
              ))}
            </select>
            <select
              className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="name_asc">Nom (A→Z)</option>
              <option value="name_desc">Nom (Z→A)</option>
              <option value="class">Classe</option>
            </select>
          </div>
        </div>

        <div>
          {/* Mobile: stacked cards */}
          <div className="md:hidden space-y-3">
            {loading && (
              <div className={`px-3 py-8 text-center ${textSecondary}`}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p>Chargement des données...</p>
                </div>
              </div>
            )}
            {!loading && items.map((s) => {
              const enr = s.enrollments?.[0]
              return (
                <div key={`mobile-${s.id}`} className={`p-4 ${bgCard} rounded-md shadow-sm border ${borderColor} space-y-4`}>
                  {/* En-tête avec code et actions */}
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${textColor}`}>Code: {s.code}</div>
                    {!enrollmentOnly && (
                    <button className={`rounded-full p-2 ${textSecondary} hover:text-indigo-600 ${hoverBg}`} onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${s.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </button>
                    )}
                  </div>

                  {/* Informations personnelles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className={`text-sm font-medium ${textSecondary}`}>Nom complet</div>
                      <div className={`mt-1 text-sm ${textColor}`}>{s.lastName} {s.middleName}</div>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${textSecondary}`}>Prénom</div>
                      <div className={`mt-1 text-sm ${textColor}`}>{s.firstName}</div>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${textSecondary}`}>Classe</div>
                      <div className={`mt-1 text-sm ${textColor}`}>{enr?.class?.name || '-'}</div>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${textSecondary}`}>Année</div>
                      <div className={`mt-1 text-sm ${textColor}`}>{enr?.year?.name || '-'}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {!loading && items.length === 0 && (
              <div className={`px-3 py-8 text-center ${textSecondary}`}>Aucun élève trouvé.</div>
            )}
          </div>

          {/* Desktop/tablet: keep existing table */}
          <div className="hidden md:block overflow-x-auto relative">
            <table className="min-w-full text-sm">
            <thead className={theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}>
              <tr>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Nom</th>
                <th className="px-3 py-2 text-left font-medium">Post-nom</th>
                <th className="px-3 py-2 text-left font-medium">Prénom</th>
                <th className="px-3 py-2 text-left font-medium">Sexe</th>
                <th className="px-3 py-2 text-left font-medium">Naissance</th>
                <th className="px-3 py-2 text-left font-medium">Classe</th>
                <th className="px-3 py-2 text-left font-medium">Année</th>
                {!enrollmentOnly && <th className="px-3 py-2 text-left font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {loading && (
                <tr>
                  <td colSpan={enrollmentOnly ? 8 : 9} className={`px-3 py-12 ${textSecondary}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p>Chargement des données...</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && items.map((s) => {
                const enr = s.enrollments?.[0]
                const isOpen = expandedId === s.id
                return (
                  <React.Fragment key={s.id}>
                    <tr className={cn(
                      hoverBg,
                      "cursor-pointer",
                      editingId === s.id ? (theme === "dark" ? "bg-blue-900/30" : "bg-blue-50") : ""
                    )} onClick={() => !enrollmentOnly && !editingId && setExpandedId(isOpen ? null : s.id)}>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.code}
                            onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                          />
                        ) : s.code}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.lastName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        ) : s.lastName}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.middleName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, middleName: e.target.value }))}
                          />
                        ) : s.middleName}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.firstName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        ) : s.firstName}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <select
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.gender}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                          >
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        ) : s.gender}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            type="date"
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                          />
                        ) : new Date(s.birthDate).toLocaleDateString()}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>
                        {editingId === s.id ? (
                          <select
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.classId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                          >
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : enr?.class?.name || "-"}
                      </td>
                      <td className={`px-3 py-2 ${textColor}`}>{enr?.year?.name || "-"}</td>
                      {!enrollmentOnly && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {editingId === s.id ? (
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
                                  if (!submitting) handleSaveEdit(s.id);
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
                              <button 
                                className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer relative group`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleEdit(s);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  Modifier
                                </span>
                              </button>
                              <button 
                                className={`${textSecondary} hover:text-orange-500 transition-colors cursor-pointer relative group`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleResetPassword(s);
                                }}
                              >
                                <KeyRound className="h-4 w-4" />
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  Réinitialiser mot de passe
                                </span>
                              </button>
                              <button 
                                className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer relative group`}
                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${s.id}`); }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className={`absolute -top-7 left-1/2 transform -translate-x-1/2 ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-gray-800 text-white"} text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50`}>
                                  Détails
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      )}
                    </tr>
                    {!enrollmentOnly && (
                    <tr key={`${s.id}-expanded`} className={theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}>
                      <td colSpan={9} className="px-3 py-0">
                        <div className={cn(
                          "overflow-hidden transition-all duration-300",
                          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm py-3">
                            <div><span className={textSecondary}>Nom</span><div className={`font-medium ${textColor}`}>{s.lastName}</div></div>
                            <div><span className={textSecondary}>Post-nom</span><div className={`font-medium ${textColor}`}>{s.middleName}</div></div>
                            <div><span className={textSecondary}>Prénom</span><div className={`font-medium ${textColor}`}>{s.firstName}</div></div>
                            <div><span className={textSecondary}>Sexe</span><div className={`font-medium ${textColor}`}>{s.gender}</div></div>
                            <div><span className={textSecondary}>Naissance</span><div className={`font-medium ${textColor}`}>{new Date(s.birthDate).toLocaleDateString()}</div></div>
                            <div><span className={textSecondary}>Classe</span><div className={`font-medium ${textColor}`}>{enr?.class?.name || "-"}</div></div>
                            <div><span className={textSecondary}>Année</span><div className={`font-medium ${textColor}`}>{enr?.year?.name || "-"}</div></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={enrollmentOnly ? 8 : 9} className={`px-3 py-8 text-center ${textSecondary}`}>Aucun élève trouvé.</td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>

        <Pagination state={pagination} setState={setPagination} total={total} />
        <CreateStudentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          classes={classes}
          years={years}
          defaultYearId={currentYearId || undefined}
          theme={theme}
          onCreated={(payload) => {
            setShowCreate(false)
            // show credentials banner (no extra message)
            setBanner({
              email: payload.email,
              password: payload.plaintextPassword,
              type: "success",
              notificationType: "create"
            })
            // show loading while refreshing
            setLoading(true)
            setPagination((p) => ({ ...p }))
          }}
        />

        {/* Modal de confirmation de réinitialisation de mot de passe */}
        {showResetPasswordModal && !newPasswordGenerated && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeResetPasswordModal} />
              
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
                      {selectedStudentForReset?.firstName?.charAt(0)}{selectedStudentForReset?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {selectedStudentForReset?.lastName} {selectedStudentForReset?.middleName} {selectedStudentForReset?.firstName}
                      </p>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Code: {selectedStudentForReset?.code}
                      </p>
                    </div>
                  </div>
                  
                  <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
                    Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet élève ?
                  </p>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Un nouveau mot de passe temporaire sera généré. L'élève devra le changer lors de sa prochaine connexion.
                  </p>
                </div>

                <div className={`p-6 flex gap-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    onClick={closeResetPasswordModal}
                    disabled={resettingPassword}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                        : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmResetPassword}
                    disabled={resettingPassword}
                    className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    {resettingPassword ? "Réinitialisation..." : "Réinitialiser"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Modal affichage des nouveaux identifiants */}
        {newPasswordGenerated && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeResetPasswordModal} />
              
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
                  {/* Avertissement */}
                  <div className={`${theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50"} border ${theme === "dark" ? "border-yellow-500/30" : "border-yellow-200"} rounded-lg p-4`}>
                    <p className={`${theme === "dark" ? "text-yellow-400" : "text-yellow-700"} text-sm font-medium flex items-start gap-2`}>
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>
                        <strong>Important :</strong> Copiez ces identifiants maintenant ! Ils ne seront plus affichés après la fermeture de cette fenêtre.
                      </span>
                    </p>
                  </div>

                  {/* Infos élève */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {selectedStudentForReset?.lastName} {selectedStudentForReset?.firstName}
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Code: {selectedStudentForReset?.code}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2 flex items-center gap-1.5`}>
                      <Mail className="w-3.5 h-3.5" />
                      Adresse email
                    </label>
                    <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} border-2 ${emailCopied ? "border-green-500" : theme === "dark" ? "border-gray-600" : "border-gray-200"} rounded-lg p-3 flex items-center justify-between hover:border-indigo-500 transition-all`}>
                      <span className={`font-mono text-sm ${theme === "dark" ? "text-gray-100" : "text-gray-900"} select-all`}>
                        {selectedStudentForReset?.email}
                      </span>
                      <button
                        onClick={() => {
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(selectedStudentForReset?.email || "")
                          } else {
                            const textArea = document.createElement('textarea')
                            textArea.value = selectedStudentForReset?.email || ""
                            textArea.style.position = 'fixed'
                            textArea.style.left = '-9999px'
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                          }
                          setEmailCopied(true)
                          setTimeout(() => setEmailCopied(false), 2000)
                        }}
                        className={`transition-colors p-1.5 rounded ${
                          emailCopied 
                            ? "text-green-500 bg-green-500/20" 
                            : "text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                        }`}
                        title={emailCopied ? "Copié !" : "Copier l'email"}
                      >
                        {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className={`block text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"} mb-2 flex items-center gap-1.5`}>
                      <KeyRound className="w-3.5 h-3.5" />
                      Nouveau mot de passe
                    </label>
                    <div className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} border-2 ${passwordCopied ? "border-green-500" : theme === "dark" ? "border-gray-600" : "border-gray-200"} rounded-lg p-3 flex items-center justify-between hover:border-orange-500 transition-all`}>
                      <span className={`font-mono text-lg font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"} select-all`}>
                        {newPasswordGenerated}
                      </span>
                      <button
                        onClick={() => {
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(newPasswordGenerated)
                          } else {
                            const textArea = document.createElement('textarea')
                            textArea.value = newPasswordGenerated
                            textArea.style.position = 'fixed'
                            textArea.style.left = '-9999px'
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                          }
                          setPasswordCopied(true)
                          setTimeout(() => setPasswordCopied(false), 2000)
                        }}
                        className={`transition-colors p-1.5 rounded ${
                          passwordCopied 
                            ? "text-green-500 bg-green-500/20" 
                            : "text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                        }`}
                        title={passwordCopied ? "Copié !" : "Copier le mot de passe"}
                      >
                        {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    L'élève devra changer ce mot de passe lors de sa prochaine connexion.
                  </p>
                </div>

                <div className={`p-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    onClick={closeResetPasswordModal}
                    className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      passwordCopied && emailCopied
                        ? theme === "dark"
                          ? "bg-green-500/30 hover:bg-green-500/40 text-green-300 border border-green-500/70"
                          : "bg-green-100 hover:bg-green-200 text-green-700 border border-green-300"
                        : theme === "dark"
                        ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                        : "bg-green-50 hover:bg-green-100 text-green-600 border border-green-200"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {passwordCopied && emailCopied ? "✓ Identifiants copiés !" : "J'ai copié les identifiants"}
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
          {/* Mobile: stacked cards for teachers */}
          <div className="md:hidden space-y-3">
            {loading && (
              <div className={`px-3 py-8 text-center ${textSecondary}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  Chargement des données...
                </div>
              </div>
            )}
            {!loading && items.map((t) => (
              <div key={`mobile-teacher-${t.id}`} className={`p-4 ${bgCard} rounded-md shadow-sm border ${borderColor} space-y-4`}>
                {/* En-tête avec actions */}
                <div className="flex items-center justify-end">
                  <button className={`rounded-full p-2 ${textSecondary} hover:text-indigo-600 ${hoverBg}`} onClick={(e) => { e.stopPropagation(); }}>
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {/* Informations personnelles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm font-medium ${textSecondary}`}>Nom complet</div>
                    <div className={`mt-1 text-sm ${textColor}`}>{t.lastName} {t.middleName}</div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${textSecondary}`}>Prénom</div>
                    <div className={`mt-1 text-sm ${textColor}`}>{t.firstName}</div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${textSecondary}`}>Spécialité</div>
                    <div className={`mt-1 text-sm ${textColor}`}>{t.specialty || '-'}</div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${textSecondary}`}>Téléphone</div>
                    <div className={`mt-1 text-sm ${textColor}`}>{t.phone || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
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
                <tr>
                  <td colSpan={9} className={`px-3 py-12 ${textSecondary}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p>Chargement des données...</p>
                    </div>
                  </td>
                </tr>
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
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!visible}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} role="dialog" aria-modal="true">
          <div className={`flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
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
      try {
        const r = await authFetch(`/api/admin/staff?${params.toString()}`)
        const res = await r.json()
        if (!r.ok) throw new Error(res.error || "Erreur")
        setItems(res.items || [])
        setTotal(res.total || 0)
      } catch (e) {
        console.error(e)
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
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou fonction..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
            className={`flex-1 rounded-xl border ${borderColor} ${theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"} px-4 py-2 text-sm`}
          />
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Créer
          </button>
        </div>

        <div className="overflow-x-auto">
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
                <tr>
                  <td colSpan={9} className={`px-3 py-8 text-center ${textSecondary}`}>Chargement...</td>
                </tr>
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
}: {
  open: boolean
  onClose: () => void
  onCreated: (payload: { email: string; plaintextPassword: string; user: Record<string, unknown> }) => void
  theme?: "light" | "dark"
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
        role: "CAISSIER",
        phone: "",
        fonction: "",
      })
      setSubmitting(false)
    }
  }, [open])

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
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all duration-200 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className={`flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
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
                {STAFF_ROLES.map((role) => (
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

export { StudentsSection }