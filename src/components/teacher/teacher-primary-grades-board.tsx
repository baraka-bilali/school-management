"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Send,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import { toast } from "sonner"
import type { PrimaryBulletinPayload } from "@/lib/grading/primary-bulletin"

type Branch = {
  assignmentId: number
  subjectId: number
  name: string
  domainName: string
  groupName: string | null
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
}

type Student = {
  enrollmentId: number
  studentId: number
  code: string
  fullName: string
  gender: string
}

type Trimestre = {
  id: number
  name: string
  hasExam: boolean
  periods: Array<{ id: number; name: string; sortOrder: number }>
}

type BoardData = {
  class: {
    id: number
    name: string
    level: string
    section: string
    letter: string
  }
  trimestres: Trimestre[]
  selectedPeriodGroupId: number | null
  branches: Branch[]
  students: Student[]
  periodScores: Record<string, Record<string, Record<string, number | null>>>
  examScores: Record<string, Record<string, Record<string, number | null>>>
  lockedPeriods: Record<string, boolean>
  lockedExams: Record<string, boolean>
}

type ViewMode = "trimestre" | "annuel"

function periodShort(name: string, fallback: string) {
  const m = name.match(/(\d+)/)
  if (!m) return fallback
  const n = m[1]
  if (n === "1") return "1ère P."
  if (n === "2") return "2ème P."
  if (n === "3") return "3ème P."
  if (n === "4") return "4ème P."
  if (n === "5") return "5ème P."
  if (n === "6") return "6ème P."
  return `${n}ème P.`
}

function draftKey(
  kind: "P" | "E",
  assignmentId: number,
  eventId: number,
  enrollmentId: number
) {
  return `${kind}:${assignmentId}:${eventId}:${enrollmentId}`
}

