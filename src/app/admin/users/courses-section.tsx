"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import Portal from "@/components/portal"
import { Plus, Trash2, BookOpen, Users, X, Loader2, Pencil, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { TableLoadingBlock } from "@/components/ui/table-loading"

interface Subject {
  id: number
  name: string
  code: string
  description: string | null
  color: string | null
  coefficient: number
  maxWeeklyHours: number
}

interface Assignment {
  id: number
  subjectId: number
  teacherId: number
  classId: number
  weeklyHours: number
  subjectName: string
  subjectCode: string
  subjectColor: string | null
  teacherName: string
  className: string
  yearName: string
}

interface TeacherOption {
  id: number
  lastName: string
  middleName: string
  firstName: string
}

interface ClassOption {
  id: number
  name: string
}

type SubTab = "subjects" | "assignments"

type DeleteTarget =
  | { type: "subject"; id: number; name: string }
  | { type: "assignment"; id: number; name: string }

const EMPTY_SUBJECT_FORM = {
  name: "",
  code: "",
  description: "",
  color: "#4f46e5",
  coefficient: "1",
  maxWeeklyHours: "5",
}

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
        {children}
      </div>
    </Portal>
  )
}

function ConfirmModal({
  theme,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
  variant = "danger",
}: {
  theme: "light" | "dark"
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  variant?: "danger"
}) {
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"

  return (
    <ModalOverlay onClose={loading ? () => {} : onCancel}>
      <div className={cn("relative w-full max-w-md rounded-2xl border shadow-2xl animate-scale-up", bgColor, borderColor)}>
        <div className={cn("border-b p-6", borderColor)}>
          <h3 className={cn("flex items-center gap-2 text-xl font-bold", textColor)}>
            <div className="rounded-lg bg-red-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            {title}
          </h3>
        </div>
        <div className="p-6">
          <p className={cn("mb-6", textColor)}>{message}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                theme === "dark"
                  ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                loading && "cursor-not-allowed opacity-50",
                variant === "danger" &&
                  (theme === "dark"
                    ? "border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100")
              )}
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  {confirmLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

function FormModal({
  theme,
  title,
  onClose,
  children,
}: {
  theme: "light" | "dark"
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return (
    <ModalOverlay onClose={onClose}>
      <div className={cn("relative w-full max-w-md rounded-2xl border shadow-2xl animate-scale-up", bgColor, borderColor)}>
        <div className={cn("flex items-center justify-between border-b p-5", borderColor)}>
          <h3 className={cn("text-lg font-bold", textColor)}>{title}</h3>
          <button type="button" onClick={onClose} className={cn("rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10", textSecondary)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </ModalOverlay>
  )
}

export function CoursesSection({ theme }: { theme: "light" | "dark" }) {
  const [subTab, setSubTab] = useState<SubTab>("subjects")
  const [tabVisible, setTabVisible] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [currentYearName, setCurrentYearName] = useState("-")
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT_FORM)
  const [assignForm, setAssignForm] = useState({
    subjectId: "",
    teacherId: "",
    classId: "",
    weeklyHours: "2",
  })

  const isDark = theme === "dark"
  const textColor = isDark ? "text-gray-100" : "text-gray-800"
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600"
  const borderColor = isDark ? "border-gray-700" : "border-gray-200"
  const rowHover = isDark ? "hover:bg-gray-700/40" : "hover:bg-gray-50"
  const inputClass = cn(
    "w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
    isDark ? "border-gray-600 bg-gray-800 text-gray-100" : "border-gray-300 bg-white text-gray-900"
  )

  const switchTab = (tab: SubTab) => {
    if (tab === subTab) return
    setTabVisible(false)
    setTimeout(() => {
      setSubTab(tab)
      setTabVisible(true)
    }, 150)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [subRes, assignRes, teachRes, metaRes] = await Promise.all([
        authFetch("/api/admin/subjects"),
        authFetch("/api/admin/course-assignments"),
        authFetch("/api/admin/teachers?pageSize=200"),
        authFetch("/api/admin/meta"),
      ])
      if (subRes.ok) {
        const d = await subRes.json()
        setSubjects(d.subjects || [])
      }
      if (assignRes.ok) {
        const d = await assignRes.json()
        setAssignments(d.assignments || [])
      }
      if (teachRes.ok) {
        const d = await teachRes.json()
        setTeachers(d.items || d.teachers || [])
      }
      if (metaRes.ok) {
        const d = await metaRes.json()
        setClasses((d.classes || []).map((c: ClassOption) => ({ id: c.id, name: c.name })))
        const current = (d.years || []).find((y: { isCurrent: boolean; name: string }) => y.isCurrent)
        if (current) setCurrentYearName(current.name)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateSubject = () => {
    setEditingSubject(null)
    setSubjectForm(EMPTY_SUBJECT_FORM)
    setShowSubjectForm(true)
  }

  const openEditSubject = (s: Subject) => {
    setEditingSubject(s)
    setSubjectForm({
      name: s.name,
      code: s.code,
      description: s.description || "",
      color: s.color || "#4f46e5",
      coefficient: String(s.coefficient),
      maxWeeklyHours: String(s.maxWeeklyHours),
    })
    setShowSubjectForm(true)
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const isEdit = !!editingSubject
      const res = await authFetch(
        isEdit ? `/api/admin/subjects/${editingSubject!.id}` : "/api/admin/subjects",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subjectForm),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(isEdit ? "Matière modifiée" : "Matière créée")
      setShowSubjectForm(false)
      setEditingSubject(null)
      setSubjectForm(EMPTY_SUBJECT_FORM)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/course-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success("Affectation enregistrée")
      setShowAssignForm(false)
      setAssignForm({ subjectId: "", teacherId: "", classId: "", weeklyHours: "2" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const url =
        deleteTarget.type === "subject"
          ? `/api/admin/subjects/${deleteTarget.id}`
          : `/api/admin/course-assignments/${deleteTarget.id}`
      const res = await authFetch(url, { method: "DELETE" })
      if (res.ok) {
        toast.success(deleteTarget.type === "subject" ? "Matière supprimée" : "Affectation retirée")
        setDeleteTarget(null)
        await loadData()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={cn("rounded-xl border px-4 py-2.5", borderColor, isDark ? "bg-gray-800/60" : "bg-indigo-50/50")}>
            <p className={textSecondary}>
              Année scolaire : <span className={cn("font-semibold", textColor)}>{currentYearName || "—"}</span>
            </p>
          </div>
          <div className={cn("flex gap-1 rounded-xl border p-1", borderColor, isDark ? "bg-gray-800/80" : "bg-gray-100/80")}>
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/25">
              Matières
            </button>
            <button type="button" className={cn("rounded-lg px-4 py-2 text-sm font-medium", textSecondary)}>
              Affectations
            </button>
          </div>
        </div>
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className={textColor}>Matières / Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <TableLoadingBlock textClassName={textSecondary} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn("rounded-xl border px-4 py-2.5", borderColor, isDark ? "bg-gray-800/60" : "bg-indigo-50/50")}>
          <p className={textSecondary}>
            Année scolaire : <span className={cn("font-semibold", textColor)}>{currentYearName}</span>
          </p>
        </div>

        {/* Matières à gauche, Affectations à droite */}
        <div className={cn("flex gap-1 rounded-xl border p-1", borderColor, isDark ? "bg-gray-800/80" : "bg-gray-100/80")}>
          <button
            type="button"
            onClick={() => switchTab("subjects")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              subTab === "subjects"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : cn(textSecondary, "hover:text-indigo-500")
            )}
          >
            Matières
          </button>
          <button
            type="button"
            onClick={() => switchTab("assignments")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              subTab === "assignments"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : cn(textSecondary, "hover:text-indigo-500")
            )}
          >
            Affectations
          </button>
        </div>
      </div>

      {/* Contenu avec transition */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          tabVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {subTab === "subjects" && (
          <Card theme={theme}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className={textColor}>Matières / Cours</CardTitle>
                <p className={cn("mt-1 text-xs", textSecondary)}>
                  Créez d&apos;abord les matières avant d&apos;assigner les professeurs.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateSubject}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
                  <BookOpen className={cn("mx-auto mb-3 h-10 w-10", textSecondary)} />
                  <p className={cn("text-sm font-medium", textColor)}>Aucune matière</p>
                  <p className={cn("mt-1 text-xs", textSecondary)}>Commencez par créer une matière.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-inherit">
                  <table className="w-full text-sm">
                    <thead className={isDark ? "bg-gray-700/50" : "bg-gray-50"}>
                      <tr className={cn("border-b text-left", borderColor)}>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Matière</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Code</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Coef.</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>H/sem.</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => (
                        <tr key={s.id} className={cn("border-b transition-colors", borderColor, rowHover)}>
                          <td className={cn("px-4 py-3.5 font-medium", textColor)}>
                            <span className="mr-2 inline-block h-3 w-3 rounded-full ring-2 ring-white/20" style={{ backgroundColor: s.color || "#4f46e5" }} />
                            {s.name}
                          </td>
                          <td className={cn("px-4 py-3.5", textSecondary)}>
                            <span className={cn("rounded-md px-2 py-0.5 text-xs font-mono", isDark ? "bg-gray-700" : "bg-gray-100")}>
                              {s.code}
                            </span>
                          </td>
                          <td className={cn("px-4 py-3.5", textSecondary)}>{s.coefficient}</td>
                          <td className={cn("px-4 py-3.5", textSecondary)}>{s.maxWeeklyHours}h</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditSubject(s)}
                                title="Modifier"
                                className={cn(
                                  "rounded-lg p-2 transition-colors",
                                  isDark ? "text-indigo-400 hover:bg-indigo-500/10" : "text-indigo-600 hover:bg-indigo-50"
                                )}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: "subject", id: s.id, name: s.name })}
                                title="Supprimer"
                                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {subTab === "assignments" && (
          <Card theme={theme}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className={textColor}>Affectations professeurs</CardTitle>
                <p className={cn("mt-1 text-xs", textSecondary)}>
                  Associez un professeur à une matière et une classe.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignForm(true)}
                disabled={subjects.length === 0}
                title={subjects.length === 0 ? "Créez d'abord une matière" : "Nouvelle affectation"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
                  <p className={cn("text-sm", textSecondary)}>Créez au moins une matière avant d&apos;assigner.</p>
                  <button
                    type="button"
                    onClick={() => switchTab("subjects")}
                    className="mt-3 text-sm font-semibold text-indigo-500 hover:text-indigo-400"
                  >
                    Aller aux matières →
                  </button>
                </div>
              ) : assignments.length === 0 ? (
                <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
                  <Users className={cn("mx-auto mb-3 h-10 w-10", textSecondary)} />
                  <p className={cn("text-sm font-medium", textColor)}>Aucune affectation</p>
                  <p className={cn("mt-1 text-xs", textSecondary)}>Assignez un cours à un professeur pour une classe.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-inherit">
                  <table className="w-full text-sm">
                    <thead className={isDark ? "bg-gray-700/50" : "bg-gray-50"}>
                      <tr className={cn("border-b text-left", borderColor)}>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Professeur</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Matière</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Classe</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>H/sem.</th>
                        <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id} className={cn("border-b transition-colors", borderColor, rowHover)}>
                          <td className={cn("px-4 py-3.5", textColor)}>
                            <span className="flex items-center gap-2">
                              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", isDark ? "bg-indigo-500/20" : "bg-indigo-50")}>
                                <Users className="h-3.5 w-3.5 text-indigo-500" />
                              </span>
                              {a.teacherName}
                            </span>
                          </td>
                          <td className={cn("px-4 py-3.5", textColor)}>
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: a.subjectColor || "#4f46e5" }} />
                              {a.subjectName}
                            </span>
                          </td>
                          <td className={cn("px-4 py-3.5", textSecondary)}>{a.className}</td>
                          <td className={cn("px-4 py-3.5", textSecondary)}>{a.weeklyHours}h</td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "assignment",
                                  id: a.id,
                                  name: `${a.subjectName} — ${a.className}`,
                                })
                              }
                              title="Retirer"
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal matière (création / édition) */}
      {showSubjectForm && (
        <FormModal
          theme={theme}
          title={editingSubject ? "Modifier la matière" : "Nouvelle matière"}
          onClose={() => {
            setShowSubjectForm(false)
            setEditingSubject(null)
          }}
        >
          <form onSubmit={handleSubjectSubmit} className="space-y-4">
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Nom *</label>
              <input className={inputClass} value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Mathématiques" required />
            </div>
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Code *</label>
              <input className={inputClass} value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="MATH" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Coefficient</label>
                <input type="number" step="0.5" min="0" className={inputClass} value={subjectForm.coefficient} onChange={(e) => setSubjectForm({ ...subjectForm, coefficient: e.target.value })} />
              </div>
              <div>
                <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Heures / sem.</label>
                <input type="number" min="1" className={inputClass} value={subjectForm.maxWeeklyHours} onChange={(e) => setSubjectForm({ ...subjectForm, maxWeeklyHours: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Couleur</label>
              <input type="color" className="h-10 w-full cursor-pointer rounded-lg border-0" value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSubject ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Enregistrement..." : editingSubject ? "Enregistrer" : "Créer"}
            </button>
          </form>
        </FormModal>
      )}

      {/* Modal affectation */}
      {showAssignForm && (
        <FormModal theme={theme} title="Nouvelle affectation" onClose={() => setShowAssignForm(false)}>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Professeur *</label>
              <select className={inputClass} value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })} required>
                <option value="">Sélectionner</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.lastName} {t.middleName} {t.firstName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Matière *</label>
              <select className={inputClass} value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })} required>
                <option value="">Sélectionner</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Classe *</label>
              <select className={inputClass} value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })} required>
                <option value="">Sélectionner</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn("mb-1.5 block text-xs font-medium", textSecondary)}>Heures par semaine</label>
              <input type="number" step="0.5" min="0.5" className={inputClass} value={assignForm.weeklyHours} onChange={(e) => setAssignForm({ ...assignForm, weeklyHours: e.target.value })} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Enregistrement..." : "Assigner"}
            </button>
          </form>
        </FormModal>
      )}

      {/* Modal confirmation suppression */}
      {deleteTarget && (
        <ConfirmModal
          theme={theme}
          title={deleteTarget.type === "subject" ? "Supprimer la matière" : "Retirer l'affectation"}
          message={
            deleteTarget.type === "subject"
              ? `Voulez-vous supprimer la matière « ${deleteTarget.name} » ? Cette action est irréversible.`
              : `Voulez-vous retirer l'affectation « ${deleteTarget.name} » ?`
          }
          confirmLabel="Supprimer"
          loading={deleting}
          onCancel={() => !deleting && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
