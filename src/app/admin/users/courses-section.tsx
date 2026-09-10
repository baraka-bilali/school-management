"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import Portal from "@/components/portal"
import { Plus, Trash2, Users, X, Loader2, Pencil, AlertTriangle, Check } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { TableLoadingBlock } from "@/components/ui/table-loading"

interface Subject {
  id: number
  name: string
  code: string
  color: string | null
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
}: {
  theme: "light" | "dark"
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
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
                theme === "dark"
                  ? "border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
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
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
}: {
  theme: "light" | "dark"
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "md" | "lg" | "xl"
}) {
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const maxW = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-md"

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className={cn(
          "relative flex w-full max-h-[min(92vh,880px)] flex-col overflow-hidden rounded-2xl border shadow-2xl animate-scale-up",
          maxW,
          bgColor,
          borderColor
        )}
      >
        <div className={cn("flex shrink-0 items-start justify-between gap-3 border-b px-6 py-5", bgColor, borderColor)}>
          <div className="min-w-0">
            <h3 className={cn("text-lg font-bold sm:text-xl", textColor)}>{title}</h3>
            {subtitle ? <p className={cn("mt-1 text-sm", textSecondary)}>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
              textSecondary
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className={cn("shrink-0 border-t px-6 py-4", bgColor, borderColor)}>{footer}</div>
        ) : null}
      </div>
    </ModalOverlay>
  )
}

