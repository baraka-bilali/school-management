"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { CheckCircle2, Loader2, RefreshCw, Save } from "lucide-react"
import { degreeKey as buildDegreeKey, formatDegreeLabel } from "@/lib/grading/degree"
import { MenuSelect } from "@/components/ui/menu-select"

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
  stream: string
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
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  const selectedDegree = useMemo(
    () =>
      degrees.find(
        (d) => buildDegreeKey(d.section, d.level, d.stream) === degreeKey
      ) || null,
    [degrees, degreeKey]
  )

  const subjectOptions = useMemo(
    () =>
      subjects.map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.code})`,
      })),
    [subjects]
  )

  const degreeOptions = useMemo(
    () =>
      degrees.map((d) => {
        const key = buildDegreeKey(d.section, d.level, d.stream)
        const base = formatDegreeLabel(d.section, d.level, d.stream)
        const classes = d.classNames.length ? ` (${d.classNames.join(", ")})` : ""
        return { value: key, label: `${base}${classes}` }
      }),
    [degrees]
  )

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
      setSaveFeedback(null)
      return
    }
    setSaveFeedback(null)
    ;(async () => {
      const params = new URLSearchParams({
        subjectId: String(subjectId),
        section: selectedDegree.section,
        level: selectedDegree.level,
        stream: selectedDegree.stream || "",
      })
      const res = await authFetch(`/api/admin/subject-maxima?${params}`)
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
    setSaveFeedback(null)
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

      if (periodMaxima.length === 0 && examMaxima.length === 0) {
        throw new Error("Renseignez au moins un maximum avant d’enregistrer")
      }

      const res = await authFetch("/api/admin/subject-maxima", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          section: selectedDegree.section,
          level: selectedDegree.level,
          stream: selectedDegree.stream || "",
          periodMaxima,
          examMaxima,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Enregistrement impossible")
      }
      const label = formatDegreeLabel(
        selectedDegree.section,
        selectedDegree.level,
        selectedDegree.stream
      )
      const msg = `Maxima enregistrés pour ${label}`
      setSaveFeedback(msg)
      toast.success(msg)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur"
      setSaveFeedback(null)
      toast.error(msg)
    } finally {
      setSavingMaxima(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notes & Bulletins</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configuration des cycles d&apos;évaluation et des maxima officiels par degré
            (et par filière en Humanités).
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
              <MenuSelect
                label="Matière"
                placeholder="Choisir…"
                value={subjectId === "" ? "" : String(subjectId)}
                options={subjectOptions}
                onChange={(v) => {
                  setSaveFeedback(null)
                  setSubjectId(v ? Number(v) : "")
                }}
              />
              <MenuSelect
                label={
                  selectedDegree?.section === "Humanités"
                    ? "Degré + filière"
                    : "Degré (section + niveau)"
                }
                placeholder="Choisir…"
                value={degreeKey}
                options={degreeOptions}
                onChange={(v) => {
                  setSaveFeedback(null)
                  setDegreeKey(v)
                }}
              />
            </div>

            {selectedDegree?.section === "Humanités" && (
              <p className="text-xs text-amber-700 dark:text-amber-400/90 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                En Humanités, les maxima sont définis <strong>par filière</strong> (ex. Scientifique vs
                Commerciale et Gestion). Choisissez la bonne filière ci-dessus.
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
                            onChange={(e) => {
                              setSaveFeedback(null)
                              setPeriodMaxInputs((prev) => ({
                                ...prev,
                                [String(p.id)]: e.target.value,
                              }))
                            }}
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
                            onChange={(e) => {
                              setSaveFeedback(null)
                              setExamMaxInputs((prev) => ({
                                ...prev,
                                [String(g.id)]: e.target.value,
                              }))
                            }}
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
                  {savingMaxima ? "Enregistrement…" : "Enregistrer les maxima"}
                </button>

                {saveFeedback && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{saveFeedback}</span>
                  </div>
                )}

                {selectedDegree && (
                  <p className="text-xs text-gray-500">
                    Ces maxima s&apos;appliquent aux classes :{" "}
                    {selectedDegree.classNames.join(", ") || "aucune classe pour ce degré"}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
  )
}
