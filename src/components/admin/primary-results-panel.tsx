"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Printer,
  Send,
  AlertCircle,
} from "lucide-react"
import { MenuSelect } from "@/components/ui/menu-select"
import { submissionStatusLabel } from "@/lib/grading/class-submission-status"
import type { ClassSubmissionStatus } from "@/lib/grading/class-submission-status"

type EventOption = {
  kind: "PERIOD" | "EXAM"
  periodId: number | null
  periodGroupId: number | null
  label: string
  groupName: string
}

type ClassRow = {
  classId: number
  name: string
  level: string
  letter: string
  titulaireName: string | null
  status: ClassSubmissionStatus
  lockedCount: number
  totalCount: number
  missingBranchNames: string[]
  publishedAt: string | null
}

function eventValue(e: EventOption): string {
  return e.kind === "PERIOD"
    ? `PERIOD:${e.periodId}`
    : `EXAM:${e.periodGroupId}`
}

function parseEventValue(v: string): {
  kind: "PERIOD" | "EXAM"
  periodId: number | null
  periodGroupId: number | null
} | null {
  if (v.startsWith("PERIOD:")) {
    const id = parseInt(v.slice(7), 10)
    if (!Number.isFinite(id)) return null
    return { kind: "PERIOD", periodId: id, periodGroupId: null }
  }
  if (v.startsWith("EXAM:")) {
    const id = parseInt(v.slice(5), 10)
    if (!Number.isFinite(id)) return null
    return { kind: "EXAM", periodId: null, periodGroupId: id }
  }
  return null
}

function statusBadge(status: ClassSubmissionStatus) {
  switch (status) {
    case "soumis":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50"
    case "partiel":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50"
    case "en_attente":
      return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700"
  }
}

