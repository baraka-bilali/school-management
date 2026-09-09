"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import {
  AcademicYearSelect,
  type AcademicYearOption,
} from "@/components/academic-year-select"
import { authFetch } from "@/lib/auth-fetch"
import { toDisplayCode } from "@/lib/student-fields"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowRightLeft,
  Check,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react"

type TabKey = "decisions" | "propositions"

type DecisionValue = "PASSAGE" | "REDOUBLEMENT" | "ORIENTATION" | ""

interface EnrollmentClass {
  id: number
  name: string
  level?: string
  section?: string
  letter?: string | null
  stream?: string | null
  nextClassId?: number | null
  nextClass?: { id: number; name: string } | null
}

interface DecisionItem {
  id: number
  studentId: number
  classId: number
  yearId: number
  code: string | null
  status: string
  origine: string | null
  decisionPassage: DecisionValue | null
  dateDecision: string | null
  commentaireConseil: string | null
  student: {
    id: number
    permanentCode?: string | null
    code?: string | null
    lastName: string
    middleName?: string | null
    firstName: string
    gender?: string | null
  }
  class: EnrollmentClass
  year: { id: number; name: string }
}

interface ClassOption {
  id: number
  name: string
  level?: string
  section?: string
  letter?: string | null
}

interface RowDraft {
  decisionPassage: DecisionValue
  commentaireConseil: string
}

const DECISION_OPTIONS: { value: DecisionValue; label: string }[] = [
  { value: "", label: "—" },
  { value: "PASSAGE", label: "Passage" },
  { value: "REDOUBLEMENT", label: "Redoublement" },
  { value: "ORIENTATION", label: "Orientation" },
]

function studentFullName(s: DecisionItem["student"]) {
  return [s.lastName, s.middleName, s.firstName].filter(Boolean).join(" ")
}

