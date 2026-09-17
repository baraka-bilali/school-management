"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  Lock,
  CheckCircle2,
  Sparkles,
  Info,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"
import type { PrimaryBulletinPayload } from "@/lib/grading/primary-bulletin"

type Summary = {
  key: string
  maxTotal: number
  obtained: number | null
  percentage: number | null
  place: number | null
  application: string | null
}

type BranchLine = {
  subjectId: number
  name: string
  domainName: string
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  trimScores: Record<string, number | null>
  annualScore: number | null
}

type TrimestreCol = {
  periodGroupId: number
  name: string
  shortLabel: string
  hasExam: boolean
  periods: { periodId: number; name: string; shortLabel: string }[]
}

type Publication = {
  id: number
  kind: "PERIOD" | "EXAM"
  periodId: number | null
  periodGroupId: number | null
  eventKey: string
  label: string
  groupId: number | null
  groupName: string | null
  publishedAt: string
}

type BulletinResponse = {
  year: { id: number; name: string; isCurrent: boolean }
  enrollment: {
    id: number
    classId: number
    className: string
    section: string | null
    level: string | null
  }
  supported: boolean
  message: string | null
  publications: Publication[]
  publishedThroughLabel?: string | null
  focusEvent?: {
    kind: "PERIOD" | "EXAM"
    periodId: number | null
    periodGroupId: number | null
    label: string
    groupName: string
  }
  visibility?: {
    periods: Record<string, boolean>
    exams: Record<string, boolean>
    trims: Record<string, boolean>
    year: boolean
  }
  trimestres?: TrimestreCol[]
  bulletin: {
    lines: BranchLine[]
    domainSubtotals: unknown[]
    summaries: Summary[]
    conduiteByPeriod: Record<string, string | null>
  } | null
  student: { enrollmentId: number; code: string; fullName: string } | null
  payload?: PrimaryBulletinPayload | null
}

function fmtScore(v: number | null | undefined, max?: number) {
  if (v == null) return "—"
  const score = Number.isInteger(v) ? String(v) : v.toFixed(1)
  return max != null ? `${score}/${max}` : score
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return "—"
  return `${Math.round(v)} %`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

async function generateBulletinPdfBlob(data: PrimaryBulletinPayload): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer")
  const { default: PrimaryBulletinPDF } = await import(
    "@/components/primary-bulletin-pdf"
  )
  return pdf(<PrimaryBulletinPDF data={data} />).toBlob()
}

