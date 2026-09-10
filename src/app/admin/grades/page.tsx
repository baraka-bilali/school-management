"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Layout from "@/components/layout"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { ChevronDown, Loader2, RefreshCw, Save } from "lucide-react"

type TabKey = "cycles" | "maxima"

type Cycle = {
  id: number
  name: string
  kind: "PRIMARY" | "SECONDARY"
  isActive: boolean
  sections: Array<{ id: number; section: string }>
  periodGroups: Array<{
    id: number
    name: string
    sortOrder: number
    hasExam: boolean
    periods: Array<{ id: number; name: string; sortOrder: number }>
  }>
}

type Degree = {
  section: string
  level: string
  label: string
  classNames: string[]
}

type Subject = { id: number; name: string; code: string }

export default function GradesPage() {
  const [tab, setTab] = useState<TabKey>("cycles")
  const [loading, setLoading] = useState(true)
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [degrees, setDegrees] = useState<Degree[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number | "">("")
  const [degreeKey, setDegreeKey] = useState("")
  const [periodMaxInputs, setPeriodMaxInputs] = useState<Record<string, string>>({})
  const [examMaxInputs, setExamMaxInputs] = useState<Record<string, string>>({})
  const [savingMaxima, setSavingMaxima] = useState(false)
  const [degreeMenuOpen, setDegreeMenuOpen] = useState(false)
  const degreeMenuRef = useRef<HTMLDivElement>(null)

  const selectedDegree = useMemo(
    () => degrees.find((d) => `${d.section}::${d.level}` === degreeKey) || null,
    [degrees, degreeKey]
  )

  useEffect(() => {
    if (!degreeMenuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (!degreeMenuRef.current?.contains(e.target as Node)) {
        setDegreeMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [degreeMenuOpen])

  const cycleForDegree = useMemo(() => {
    if (!selectedDegree) return null
    return (
      cycles.find((c) => c.sections.some((s) => s.section === selectedDegree.section)) || null
    )
  }, [cycles, selectedDegree])

  const loadCycles = useCallback(async (ensure = false) => {
    const res = await authFetch(
      `/api/admin/evaluation-cycles${ensure ? "?ensureDefaults=1" : ""}`
    )
    if (!res.ok) throw new Error("Impossible de charger les cycles")
    const data = await res.json()
    setCycles(data.cycles || [])
  }, [])

  const loadMeta = useCallback(async () => {
    const [degRes, subRes] = await Promise.all([
      authFetch("/api/admin/grading-degrees"),
      authFetch("/api/admin/subjects"),
    ])
    if (degRes.ok) {
      const d = await degRes.json()
      setDegrees(d.degrees || [])
      setDegreeMenuOpen(false)
    }
    if (subRes.ok) {
      const s = await subRes.json()
      const items: Subject[] = (s.subjects || s.items || []).map(
        (x: { id: number; name: string; code: string }) => ({
          id: x.id,
          name: x.name,
          code: x.code,
        })
      )
      setSubjects(items)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        await Promise.all([loadCycles(true), loadMeta()])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    })()
  }, [loadCycles, loadMeta])

  useEffect(() => {
    if (!subjectId || !selectedDegree) {
      setPeriodMaxInputs({})
      setExamMaxInputs({})
      return
    }
    ;(async () => {
      const res = await authFetch(
        `/api/admin/subject-maxima?subjectId=${subjectId}&section=${encodeURIComponent(selectedDegree.section)}&level=${encodeURIComponent(selectedDegree.level)}`
      )
      if (!res.ok) return
      const data = await res.json()
      const p: Record<string, string> = {}
      for (const row of data.periodMaxima || []) {
        p[String(row.periodId)] = String(row.maxPoints)
      }
      const e: Record<string, string> = {}
      for (const row of data.examMaxima || []) {
        e[String(row.periodGroupId)] = String(row.maxPoints)
      }
      setPeriodMaxInputs(p)
      setExamMaxInputs(e)
    })()
  }, [subjectId, selectedDegree])

  const saveMaxima = async () => {
    if (!subjectId || !selectedDegree || !cycleForDegree) return
    setSavingMaxima(true)
    try {
      const periodMaxima = cycleForDegree.periodGroups.flatMap((g) =>
        g.periods
          .map((p) => ({
            periodId: p.id,
            maxPoints: Number(periodMaxInputs[String(p.id)]),
          }))
          .filter((x) => Number.isFinite(x.maxPoints) && x.maxPoints >= 0)
      )
      const examMaxima = cycleForDegree.periodGroups
        .filter((g) => g.hasExam)
        .map((g) => ({
          periodGroupId: g.id,
          maxPoints: Number(examMaxInputs[String(g.id)]),
        }))
        .filter((x) => Number.isFinite(x.maxPoints) && x.maxPoints >= 0)

      const res = await authFetch("/api/admin/subject-maxima", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          section: selectedDegree.section,
          level: selectedDegree.level,
          periodMaxima,
          examMaxima,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Enregistrement impossible")
      }
      toast.success("Maxima enregistrés pour ce degré")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSavingMaxima(false)
    }
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notes & Bulletins</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configuration des cycles d&apos;évaluation et des maxima officiels par degré.
          </p>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {(
            [
              ["cycles", "Cycles & périodes"],
              ["maxima", "Maxima officiels"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : tab === "cycles" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await loadCycles(true)
                    toast.success("Cycles par défaut synchronisés")
                  } catch {
                    toast.error("Échec de synchronisation")
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
                Assurer les cycles par défaut
              </button>
            </div>

            {cycles.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun cycle configuré.</p>
            ) : (
              cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {cycle.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cycle.kind === "PRIMARY" ? "Primaire (trimestres)" : "Secondaire (semestres)"}
                        {" · "}
                        Sections : {cycle.sections.map((s) => s.section).join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cycle.periodGroups.map((g) => (
                      <div
                        key={g.id}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 p-4"
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-100">{g.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {g.hasExam ? "Avec examen" : "Sans examen"}
                        </p>
                        <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {g.periods.map((p) => (
                            <li key={p.id}>• {p.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-600 dark:text-gray-400">Matière</span>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                >
                  <option value="">Choisir…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </label>
              <div className="block text-sm" ref={degreeMenuRef}>
                <span className="text-gray-600 dark:text-gray-400">Degré (section + niveau)</span>
                <div className="relative mt-1">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={degreeMenuOpen}
                    onClick={() => setDegreeMenuOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-left"
                  >
                    <span className={selectedDegree ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
                      {selectedDegree
                        ? `${selectedDegree.level} — ${selectedDegree.section}${
                            selectedDegree.classNames.length
                              ? ` (${selectedDegree.classNames.join(", ")})`
                              : ""
                          }`
                        : "Choisir…"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                        degreeMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {degreeMenuOpen && (
                    <ul
                      role="listbox"
                      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
                    >
                      <li>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => {
                            setDegreeKey("")
                            setDegreeMenuOpen(false)
                          }}
                        >
                          Choisir…
                        </button>
                      </li>
                      {degrees.map((d) => {
                        const key = `${d.section}::${d.level}`
                        const active = key === degreeKey
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                                active
                                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                              onClick={() => {
                                setDegreeKey(key)
                                setDegreeMenuOpen(false)
                              }}
                            >
                              {d.level} — {d.section}
                              {d.classNames.length ? ` (${d.classNames.join(", ")})` : ""}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {selectedDegree && (
              <p className="text-xs text-gray-500">
                Ces maxima s&apos;appliquent automatiquement à toutes les classes parallèles :{" "}
                {selectedDegree.classNames.join(", ") || "aucune classe pour ce degré"}.
              </p>
            )}

            {!cycleForDegree && selectedDegree && (
              <p className="text-sm text-amber-600">
                Aucun cycle ne couvre la section « {selectedDegree.section} ». Vérifiez l&apos;onglet
                Cycles.
              </p>
            )}

            {cycleForDegree && subjectId && (
              <div className="space-y-4">
                {cycleForDegree.periodGroups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{g.name}</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {g.periods.map((p) => (
                        <label key={p.id} className="text-sm block">
                          <span className="text-gray-600 dark:text-gray-400">Max {p.name}</span>
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={periodMaxInputs[String(p.id)] ?? ""}
                            onChange={(e) =>
                              setPeriodMaxInputs((prev) => ({
                                ...prev,
                                [String(p.id)]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                          />
                        </label>
                      ))}
                      {g.hasExam && (
                        <label className="text-sm block">
                          <span className="text-gray-600 dark:text-gray-400">Max examen</span>
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={examMaxInputs[String(g.id)] ?? ""}
                            onChange={(e) =>
                              setExamMaxInputs((prev) => ({
                                ...prev,
                                [String(g.id)]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  disabled={savingMaxima}
                  onClick={() => void saveMaxima()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingMaxima ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer les maxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
