"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  BarChart3,
  BookOpen,
  GraduationCap,
  PieChart as PieIcon,
  School,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Theme = "light" | "dark"

interface DashboardStatsResponse {
  students: number
  teachers: number
  classes: number
  attendance: string
  monthLabels?: string[]
  monthlyStudents?: number[]
  monthlyTeachers?: number[]
  monthlyPayments?: number[]
  genderStats?: {
    male: number
    female: number
  }
  sectionStats?: {
    Primaire: number
    Secondaire: number
  }
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

function TrendCard({
  title,
  value,
  icon,
  color,
  data,
  theme,
}: {
  title: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  color: string
  data: Array<{ name: string; value: number }>
  theme: Theme
}) {
  const Icon = icon
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return (
    <div className={`${bgCard} border ${borderColor} rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className={`text-xs uppercase tracking-wider font-semibold ${textSecondary}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>

      <div className="h-16 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Tooltip
              formatter={(v: number) => [v, title]}
              labelFormatter={(label: string) => `Mois: ${label}`}
              contentStyle={{ borderRadius: 12, border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}` }}
            />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={`text-xs ${textSecondary} flex items-center gap-1 mt-1`}>
        <TrendingUp className="w-3 h-3 text-green-500" />
        Donnees reelles basees sur la BDD
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [theme, setTheme] = useState<Theme>("light")
  const [usdToCdfRate, setUsdToCdfRate] = useState(2800)

  // Utiliser React Query pour le cache automatique - OPTIMISATION CRITIQUE
  const { data: stats, isLoading: loading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('[DEBUG] Fetching dashboard stats...')
      const res = await fetch("/api/admin/dashboard-stats-simple", { 
        cache: "no-store",
        credentials: "include" 
      })
      
      console.log('[DEBUG] Response status:', res.status)
      console.log('[DEBUG] Response headers:', Object.fromEntries(res.headers.entries()))
      
      // Vérifier si la réponse est bien du JSON
      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error('[ERROR] Invalid content type:', contentType)
        const text = await res.text()
        console.error('[ERROR] Response body:', text.substring(0, 200))
        throw new Error('Not authenticated or invalid response')
      }
      
      if (!res.ok) {
        console.error('[ERROR] Response not OK:', res.status)
        throw new Error('Failed to fetch dashboard stats')
      }
      
      const data = await res.json()
      console.log('[DEBUG] Data received:', data)
      return data as DashboardStatsResponse
    },
    placeholderData: {
      students: 0,
      teachers: 0,
      classes: 0,
      attendance: "--",
      monthLabels: [],
      monthlyStudents: [],
      monthlyTeachers: [],
      monthlyPayments: [],
      genderStats: { male: 0, female: 0 },
      sectionStats: { Primaire: 0, Secondaire: 0 },
    },
    retry: false, // Ne pas retry si pas authentifié
    enabled: true, // Désactiver si besoin
  })

  // Garantir que stats n'est jamais undefined
  const safeStats: DashboardStatsResponse = stats || {
    students: 0,
    teachers: 0,
    classes: 0,
    attendance: "--",
    monthLabels: [],
    monthlyStudents: [],
    monthlyTeachers: [],
    monthlyPayments: [],
    genderStats: { male: 0, female: 0 },
    sectionStats: { Primaire: 0, Secondaire: 0 },
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) setTheme(savedTheme)

    const savedRate = localStorage.getItem("schoolExchangeRate")
    if (savedRate) {
      const parsedRate = Number(savedRate)
      if (!Number.isNaN(parsedRate) && parsedRate > 0) setUsdToCdfRate(parsedRate)
    }

    const onThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") as Theme | null
      if (currentTheme) setTheme(currentTheme)
    }

    const onRateChange = () => {
      const nextRate = localStorage.getItem("schoolExchangeRate")
      if (!nextRate) return
      const parsedRate = Number(nextRate)
      if (!Number.isNaN(parsedRate) && parsedRate > 0) setUsdToCdfRate(parsedRate)
    }

    window.addEventListener("storage", onThemeChange)
    window.addEventListener("themeChange", onThemeChange)
    window.addEventListener("schoolSettingsChange", onRateChange)
    return () => {
      window.removeEventListener("storage", onThemeChange)
      window.removeEventListener("themeChange", onThemeChange)
      window.removeEventListener("schoolSettingsChange", onRateChange)
    }
  }, [])

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
  }

  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb"

  const monthlySeries = useMemo(() => {
    const labels = safeStats.monthLabels ?? []
    const students = safeStats.monthlyStudents ?? []
    const teachers = safeStats.monthlyTeachers ?? []
    const payments = safeStats.monthlyPayments ?? []

    const max = Math.max(labels.length, students.length, teachers.length, payments.length)
    return Array.from({ length: max }, (_, i) => ({
      month: labels[i] ?? `M${i + 1}`,
      students: students[i] ?? 0,
      teachers: teachers[i] ?? 0,
      payments: payments[i] ?? 0,
    }))
  }, [safeStats.monthLabels, safeStats.monthlyStudents, safeStats.monthlyTeachers, safeStats.monthlyPayments])

  const genderData = [
    { name: "Garcons", value: safeStats.genderStats?.male ?? 0, color: palette.male },
    { name: "Filles", value: safeStats.genderStats?.female ?? 0, color: palette.female },
  ]

  const sectionData = [
    { name: "Primaire", value: safeStats.sectionStats?.Primaire ?? 0, color: palette.primaire },
    { name: "Secondaire", value: safeStats.sectionStats?.Secondaire ?? 0, color: palette.secondaire },
  ]

  const cardStudentsData = monthlySeries.map((r) => ({ name: r.month, value: r.students }))
  const cardTeachersData = monthlySeries.map((r) => ({ name: r.month, value: r.teachers }))
  const cardClassesData = monthlySeries.map((r, idx) => ({
    name: r.month,
    value: idx === monthlySeries.length - 1 ? safeStats.classes : safeStats.classes,
  }))
  const cardPaymentsData = monthlySeries.map((r) => ({ name: r.month, value: r.payments }))
  const currentMonthPayment = monthlySeries.length > 0 ? monthlySeries[monthlySeries.length - 1].payments : 0

  return (
    <div className={`min-h-screen ${bgPage}`}>
      <div id="dashboard" className="p-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${textColor}`}>Tableau de bord</h2>
          <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <Activity className="w-3 h-3" />
            {loading ? "Chargement..." : "Graphiques interactifs (survol actif)"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <TrendCard title="Eleves" value={safeStats.students} icon={GraduationCap} color={palette.students} data={cardStudentsData} theme={theme} />
          <TrendCard title="Enseignants" value={safeStats.teachers} icon={Users} color={palette.teachers} data={cardTeachersData} theme={theme} />
          <TrendCard title="Classes" value={safeStats.classes} icon={School} color={palette.classes} data={cardClassesData} theme={theme} />
          <TrendCard title="Paiements (mois)" value={formatUsd(currentMonthPayment)} icon={BarChart3} color={palette.payment} data={cardPaymentsData} theme={theme} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Evolution des inscriptions</p>
                <p className={`text-xs ${textSecondary}`}>Basee sur la creation des comptes eleves</p>
              </div>
              <Activity className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} allowDecimals={false} domain={[1, 100]} />
                  <Tooltip
                    formatter={(value: number) => [value, "Eleves cumules"]}
                    labelFormatter={(label: string) => `Mois: ${label}`}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                  />
                  <Area type="monotone" dataKey="students" stroke={palette.students} fill={palette.students} fillOpacity={0.22} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${bgCard} rounded-2xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Frais collectes</p>
                <p className={`text-xs ${textSecondary}`}>Somme des paiements non annules par mois (USD)</p>
              </div>
              <BarChart3 className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} tickFormatter={(v) => `$${Math.round(v)}`} domain={[0, 500]} />
                  <Tooltip
                    formatter={(value: number) => [`${formatUsd(value)} (≈ ${formatCdf(value * usdToCdfRate)})`, "Montant collecte"]}
                    labelFormatter={(label: string) => `Mois: ${label}`}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                  />
                  <Bar dataKey="payments" radius={[8, 8, 0, 0]} fill={palette.payment} />
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
                <p className={`text-sm font-semibold ${textColor}`}>Evolution des enseignants</p>
                <p className={`text-xs ${textSecondary}`}>Basee sur la creation des comptes enseignants</p>
              </div>
              <Users className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    formatter={(value: number) => [value, "Enseignants cumules"]}
                    labelFormatter={(label: string) => `Mois: ${label}`}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }}
                  />
                  <Area type="monotone" dataKey="teachers" stroke={palette.teachers} fill={palette.teachers} fillOpacity={0.22} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
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
                  <Tooltip formatter={(value: number) => [value, "Eleves"]} contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }} />
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
                <p className={`text-xs ${textSecondary}`}>Primaire vs Secondaire (inscriptions actives)</p>
              </div>
              <BookOpen className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value: number) => [value, "Eleves"]} contentStyle={{ borderRadius: 12, border: `1px solid ${gridColor}` }} />
                  <Pie data={sectionData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {sectionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-1">
              {sectionData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  <span className={`text-xs ${textSecondary}`}>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  )
}