export function PrimaryResultsPanel() {
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventKey, setEventKey] = useState("")
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [printOpenFor, setPrintOpenFor] = useState<number | null>(null)
  const [printStudentModal, setPrintStudentModal] = useState<ClassRow | null>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)

  const selectedEvent = useMemo(() => {
    const parsed = parseEventValue(eventKey)
    if (!parsed) return null
    return (
      events.find(
        (e) =>
          e.kind === parsed.kind &&
          (parsed.kind === "PERIOD"
            ? e.periodId === parsed.periodId
            : e.periodGroupId === parsed.periodGroupId)
      ) || null
    )
  }, [eventKey, events])

  const eventOptions = useMemo(
    () =>
      events.map((e) => ({
        value: eventValue(e),
        label: `${e.groupName} — ${e.label}`,
      })),
    [events]
  )

  const load = useCallback(async (key?: string) => {
    setLoading(true)
    try {
      const parsed = key ? parseEventValue(key) : null
      const params = new URLSearchParams()
      if (parsed) {
        params.set("kind", parsed.kind)
        if (parsed.periodId) params.set("periodId", String(parsed.periodId))
        if (parsed.periodGroupId) params.set("periodGroupId", String(parsed.periodGroupId))
      }
      const qs = params.toString()
      const res = await authFetch(`/api/admin/primary-results${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Chargement impossible")

      const evs = (data.events || []) as EventOption[]
      setEvents(evs)

      const sel = data.selected as
        | { kind: "PERIOD" | "EXAM"; periodId: number | null; periodGroupId: number | null }
        | undefined
      if (sel) {
        const v =
          sel.kind === "PERIOD"
            ? `PERIOD:${sel.periodId}`
            : `EXAM:${sel.periodGroupId}`
        setEventKey(v)
      } else if (evs[0]) {
        setEventKey(eventValue(evs[0]))
      }

      setClasses((data.classes || []) as ClassRow[])
      setSelectedIds(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (printOpenFor == null) return
    const onDoc = (ev: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(ev.target as Node)) {
        setPrintOpenFor(null)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [printOpenFor])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSoumisSelected = useMemo(() => {
    const rows = classes.filter((c) => selectedIds.has(c.classId))
    return rows.length > 0 && rows.every((c) => c.status === "soumis")
  }, [classes, selectedIds])

  const publish = async (classIds: number[]) => {
    if (!selectedEvent || classIds.length === 0) return
    setPublishing(true)
    try {
      const res = await authFetch("/api/admin/bulletin-publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: classIds.map((classId) => ({
            classId,
            kind: selectedEvent.kind,
            periodId: selectedEvent.periodId,
            periodGroupId: selectedEvent.periodGroupId,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Publication impossible")
      const n = (data.published || []).length
      const skipped = (data.skipped || []).length
      if (n > 0) toast.success(`${n} bulletin(s) publié(s)`)
      if (skipped > 0) {
        toast.message(`${skipped} classe(s) ignorée(s) (non entièrement soumise)`)
      }
      await load(eventKey)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20 px-3 py-2.5 text-xs text-indigo-800 dark:text-indigo-200">
        Statut provisoire basé sur les verrous <strong>GradeEntryLock</strong> par branche pour
        l&apos;événement sélectionné (soumis = tous · partiel = certains · en attente = aucun).
        La règle définitive pourra être ajustée.
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <MenuSelect
            mode="menu"
            label="Événement d'évaluation"
            placeholder="Choisir une période ou un examen…"
            value={eventKey}
            options={eventOptions}
            allowClear={false}
            onChange={(v) => {
              setEventKey(v)
              void load(v)
            }}
          />
        </div>
        <button
          type="button"
          disabled={publishing || !allSoumisSelected}
          onClick={() =>
            void publish(classes.filter((c) => selectedIds.has(c.classId)).map((c) => c.classId))
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title={
            allSoumisSelected
              ? "Publier les classes sélectionnées"
              : "Sélectionnez uniquement des classes entièrement soumises"
          }
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Publier la sélection
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : classes.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          Aucune classe Primaire. Créez des classes dans la section Primaire.
        </p>
      ) : (
        <div className="space-y-3">
          {classes.map((row) => {
            const canPublish = row.status === "soumis"
            const checked = selectedIds.has(row.classId)
            return (
              <div
                key={row.classId}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <label className="mt-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(row.classId)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label={`Sélectionner ${row.name}`}
                    />
                  </label>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {row.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {row.level}
                        {row.letter ? ` · ${row.letter}` : ""}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(row.status)}`}
                      >
                        {row.status === "soumis" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : row.status === "partiel" ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {submissionStatusLabel(row.status)}
                      </span>
                      {row.publishedAt && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                          Publié
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Titulaire : {row.titulaireName || "—"}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {row.lockedCount}/{row.totalCount} branches validées
                    </p>
                    {(row.status === "partiel" || row.status === "en_attente") &&
                      row.missingBranchNames.length > 0 && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Branches manquantes : {row.missingBranchNames.join(", ")}
                        </p>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <button
                      type="button"
                      disabled={!canPublish || publishing}
                      onClick={() => void publish([row.classId])}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        canPublish
                          ? "Publier les bulletins de la classe"
                          : "Disponible uniquement lorsque toutes les branches sont soumises"
                      }
                    >
                      <Send className="h-3.5 w-3.5" />
                      Publier
                    </button>

                    <div className="relative" ref={printOpenFor === row.classId ? printMenuRef : undefined}>
                      <button
                        type="button"
                        onClick={() =>
                          setPrintOpenFor((prev) => (prev === row.classId ? null : row.classId))
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimer
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </button>
                      {printOpenFor === row.classId && (
                        <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setPrintOpenFor(null)
                              toast.message("Impression bientôt disponible")
                            }}
                          >
                            Toute la classe
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setPrintOpenFor(null)
                              setPrintStudentModal(row)
                            }}
                          >
                            Un élève…
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {printStudentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPrintStudentModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Imprimer un élève
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Classe {printStudentModal.name} — l&apos;impression individuelle sera disponible
              prochainement.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.message("Impression bientôt disponible")
                  setPrintStudentModal(null)
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