export function TeacherPrimaryGradesBoard({
  classId,
  initialEnrollmentId = null,
}: {
  classId: string
  initialEnrollmentId?: number | null
}) {
  const { card, text, textMuted, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [data, setData] = useState<BoardData | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("trimestre")
  const [trimestreId, setTrimestreId] = useState<number | null>(null)
  const [branchId, setBranchId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [bulletinOpen, setBulletinOpen] = useState(false)
  const [bulletinLoading, setBulletinLoading] = useState(false)
  const [bulletinUrl, setBulletinUrl] = useState<string | null>(null)
  const [bulletinTitle, setBulletinTitle] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/teacher/primary-grades?classId=${classId}`,
        { credentials: "include" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Chargement impossible")
      setData(json)
      setTrimestreId((prev) => prev ?? json.selectedPeriodGroupId)
      setBranchId((prev) => prev ?? json.branches[0]?.assignmentId ?? null)
      const next: Record<string, string> = {}
      for (const b of json.branches as Branch[]) {
        for (const t of json.trimestres as Trimestre[]) {
          for (const p of t.periods) {
            for (const s of json.students as Student[]) {
              const v =
                json.periodScores?.[String(b.assignmentId)]?.[String(p.id)]?.[
                  String(s.enrollmentId)
                ]
              next[draftKey("P", b.assignmentId, p.id, s.enrollmentId)] =
                v == null ? "" : String(v)
            }
          }
          for (const s of json.students as Student[]) {
            const v =
              json.examScores?.[String(b.assignmentId)]?.[String(t.id)]?.[
                String(s.enrollmentId)
              ]
            next[draftKey("E", b.assignmentId, t.id, s.enrollmentId)] =
              v == null ? "" : String(v)
          }
        }
      }
      setDrafts(next)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    if (!data) return { periodGrades: [], examGrades: [] }
    const periodGrades: Array<{
      assignmentId: number
      periodId: number
      enrollmentId: number
      pointsObtained: number | null
    }> = []
    const examGrades: Array<{
      assignmentId: number
      periodGroupId: number
      enrollmentId: number
      pointsObtained: number | null
    }> = []

    for (const b of data.branches) {
      for (const t of data.trimestres) {
        for (const p of t.periods) {
          for (const s of data.students) {
            const key = draftKey("P", b.assignmentId, p.id, s.enrollmentId)
            const cur = drafts[key] ?? ""
            const orig =
              data.periodScores[String(b.assignmentId)]?.[String(p.id)]?.[
                String(s.enrollmentId)
              ]
            const origStr = orig == null ? "" : String(orig)
            if (cur === origStr) continue
            periodGrades.push({
              assignmentId: b.assignmentId,
              periodId: p.id,
              enrollmentId: s.enrollmentId,
              pointsObtained: cur === "" ? null : Number(cur),
            })
          }
        }
        for (const s of data.students) {
          const key = draftKey("E", b.assignmentId, t.id, s.enrollmentId)
          const cur = drafts[key] ?? ""
          const orig =
            data.examScores[String(b.assignmentId)]?.[String(t.id)]?.[
              String(s.enrollmentId)
            ]
          const origStr = orig == null ? "" : String(orig)
          if (cur === origStr) continue
          examGrades.push({
            assignmentId: b.assignmentId,
            periodGroupId: t.id,
            enrollmentId: s.enrollmentId,
            pointsObtained: cur === "" ? null : Number(cur),
          })
        }
      }
    }
    return { periodGrades, examGrades }
  }, [data, drafts])

  const dirtyCount = dirty.periodGrades.length + dirty.examGrades.length

  const save = async () => {
    if (!data || dirtyCount === 0) return
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/primary-grades", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: data.class.id,
          periodGrades: dirty.periodGrades,
          examGrades: dirty.examGrades,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible")
      toast.success("Notes enregistrées")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const sendResults = async (kind: "PERIOD" | "EXAM", id: number) => {
    if (!data) return
    if (dirtyCount > 0) {
      toast.error("Enregistrez d'abord les modifications")
      return
    }
    const label =
      kind === "PERIOD"
        ? data.trimestres
            .flatMap((t) => t.periods)
            .find((p) => p.id === id)?.name || "période"
        : data.trimestres.find((t) => t.id === id)?.name || "examen"
    if (
      !confirm(
        `Envoyer les résultats « ${label} » à l'administration ? Les notes seront verrouillées.`
      )
    ) {
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/teacher/primary-grades/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: data.class.id,
          kind,
          ...(kind === "PERIOD"
            ? { periodId: id }
            : { periodGroupId: id }),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Envoi impossible")
      toast.success(json.message || "Résultats envoyés")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSending(false)
    }
  }

  const openBulletin = async (student: Student) => {
    if (!data) return
    setBulletinOpen(true)
    setBulletinLoading(true)
    setBulletinTitle(student.fullName)
    setBulletinUrl(null)
    try {
      const trim =
        data.trimestres.find((t) => t.id === trimestreId) || data.trimestres[0]
      const period = trim?.periods[0]
      const params = new URLSearchParams({
        classId: String(data.class.id),
        enrollmentId: String(student.enrollmentId),
        kind: "PERIOD",
      })
      if (period) params.set("periodId", String(period.id))
      if (trim) params.set("periodGroupId", String(trim.id))

      const res = await fetch(`/api/teacher/bulletin?${params}`, {
        credentials: "include",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Bulletin indisponible")
      const payload = json.data as PrimaryBulletinPayload
      const { pdf } = await import("@react-pdf/renderer")
      const { default: PrimaryBulletinPDF } = await import(
        "@/components/primary-bulletin-pdf"
      )
      const blob = await pdf(
        <PrimaryBulletinPDF data={payload} trailingBlankPage />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      setBulletinUrl(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
      setBulletinOpen(false)
    } finally {
      setBulletinLoading(false)
    }
  }

  const closeBulletin = () => {
    if (bulletinUrl) URL.revokeObjectURL(bulletinUrl)
    setBulletinUrl(null)
    setBulletinOpen(false)
  }

  useEffect(() => {
    if (!data || !initialEnrollmentId || bulletinOpen) return
    const student = data.students.find(
      (s) =>
        s.enrollmentId === initialEnrollmentId ||
        s.studentId === initialEnrollmentId
    )
    if (student) void openBulletin(student)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, initialEnrollmentId])

  if (loading && !data) return <StudentLoading variant="list" />
  if (!data) {
    return (
      <div className="space-y-4">
        <Link
          href={`/teacher/classes/${classId}`}
          className={cn("inline-flex items-center gap-2 text-sm", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <p className={text}>Impossible de charger la cotation primaire.</p>
      </div>
    )
  }

  const trim =
    data.trimestres.find((t) => t.id === trimestreId) || data.trimestres[0]
  const branch =
    data.branches.find((b) => b.assignmentId === branchId) || data.branches[0]

  const inputClass = cn(
    "w-[4.25rem] rounded-lg border px-1.5 py-1 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50",
    border,
    isDark ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"
  )

  const renderScoreCell = (
    kind: "P" | "E",
    assignmentId: number,
    eventId: number,
    enrollmentId: number,
    max: number,
    locked: boolean
  ) => {
    const key = draftKey(kind, assignmentId, eventId, enrollmentId)
    return (
      <input
        type="number"
        min={0}
        max={max}
        step={0.5}
        disabled={locked}
        value={drafts[key] ?? ""}
        onChange={(e) =>
          setDrafts((d) => ({ ...d, [key]: e.target.value }))
        }
        className={inputClass}
      />
    )
  }

  return (
    <div className="space-y-4 pb-24">
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
          <h1 className={cn("text-xl font-bold", text)}>Cotation</h1>
          <p className={cn("text-sm", textMuted)}>
            {data.class.name} · {data.class.level} {data.class.section}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewMode("trimestre")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium border",
            viewMode === "trimestre"
              ? "bg-indigo-600 text-white border-indigo-600"
              : cn(border, textMuted)
          )}
        >
          Trimestriel
        </button>
        <button
          type="button"
          onClick={() => setViewMode("annuel")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium border",
            viewMode === "annuel"
              ? "bg-indigo-600 text-white border-indigo-600"
              : cn(border, textMuted)
          )}
        >
          Annuel
        </button>
      </div>

      {viewMode === "trimestre" && (
        <div className="flex flex-wrap gap-2">
          {data.trimestres.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrimestreId(t.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border",
                trimestreId === t.id
                  ? "bg-violet-600 text-white border-violet-600"
                  : cn(border, textMuted)
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className={cn("rounded-2xl border p-3 space-y-2", card, border)}>
        <label className={cn("block text-xs font-medium", textMuted)}>
          Branche
          <select
            value={branch?.assignmentId ?? ""}
            onChange={(e) => setBranchId(Number(e.target.value))}
            className={cn(
              "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
              border,
              isDark ? "bg-gray-900 text-gray-100" : "bg-white"
            )}
          >
            {data.branches.map((b) => (
              <option key={b.assignmentId} value={b.assignmentId}>
                {b.domainName} — {b.name}
              </option>
            ))}
          </select>
        </label>
        {branch ? (
          <p className={cn("text-xs", textMuted)}>
            Maxima : période{" "}
            <span className={cn("font-semibold", text)}>{branch.maxPeriode}</span>
            {" · "}examen{" "}
            <span className={cn("font-semibold", text)}>{branch.maxExamen}</span>
            {" · "}trimestre{" "}
            <span className={cn("font-semibold", text)}>
              {branch.maxTrimestre}
            </span>
            {" · "}année{" "}
            <span className={cn("font-semibold", text)}>{branch.maxAnnuel}</span>
          </p>
        ) : null}
      </div>

      {branch && (viewMode === "trimestre" ? trim : true) ? (
        <div className={cn("rounded-2xl border overflow-x-auto", card, border)}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className={isDark ? "bg-gray-800/60" : "bg-gray-50"}>
                <th
                  className={cn(
                    "sticky left-0 z-10 px-3 py-2 text-left font-medium",
                    isDark ? "bg-gray-800" : "bg-gray-50",
                    text
                  )}
                >
                  Élève
                </th>
                {viewMode === "trimestre" && trim
                  ? [
                      ...trim.periods.map((p, i) => (
                        <th key={p.id} className={cn("px-2 py-2 text-center font-medium", text)}>
                          {periodShort(p.name, `${i + 1}P`)}
                          <div className={cn("text-[10px] font-normal", textMuted)}>
                            /{branch.maxPeriode}
                            {data.lockedPeriods[String(p.id)] ? " · verrouillé" : ""}
                          </div>
                        </th>
                      )),
                      trim.hasExam ? (
                        <th key="ex" className={cn("px-2 py-2 text-center font-medium", text)}>
                          Exam.
                          <div className={cn("text-[10px] font-normal", textMuted)}>
                            /{branch.maxExamen}
                            {data.lockedExams[String(trim.id)] ? " · verrouillé" : ""}
                          </div>
                        </th>
                      ) : null,
                      <th key="tot" className={cn("px-2 py-2 text-center font-medium", text)}>
                        Total
                        <div className={cn("text-[10px] font-normal", textMuted)}>
                          /{branch.maxTrimestre}
                        </div>
                      </th>,
                    ]
                  : data.trimestres.flatMap((t) => [
                      ...t.periods.map((p, i) => (
                        <th
                          key={`a-${p.id}`}
                          className={cn("px-2 py-2 text-center font-medium", text)}
                        >
                          <div className="text-[10px] opacity-70">{t.name}</div>
                          {periodShort(p.name, `${i + 1}P`)}
                        </th>
                      )),
                      t.hasExam ? (
                        <th
                          key={`ae-${t.id}`}
                          className={cn("px-2 py-2 text-center font-medium", text)}
                        >
                          <div className="text-[10px] opacity-70">{t.name}</div>
                          Exam.
                        </th>
                      ) : null,
                      <th
                        key={`at-${t.id}`}
                        className={cn("px-2 py-2 text-center font-medium", text)}
                      >
                        <div className="text-[10px] opacity-70">{t.name}</div>
                        Total
                      </th>,
                    ])}
                <th className={cn("px-2 py-2 text-center font-medium", text)}>
                  Bulletin
                </th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => {
                const trimCells =
                  viewMode === "trimestre" && trim
                    ? (() => {
                        const periodVals = trim.periods.map((p) => {
                          const raw =
                            drafts[
                              draftKey("P", branch.assignmentId, p.id, s.enrollmentId)
                            ] ?? ""
                          return raw === "" ? null : Number(raw)
                        })
                        const examRaw =
                          drafts[
                            draftKey("E", branch.assignmentId, trim.id, s.enrollmentId)
                          ] ?? ""
                        const examVal = examRaw === "" ? null : Number(examRaw)
                        const parts = [...periodVals, examVal]
                        const has = parts.some((v) => v != null && Number.isFinite(v))
                        const total = has
                          ? parts.reduce<number>(
                              (a, v) => a + (v != null && Number.isFinite(v) ? v : 0),
                              0
                            )
                          : null
                        return (
                          <>
                            {trim.periods.map((p) => (
                              <td key={p.id} className="px-1.5 py-1.5 text-center">
                                {renderScoreCell(
                                  "P",
                                  branch.assignmentId,
                                  p.id,
                                  s.enrollmentId,
                                  branch.maxPeriode,
                                  !!data.lockedPeriods[String(p.id)]
                                )}
                              </td>
                            ))}
                            {trim.hasExam ? (
                              <td className="px-1.5 py-1.5 text-center">
                                {renderScoreCell(
                                  "E",
                                  branch.assignmentId,
                                  trim.id,
                                  s.enrollmentId,
                                  branch.maxExamen,
                                  !!data.lockedExams[String(trim.id)]
                                )}
                              </td>
                            ) : null}
                            <td
                              className={cn(
                                "px-2 py-1.5 text-center font-semibold tabular-nums",
                                text
                              )}
                            >
                              {total == null ? "—" : total}
                            </td>
                          </>
                        )
                      })()
                    : data.trimestres.map((t) => {
                        const periodVals = t.periods.map((p) => {
                          const raw =
                            drafts[
                              draftKey("P", branch.assignmentId, p.id, s.enrollmentId)
                            ] ?? ""
                          return raw === "" ? null : Number(raw)
                        })
                        const examRaw =
                          drafts[
                            draftKey("E", branch.assignmentId, t.id, s.enrollmentId)
                          ] ?? ""
                        const examVal = examRaw === "" ? null : Number(examRaw)
                        const parts = [...periodVals, examVal]
                        const has = parts.some((v) => v != null && Number.isFinite(v))
                        const total = has
                          ? parts.reduce<number>(
                              (a, v) => a + (v != null && Number.isFinite(v) ? v : 0),
                              0
                            )
                          : null
                        return (
                          <Fragment key={t.id}>
                            {t.periods.map((p) => (
                              <td key={p.id} className="px-1.5 py-1.5 text-center">
                                {renderScoreCell(
                                  "P",
                                  branch.assignmentId,
                                  p.id,
                                  s.enrollmentId,
                                  branch.maxPeriode,
                                  !!data.lockedPeriods[String(p.id)]
                                )}
                              </td>
                            ))}
                            {t.hasExam ? (
                              <td className="px-1.5 py-1.5 text-center">
                                {renderScoreCell(
                                  "E",
                                  branch.assignmentId,
                                  t.id,
                                  s.enrollmentId,
                                  branch.maxExamen,
                                  !!data.lockedExams[String(t.id)]
                                )}
                              </td>
                            ) : null}
                            <td
                              className={cn(
                                "px-2 py-1.5 text-center font-semibold tabular-nums",
                                text
                              )}
                            >
                              {total == null ? "—" : total}
                            </td>
                          </Fragment>
                        )
                      })

                return (
                  <tr key={s.enrollmentId} className={cn("border-t", border)}>
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-3 py-2",
                        isDark ? "bg-gray-900" : "bg-white"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => void openBulletin(s)}
                        className="text-left"
                      >
                        <div className="font-medium text-teal-600 dark:text-teal-400">
                          {s.fullName}
                        </div>
                        <div className={cn("text-[11px]", textMuted)}>{s.code}</div>
                      </button>
                    </td>
                    {trimCells}
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => void openBulletin(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-teal-500/40 px-2 py-1 text-xs text-teal-600 dark:text-teal-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {data.students.length === 0 ? (
            <p className={cn("p-6 text-center text-sm", textMuted)}>
              Aucun élève actif.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Envoyer résultats */}
      {viewMode === "trimestre" && trim ? (
        <div className={cn("rounded-2xl border p-4 space-y-3", card, border)}>
          <p className={cn("text-sm font-semibold", text)}>
            Envoyer à l&apos;administration
          </p>
          <p className={cn("text-xs", textMuted)}>
            Verrouille les notes de toutes les branches pour l&apos;événement.
            L&apos;admin pourra ensuite imprimer ou publier.
          </p>
          <div className="flex flex-wrap gap-2">
            {trim.periods.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={sending || !!data.lockedPeriods[String(p.id)]}
                onClick={() => void sendResults("PERIOD", p.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {data.lockedPeriods[String(p.id)]
                  ? `${periodShort(p.name, "P")} envoyé`
                  : `Envoyer ${periodShort(p.name, "P")}`}
              </button>
            ))}
            {trim.hasExam ? (
              <button
                type="button"
                disabled={sending || !!data.lockedExams[String(trim.id)]}
                onClick={() => void sendResults("EXAM", trim.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {data.lockedExams[String(trim.id)]
                  ? "Examen envoyé"
                  : "Envoyer Exam."}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Sticky save */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-3 lg:bottom-4 lg:left-64">
        <div
          className={cn(
            "mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg",
            card,
            border,
            dirtyCount === 0 && "opacity-70"
          )}
        >
          <p className={cn("text-xs sm:text-sm", textMuted)}>
            {dirtyCount === 0
              ? "Aucune modification"
              : `${dirtyCount} modification${dirtyCount > 1 ? "s" : ""} non enregistrée${dirtyCount > 1 ? "s" : ""}`}
          </p>
          <button
            type="button"
            disabled={saving || dirtyCount === 0}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      {bulletinOpen ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/50 p-2 sm:p-4">
          <div
            className={cn(
              "mx-auto flex w-full max-w-[96vw] flex-1 flex-col min-h-0 overflow-hidden rounded-2xl border shadow-2xl",
              card,
              border
            )}
          >
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <Eye className="h-4 w-4 text-indigo-500" />
              <h3 className={cn("flex-1 truncate text-sm font-semibold", text)}>
                Bulletin — {bulletinTitle}
              </h3>
              <button
                type="button"
                onClick={closeBulletin}
                className={cn("rounded-lg p-1.5", textMuted)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1 bg-gray-100 dark:bg-gray-950">
              {bulletinLoading ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <span className="text-sm">Génération…</span>
                </div>
              ) : bulletinUrl ? (
                <iframe
                  title="Bulletin"
                  src={`${bulletinUrl}#toolbar=1`}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
