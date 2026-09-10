"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import Portal from "@/components/portal"
import { Plus, Trash2, BookOpen, X, Loader2, Pencil, AlertTriangle } from "lucide-react"
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

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className={cn(
          "relative flex w-full max-w-md max-h-[92vh] flex-col overflow-hidden rounded-2xl border shadow-2xl animate-scale-up",
          bgColor,
          borderColor
        )}
      >
        <div className={cn("flex shrink-0 items-start justify-between gap-3 border-b px-6 py-5", borderColor)}>
          <h3 className={cn("text-lg font-bold sm:text-xl", textColor)}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </ModalOverlay>
  )
}

export function SubjectsSection({ theme }: { theme: "light" | "dark" }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT_FORM)

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
      const res = await authFetch("/api/admin/subjects")
      if (res.ok) {
        const d = await res.json()
        setSubjects(d.subjects || [])
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/admin/subjects/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Matière supprimée")
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
      <Card theme={theme}>
        <CardHeader>
          <CardTitle className={textColor}>Matières / Cours</CardTitle>
        </CardHeader>
        <CardContent>
          <TableLoadingBlock textClassName={textSecondary} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card theme={theme}>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className={textColor}>Matières / Cours</CardTitle>
            <p className={cn("mt-1 text-xs", textSecondary)}>
              Structure pédagogique (nom, code, coefficient, heures). Les affectations se font dans Utilisateurs → Affectations.
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
            <>
              <div className="md:hidden space-y-2.5">
                {subjects.map((s) => (
                  <div key={`m-subj-${s.id}`} className={cn("flex items-center gap-3 rounded-xl border p-3.5", borderColor)}>
                    <span className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white/20" style={{ backgroundColor: s.color || "#4f46e5" }} />
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-sm font-semibold", textColor)}>{s.name}</div>
                      <div className={cn("mt-0.5 truncate text-xs", textSecondary)}>
                        Code {s.code} · Coef {s.coefficient} · {s.maxWeeklyHours}h/sem
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditSubject(s)}
                      title="Modifier"
                      className={cn("shrink-0 rounded-lg p-2 transition-colors", isDark ? "text-indigo-400 hover:bg-indigo-500/10" : "text-indigo-600 hover:bg-indigo-50")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                      title="Supprimer"
                      className="shrink-0 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-lg border border-inherit">
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
                              onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
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
            </>
          )}
        </CardContent>
      </Card>

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

      {deleteTarget && (
        <ConfirmModal
          theme={theme}
          title="Supprimer la matière"
          message={`Voulez-vous supprimer la matière « ${deleteTarget.name} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          loading={deleting}
          onCancel={() => !deleting && setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}
