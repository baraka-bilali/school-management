"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"

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

type Props = {
  /** Compact layout for Settings (default true). */
  compact?: boolean
}

export function EvaluationCyclesPanel({ compact = true }: Props) {
  const [loading, setLoading] = useState(true)
  const [cycles, setCycles] = useState<Cycle[]>([])

  const loadCycles = useCallback(async (ensure = false) => {
    const res = await authFetch(
      `/api/admin/evaluation-cycles${ensure ? "?ensureDefaults=1" : ""}`
    )
    if (!res.ok) throw new Error("Impossible de charger les cycles")
    const data = await res.json()
    setCycles(data.cycles || [])
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        await loadCycles(true)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    })()
  }, [loadCycles])

  return (
    <div className="space-y-4">
      {compact && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Les cycles (trimestres / semestres) sont en général préconfigurés. Ne les
          modifiez que si votre établissement suit un calendrier particulier.
        </p>
      )}

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

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : cycles.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun cycle configuré.</p>
      ) : (
        cycles.map((cycle) => (
          <div
            key={cycle.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {cycle.name}
                </h3>
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
  )
}
