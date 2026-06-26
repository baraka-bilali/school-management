"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import Portal from "@/components/portal"
import { Plus, Trash2, BookOpen, Users, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"

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

export function CoursesSection({ theme }: { theme: "light" | "dark" }) {
  const [subTab, setSubTab] = useState<SubTab>("assignments")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [currentYearName, setCurrentYearName] = useState("-")
  const [loading, setLoading] = useState(true)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
    color: "#4f46e5",
    coefficient: "1",
    maxWeeklyHours: "5",
  })

  const [assignForm, setAssignForm] = useState({
    subjectId: "",
    teacherId: "",
    classId: "",
    weeklyHours: "2",
  })

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputClass = cn(
    "w-full rounded-lg border px-3 py-2 text-sm",
    theme === "dark" ? "border-gray-700 bg-gray-800 text-gray-100" : "border-gray-300 bg-white"
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

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await authFetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subjectForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success("Matière créée")
      setShowSubjectForm(false)
      setSubjectForm({ name: "", code: "", description: "", color: "#4f46e5", coefficient: "1", maxWeeklyHours: "5" })
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

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Désactiver cette matière ?")) return
    const res = await authFetch(`/api/admin/subjects/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Matière désactivée")
      await loadData()
    } else {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Retirer cette affectation ?")) return
    const res = await authFetch(`/api/admin/course-assignments/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Affectation retirée")
      await loadData()
    } else {
      toast.error("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={textSecondary}>
            Année scolaire : <span className={cn("font-semibold", textColor)}>{currentYearName}</span>
          </p>
        </div>
        <div className={`flex gap-1 rounded-lg border p-1 ${borderColor}`}>
          <button
            type="button"
            onClick={() => setSubTab("assignments")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              subTab === "assignments" ? "bg-indigo-600 text-white" : textSecondary
            )}
          >
            Affectations
          </button>
          <button
            type="button"
            onClick={() => setSubTab("subjects")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              subTab === "subjects" ? "bg-indigo-600 text-white" : textSecondary
            )}
          >
            Matières
          </button>
        </div>
      </div>

      {subTab === "subjects" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className={textColor}>Matières / Cours</CardTitle>
            <button
              type="button"
              onClick={() => setShowSubjectForm(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className={cn("py-8 text-center text-sm", textSecondary)}>Aucune matière. Créez-en une pour commencer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b text-left", borderColor)}>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Matière</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Code</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Coef.</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>H/sem.</th>
                      <th className={cn("pb-2 font-medium", textSecondary)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id} className={cn("border-b", borderColor)}>
                        <td className={cn("py-3 pr-4", textColor)}>
                          <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color || "#4f46e5" }} />
                          {s.name}
                        </td>
                        <td className={cn("py-3 pr-4", textSecondary)}>{s.code}</td>
                        <td className={cn("py-3 pr-4", textSecondary)}>{s.coefficient}</td>
                        <td className={cn("py-3 pr-4", textSecondary)}>{s.maxWeeklyHours}h</td>
                        <td className="py-3">
                          <button type="button" onClick={() => handleDeleteSubject(s.id)} className="text-red-500 hover:text-red-600">
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

      {subTab === "assignments" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className={textColor}>Affectations professeurs</CardTitle>
            <button
              type="button"
              onClick={() => setShowAssignForm(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className={cn("py-8 text-center text-sm", textSecondary)}>
                Aucune affectation. Assignez un cours à un professeur pour une classe.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b text-left", borderColor)}>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Professeur</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Matière</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>Classe</th>
                      <th className={cn("pb-2 pr-4 font-medium", textSecondary)}>H/sem.</th>
                      <th className={cn("pb-2 font-medium", textSecondary)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className={cn("border-b", borderColor)}>
                        <td className={cn("py-3 pr-4", textColor)}>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                            {a.teacherName}
                          </span>
                        </td>
                        <td className={cn("py-3 pr-4", textColor)}>
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" style={{ color: a.subjectColor || "#4f46e5" }} />
                            {a.subjectName}
                          </span>
                        </td>
                        <td className={cn("py-3 pr-4", textSecondary)}>{a.className}</td>
                        <td className={cn("py-3 pr-4", textSecondary)}>{a.weeklyHours}h</td>
                        <td className="py-3">
                          <button type="button" onClick={() => handleDeleteAssignment(a.id)} className="text-red-500 hover:text-red-600">
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

      {showSubjectForm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={cn("w-full max-w-md rounded-xl border p-6 shadow-xl", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn("text-lg font-bold", textColor)}>Nouvelle matière</h3>
                <button type="button" onClick={() => setShowSubjectForm(false)} className={textSecondary}><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Nom *</label>
                  <input className={inputClass} value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Mathématiques" required />
                </div>
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Code *</label>
                  <input className={inputClass} value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="MATH" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Coefficient</label>
                    <input type="number" step="0.5" min="0" className={inputClass} value={subjectForm.coefficient} onChange={(e) => setSubjectForm({ ...subjectForm, coefficient: e.target.value })} />
                  </div>
                  <div>
                    <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Heures / sem.</label>
                    <input type="number" min="1" className={inputClass} value={subjectForm.maxWeeklyHours} onChange={(e) => setSubjectForm({ ...subjectForm, maxWeeklyHours: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Couleur</label>
                  <input type="color" className="h-10 w-full rounded-lg" value={subjectForm.color} onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Créer
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showAssignForm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={cn("w-full max-w-md rounded-xl border p-6 shadow-xl", theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn("text-lg font-bold", textColor)}>Nouvelle affectation</h3>
                <button type="button" onClick={() => setShowAssignForm(false)} className={textSecondary}><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCreateAssignment} className="space-y-3">
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Professeur *</label>
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
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Matière *</label>
                  <select className={inputClass} value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })} required>
                    <option value="">Sélectionner</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Classe *</label>
                  <select className={inputClass} value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })} required>
                    <option value="">Sélectionner</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn("mb-1 block text-xs font-medium", textSecondary)}>Heures par semaine</label>
                  <input type="number" step="0.5" min="0.5" className={inputClass} value={assignForm.weeklyHours} onChange={(e) => setAssignForm({ ...assignForm, weeklyHours: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Assigner
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
