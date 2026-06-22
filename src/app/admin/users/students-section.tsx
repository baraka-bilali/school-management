"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import React from "react"
import Portal from "@/components/portal"
import { Eye, Pencil, Check, X, Plus, KeyRound, Copy, Mail, User, Download } from "lucide-react"
import { toast } from "sonner"
import { Banner } from "@/components/ui/banner"
import { authFetch } from "@/lib/auth-fetch"
import { toDisplayCode } from "@/lib/student-fields"
import { validateStudentCreateInput, type StudentCreateField } from "@/lib/student-create-validation"
import {
  AcademicYearSelect,
  type AcademicYearOption,
} from "@/components/academic-year-select"

interface PaginationState {
  page: number
  pageSize: number
}

function CreateStudentModal({
  open,
  onClose,
  classes,
  years,
  defaultYearId,
  currentYearId,
  onCreated,
  theme = "light",
}: {
  open: boolean
  onClose: () => void
  classes: Array<{ id: number; name: string }>
  years: AcademicYearOption[]
  defaultYearId?: number
  currentYearId?: number | null
  onCreated: (payload: { 
    email: string
    plaintextPassword: string
    lastName?: string
    firstName?: string
    code?: string
    classId?: number
    academicYearId?: number
  }) => void
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<StudentCreateField, string>>>({})
  const [formError, setFormError] = useState("")
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  const clearFieldError = (field: StudentCreateField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setFormError("")
  }

  const inputClass = (field?: StudentCreateField) => {
    const hasError = field && fieldErrors[field]
    const base =
      theme === "dark"
        ? "border-gray-600 bg-gray-700 text-gray-100"
        : "border-gray-300 bg-white text-gray-900"
    const err = "border-red-500 focus:ring-red-500"
    return `w-full rounded-md border px-3 py-2 ${hasError ? err : base}`
  }

  const FieldError = ({ field }: { field: StudentCreateField }) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[field]}</p>
    ) : null

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
      setFieldErrors({})
      setFormError("")
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
    const validation = validateStudentCreateInput({
      lastName: form.lastName,
      firstName: form.firstName,
      birthDate: form.birthDate,
      classId: form.classId,
      academicYearId: form.academicYearId,
    })

    if (!validation.ok) {
      setFieldErrors(validation.field ? { [validation.field]: validation.error } : {})
      setFormError(validation.field ? "" : validation.error)
      return
    }

    setFieldErrors({})
    setFormError("")
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classId: Number(form.classId),
          academicYearId: Number(form.academicYearId),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const field = data.field as StudentCreateField | undefined
        if (field) {
          setFieldErrors({ [field]: data.error || "Erreur de validation" })
        } else {
          setFormError(data.error || "Erreur lors de la création")
        }
        return
      }
      onCreated({
        email: data.user.email,
        plaintextPassword: data.plaintextPassword,
        lastName: data.student?.lastName ?? form.lastName,
        firstName: data.student?.firstName ?? form.firstName,
        code: data.student?.code ?? form.code,
        classId: Number(form.classId),
        academicYearId: Number(form.academicYearId),
      })
    } catch {
      setFormError("Impossible de contacter le serveur. Réessayez.")
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
          {formError && (
            <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {formError}
            </div>
          )}
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Nom <span className="text-red-500">*</span></label>
            <input
              className={`${inputClass("lastName")} uppercase`}
              value={form.lastName}
              onChange={(e) => {
                clearFieldError("lastName")
                setForm({ ...form, lastName: toUpper(e.target.value) })
              }}
            />
            <FieldError field="lastName" />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Post-nom</label>
            <input className={`${inputClass()} uppercase`} value={form.middleName} onChange={(e) => setForm({ ...form, middleName: toUpper(e.target.value) })} />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Prénom <span className="text-red-500">*</span></label>
            <input
              className={`${inputClass("firstName")} uppercase`}
              value={form.firstName}
              onChange={(e) => {
                clearFieldError("firstName")
                setForm({ ...form, firstName: toUpper(e.target.value) })
              }}
            />
            <FieldError field="firstName" />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Sexe</label>
            <select className={inputClass()} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Date de naissance <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              className={inputClass("birthDate")}
              value={form.birthDate}
              onChange={(e) => {
                clearFieldError("birthDate")
                setForm({ ...form, birthDate: e.target.value })
              }}
            />
            <FieldError field="birthDate" />
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
              <input
                className={inputClass("code")}
                value={form.code}
                onChange={(e) => {
                  clearFieldError("code")
                  setForm({ ...form, code: e.target.value })
                }}
                placeholder="Optionnel — auto si vide"
              />
            )}
            <FieldError field="code" />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Classe <span className="text-red-500">*</span></label>
            <select
              className={inputClass("classId")}
              value={form.classId}
              onChange={(e) => {
                clearFieldError("classId")
                setForm({ ...form, classId: e.target.value })
              }}
            >
              <option value="">Sélectionner</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FieldError field="classId" />
          </div>
          <div>
            <label className={`block ${theme === "dark" ? "text-gray-200" : "text-gray-700"} mb-1`}>Année académique <span className="text-red-500">*</span></label>
            <AcademicYearSelect
              years={years}
              currentYearId={currentYearId}
              value={form.academicYearId}
              onChange={(value) => {
                clearFieldError("academicYearId")
                setForm({ ...form, academicYearId: value })
              }}
              placeholder="Sélectionner"
              className={inputClass("academicYearId")}
            />
            <FieldError field="academicYearId" />
            <p className={`mt-1 text-[11px] ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              Toute année scolaire disponible — indépendamment du filtre de la liste.
            </p>
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
  const [years, setYears] = useState<AcademicYearOption[]>([])
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
  const [isCreateCredentials, setIsCreateCredentials] = useState(false)
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
    setIsCreateCredentials(false)
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
    setIsCreateCredentials(false)
    setSelectedStudentForReset(null)
    setNewPasswordGenerated("")
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  const handleEdit = (student: any) => {
    setEditingId(student.id)
    setEditForm({
      code: studentDisplayCode(student),
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
            enrollments: item.enrollments.map((enr: { classId: number; class: { name: string } }, idx: number) => 
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
        setYears(
          (res.years || []).map((y: AcademicYearOption) => ({
            ...y,
            isCurrent: res.currentYearId ? y.id === res.currentYearId : y.isCurrent,
          }))
        )
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
  const cellHover = theme === "dark" ? "group-hover:bg-gray-700" : "group-hover:bg-gray-50"
  const studentDisplayCode = (student: { code?: string; enrollments?: Array<{ classId?: number; yearId?: number }> }) =>
    toDisplayCode(
      student.code,
      student.enrollments?.[0]?.classId,
      student.enrollments?.[0]?.yearId
    )

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
        s.code ? studentDisplayCode(s) : "",
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
              <AcademicYearSelect
                years={years}
                currentYearId={currentYearId}
                value={filters.yearId || "all"}
                onChange={(value) =>
                  setFilters((f) => ({ ...f, yearId: value === "all" ? "all" : value }))
                }
                allowAll
                className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
              />
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
            <AcademicYearSelect
              years={years}
              currentYearId={currentYearId}
              value={filters.yearId || "all"}
              onChange={(value) =>
                setFilters((f) => ({ ...f, yearId: value === "all" ? "all" : value }))
              }
              allowAll
              className={`rounded-md border ${borderColor} ${bgInput} ${textColor} px-3 py-2 text-sm`}
            />
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
                    <div className={`font-medium ${textColor}`}>Code: {studentDisplayCode(s)}</div>
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
                      "group",
                      !enrollmentOnly && "cursor-pointer",
                      editingId === s.id ? (theme === "dark" ? "bg-blue-900/30" : "bg-blue-50") : ""
                    )} onClick={() => !enrollmentOnly && !editingId && setExpandedId(isOpen ? null : s.id)}>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.code}
                            onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                          />
                        ) : studentDisplayCode(s)}
                      </td>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.lastName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        ) : s.lastName}
                      </td>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.middleName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, middleName: e.target.value }))}
                          />
                        ) : s.middleName}
                      </td>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
                        {editingId === s.id ? (
                          <input
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.firstName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        ) : s.firstName}
                      </td>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
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
                      <td className={cn("px-3 py-2", cellHover)}>
                        {editingId === s.id ? (
                          <input
                            type="date"
                            className={`w-full rounded-md border ${borderColor} ${bgInput} ${textColor} px-2 py-1`}
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                          />
                        ) : new Date(s.birthDate).toLocaleDateString()}
                      </td>
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>
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
                      <td className={cn(`px-3 py-2 ${textColor}`, cellHover)}>{enr?.year?.name || "-"}</td>
                      {!enrollmentOnly && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {editingId === s.id ? (
                            <>
                              <button 
                                disabled={submitting}
                                title={submitting ? "Enregistrement..." : "Valider"}
                                className={`transition-colors cursor-pointer ${
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
                              </button>
                              <button 
                                disabled={submitting}
                                title="Annuler"
                                className={`transition-colors cursor-pointer ${
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
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                title="Modifier"
                                className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleEdit(s);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button 
                                title="Réinitialiser mot de passe"
                                className={`${textSecondary} hover:text-orange-500 transition-colors cursor-pointer`}
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleResetPassword(s);
                                }}
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button 
                                title="Détails"
                                className={`${textSecondary} hover:text-indigo-600 transition-colors cursor-pointer`}
                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${s.id}`); }}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      )}
                    </tr>
                    {!enrollmentOnly && isOpen && (
                    <tr key={`${s.id}-expanded`} className={theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}>
                      <td colSpan={9} className="px-3 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div><span className={textSecondary}>Nom</span><div className={`font-medium ${textColor}`}>{s.lastName}</div></div>
                            <div><span className={textSecondary}>Post-nom</span><div className={`font-medium ${textColor}`}>{s.middleName}</div></div>
                            <div><span className={textSecondary}>Prénom</span><div className={`font-medium ${textColor}`}>{s.firstName}</div></div>
                            <div><span className={textSecondary}>Sexe</span><div className={`font-medium ${textColor}`}>{s.gender}</div></div>
                            <div><span className={textSecondary}>Naissance</span><div className={`font-medium ${textColor}`}>{new Date(s.birthDate).toLocaleDateString()}</div></div>
                            <div><span className={textSecondary}>Classe</span><div className={`font-medium ${textColor}`}>{enr?.class?.name || "-"}</div></div>
                            <div><span className={textSecondary}>Année</span><div className={`font-medium ${textColor}`}>{enr?.year?.name || "-"}</div></div>
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
          currentYearId={currentYearId}
          theme={theme}
          onCreated={(payload) => {
            setShowCreate(false)
            setIsCreateCredentials(true)
            setSelectedStudentForReset({
              email: payload.email,
              lastName: payload.lastName,
              firstName: payload.firstName,
              code: toDisplayCode(payload.code, payload.classId),
            })
            setNewPasswordGenerated(payload.plaintextPassword)
            setPasswordCopied(false)
            setEmailCopied(false)
            setLoading(true)
            setPagination((p) => ({ ...p }))
            if (
              payload.academicYearId &&
              filters.yearId &&
              filters.yearId !== "all" &&
              String(payload.academicYearId) !== filters.yearId
            ) {
              const yearName = years.find((y) => y.id === payload.academicYearId)?.name
              toast.info(
                yearName
                  ? `Élève inscrit en ${yearName}. Changez le filtre d'année pour l'afficher dans la liste.`
                  : "Élève créé dans une autre année. Ajustez le filtre pour l'afficher."
              )
            }
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
                        Code: {toDisplayCode(selectedStudentForReset?.code, selectedStudentForReset?.enrollments?.[0]?.classId)}
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
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {isCreateCredentials ? "Compte créé avec succès" : "Mot de passe réinitialisé avec succès"}
                      </p>
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
                        Code: {toDisplayCode(selectedStudentForReset?.code, selectedStudentForReset?.enrollments?.[0]?.classId)}
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
                      {isCreateCredentials ? "Mot de passe temporaire" : "Nouveau mot de passe"}
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

export { StudentsSection, Toolbar, Pagination }
