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
import { useAppTheme } from "@/components/use-app-theme"
import { cn } from "@/lib/utils"

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
  isDark,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
  accent?: "indigo" | "green" | "amber" | "blue"
  isDark: boolean
}) {
  const accents = {
    indigo: isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600",
    green: isDark ? "bg-green-500/15 text-green-300" : "bg-green-50 text-green-600",
    amber: isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-600",
    blue: isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-600",
  }
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-xl p-2 shrink-0", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-lg font-semibold",
              isDark ? "text-gray-100" : "text-gray-900"
            )}
          >
            {value}
          </p>
          {hint ? (
            <p
              className={cn(
                "mt-0.5 truncate text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  const { isDark } = useAppTheme()
  const [cycleTab, setCycleTab] = useState<CycleTab>("primaire")
  const [primaireSub, setPrimaireSub] = useState<PrimaireSub>("resultats")
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData | null>(null)

  const text = isDark ? "text-gray-100" : "text-gray-900"
  const textMuted = isDark ? "text-gray-400" : "text-gray-600"
  const textFaint = isDark ? "text-gray-500" : "text-gray-500"
  const border = isDark ? "border-gray-700" : "border-gray-200"

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
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className={cn("text-2xl font-bold", text)}>Notes & Bulletins</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>
          Suivi des résultats par cycle et configuration du curriculum primaire.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-xs font-medium uppercase tracking-wide", textFaint)}>
            Vue d&apos;ensemble — Primaire
          </p>
          {overviewLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
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
            isDark={isDark}
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
            isDark={isDark}
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
            isDark={isDark}
          />
          <StatCard
            icon={CheckCircle2}
            label="Classes soumises"
            value={p ? `${p.submittedCount} / ${p.classCount || 0}` : "—"}
            hint={
              p
                ? `${p.pendingCount} en attente${p.partialCount ? ` · ${p.partialCount} partiel` : ""}`
                : undefined
            }
            accent="amber"
            isDark={isDark}
          />
        </div>
        {overview?.submissionRuleNote && (
          <p className={cn("flex items-start gap-1.5 text-[11px]", textFaint)}>
            <Clock className="mt-0.5 h-3 w-3 shrink-0" />
            {overview.submissionRuleNote}
          </p>
        )}
      </div>

      <div className={cn("flex flex-wrap gap-2 overflow-x-auto overflow-y-hidden border-b scrollbar-hide", border)}>
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
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              cycleTab === key
                ? "border-indigo-600 text-indigo-600"
                : cn(
                    "border-transparent",
                    isDark
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-800"
                  )
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {cycleTab === "primaire" ? (
        <div className="space-y-5">
          <div
            className={cn(
              "inline-flex rounded-xl border p-1",
              border,
              isDark ? "bg-gray-800/50" : "bg-gray-50"
            )}
          >
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
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  primaireSub === key
                    ? cn(
                        "text-indigo-600 shadow-sm",
                        isDark ? "bg-gray-900" : "bg-white"
                      )
                    : isDark
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                )}
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
        <div
          className={cn(
            "rounded-2xl border border-dashed px-6 py-16 text-center",
            isDark
              ? "border-gray-600 bg-gray-900/40"
              : "border-gray-300 bg-gray-50/80"
          )}
        >
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className={cn("text-base font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
            Bientôt disponible
          </p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Les résultats pour{" "}
            {cycleTab === "eb" ? "l'Éducation de Base" : "les Humanités"} seront
            configurés dans une prochaine version.
          </p>
        </div>
      )}
    </div>
  )
}