export default function PromotionsPage() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  )
  const [tab, setTab] = useState<TabKey>("decisions")
  const [years, setYears] = useState<AcademicYearOption[]>([])
  const [currentYearId, setCurrentYearId] = useState<number | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [sourceYearId, setSourceYearId] = useState<string>("")
  const [targetYearId, setTargetYearId] = useState<string>("")
  const [items, setItems] = useState<DecisionItem[]>([])
  const [targetItems, setTargetItems] = useState<DecisionItem[]>([])
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({})
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingTarget, setLoadingTarget] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [generateResult, setGenerateResult] = useState<{
    created: number
    skipped: number
  } | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  useEffect(() => {
    authFetch("/api/admin/meta")
      .then((r) => r.json())
      .then((res) => {
        const mappedYears = (res.years || []).map((y: AcademicYearOption) => ({
          ...y,
          isCurrent: res.currentYearId ? y.id === res.currentYearId : y.isCurrent,
        }))
        setYears(mappedYears)
        setClasses(res.classes || [])
        if (res.currentYearId) {
          setCurrentYearId(res.currentYearId)
          setSourceYearId((prev) => prev || String(res.currentYearId))
        } else if (mappedYears[0]) {
          setSourceYearId((prev) => prev || String(mappedYears[0].id))
        }
      })
      .catch(() => toast.error("Impossible de charger les années scolaires"))
  }, [])

  // Default target year = next year after source (by name desc order, pick first different)
  useEffect(() => {
    if (!sourceYearId || !years.length) return
    const sourceId = Number(sourceYearId)
    const others = years.filter((y) => y.id !== sourceId)
    if (!targetYearId && others.length) {
      // Prefer a year that looks like N+1 (lexicographically after source name)
      const source = years.find((y) => y.id === sourceId)
      const nextByName = others.find(
        (y) => source && y.name.localeCompare(source.name) > 0
      )
      setTargetYearId(String((nextByName || others[0]).id))
    }
  }, [sourceYearId, years, targetYearId])

  const loadDecisions = useCallback(async (yearId: string) => {
    if (!yearId) return
    setLoading(true)
    try {
      const res = await authFetch(
        `/api/admin/enrollments/decisions?yearId=${yearId}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de chargement")
      const list: DecisionItem[] = data.items || []
      setItems(list)
      const nextDrafts: Record<number, RowDraft> = {}
      for (const e of list) {
        nextDrafts[e.id] = {
          decisionPassage: (e.decisionPassage || "") as DecisionValue,
          commentaireConseil: e.commentaireConseil || "",
        }
      }
      setDrafts(nextDrafts)
      setOverrides({})
      setGenerateResult(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPropositions = useCallback(async (yearId: string) => {
    if (!yearId) return
    setLoadingTarget(true)
    try {
      const res = await authFetch(
        `/api/admin/enrollments/decisions?yearId=${yearId}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de chargement")
      const list: DecisionItem[] = (data.items || []).filter(
        (e: DecisionItem) => e.status === "PROPOSEE"
      )
      setTargetItems(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement")
      setTargetItems([])
    } finally {
      setLoadingTarget(false)
    }
  }, [])

  useEffect(() => {
    if (sourceYearId) loadDecisions(sourceYearId)
  }, [sourceYearId, loadDecisions])

  useEffect(() => {
    if (tab === "propositions" && targetYearId) {
      loadPropositions(targetYearId)
    }
  }, [tab, targetYearId, loadPropositions])

  const decisionRows = useMemo(
    () =>
      items.filter((e) => e.status === "ACTIVE" || e.status === "CONFIRMEE"),
    [items]
  )

  const passageNeedsOverride = useMemo(() => {
    return decisionRows.filter((e) => {
      const draft = drafts[e.id]
      return (
        draft?.decisionPassage === "PASSAGE" && !e.class?.nextClassId
      )
    })
  }, [decisionRows, drafts])

  const dirtyCount = useMemo(() => {
    let n = 0
    for (const e of decisionRows) {
      const d = drafts[e.id]
      if (!d) continue
      const origDecision = (e.decisionPassage || "") as DecisionValue
      const origComment = e.commentaireConseil || ""
      if (
        d.decisionPassage !== origDecision ||
        d.commentaireConseil !== origComment
      ) {
        n++
      }
    }
    return n
  }, [decisionRows, drafts])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const bgInput = theme === "dark" ? "bg-gray-700" : "bg-white"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
  const selectCls = `rounded-md border ${borderColor} ${bgInput} ${textColor} px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`

  const updateDraft = (id: number, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  const handleSaveDecisions = async () => {
    const updates = decisionRows
      .map((e) => {
        const d = drafts[e.id]
        if (!d) return null
        const origDecision = (e.decisionPassage || "") as DecisionValue
        const origComment = e.commentaireConseil || ""
        if (
          d.decisionPassage === origDecision &&
          d.commentaireConseil === origComment
        ) {
          return null
        }
        return {
          enrollmentId: e.id,
          decisionPassage: d.decisionPassage || null,
          commentaireConseil: d.commentaireConseil,
        }
      })
      .filter(Boolean)

    if (!updates.length) {
      toast.message("Aucune modification à enregistrer")
      return
    }

    setSaving(true)
    try {
      const res = await authFetch("/api/admin/enrollments/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur d'enregistrement")
      toast.success(`${data.updated ?? updates.length} décision(s) enregistrée(s)`)
      await loadDecisions(sourceYearId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (!sourceYearId || !targetYearId) {
      toast.error("Sélectionnez les années source et cible")
      return
    }
    if (sourceYearId === targetYearId) {
      toast.error("L'année cible doit être différente de l'année source")
      return
    }

    const missing = passageNeedsOverride.filter((e) => !overrides[e.id])
    if (missing.length) {
      toast.error(
        `${missing.length} élève(s) en passage sans classe supérieure — choisissez une classe`
      )
      return
    }

    const overridePayload: Record<string, number> = {}
    for (const [id, classId] of Object.entries(overrides)) {
      if (classId) overridePayload[id] = Number(classId)
    }

    setGenerating(true)
    setGenerateResult(null)
    try {
      const res = await authFetch("/api/admin/enrollments/generate-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceYearId: Number(sourceYearId),
          targetYearId: Number(targetYearId),
          overrides: overridePayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de génération")
      setGenerateResult({
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
      })
      toast.success(
        `Propositions : ${data.created ?? 0} créées, ${data.skipped ?? 0} ignorées`
      )
      if (tab === "propositions") {
        await loadPropositions(targetYearId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de génération")
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirm = async (enrollmentId: number) => {
    setConfirmingId(enrollmentId)
    try {
      const res = await authFetch(
        `/api/admin/enrollments/${enrollmentId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activate: true }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de confirmation")
      toast.success("Inscription confirmée et activée")
      await loadPropositions(targetYearId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de confirmation")
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-4 md:p-6">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Passages</h1>
          <p className={textSecondary}>
            Décisions de fin d&apos;année, propositions N+1 et confirmations.
          </p>
        </div>

        <div
          className={`flex items-center space-x-2 border-b ${borderColor} overflow-x-auto scrollbar-hide`}
        >
          <button
            type="button"
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "decisions"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : `border-transparent ${textSecondary} hover:text-gray-900 dark:hover:text-gray-100`
            )}
            onClick={() => setTab("decisions")}
          >
            Décisions
          </button>
          <button
            type="button"
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "propositions"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : `border-transparent ${textSecondary} hover:text-gray-900 dark:hover:text-gray-100`
            )}
            onClick={() => setTab("propositions")}
          >
            Propositions
          </button>
        </div>

        {tab === "decisions" && (
          <>
            <Card theme={theme}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className={textColor}>Décisions de passage</CardTitle>
                  <p className={`mt-1 text-sm ${textSecondary}`}>
                    Année source (année en cours des inscriptions)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AcademicYearSelect
                    years={years}
                    value={sourceYearId}
                    currentYearId={currentYearId}
                    onChange={setSourceYearId}
                    className={selectCls}
                    aria-label="Année source"
                  />
                  <button
                    type="button"
                    disabled={saving || dirtyCount === 0}
                    onClick={handleSaveDecisions}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer les décisions
                    {dirtyCount > 0 && (
                      <span className="rounded-full bg-white/20 px-1.5 text-xs">
                        {dirtyCount}
                      </span>
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className={`flex items-center gap-2 py-10 justify-center ${textSecondary}`}>
                    <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    Chargement…
                  </div>
                ) : decisionRows.length === 0 ? (
                  <p className={`py-8 text-center text-sm ${textSecondary}`}>
                    Aucune inscription active pour cette année.
                  </p>
                ) : (
                  <div className={`overflow-x-auto rounded-lg border ${borderColor}`}>
                    <table className="min-w-full text-sm">
                      <thead
                        className={
                          theme === "dark"
                            ? "bg-gray-900/50 text-gray-400"
                            : "bg-gray-50 text-gray-600"
                        }
                      >
                        <tr>
                          <th className="px-3 py-2.5 text-left font-medium">Élève</th>
                          <th className="px-3 py-2.5 text-left font-medium">Code</th>
                          <th className="px-3 py-2.5 text-left font-medium">Classe</th>
                          <th className="px-3 py-2.5 text-left font-medium">Décision</th>
                          <th className="px-3 py-2.5 text-left font-medium">
                            Commentaire conseil
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${borderColor}`}>
                        {decisionRows.map((e) => {
                          const draft = drafts[e.id] || {
                            decisionPassage: "" as DecisionValue,
                            commentaireConseil: "",
                          }
                          return (
                            <tr key={e.id} className={hoverBg}>
                              <td className={`px-3 py-2.5 font-medium ${textColor}`}>
                                {studentFullName(e.student)}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-teal-500">
                                {toDisplayCode(
                                  e.student.permanentCode || e.student.code
                                )}
                              </td>
                              <td className={`px-3 py-2.5 ${textSecondary}`}>
                                {e.class?.name}
                                {e.class?.nextClass?.name && (
                                  <span className="ml-1 text-xs opacity-70">
                                    → {e.class.nextClass.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <select
                                  value={draft.decisionPassage}
                                  onChange={(ev) =>
                                    updateDraft(e.id, {
                                      decisionPassage: ev.target
                                        .value as DecisionValue,
                                    })
                                  }
                                  className={selectCls}
                                >
                                  {DECISION_OPTIONS.map((o) => (
                                    <option key={o.value || "empty"} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5 min-w-[180px]">
                                <input
                                  type="text"
                                  value={draft.commentaireConseil}
                                  onChange={(ev) =>
                                    updateDraft(e.id, {
                                      commentaireConseil: ev.target.value,
                                    })
                                  }
                                  placeholder="Optionnel"
                                  className={`w-full ${selectCls}`}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card theme={theme}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                  <ArrowRightLeft className="h-5 w-5 text-teal-500" />
                  Générer propositions N+1
                </CardTitle>
                <p className={`text-sm ${textSecondary}`}>
                  Crée des inscriptions PROPOSÉE pour l&apos;année cible (passage /
                  redoublement).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className={`mb-1 block text-xs font-medium ${textSecondary}`}>
                      Année cible
                    </label>
                    <AcademicYearSelect
                      years={years.filter((y) => String(y.id) !== sourceYearId)}
                      value={targetYearId}
                      currentYearId={currentYearId}
                      onChange={setTargetYearId}
                      className={selectCls}
                      aria-label="Année cible"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={generating || !targetYearId}
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Générer les propositions
                  </button>
                </div>

                {passageNeedsOverride.length > 0 && (
                  <div
                    className={`rounded-lg border ${borderColor} p-3 space-y-2`}
                  >
                    <p className={`text-sm font-medium ${textColor}`}>
                      Classes manquantes pour le passage
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      Ces élèves sont en PASSAGE sans classe supérieure définie.
                      Choisissez la classe cible.
                    </p>
                    <div className="space-y-2">
                      {passageNeedsOverride.map((e) => (
                        <div
                          key={e.id}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <span className={`min-w-[160px] font-medium ${textColor}`}>
                            {studentFullName(e.student)}
                          </span>
                          <span className={textSecondary}>{e.class?.name}</span>
                          <select
                            value={overrides[e.id] || ""}
                            onChange={(ev) =>
                              setOverrides((prev) => ({
                                ...prev,
                                [e.id]: ev.target.value,
                              }))
                            }
                            className={selectCls}
                          >
                            <option value="">Choisir une classe…</option>
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generateResult && (
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      theme === "dark"
                        ? "bg-teal-500/10 text-teal-300"
                        : "bg-teal-50 text-teal-800"
                    )}
                  >
                    Résultat :{" "}
                    <strong>{generateResult.created}</strong> créée(s),{" "}
                    <strong>{generateResult.skipped}</strong> ignorée(s).
                    <button
                      type="button"
                      className="ml-3 underline font-medium"
                      onClick={() => setTab("propositions")}
                    >
                      Voir les propositions
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {tab === "propositions" && (
          <Card theme={theme}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className={textColor}>Propositions N+1</CardTitle>
                <p className={`mt-1 text-sm ${textSecondary}`}>
                  Inscriptions au statut PROPOSÉE — confirmer pour les activer.
                </p>
              </div>
              <AcademicYearSelect
                years={years}
                value={targetYearId}
                currentYearId={currentYearId}
                onChange={setTargetYearId}
                className={selectCls}
                aria-label="Année des propositions"
              />
            </CardHeader>
            <CardContent>
              {loadingTarget ? (
                <div className={`flex items-center gap-2 py-10 justify-center ${textSecondary}`}>
                  <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                  Chargement…
                </div>
              ) : targetItems.length === 0 ? (
                <p className={`py-8 text-center text-sm ${textSecondary}`}>
                  Aucune proposition pour cette année.
                </p>
              ) : (
                <div className={`overflow-x-auto rounded-lg border ${borderColor}`}>
                  <table className="min-w-full text-sm">
                    <thead
                      className={
                        theme === "dark"
                          ? "bg-gray-900/50 text-gray-400"
                          : "bg-gray-50 text-gray-600"
                      }
                    >
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium">Élève</th>
                        <th className="px-3 py-2.5 text-left font-medium">Code</th>
                        <th className="px-3 py-2.5 text-left font-medium">Classe</th>
                        <th className="px-3 py-2.5 text-left font-medium">Origine</th>
                        <th className="px-3 py-2.5 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${borderColor}`}>
                      {targetItems.map((e) => (
                        <tr key={e.id} className={hoverBg}>
                          <td className={`px-3 py-2.5 font-medium ${textColor}`}>
                            {studentFullName(e.student)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-teal-500">
                            {toDisplayCode(
                              e.student.permanentCode || e.student.code
                            )}
                          </td>
                          <td className={`px-3 py-2.5 ${textSecondary}`}>
                            {e.class?.name}
                          </td>
                          <td className={`px-3 py-2.5 ${textSecondary}`}>
                            {e.origine || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              disabled={confirmingId === e.id}
                              onClick={() => handleConfirm(e.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                              {confirmingId === e.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Confirmer
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
    </Layout>
  )
}
