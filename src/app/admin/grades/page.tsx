"use client"

import { useCallback, useEffect, useState, type ComponentType } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react"
import { PrimaryCurriculumPanel } from "@/components/admin/primary-curriculum-panel"
import { PrimaryResultsPanel } from "@/components/admin/primary-results-panel"

type CycleTab = "primaire" | "eb" | "humanites"
type PrimaireSub = "branches" | "resultats"

type OverviewData = {
  primaire: {
    classCount: number
    submittedCount: number
    partialCount: number
    pendingCount: number
    bestStudent: { name: string; className: string; averagePercent: number } | null
    bestClass: { classId: number; name: string; averagePercent: number } | null
    globalPassRate: number | null
  }
  submissionRuleNote?: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "indigo",
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  accent?: "indigo" | "green" | "amber" | "blue"
}) {
  const accents = {
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2 shrink-0 ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  const [cycleTab, setCycleTab] = useState<CycleTab>("primaire")
  const [primaireSub, setPrimaireSub] = useState<PrimaireSub>("resultats")
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData | null>(null)

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    try {
      const res = await authFetch("/api/admin/grades-overview")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Impossible de charger le résumé")
      setOverview(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
      setOverview(null)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const p = overview?.primaire

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notes & Bulletins
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Suivi des résultats par cycle et configuration du curriculum primaire.
        </p>
      </div>

      {/* Top banner — school-wide stats (Primaire focus) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Vue d&apos;ensemble — Primaire
          </p>
          {overviewLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Award}
            label="Meilleure classe"
            value={p?.bestClass ? p.bestClass.name : "—"}
            hint={
              p?.bestClass
                ? `Moyenne ${p.bestClass.averagePercent.toFixed(1)} %`
                : "Pas encore de notes"
            }
            accent="indigo"
          />
          <StatCard
            icon={Users}
            label="Meilleur élève"
            value={p?.bestStudent ? p.bestStudent.name : "—"}
            hint={
              p?.bestStudent
                ? `${p.bestStudent.className} · ${p.bestStudent.averagePercent.toFixed(1)} %`
                : "Pas encore de notes"
            }
            accent="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Taux de réussite"
            value={
              p?.globalPassRate != null ? `${p.globalPassRate.toFixed(1)} %` : "—"
            }
            hint={
              p?.globalPassRate != null
                ? "Moyenne ≥ 50 % (période courante)"
                : "Données insuffisantes"
            }
            accent="green"
          />
          <StatCard
            icon={CheckCircle2}
            label="Classes soumises"
            value={
              p
                ? `${p.submittedCount} / ${p.classCount || 0}`
                : "—"
            }
            hint={
              p
                ? `${p.pendingCount} en attente${p.partialCount ? ` · ${p.partialCount} partiel` : ""}`
                : undefined
            }
            accent="amber"
          />
        </div>
        {overview?.submissionRuleNote && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
            <Clock className="h-3 w-3 mt-0.5 shrink-0" />
            {overview.submissionRuleNote}
          </p>
        )}
      </div>

      {/* Cycle tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(
          [
            ["primaire", "Primaire"],
            ["eb", "Éducation de Base"],
            ["humanites", "Humanités"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCycleTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              cycleTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cycleTab === "primaire" ? (
        <div className="space-y-5">
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800/50">
            {(
              [
                ["resultats", "Résultats"],
                ["branches", "Branches primaire"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPrimaireSub(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  primaireSub === key
                    ? "bg-white dark:bg-gray-900 text-indigo-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {primaireSub === "resultats" ? (
            <PrimaryResultsPanel />
          ) : (
            <PrimaryCurriculumPanel />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 py-16 px-6 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
            Bientôt disponible
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Les résultats pour{" "}
            {cycleTab === "eb" ? "l'Éducation de Base" : "les Humanités"} seront
            configurés dans une prochaine version.
          </p>
        </div>
      )}
    </div>
  )
}
