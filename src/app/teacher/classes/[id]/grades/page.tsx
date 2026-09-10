"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import { toast } from "sonner"

type Student = {
  enrollmentId: number
  code: string
  lastName: string
  middleName: string
  firstName: string
}

type Column = {
  id: number
  label: string
  date: string
  maxPoints: number
  grades: Record<string, number>
}

type GradesContext = {
  assignment: {
    id: number
    subject: { id: number; name: string; color: string | null }
    class: { id: number; name: string; section: string; level: string }
  }
  periods: Array<{
    id: number
    name: string
    periodGroupId: number
    periodGroupName: string
    hasExam: boolean
  }>
  selectedPeriodId: number | null
  selectedPeriodGroup: { id: number; name: string; hasExam: boolean } | null
  officialPeriodMax: number | null
  officialExamMax: number | null
  students: Student[]
  columns: Column[]
  normalizedByEnrollment: Record<string, number | null>
  examByEnrollment: Record<string, number>
}

function fullName(s: Student) {
  return [s.lastName, s.middleName, s.firstName].filter(Boolean).join(" ")
}

export default function TeacherGradesPage() {
  return (
    <Suspense fallback={<StudentLoading variant="list" />}>
      <TeacherGradesContent />
    </Suspense>
  )
}

function TeacherGradesContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const classId = params.id as string
  const assignmentId = Number(searchParams.get("assignmentId") || 0)
  const { card, text, textMuted, border, isDark } = useTeacherTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ctx, setCtx] = useState<GradesContext | null>(null)
  const [periodId, setPeriodId] = useState<number | null>(null)
  const [gradeDraft, setGradeDraft] = useState<Record<string, string>>({})
  const [examDraft, setExamDraft] = useState<Record<string, string>>({})
  const [newCol, setNewCol] = useState({ label: "", date: "", maxPoints: "" })

  const load = useCallback(async (pid?: number | null) => {
    if (!assignmentId) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ assignmentId: String(assignmentId) })
      if (pid) q.set("periodId", String(pid))
      const res = await fetch(`/api/teacher/grades?${q}`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Chargement impossible")
      setCtx(data)
      setPeriodId(data.selectedPeriodId)
      const drafts: Record<string, string> = {}
      for (const col of data.columns as Column[]) {
        for (const [enr, pts] of Object.entries(col.grades)) {
          drafts[`${col.id}:${enr}`] = String(pts)
        }
      }
      setGradeDraft(drafts)
      const exams: Record<string, string> = {}
      for (const [enr, pts] of Object.entries(data.examByEnrollment || {})) {
        exams[enr] = String(pts)
      }
      setExamDraft(exams)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
      setCtx(null)
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    void load()
  }, [load])

  const dirtyGrades = useMemo(() => {
    if (!ctx) return []
    const rows: Array<{ evaluationColumnId: number; enrollmentId: number; pointsObtained: number | null }> = []
    for (const col of ctx.columns) {
      for (const s of ctx.students) {
        const key = `${col.id}:${s.enrollmentId}`
        const raw = gradeDraft[key]
        const original = col.grades[String(s.enrollmentId)]
        const origStr = original == null ? "" : String(original)
        const cur = raw ?? ""
        if (cur === origStr) continue
        rows.push({
          evaluationColumnId: col.id,
          enrollmentId: s.enrollmentId,
          pointsObtained: cur === "" ? null : Number(cur),
        })
      }
    }
    return rows
  }, [ctx, gradeDraft])

  const dirtyExams = useMemo(() => {
    if (!ctx) return []
    return ctx.students
      .map((s) => {
        const key = String(s.enrollmentId)
        const cur = examDraft[key] ?? ""
        const orig = ctx.examByEnrollment[key]
        const origStr = orig == null ? "" : String(orig)
        if (cur === origStr) return null
        return {
          enrollmentId: s.enrollmentId,
          pointsObtained: cur === "" ? null : Number(cur),
        }
      })
      .filter(Boolean) as Array<{ enrollmentId: number; pointsObtained: number | null }>
  }, [ctx, examDraft])

  const saveGrades = async () => {
    if (!ctx || dirtyGrades.length === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/grades/mutate", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsertGrades",
          assignmentId: ctx.assignment.id,
          grades: dirtyGrades,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec enregistrement")
      toast.success("Notes enregistrées")
      await load(periodId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const saveExams = async () => {
    if (!ctx?.selectedPeriodGroup || dirtyExams.length === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/grades/mutate", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsertExam",
          assignmentId: ctx.assignment.id,
          periodGroupId: ctx.selectedPeriodGroup.id,
          grades: dirtyExams,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec examen")
      toast.success("Notes d'examen enregistrées")
      await load(periodId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const addColumn = async () => {
    if (!ctx || !periodId) return
    const maxPoints = Number(newCol.maxPoints)
    if (!newCol.label.trim() || !newCol.date || !Number.isFinite(maxPoints) || maxPoints <= 0) {
      toast.error("Intitulé, date et maximum requis")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/grades/mutate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: ctx.assignment.id,
          periodId,
          label: newCol.label.trim(),
          date: newCol.date,
          maxPoints,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Création impossible")
      setNewCol({ label: "", date: "", maxPoints: "" })
      toast.success("Colonne créée")
      await load(periodId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const deleteColumn = async (columnId: number) => {
    if (!ctx || !confirm("Supprimer cette colonne et ses notes ?")) return
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/grades/mutate", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteColumn",
          assignmentId: ctx.assignment.id,
          columnId,
        }),
      })
      if (!res.ok) throw new Error("Suppression impossible")
      await load(periodId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  if (!assignmentId) {
    return (
      <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
        <p className={text}>Sélectionnez un cours depuis la fiche classe.</p>
        <Link href={`/teacher/classes/${classId}`} className="mt-3 inline-block text-sm text-indigo-600">
          Retour
        </Link>
      </div>
    )
  }

  if (loading && !ctx) return <StudentLoading variant="list" />

  if (!ctx) {
    return (
      <div className="space-y-4">
        <Link href={`/teacher/classes/${classId}`} className={cn("inline-flex items-center gap-2 text-sm", textMuted)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <p className={text}>Impossible de charger la cotation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link
          href={`/teacher/classes/${classId}`}
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            border
          )}
        >
          <ArrowLeft className={cn("h-4 w-4", text)} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className={cn("text-xl font-bold", text)}>{ctx.assignment.subject.name}</h1>
          <p className={cn("text-sm", textMuted)}>
            {ctx.assignment.class.name} · {ctx.assignment.class.level} {ctx.assignment.class.section}
          </p>
        </div>
      </div>

      <div className={cn("rounded-2xl border p-4 space-y-3", card, border)}>
        <label className={cn("block text-sm", textMuted)}>
          Période
          <select
            value={periodId ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value)
              setPeriodId(id)
              void load(id)
            }}
            className={cn(
              "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
              border,
              isDark ? "bg-gray-900 text-gray-100" : "bg-white"
            )}
          >
            {ctx.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodGroupName} — {p.name}
              </option>
            ))}
          </select>
        </label>
        <p className={cn("text-xs", textMuted)}>
          Max officiel période :{" "}
          <span className={cn("font-semibold", text)}>
            {ctx.officialPeriodMax != null ? ctx.officialPeriodMax : "non défini"}
          </span>
          {ctx.selectedPeriodGroup?.hasExam && (
            <>
              {" · "}Max examen :{" "}
              <span className={cn("font-semibold", text)}>
                {ctx.officialExamMax != null ? ctx.officialExamMax : "non défini"}
              </span>
            </>
          )}
        </p>
      </div>

      <div className={cn("rounded-2xl border p-4 space-y-3", card, border)}>
        <h2 className={cn("text-sm font-semibold", text)}>Nouvelle colonne d&apos;évaluation</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <input
            placeholder="Intitulé"
            value={newCol.label}
            onChange={(e) => setNewCol((c) => ({ ...c, label: e.target.value }))}
            className={cn("rounded-xl border px-3 py-2 text-sm", border, isDark ? "bg-gray-900" : "bg-white")}
          />
          <input
            type="date"
            value={newCol.date}
            onChange={(e) => setNewCol((c) => ({ ...c, date: e.target.value }))}
            className={cn("rounded-xl border px-3 py-2 text-sm", border, isDark ? "bg-gray-900" : "bg-white")}
          />
          <input
            type="number"
            min={0.5}
            step={0.5}
            placeholder="Max"
            value={newCol.maxPoints}
            onChange={(e) => setNewCol((c) => ({ ...c, maxPoints: e.target.value }))}
            className={cn("rounded-xl border px-3 py-2 text-sm", border, isDark ? "bg-gray-900" : "bg-white")}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void addColumn()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className={cn("rounded-2xl border overflow-x-auto", card, border)}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDark ? "bg-gray-800/60" : "bg-gray-50"}>
              <th className={cn("px-3 py-2 text-left font-medium sticky left-0 z-10", isDark ? "bg-gray-800" : "bg-gray-50", text)}>
                Élève
              </th>
              {ctx.columns.map((col) => (
                <th key={col.id} className={cn("px-3 py-2 text-left font-medium min-w-[7rem]", text)}>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div>{col.label}</div>
                      <div className={cn("text-[11px] font-normal", textMuted)}>
                        /{col.maxPoints} · {col.date}
                      </div>
                    </div>
                    <button type="button" onClick={() => void deleteColumn(col.id)} className="text-red-500 p-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className={cn("px-3 py-2 text-left font-medium", text)}>
                Normalisé
                <div className={cn("text-[11px] font-normal", textMuted)}>
                  /{ctx.officialPeriodMax ?? "—"}
                </div>
              </th>
              {ctx.selectedPeriodGroup?.hasExam && (
                <th className={cn("px-3 py-2 text-left font-medium", text)}>
                  Examen
                  <div className={cn("text-[11px] font-normal", textMuted)}>
                    /{ctx.officialExamMax ?? "—"}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ctx.students.map((s) => (
              <tr key={s.enrollmentId} className={cn("border-t", border)}>
                <td className={cn("px-3 py-2 sticky left-0 z-10", isDark ? "bg-gray-900" : "bg-white")}>
                  <div className={cn("font-medium", text)}>{fullName(s)}</div>
                  <div className={cn("text-[11px]", textMuted)}>{s.code}</div>
                </td>
                {ctx.columns.map((col) => (
                  <td key={col.id} className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={col.maxPoints}
                      step={0.5}
                      value={gradeDraft[`${col.id}:${s.enrollmentId}`] ?? ""}
                      onChange={(e) =>
                        setGradeDraft((d) => ({
                          ...d,
                          [`${col.id}:${s.enrollmentId}`]: e.target.value,
                        }))
                      }
                      className={cn(
                        "w-20 rounded-lg border px-2 py-1.5",
                        border,
                        isDark ? "bg-gray-950" : "bg-white"
                      )}
                    />
                  </td>
                ))}
                <td className={cn("px-3 py-2 font-medium tabular-nums", text)}>
                  {ctx.normalizedByEnrollment[String(s.enrollmentId)] ?? "—"}
                </td>
                {ctx.selectedPeriodGroup?.hasExam && (
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={ctx.officialExamMax ?? undefined}
                      step={0.5}
                      value={examDraft[String(s.enrollmentId)] ?? ""}
                      onChange={(e) =>
                        setExamDraft((d) => ({
                          ...d,
                          [String(s.enrollmentId)]: e.target.value,
                        }))
                      }
                      className={cn(
                        "w-20 rounded-lg border px-2 py-1.5",
                        border,
                        isDark ? "bg-gray-950" : "bg-white"
                      )}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {ctx.students.length === 0 && (
          <p className={cn("p-6 text-center text-sm", textMuted)}>Aucun élève actif dans cette classe.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || dirtyGrades.length === 0}
          onClick={() => void saveGrades()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer les notes de période
        </button>
        {ctx.selectedPeriodGroup?.hasExam && (
          <button
            type="button"
            disabled={saving || dirtyExams.length === 0 || ctx.officialExamMax == null}
            onClick={() => void saveExams()}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300 disabled:opacity-50"
          >
            Enregistrer l&apos;examen
          </button>
        )}
      </div>
    </div>
  )
}