export function CoursesSection({ theme }: { theme: "light" | "dark" }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [currentYearName, setCurrentYearName] = useState("-")
  const [loading, setLoading] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assignForm, setAssignForm] = useState({
    subjectId: "",
    teacherId: "",
    classId: "",
    classIds: [] as string[],
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

  const openCreateAssignment = () => {
    setEditingAssignment(null)
    setAssignForm({ subjectId: "", teacherId: "", classId: "", classIds: [] })
    setShowAssignForm(true)
  }

  const openEditAssignment = (a: Assignment) => {
    setEditingAssignment(a)
    setAssignForm({
      subjectId: String(a.subjectId),
      teacherId: String(a.teacherId),
      classId: String(a.classId),
      classIds: [String(a.classId)],
    })
    setShowAssignForm(true)
  }

  const toggleAssignClass = (id: string) => {
    setAssignForm((prev) => {
      const selected = prev.classIds.includes(id)
        ? prev.classIds.filter((x) => x !== id)
        : [...prev.classIds, id]
      return { ...prev, classIds: selected, classId: selected[0] || "" }
    })
  }

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const isEdit = !!editingAssignment
      if (!isEdit && assignForm.classIds.length === 0) {
        throw new Error("Sélectionnez au moins une classe")
      }
      const res = await authFetch(
        isEdit
          ? `/api/admin/course-assignments/${editingAssignment!.id}`
          : "/api/admin/course-assignments",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  subjectId: assignForm.subjectId,
                  teacherId: assignForm.teacherId,
                  classId: assignForm.classId,
                }
              : {
                  subjectId: assignForm.subjectId,
                  teacherId: assignForm.teacherId,
                  classIds: assignForm.classIds.map((id) => parseInt(id, 10)),
                }
          ),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      if (isEdit) {
        toast.success("Affectation modifiée")
      } else {
        const n = data.count ?? assignForm.classIds.length
        toast.success(
          n > 1 ? `${n} affectations enregistrées` : "Affectation enregistrée"
        )
      }
      setShowAssignForm(false)
      setEditingAssignment(null)
      setAssignForm({ subjectId: "", teacherId: "", classId: "", classIds: [] })
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
      const res = await authFetch(`/api/admin/course-assignments/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Affectation retirée")
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
        <div className={cn("rounded-xl border px-4 py-2.5", borderColor, isDark ? "bg-gray-800/60" : "bg-indigo-50/50")}>
          <p className={textSecondary}>
            Année scolaire : <span className={cn("font-semibold", textColor)}>{currentYearName || "—"}</span>
          </p>
        </div>
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className={textColor}>Affectations professeurs</CardTitle>
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
      <div className={cn("rounded-xl border px-4 py-2.5", borderColor, isDark ? "bg-gray-800/60" : "bg-indigo-50/50")}>
        <p className={textSecondary}>
          Année scolaire : <span className={cn("font-semibold", textColor)}>{currentYearName}</span>
        </p>
      </div>

      <Card theme={theme}>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className={textColor}>Affectations professeurs</CardTitle>
            <p className={cn("mt-1 text-xs", textSecondary)}>
              Associez un professeur à une matière existante et une ou plusieurs classes.{" "}
              <Link href="/admin/classes?tab=subjects" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Gérer les matières
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateAssignment}
            disabled={subjects.length === 0}
            title={subjects.length === 0 ? "Créez d'abord une matière dans Classes & Filières" : "Nouvelle affectation"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
              <Users className={cn("mx-auto mb-3 h-10 w-10", textSecondary)} />
              <p className={cn("text-sm font-medium", textColor)}>Aucune matière disponible</p>
              <p className={cn("mt-1 text-xs", textSecondary)}>
                Créez d&apos;abord les matières dans{" "}
                <Link href="/admin/classes?tab=subjects" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  Classes &amp; Filières → Matières
                </Link>
                .
              </p>
            </div>
          ) : assignments.length === 0 ? (
            <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
              <Users className={cn("mx-auto mb-3 h-10 w-10", textSecondary)} />
              <p className={cn("text-sm font-medium", textColor)}>Aucune affectation</p>
              <p className={cn("mt-1 text-xs", textSecondary)}>Assignez un professeur à une matière et une classe.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-2.5">
                {assignments.map((a) => (
                  <div key={`m-asg-${a.id}`} className={cn("rounded-xl border p-3.5", borderColor)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: a.subjectColor || "#4f46e5" }} />
                          <span className={cn("truncate text-sm font-semibold", textColor)}>{a.subjectName}</span>
                        </div>
                        <div className={cn("mt-1 text-xs", textSecondary)}>
                          {a.teacherName} · {a.className}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditAssignment(a)}
                          title="Modifier"
                          className={cn("rounded-lg p-2 transition-colors", isDark ? "text-indigo-400 hover:bg-indigo-500/10" : "text-indigo-600 hover:bg-indigo-50")}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              id: a.id,
                              name: `${a.subjectName} — ${a.className}`,
                            })
                          }
                          title="Retirer"
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-lg border border-inherit">
                <table className="w-full text-sm">
                  <thead className={isDark ? "bg-gray-700/50" : "bg-gray-50"}>
                    <tr className={cn("border-b text-left", borderColor)}>
                      <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Matière</th>
                      <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Professeur</th>
                      <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Classe</th>
                      <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className={cn("border-b transition-colors", borderColor, rowHover)}>
                        <td className={cn("px-4 py-3.5 font-medium", textColor)}>
                          <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: a.subjectColor || "#4f46e5" }} />
                          {a.subjectName}
                          <span className={cn("ml-2 text-xs font-normal", textSecondary)}>({a.subjectCode})</span>
                        </td>
                        <td className={cn("px-4 py-3.5", textSecondary)}>{a.teacherName}</td>
                        <td className={cn("px-4 py-3.5", textSecondary)}>{a.className}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditAssignment(a)}
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
                              onClick={() =>
                                setDeleteTarget({
                                  id: a.id,
                                  name: `${a.subjectName} — ${a.className}`,
                                })
                              }
                              title="Retirer"
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
            </>
          )}
        </CardContent>
      </Card>

      {showAssignForm && (
        <FormModal
          theme={theme}
          size="xl"
          title={editingAssignment ? "Modifier l'affectation" : "Nouvelle affectation"}
          subtitle={
            editingAssignment
              ? "Modifiez le professeur, la matière ou la classe."
              : "Assignez un professeur et une matière à une ou plusieurs classes."
          }
          onClose={() => {
            setShowAssignForm(false)
            setEditingAssignment(null)
          }}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn("text-xs font-medium", !editingAssignment && assignForm.classIds.length ? "text-indigo-600 dark:text-indigo-400" : textSecondary)}>
                {editingAssignment
                  ? " "
                  : assignForm.classIds.length === 0
                    ? "Aucune classe sélectionnée"
                    : `${assignForm.classIds.length} classe${assignForm.classIds.length > 1 ? "s" : ""} sélectionnée${assignForm.classIds.length > 1 ? "s" : ""}`}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(false)
                    setEditingAssignment(null)
                  }}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    isDark
                      ? "border border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="assignment-form"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingAssignment ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting
                    ? "Enregistrement..."
                    : editingAssignment
                      ? "Enregistrer"
                      : assignForm.classIds.length > 1
                        ? `Assigner (${assignForm.classIds.length})`
                        : "Assigner"}
                </button>
              </div>
            </div>
          }
        >
          <form id="assignment-form" onSubmit={handleAssignmentSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide", textSecondary)}>
                  Professeur *
                </label>
                <select
                  className={inputClass}
                  value={assignForm.teacherId}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un professeur</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.lastName} {t.middleName} {t.firstName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide", textSecondary)}>
                  Matière *
                </label>
                <select
                  className={inputClass}
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <label className={cn("block text-xs font-semibold uppercase tracking-wide", textSecondary)}>
                    {editingAssignment ? "Classe *" : "Classes *"}
                  </label>
                  {!editingAssignment && (
                    <p className={cn("mt-1 text-xs", textSecondary)}>
                      Sélectionnez toutes les classes concernées (ex. 7ème A, B, C).
                    </p>
                  )}
                </div>
                {!editingAssignment && classes.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAssignForm((prev) => ({
                          ...prev,
                          classIds: classes.map((c) => String(c.id)),
                          classId: String(classes[0]?.id || ""),
                        }))
                      }
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isDark ? "text-indigo-300 hover:text-indigo-200" : "text-indigo-700 hover:text-indigo-900"
                      )}
                    >
                      Tout sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignForm((prev) => ({ ...prev, classIds: [], classId: "" }))}
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Tout désélectionner
                    </button>
                  </div>
                )}
              </div>

              {editingAssignment ? (
                <div
                  className={cn(
                    "overflow-hidden rounded-lg border shadow-sm",
                    isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
                  )}
                >
                  <ul className="max-h-64 overflow-y-auto" role="listbox">
                    {classes.map((c) => {
                      const id = String(c.id)
                      const active = assignForm.classId === id
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() =>
                              setAssignForm({
                                ...assignForm,
                                classId: id,
                                classIds: [id],
                              })
                            }
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                              active
                                ? isDark
                                  ? "bg-indigo-950/50 text-indigo-300"
                                  : "bg-indigo-50 text-indigo-700"
                                : isDark
                                  ? "text-gray-200 hover:bg-gray-800"
                                  : "text-gray-800 hover:bg-gray-50"
                            )}
                          >
                            {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
                            <span className="min-w-0 flex-1">{c.name}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div
                  className={cn(
                    "overflow-hidden rounded-lg border shadow-sm",
                    isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
                  )}
                >
                  <ul className="max-h-[min(22rem,45vh)] overflow-y-auto" role="listbox" aria-multiselectable="true">
                    {classes.length === 0 ? (
                      <li className={cn("px-3 py-6 text-center text-sm", textSecondary)}>
                        Aucune classe disponible
                      </li>
                    ) : (
                      classes.map((c) => {
                        const id = String(c.id)
                        const checked = assignForm.classIds.includes(id)
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={checked}
                              onClick={() => toggleAssignClass(id)}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                                checked
                                  ? isDark
                                    ? "bg-indigo-950/50 text-indigo-300"
                                    : "bg-indigo-50 text-indigo-700"
                                  : isDark
                                    ? "text-gray-200 hover:bg-gray-800"
                                    : "text-gray-800 hover:bg-gray-50"
                              )}
                            >
                              {checked ? (
                                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              ) : (
                                <span className="w-3.5 shrink-0" aria-hidden />
                              )}
                              <span className="min-w-0 flex-1 leading-snug">{c.name}</span>
                            </button>
                          </li>
                        )
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </FormModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          theme={theme}
          title="Retirer l'affectation"
          message={`Voulez-vous retirer l'affectation « ${deleteTarget.name} » ?`}
          confirmLabel="Supprimer"
          loading={deleting}
          onCancel={() => !deleting && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
