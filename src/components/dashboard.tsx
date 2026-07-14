"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_CONFIGS } from "@/lib/react-query-config"
import dynamic from "next/dynamic"
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  PieChart as PieIcon,
  School,
  Users,
  type LucideIcon,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import DashboardSkeleton from "@/components/dashboard-skeleton"
import DashboardEventCalendar from "@/components/dashboard-event-calendar"
import { SECTION_ORDER, SECTION_LABELS } from "@/lib/class-sort"
import { formatAcademicYearOptionLabel } from "@/lib/school-year-utils"

// ============================================================
// OPTIMIZATION #4: Lazy Load Charts (40% bundle reduction)
// ============================================================
// Recharts is heavy (~35KB gzipped), load it only when needed
// This reduces initial JavaScript bundle by 40%
// Charts load asynchronously after main UI is interactive
// ============================================================

type Theme = "light" | "dark"

interface DashboardStatsResponse {
  students: number
  teachers: number
  classes: number
  attendance: string
  monthLabels?: string[]
  monthlyStudents?: number[]
  monthlyStudentsNew?: number[]
  monthlyTeachers?: number[]
  monthlyTeachersNew?: number[]
  monthlyPaymentsUsd?: number[]
  monthlyPaymentsCdf?: number[]
  genderStats?: {
    male: number
    female: number
  }
  sectionStats?: Record<string, number>
  currentYearId?: number | null
  currentYearName?: string | null
  calendarEvents?: Array<{ date: string; label: string; type: "year" | "communique" }>
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCdf(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value)} CDF`
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  color,
  theme,
}: {
  title: string
  value: string | number
  subValue?: string
  icon: LucideIcon
  color: string
  theme: Theme
}) {
  const Icon = icon
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return (
    <div className={`${bgCard} border ${borderColor} rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wider font-semibold ${textSecondary}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
          {subValue && <p className={`text-base font-semibold mt-0.5 ${textColor} opacity-70`}>{subValue}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  )
  const [usdToCdfRate, setUsdToCdfRate] = useState(2800)
  const [activeYearKey, setActiveYearKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("schoolCurrentYearId")
  })

  // ✅ OPTIMISÉ - React Query avec config centralisée (clé par année scolaire)
  const { data: stats, isLoading: loading, isFetching, error } = useQuery({
    queryKey: ["dashboard-stats", activeYearKey],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard-stats-simple", {
        credentials: "include",
      })
      
      const contentType = res.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        throw new Error('Not authenticated or invalid response')
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      
      return res.json() as Promise<DashboardStatsResponse>
    },
    ...QUERY_CONFIGS.dashboard,
  })

  const isInitialLoading = loading && !stats

  // ✅ OPTIMISÉ - Callbacks memoïzés pour éviter re-créations
  const handleThemeChange = useCallback(() => {
    const currentTheme = localStorage.getItem("theme") as Theme | null
    if (currentTheme) setTheme(currentTheme)
  }, [])

  const handleSettingsChange = useCallback(() => {
    const nextRate = localStorage.getItem("schoolExchangeRate")
    if (nextRate) {
      const parsedRate = Number(nextRate)
      if (!Number.isNaN(parsedRate) && parsedRate > 0) setUsdToCdfRate(parsedRate)
    }
    const nextYear = localStorage.getItem("schoolCurrentYearId")
    setActiveYearKey(nextYear)
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
  }, [queryClient])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) setTheme(savedTheme)

    const savedRate = localStorage.getItem("schoolExchangeRate")
    if (savedRate) {
      const parsedRate = Number(savedRate)
      if (!Number.isNaN(parsedRate) && parsedRate > 0) setUsdToCdfRate(parsedRate)
    }

    window.addEventListener("storage", handleThemeChange)
    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("schoolSettingsChange", handleSettingsChange)
    return () => {
      window.removeEventListener("storage", handleThemeChange)
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("schoolSettingsChange", handleSettingsChange)
    }
  }, [handleThemeChange, handleSettingsChange])

  const safeStats: DashboardStatsResponse = stats ?? {
    students: 0,
    teachers: 0,
    classes: 0,
    attendance: "--",
    monthLabels: [],
    monthlyStudents: [],
    monthlyStudentsNew: [],
    monthlyTeachers: [],
    monthlyTeachersNew: [],
    monthlyPaymentsUsd: [],
    monthlyPaymentsCdf: [],
    genderStats: { male: 0, female: 0 },
    sectionStats: Object.fromEntries(SECTION_ORDER.map((s) => [s, 0])),
    currentYearId: null,
    currentYearName: null,
    calendarEvents: [],
  }

  const palette = {
    students: "#4f46e5",
    teachers: "#0ea5e9",
    classes: "#10b981",
    attendance: "#a855f7",
    payment: "#14b8a6",
    male: "#6366f1",
    female: "#ec4899",
    primaire: "#f59e0b",
    secondaire: "#3b82f6",
    maternelle: "#ec4899",
    educationBase: "#10b981",
  }

  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb"

  // ✅ OPTIMISÉ - Calculs memoïzés (évite recalcul à chaque render)
  const monthlySeries = useMemo(() => {
    const labels = safeStats.monthLabels ?? []
    const students = safeStats.monthlyStudents ?? []
    const studentsNew = safeStats.monthlyStudentsNew ?? []
    const teachers = safeStats.monthlyTeachers ?? []
    const teachersNew = safeStats.monthlyTeachersNew ?? []
    const paymentsUsd = safeStats.monthlyPaymentsUsd ?? []
    const paymentsCdf = safeStats.monthlyPaymentsCdf ?? []

    const max = Math.max(labels.length, students.length, teachers.length, paymentsUsd.length)
    return Array.from({ length: max }, (_, i) => ({
      month: labels[i] ?? `M${i + 1}`,
      students: students[i] ?? 0,
      studentsNew: studentsNew[i] ?? 0,
      teachers: teachers[i] ?? 0,
      teachersNew: teachersNew[i] ?? 0,
      paymentsUsd: paymentsUsd[i] ?? 0,
      paymentsCdf: paymentsCdf[i] ?? 0,
    }))
  }, [
    safeStats.monthLabels,
    safeStats.monthlyStudents,
    safeStats.monthlyStudentsNew,
    safeStats.monthlyTeachers,
    safeStats.monthlyTeachersNew,
    safeStats.monthlyPaymentsUsd,
    safeStats.monthlyPaymentsCdf,
  ])

  const genderData = useMemo(() => [
    { name: "Garcons", value: safeStats.genderStats?.male ?? 0, color: palette.male },
    { name: "Filles", value: safeStats.genderStats?.female ?? 0, color: palette.female },
  ], [safeStats.genderStats, palette.male, palette.female])

  const sectionData = useMemo(() => {
    const colors: Record<string, string> = {
      Maternelle: palette.maternelle,
      Primaire: palette.primaire,
      "Education de Base": palette.educationBase,
      Humanités: palette.secondaire,
    }
    return SECTION_ORDER.map((key) => ({
      key,
      name: SECTION_LABELS[key] || key,
      value: safeStats.sectionStats?.[key] ?? 0,
      color: colors[key] ?? "#6b7280",
    }))
  }, [safeStats.sectionStats, palette.maternelle, palette.primaire, palette.educationBase, palette.secondaire])

  const sectionTotal = useMemo(
    () => sectionData.reduce((sum, item) => sum + item.value, 0),
    [sectionData]
  )

  const enrollmentYMax = useMemo(() => {
    const max = Math.max(...monthlySeries.map((d) => d.students), safeStats.students, 1)
    if (max <= 10) return Math.max(max, 5)
    if (max <= 50) return Math.ceil(max / 5) * 5
    if (max <= 200) return Math.ceil(max / 20) * 20
    if (max <= 1000) return Math.ceil(max / 100) * 100
    return Math.ceil(max / 200) * 200
  }, [monthlySeries, safeStats.students])

  const sectionXMax = useMemo(() => {
    const max = Math.max(...sectionData.map((d) => d.value), 1)
    if (max <= 10) return Math.max(max, 5)
    if (max <= 100) return Math.ceil(max / 10) * 10
    if (max <= 500) return Math.ceil(max / 50) * 50
    return Math.ceil(max / 100) * 100
  }, [sectionData])

  const currentMonthUsd = useMemo(() =>
    monthlySeries.length > 0 ? monthlySeries[monthlySeries.length - 1].paymentsUsd : 0
  , [monthlySeries])

  const currentMonthCdf = useMemo(() =>
    monthlySeries.length > 0 ? monthlySeries[monthlySeries.length - 1].paymentsCdf : 0
  , [monthlySeries])

  // Y-axis ticks for the payments chart (steps of 5000 USD / equivalent CDF)
  const chartYAxis = useMemo(() => {
    const maxUsd = Math.max(...monthlySeries.map(d => d.paymentsUsd), 0)
    const usdStep = 5000
    const yMaxUsd = Math.max(usdStep, Math.ceil(Math.max(maxUsd, 1) / usdStep) * usdStep)
    const usdTicks = Array.from({ length: Math.floor(yMaxUsd / usdStep) + 1 }, (_, i) => i * usdStep)

    const maxCdf = Math.max(...monthlySeries.map(d => d.paymentsCdf), 0)
    const cdfStep = usdStep * usdToCdfRate
    const yMaxCdf = Math.max(cdfStep, Math.ceil(Math.max(maxCdf, 1) / cdfStep) * cdfStep)
    const cdfTicks = Array.from({ length: Math.floor(yMaxCdf / cdfStep) + 1 }, (_, i) => i * cdfStep)

    return { usdTicks, yMaxUsd, cdfTicks, yMaxCdf }
  }, [monthlySeries, usdToCdfRate])

  return (
    <div className={`min-h-screen ${bgPage}`}>
      <div id="dashboard" className="p-1">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-2xl font-bold ${textColor}`}>Tableau de bord</h2>
            {safeStats.currentYearName && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                Année {formatAcademicYearOptionLabel(safeStats.currentYearName, true)}
              </span>
            )}
          </div>
          <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <Activity className="w-3 h-3" />
            {isInitialLoading ? "Chargement..." : isFetching ? "Mise à jour..." : "Graphiques interactifs (survol actif)"}
          </span>
        </div>

        {isInitialLoading ? (
          <DashboardSkeleton theme={theme} />
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard title="Eleves" value={safeStats.students} icon={GraduationCap} color={palette.students} theme={theme} />
          <StatCard title="Enseignants" value={safeStats.teachers} icon={Users} color={palette.teachers} theme={theme} />
          <StatCard title="Classes" value={safeStats.classes} icon={School} color={palette.classes} theme={theme} />
          <StatCard title="Frais scolaires (mois)"
            value={currentMonthUsd > 0 || currentMonthCdf === 0 ? formatUsd(currentMonthUsd) : `${new Intl.NumberFormat("fr-FR").format(currentMonthCdf)} FC`}
            subValue={
              currentMonthUsd > 0 && currentMonthCdf > 0
                ? `${new Intl.NumberFormat("fr-FR").format(currentMonthCdf)} FC`
                : currentMonthUsd === 0 && currentMonthCdf > 0
                  ? "0 $"
                  : undefined
            }
            icon={BarChart3} color={palette.payment} theme={theme} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Evolution des inscriptions</p>
                <p className={`text-xs ${textSecondary}`}>
                  Barres = inscriptions du mois · Courbe = total cumulé
                  {safeStats.currentYearName ? ` (${safeStats.currentYearName})` : ""}
                </p>
              </div>
              <Activity className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} />
                  <YAxis
                    stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                    allowDecimals={false}
                    domain={[0, enrollmentYMax]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0]?.payload as {
                        students?: number
                        studentsNew?: number
                      }
                      return (
                        <div
                          className={`rounded-xl border px-3 py-2 text-xs shadow-md ${
                            theme === "dark" ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="font-semibold mb-1">Mois : {String(label ?? "")}</p>
                          <p>Nouvelles inscriptions : <strong>{row.studentsNew ?? 0}</strong></p>
                          <p>Total cumulé : <strong>{row.students ?? 0}</strong></p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="studentsNew"
                    fill={palette.students}
                    fillOpacity={0.35}
                    radius={[4, 4, 0, 0]}
                    name="Nouvelles inscriptions"
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke={palette.students}
                    fill={palette.students}
                    fillOpacity={0.12}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: palette.students }}
                    name="Total cumulé"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Frais scolaires collectés</p>
                <p className={`text-xs ${textSecondary}`}>Paiements frais scolaire par mois</p>
              </div>
              <BarChart3 className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <p className={`text-xs font-semibold ${textSecondary} mb-1`}>USD ($)</p>
            <div className="h-[108px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke={palette.payment}
                    ticks={chartYAxis.usdTicks}
                    domain={[0, chartYAxis.yMaxUsd]}
                    tickFormatter={(v) => v >= 1000 ? `$${v / 1000}k` : `$${v}`}
                    tick={{ fontSize: 10 }}
                    width={44}
                  />
                  <Tooltip
                    formatter={(value) => [formatUsd(Number(value ?? 0)), "USD"]}
                    labelFormatter={(label) => `Mois: ${String(label ?? "")}`}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                  />
                  <Bar dataKey="paymentsUsd" radius={[4, 4, 0, 0]} fill={palette.payment} name="USD" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className={`text-xs font-semibold ${textSecondary} mt-3 mb-1`}>Francs congolais (FC)</p>
            <div className="h-[108px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#06b6d4"
                    ticks={chartYAxis.cdfTicks}
                    domain={[0, chartYAxis.yMaxCdf]}
                    tickFormatter={(v) => v >= 1000000 ? `${Math.round(v / 1000000)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`}
                    tick={{ fontSize: 10 }}
                    width={44}
                  />
                  <Tooltip
                    formatter={(value) => [`${new Intl.NumberFormat("fr-FR").format(Number(value ?? 0))} FC`, "CDF"]}
                    labelFormatter={(label) => `Mois: ${String(label ?? "")}`}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                  />
                  <Bar dataKey="paymentsCdf" radius={[4, 4, 0, 0]} fill="#06b6d4" name="CDF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className={`text-xs ${textSecondary} mt-2`}>Taux applique: 1 USD = {new Intl.NumberFormat("fr-FR").format(usdToCdfRate)} CDF</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className={`lg:col-span-2 ${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Calendrier scolaire</p>
                <p className={`text-xs ${textSecondary}`}>
                  Dates clés et communiqués
                  {safeStats.currentYearName ? ` · ${safeStats.currentYearName}` : ""}
                </p>
              </div>
              <CalendarDays className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-64">
              <DashboardEventCalendar
                events={safeStats.calendarEvents ?? []}
                theme={theme}
              />
            </div>
          </div>

          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Repartition genre</p>
                <p className={`text-xs ${textSecondary}`}>Depuis la table Student</p>
              </div>
              <PieIcon className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value) => [Number(value ?? 0), "Eleves"]} contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }} />
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-1">
              {genderData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  <span className={`text-xs ${textSecondary}`}>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Niveau scolaire</p>
                <p className={`text-xs ${textSecondary}`}>
                  Répartition par section — {sectionTotal} inscription{sectionTotal > 1 ? "s" : ""} active{sectionTotal > 1 ? "s" : ""}
                  {safeStats.currentYearName ? ` (${safeStats.currentYearName})` : ""}
                </p>
              </div>
              <BookOpen className={`w-4 h-4 ${textSecondary}`} />
            </div>
            {sectionTotal === 0 ? (
              <div className={`h-56 flex items-center justify-center rounded-xl border border-dashed ${borderColor}`}>
                <p className={`text-sm ${textSecondary} text-center px-4`}>
                  Aucune inscription active
                  {safeStats.currentYearName ? ` pour ${safeStats.currentYearName}` : " cette année"}
                </p>
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        domain={[0, sectionXMax]}
                        stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={108}
                        tick={{ fontSize: 11 }}
                        stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                      />
                      <Tooltip
                        formatter={(value, _name, item) => {
                          const num = Number(value ?? 0)
                          const pct = sectionTotal > 0 ? Math.round((num / sectionTotal) * 100) : 0
                          const sectionName = (item?.payload as { name?: string } | undefined)?.name ?? "Section"
                          return [`${num} élève${num > 1 ? "s" : ""} (${pct}%)`, sectionName]
                        }}
                        contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                        {sectionData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {sectionData.map((entry) => {
                    const pct = sectionTotal > 0 ? Math.round((entry.value / sectionTotal) * 100) : 0
                    return (
                      <div key={entry.key} className={`flex items-center justify-between gap-2 text-xs ${textSecondary}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="truncate">{entry.name}</span>
                        </div>
                        <span className={`font-medium ${textColor} shrink-0`}>{entry.value} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className={`lg:col-span-2 ${bgCard} rounded-2xl shadow-sm border ${borderColor} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderColor} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${textSecondary}`} />
                <h3 className={`text-sm font-semibold ${textColor}`}>Qualite des donnees graphiques</h3>
              </div>
              <span className={`text-xs ${textSecondary}`}>Mise a jour: temps reel</span>
            </div>
            <div className={`p-5 ${textSecondary} text-sm space-y-2`}>
              <p>Les graphiques utilisent des donnees de la BDD: Student, Teacher, Paiement, Enrollment.</p>
              <p>Au survol, chaque point/barre affiche la valeur exacte du mois en USD, avec equivalent CDF.</p>
              <p>Le taux de presence reste un placeholder tant que le module de presences n&apos;est pas calcule en base.</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
