"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Loader2,
  Printer,
  Search,
  Send,
  AlertCircle,
  X,
  Undo2,
} from "lucide-react"
import { MenuSelect } from "@/components/ui/menu-select"
import Portal from "@/components/portal"
import { useAppTheme } from "@/components/use-app-theme"
import { cn } from "@/lib/utils"
import { submissionStatusLabel } from "@/lib/grading/class-submission-status"
import type { ClassSubmissionStatus } from "@/lib/grading/class-submission-status"
import type {
  ClassStudentOption,
  PrimaryBulletinPayload,
} from "@/lib/grading/primary-bulletin"

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

function statusBadge(status: ClassSubmissionStatus, isDark: boolean) {
  switch (status) {
    case "soumis":
      return isDark
        ? "bg-green-950/40 text-green-300 border-green-900/50"
        : "bg-green-50 text-green-700 border-green-200"
    case "partiel":
      return isDark
        ? "bg-amber-950/40 text-amber-300 border-amber-900/50"
        : "bg-amber-50 text-amber-800 border-amber-200"
    case "en_attente":
      return isDark
        ? "bg-gray-800/50 text-gray-300 border-gray-700"
        : "bg-gray-50 text-gray-600 border-gray-200"
  }
}

function normalizeSearch(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

async function generateBulletinPdfBlob(
  data: PrimaryBulletinPayload,
  opts?: { trailingBlankPage?: boolean }
): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer")
  const { default: PrimaryBulletinPDF } = await import(
    "@/components/primary-bulletin-pdf"
  )
  return pdf(
    <PrimaryBulletinPDF
      data={data}
      trailingBlankPage={opts?.trailingBlankPage === true}
    />
  ).toBlob()
}