export default function StudentGradesYearPage() {
  const params = useParams()
  const yearId = Number(params.yearId)
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [data, setData] = useState<BulletinResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTrimId, setActiveTrimId] = useState<number | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const loadBulletin = useCallback(
    async (opts?: { kind?: "PERIOD" | "EXAM"; periodId?: number | null; periodGroupId?: number | null }) => {
      const qs = new URLSearchParams({ yearId: String(yearId) })
      if (opts?.kind) {
        qs.set("kind", opts.kind)
        if (opts.kind === "PERIOD" && opts.periodId != null) {
          qs.set("periodId", String(opts.periodId))
        }
        if (opts.kind === "EXAM" && opts.periodGroupId != null) {
          qs.set("periodGroupId", String(opts.periodGroupId))
        }
      }
      const res = await fetch(`/api/student/bulletins?${qs}`, {
        credentials: "include",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Impossible de charger le bulletin")
      }
      return (await res.json()) as BulletinResponse
    },
    [yearId]
  )

  useEffect(() => {
    if (!Number.isFinite(yearId)) {
      setError("Année invalide")
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const json = await loadBulletin()
        if (cancelled) return
        setData(json)
        const pubs = json.publications || []
        if (pubs.length > 0) {
          const last = pubs[pubs.length - 1]
          setFocusKey(last.eventKey)
          setActiveTrimId(last.groupId)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [yearId, loadBulletin])

  const trimTabs = useMemo(() => {
    if (!data?.publications?.length) return []
    const map = new Map<number, { id: number; name: string; short: string }>()
    for (const p of data.publications) {
      if (p.groupId == null) continue
      if (!map.has(p.groupId)) {
        const trim = data.trimestres?.find((t) => t.periodGroupId === p.groupId)
        map.set(p.groupId, {
          id: p.groupId,
          name: p.groupName || trim?.name || `Trimestre`,
          short: trim?.shortLabel || "T",
        })
      }
    }
    // Inclure aussi les trimestres connus même sans pub (grisés plus tard)
    for (const t of data.trimestres || []) {
      if (!map.has(t.periodGroupId) && data.publications.some((p) => p.groupId === t.periodGroupId)) {
        map.set(t.periodGroupId, {
          id: t.periodGroupId,
          name: t.name,
          short: t.shortLabel,
        })
      }
    }
    return [...map.values()]
  }, [data])

  const pubsInActiveTrim = useMemo(() => {
    if (!data?.publications) return []
    if (activeTrimId == null) return data.publications
    return data.publications.filter((p) => p.groupId === activeTrimId)
  }, [data, activeTrimId])

  const selectFocus = async (pub: Publication) => {
    if (pub.eventKey === focusKey) return
    setFocusKey(pub.eventKey)
    setLoading(true)
    setError("")
    try {
      const json = await loadBulletin({
        kind: pub.kind,
        periodId: pub.periodId,
        periodGroupId: pub.periodGroupId,
      })
      setData(json)
      setActiveTrimId(pub.groupId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async (pub?: Publication) => {
    const target = pub || data?.publications.find((p) => p.eventKey === focusKey)
    if (!target) return
    setPdfLoading(true)
    try {
      const qs = new URLSearchParams({
        yearId: String(yearId),
        kind: target.kind,
        full: "1",
      })
      if (target.kind === "PERIOD" && target.periodId != null) {
        qs.set("periodId", String(target.periodId))
      }
      if (target.kind === "EXAM" && target.periodGroupId != null) {
        qs.set("periodGroupId", String(target.periodGroupId))
      }
      const res = await fetch(`/api/student/bulletins?${qs}`, {
        credentials: "include",
      })
      const json = (await res.json()) as BulletinResponse
      if (!res.ok || !json.payload) {
        throw new Error(json.message || "Bulletin PDF indisponible")
      }
      const blob = await generateBulletinPdfBlob(json.payload)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const name = (json.student?.fullName || "eleve").replace(/\s+/g, "-")
      a.download = `bulletin-${name}-${target.label.replace(/\s+/g, "-")}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible")
    } finally {
      setPdfLoading(false)
    }
  }

  const visibleSummaries = useMemo(() => {
    if (!data?.bulletin?.summaries || !data.trimestres) return []
    const labelFor = (key: string) => {
      if (key === "year") return "Année"
      if (key.startsWith("period:")) {
        const id = Number(key.slice(7))
        for (const t of data.trimestres!) {
          const p = t.periods.find((x) => x.periodId === id)
          if (p) return p.shortLabel || p.name
        }
      }
      if (key.startsWith("exam:")) {
        const id = Number(key.slice(5))
        const t = data.trimestres!.find((x) => x.periodGroupId === id)
        return t ? `Ex. ${t.shortLabel}` : "Examen"
      }
      if (key.startsWith("trim:")) {
        const id = Number(key.slice(5))
        const t = data.trimestres!.find((x) => x.periodGroupId === id)
        return t ? `Tot. ${t.shortLabel}` : "Trimestre"
      }
      return key
    }
    return data.bulletin.summaries
      .filter((s) => s.obtained != null || s.percentage != null)
      .map((s) => ({ ...s, label: labelFor(s.key) }))
  }, [data])

  const periodCols = useMemo(() => {
    if (!data?.trimestres || !data.visibility) return []
    const cols: { key: string; label: string; kind: "period" | "exam" | "trim" | "year" }[] = []
    for (const t of data.trimestres) {
      for (const p of t.periods) {
        if (data.visibility.periods[String(p.periodId)]) {
          cols.push({ key: `p:${p.periodId}`, label: p.shortLabel || p.name, kind: "period" })
        }
      }
      if (t.hasExam && data.visibility.exams[String(t.periodGroupId)]) {
        cols.push({
          key: `e:${t.periodGroupId}`,
          label: `Ex. ${t.shortLabel}`,
          kind: "exam",
        })
      }
      if (data.visibility.trims[String(t.periodGroupId)]) {
        cols.push({
          key: `t:${t.periodGroupId}`,
          label: `Tot. ${t.shortLabel}`,
          kind: "trim",
        })
      }
    }
    if (data.visibility.year) {
      cols.push({ key: "year", label: "Année", kind: "year" })
    }
    return cols
  }, [data])

  if (loading && !data) return <StudentLoading variant="list" label="Chargement du bulletin…" />

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Link href="/student/grades" className={cn("inline-flex items-center gap-2 text-sm", textMuted)}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 lg:pb-8">
      <div className="flex items-start gap-3">
        <Link
          href="/student/grades"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
            border,
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
          )}
        >
          <ArrowLeft className={cn("h-4 w-4", textMuted)} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={cn("text-xl font-bold tracking-tight sm:text-2xl", text)}>
              {data.year.name}
            </h1>
            {data.year.isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                <Sparkles className="h-3 w-3" /> En cours
              </span>
            )}
          </div>
          <p className={cn("mt-0.5 text-sm", textMuted)}>{data.enrollment.className}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Publications by trimestre */}
      {data.publications.length > 0 && (
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className={cn("text-sm font-semibold", text)}>Bulletins publiés</h2>
            </div>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={pdfLoading || !focusKey}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {pdfLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              PDF officiel
            </button>
          </div>

          {trimTabs.length > 1 && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {trimTabs.map((t) => {
                const active = activeTrimId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTrimId(t.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-indigo-600 text-white"
                        : isDark
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {t.short} · {t.name}
                  </button>
                )
              })}
            </div>
          )}

          <ul className="space-y-2">
            {pubsInActiveTrim.map((p) => {
              const selected = p.eventKey === focusKey
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => void selectFocus(p)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? isDark
                          ? "bg-indigo-500/20 ring-1 ring-indigo-500/40"
                          : "bg-indigo-50 ring-1 ring-indigo-200"
                        : isDark
                          ? "bg-gray-800/60 hover:bg-gray-800"
                          : "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <span className={cn("font-medium", text)}>{p.label}</span>
                    <span className={cn("shrink-0 text-xs", textMuted)}>
                      {fmtDate(p.publishedAt)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {data.publishedThroughLabel && (
            <p className={cn("mt-3 flex items-start gap-2 text-xs", textMuted)}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Affichage cumulatif jusqu&apos;à :{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {data.publishedThroughLabel}
              </span>
              . Les trimestres suivants apparaîtront ici dès leur publication.
            </p>
          )}
        </div>
      )}

      {!data.supported && (
        <div className={cn("rounded-2xl border px-6 py-10 text-center", card, border, shadow)}>
          <Lock className="mx-auto h-10 w-10 text-amber-500" />
          <p className={cn("mt-3 font-semibold", text)}>Section non disponible</p>
          <p className={cn("mt-1 text-sm", textMuted)}>{data.message}</p>
        </div>
      )}

      {data.supported && !data.bulletin && (
        <div className={cn("rounded-2xl border px-6 py-10 text-center", card, border, shadow)}>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
            <FileText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <p className={cn("font-semibold", text)}>Pas encore de notes</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            {data.message ||
              "Les notes apparaîtront ici dès que l'administration publiera les résultats."}
          </p>
        </div>
      )}

      {data.bulletin && (
        <>
          {visibleSummaries.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleSummaries.map((s) => (
                <div
                  key={s.key}
                  className={cn("rounded-2xl border p-3 sm:p-4", card, border, shadow)}
                >
                  <p className={cn("text-[11px] font-medium uppercase tracking-wide", textMuted)}>
                    {s.label}
                  </p>
                  <p className={cn("mt-1 text-xl font-bold", text)}>{fmtPct(s.percentage)}</p>
                  <p className={cn("text-xs", textMuted)}>
                    {fmtScore(s.obtained, s.maxTotal)}
                    {s.application ? ` · ${s.application}` : ""}
                    {s.place != null ? ` · ${s.place}ᵉ` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className={cn("border-b", border, isDark ? "bg-gray-800/80" : "bg-gray-50")}>
                    <th
                      className={cn(
                        "sticky left-0 z-10 px-3 py-2.5 font-semibold",
                        text,
                        isDark ? "bg-gray-800/80" : "bg-gray-50"
                      )}
                    >
                      Branche
                    </th>
                    {periodCols.map((c) => (
                      <th
                        key={c.key}
                        className={cn(
                          "whitespace-nowrap px-2 py-2.5 text-center text-xs font-semibold",
                          textMuted
                        )}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.bulletin.lines.map((line) => (
                    <tr key={line.subjectId} className={cn("border-b last:border-0", border)}>
                      <td
                        className={cn(
                          "sticky left-0 z-10 max-w-[140px] truncate px-3 py-2.5 font-medium sm:max-w-[200px]",
                          text,
                          isDark ? "bg-gray-800" : "bg-white"
                        )}
                        title={line.name}
                      >
                        <span className="block truncate">{line.name}</span>
                        <span className={cn("block truncate text-[10px] font-normal", textMuted)}>
                          {line.domainName}
                        </span>
                      </td>
                      {periodCols.map((c) => {
                        let val: number | null = null
                        let max: number | undefined
                        if (c.kind === "period") {
                          const id = c.key.slice(2)
                          val = line.periodScores[id] ?? null
                          max = line.maxPeriode
                        } else if (c.kind === "exam") {
                          const id = c.key.slice(2)
                          val = line.examScores[id] ?? null
                          max = line.maxExamen
                        } else if (c.kind === "trim") {
                          const id = c.key.slice(2)
                          val = line.trimScores[id] ?? null
                          max = line.maxTrimestre
                        } else {
                          val = line.annualScore
                          max = line.maxAnnuel
                        }
                        return (
                          <td
                            key={c.key}
                            className={cn("px-2 py-2.5 text-center tabular-nums", text)}
                          >
                            {fmtScore(val, max)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