export function PrimaryResultsPanel() {
  const { isDark } = useAppTheme()
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventKey, setEventKey] = useState("")
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [printOpenFor, setPrintOpenFor] = useState<number | null>(null)
  const printMenuRef = useRef<HTMLDivElement>(null)

  const [studentPicker, setStudentPicker] = useState<ClassRow | null>(null)
  const [studentList, setStudentList] = useState<ClassStudentOption[]>([])
  const [studentListLoading, setStudentListLoading] = useState(false)
  const [studentQuery, setStudentQuery] = useState("")

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTitle, setPreviewTitle] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<PrimaryBulletinPayload | null>(
    null
  )
  const previewUrlRef = useRef<string | null>(null)
  const previewRequestIdRef = useRef(0)

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

  const filteredStudents = useMemo(() => {
    const q = normalizeSearch(studentQuery)
    if (!q) return studentList
    return studentList.filter((s) => {
      const hay = normalizeSearch(
        `${s.fullName} ${s.code} ${s.lastName} ${s.firstName} ${s.middleName}`
      )
      return hay.includes(q)
    })
  }, [studentList, studentQuery])

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  const closePreview = useCallback(() => {
    previewRequestIdRef.current += 1
    setPreviewOpen(false)
    setPreviewLoading(false)
    setPreviewData(null)
    setPreviewTitle("")
    revokePreviewUrl()
  }, [revokePreviewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const load = useCallback(async (key?: string) => {
    setLoading(true)
    try {
      const parsed = key ? parseEventValue(key) : null
      const params = new URLSearchParams()
      if (parsed) {
        params.set("kind", parsed.kind)
        if (parsed.periodId) params.set("periodId", String(parsed.periodId))
        if (parsed.periodGroupId)
          params.set("periodGroupId", String(parsed.periodGroupId))
      }
      const qs = params.toString()
      const res = await authFetch(
        `/api/admin/primary-results${qs ? `?${qs}` : ""}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Chargement impossible")

      const evs = (data.events || []) as EventOption[]
      setEvents(evs)

      const sel = data.selected as
        | {
            kind: "PERIOD" | "EXAM"
            periodId: number | null
            periodGroupId: number | null
          }
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
      if (
        printMenuRef.current &&
        !printMenuRef.current.contains(ev.target as Node)
      ) {
        setPrintOpenFor(null)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [printOpenFor])

  useEffect(() => {
    if (!studentPicker) {
      setStudentList([])
      setStudentQuery("")
      return
    }
    let cancelled = false
    setStudentListLoading(true)
    void (async () => {
      try {
        const res = await authFetch(
          `/api/admin/primary-results/students?classId=${studentPicker.classId}`
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Chargement des élèves impossible")
        if (!cancelled) {
          setStudentList((data.students || []) as ClassStudentOption[])
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Erreur")
          setStudentPicker(null)
        }
      } finally {
        if (!cancelled) setStudentListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentPicker])

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
        toast.message(
          `${skipped} classe(s) ignorée(s) (non entièrement soumise)`
        )
      }
      await load(eventKey)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setPublishing(false)
    }
  }

  const unpublish = async (classId: number) => {
    if (!selectedEvent) return
    setPublishing(true)
    try {
      const res = await authFetch("/api/admin/bulletin-publications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          kind: selectedEvent.kind,
          periodId: selectedEvent.periodId,
          periodGroupId: selectedEvent.periodGroupId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Retrait impossible")
      toast.success(data.message || "Publication retirée")
      await load(eventKey)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setPublishing(false)
    }
  }

  const openBulletinPreview = async (opts: {
    classRow: ClassRow
    enrollmentId?: number
    title: string
  }) => {
    if (!selectedEvent) {
      toast.error("Choisissez un événement d'évaluation")
      return
    }
    const requestId = ++previewRequestIdRef.current
    setStudentPicker(null)
    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewTitle(opts.title)
    setPreviewData(null)
    revokePreviewUrl()

    try {
      const params = new URLSearchParams({
        classId: String(opts.classRow.classId),
        kind: selectedEvent.kind,
      })
      if (selectedEvent.periodId)
        params.set("periodId", String(selectedEvent.periodId))
      if (selectedEvent.periodGroupId)
        params.set("periodGroupId", String(selectedEvent.periodGroupId))
      if (opts.enrollmentId)
        params.set("enrollmentId", String(opts.enrollmentId))

      const res = await authFetch(
        `/api/admin/primary-results/bulletin?${params}`
      )
      if (requestId !== previewRequestIdRef.current) return
      const json = await res.json()
      if (requestId !== previewRequestIdRef.current) return
      if (!res.ok) throw new Error(json.error || "Impossible de charger le bulletin")

      const data = json.data as PrimaryBulletinPayload
      if (!data?.students?.length) {
        throw new Error("Aucun élève à imprimer pour cette sélection")
      }

      // Page blanche finale désactivée : le bulletin tient sur 1 page ;
      // le padding bas évite la troncature Chrome en iframe.
      const blob = await generateBulletinPdfBlob(data)
      if (requestId !== previewRequestIdRef.current) return
      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setPreviewData(data)
      setPreviewLoading(false)
    } catch (e) {
      if (requestId !== previewRequestIdRef.current) return
      toast.error(e instanceof Error ? e.message : "Erreur")
      closePreview()
    }
  }

  const downloadPreviewPdf = async () => {
    if (!previewData) return
    try {
      // PDF « propre » sans page blanche (réservée à l’aperçu iframe)
      const blob = await generateBulletinPdfBlob(previewData)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const suffix =
        previewData.students.length === 1
          ? previewData.students[0].fullName.replace(/\s+/g, "-")
          : previewData.class.name.replace(/\s+/g, "-")
      a.download = `bulletin-${suffix}-${previewData.focusEvent.label.replace(/\s+/g, "-")}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléchargement impossible")
    }
  }

  const printPreviewPdf = async () => {
    if (!previewData) return
    try {
      const blob = await generateBulletinPdfBlob(previewData)
      const url = URL.createObjectURL(blob)
      const w = window.open(url, "_blank")
      if (!w) {
        URL.revokeObjectURL(url)
        toast.error("Autorisez les pop-ups pour imprimer")
        return
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impression impossible")
    }
  }

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 text-xs",
          isDark
            ? "border-indigo-900/40 bg-indigo-950/30 text-indigo-200"
            : "border-indigo-200 bg-indigo-50 text-indigo-900"
        )}
      >
        Statut basé sur la validation enseignant (<strong>soumis</strong> = toutes
        les branches verrouillées). L&apos;aperçu / impression PDF reprend aussi
        ce qui est déjà publié aux élèves. Choisissez le même événement (ex.
        Examen T1) pour comparer. Seul <strong>Publier</strong> rend les notes
        visibles aux élèves.
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
            void publish(
              classes
                .filter((c) => selectedIds.has(c.classId))
                .map((c) => c.classId)
            )
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
                className={cn(
                  "rounded-2xl border p-4 sm:p-5",
                  isDark
                    ? "border-gray-700 bg-gray-900"
                    : "border-gray-200 bg-white"
                )}
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
                      <h3
                        className={cn(
                          "text-base font-semibold",
                          isDark ? "text-gray-100" : "text-gray-900"
                        )}
                      >                        {row.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {row.level}
                        {row.letter ? ` · ${row.letter}` : ""}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(row.status, isDark)}`}
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
                    {row.publishedAt ? (
                      <button
                        type="button"
                        disabled={publishing}
                        onClick={() => void unpublish(row.classId)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                        title="Retirer la publication pour les élèves"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Dépublier
                      </button>
                    ) : (
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
                    )}

                    <div
                      className="relative"
                      ref={
                        printOpenFor === row.classId ? printMenuRef : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPrintOpenFor((prev) =>
                            prev === row.classId ? null : row.classId
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimer
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </button>
                      {printOpenFor === row.classId && (
                        <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setPrintOpenFor(null)
                              void openBulletinPreview({
                                classRow: row,
                                title: `Aperçu — ${row.name}`,
                              })
                            }}
                          >
                            Toute la classe
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setPrintOpenFor(null)
                              setStudentPicker(row)
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

      {studentPicker && (
        <Portal>
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
            onClick={() => setStudentPicker(null)}
          >
            <div
              className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Choisir un élève
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {studentPicker.name} — liste alphabétique
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentPicker(null)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Rechercher par nom ou code…"
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 pl-10 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-[200px]">
                {studentListLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-gray-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des élèves…
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">
                    {studentList.length === 0
                      ? "Aucun élève inscrit dans cette classe."
                      : "Aucun élève ne correspond à la recherche."}
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {filteredStudents.map((s) => (
                      <li key={s.enrollmentId}>
                        <button
                          type="button"
                          className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          onClick={() =>
                            void openBulletinPreview({
                              classRow: studentPicker,
                              enrollmentId: s.enrollmentId,
                              title: `Aperçu — ${s.fullName}`,
                            })
                          }
                        >
                          <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                            {s.fullName}
                          </span>
                          {s.code ? (
                            <span className="text-xs text-gray-500">
                              Code {s.code}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {previewOpen && (
        <Portal>
          <div className="fixed inset-0 z-[90] flex flex-col bg-black/50 p-2 sm:p-4">
            <div className="mx-auto w-full max-w-[96vw] flex-1 flex flex-col min-h-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Eye className="h-4 w-4 text-indigo-600 shrink-0" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {previewTitle || "Aperçu du bulletin"}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!previewUrl || previewLoading}
                    onClick={() => void downloadPreviewPdf()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </button>
                  <button
                    type="button"
                    disabled={!previewUrl || previewLoading}
                    onClick={printPreviewPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimer
                  </button>
                  <button
                    type="button"
                    onClick={closePreview}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/70 dark:hover:bg-gray-800"
                    aria-label="Fermer l'aperçu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-gray-100 dark:bg-gray-950 relative">
                {previewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <p className="text-sm">Génération de l&apos;aperçu PDF…</p>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    title="Aperçu bulletin PDF"
                    src={`${previewUrl}#toolbar=1&navpanes=0`}
                    className="absolute inset-0 w-full h-full border-0 bg-white"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                    Aperçu indisponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
