"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  School, 
  ClipboardCheck, 
  TrendingUp, 
  TrendingDown,
  BookOpen,
  GraduationCap,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"

// ─── Mini composants de diagrammes SVG ────────────────────────────────────────

function BarChart({ data, labels, color, height = 120 }: {
  data: number[]
  labels: string[]
  color: string
  height?: number
}) {
  const max = Math.max(...data, 1)
  const barW = 100 / (data.length * 2)
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {data.map((v, i) => {
        const barH = (v / max) * (height - 20)
        const x = i * (100 / data.length) + barW / 2
        return (
          <g key={i}>
            <rect
              x={x}
              y={height - 20 - barH}
              width={barW}
              height={barH}
              rx={2}
              fill={color}
              opacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={height - 4}
              textAnchor="middle"
              fontSize={6}
              fill="currentColor"
              opacity={0.6}
            >
              {labels[i]}
            </text>
            <text
              x={x + barW / 2}
              y={height - 22 - barH}
              textAnchor="middle"
              fontSize={6}
              fill="currentColor"
              opacity={0.8}
            >
              {v}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, color, height = 100 }: {
  data: number[]
  color: string
  height?: number
}) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 8
  const w = 100
  const h = height - pad * 2
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const area = `M0,${height} ` + pts.map((p) => `L${p}`).join(" ") + ` L${w},${height} Z`
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = pad + h - ((v - min) / range) * h
        return <circle key={i} cx={x} cy={y} r={1.5} fill={color} />
      })}
    </svg>
  )
}

function DonutChart({ segments, colors, size = 100 }: {
  segments: number[]
  colors: string[]
  size?: number
}) {
  const total = segments.reduce((a, b) => a + b, 0) || 1
  const r = 35
  const cx = 50
  const cy = 50
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {segments.map((seg, i) => {
        const pct = seg / total
        const dash = pct * circ
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors[i]}
            strokeWidth={14}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ / 1}
            style={{ transform: `rotate(-90deg)`, transformOrigin: "50px 50px" }}
            strokeLinecap="round"
            opacity={0.9}
          />
        )
        offset += pct
        return el
      })}
      <circle cx={cx} cy={cy} r={21} fill="white" opacity={0.1} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0 as number | string,
    teachers: 0 as number | string,
    classes: 0 as number | string,
    attendance: "..." as string
  })
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Charger le thème
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Écouter les changements de thème
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) {
        setTheme(currentTheme)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChange", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChange", handleStorageChange)
    }
  }, [])

  const fetchStats = async () => {
    try {
      const statsRes = await fetch('/api/admin/dashboard-stats')
      const statsText = await statsRes.text()
      const statsData = statsText ? JSON.parse(statsText) : { 
        students: 0, teachers: 0, classes: 0, attendance: "94%" 
      }
      setStats({
        students: statsData.students || 0,
        teachers: statsData.teachers || 0,
        classes: statsData.classes || 0,
        attendance: statsData.attendance || "94%"
      })
    } catch {
      setStats({ students: "—", teachers: "—", classes: "—", attendance: "—" })
    }
  }

  useEffect(() => { fetchStats() }, [])

  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  // Données simulées pour les diagrammes (représentatives d'une école)
  const monthLabels = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr"]
  const studentsEvolution = [85, 90, 92, 91, 95, 97, 98, typeof stats.students === "number" ? stats.students : 95]
  const feesMonthly = [420000, 380000, 510000, 290000, 460000, 530000, 480000, 610000]
  const attendanceMonthly = [88, 91, 87, 93, 90, 94, 92, 95]
  const genderSplit = [typeof stats.students === "number" ? Math.round(stats.students * 0.52) : 50, typeof stats.students === "number" ? Math.round(stats.students * 0.48) : 45]
  const levelSplit = [
    typeof stats.students === "number" ? Math.round(stats.students * 0.38) : 36,
    typeof stats.students === "number" ? Math.round(stats.students * 0.62) : 59,
  ]

  const statCards = [
    {
      label: "Élèves",
      value: stats.students,
      trend: "+4",
      up: true,
      icon: GraduationCap,
      iconBg: theme === "dark" ? "bg-indigo-900/60" : "bg-indigo-50",
      iconColor: theme === "dark" ? "text-indigo-400" : "text-indigo-600",
      sparkData: studentsEvolution,
      sparkColor: "#6366f1",
    },
    {
      label: "Enseignants",
      value: stats.teachers,
      trend: "+1",
      up: true,
      icon: Users,
      iconBg: theme === "dark" ? "bg-blue-900/60" : "bg-blue-50",
      iconColor: theme === "dark" ? "text-blue-400" : "text-blue-600",
      sparkData: [18, 19, 19, 20, 20, 21, 21, typeof stats.teachers === "number" ? stats.teachers : 21],
      sparkColor: "#3b82f6",
    },
    {
      label: "Classes",
      value: stats.classes,
      trend: "stable",
      up: null,
      icon: School,
      iconBg: theme === "dark" ? "bg-emerald-900/60" : "bg-emerald-50",
      iconColor: theme === "dark" ? "text-emerald-400" : "text-emerald-600",
      sparkData: [18, 18, 20, 20, 20, 20, 20, typeof stats.classes === "number" ? stats.classes : 20],
      sparkColor: "#10b981",
    },
    {
      label: "Taux de présence",
      value: stats.attendance,
      trend: "+2%",
      up: true,
      icon: ClipboardCheck,
      iconBg: theme === "dark" ? "bg-purple-900/60" : "bg-purple-50",
      iconColor: theme === "dark" ? "text-purple-400" : "text-purple-600",
      sparkData: attendanceMonthly,
      sparkColor: "#a855f7",
    },
  ]

  return (
    <div className={`min-h-screen ${bgPage}`}>
      <div id="dashboard" className="p-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${textColor}`}>Tableau de bord</h2>
          <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <Activity className="w-3 h-3" /> Mis à jour à l&apos;instant
          </span>
        </div>

        {/* ── Cartes stats avec mini sparkline ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`${bgCard} rounded-xl shadow-sm border ${borderColor} p-5 flex flex-col gap-3`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>{card.label}</p>
                    <p className={`text-3xl font-bold ${textColor} mt-1`}>{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
                {/* Sparkline */}
                <div className={textSecondary}>
                  <LineChart data={card.sparkData} color={card.sparkColor} height={48} />
                </div>
                <div className="flex items-center gap-1">
                  {card.up === true && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {card.up === false && <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs font-medium ${card.up === true ? "text-green-500" : card.up === false ? "text-red-500" : textSecondary}`}>
                    {card.trend}
                  </span>
                  <span className={`text-xs ${textSecondary}`}>vs mois dernier</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Ligne 2 : Évolution inscriptions + Frais collectés ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Évolution des élèves — courbe */}
          <div className={`${bgCard} rounded-xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Évolution des inscriptions</p>
                <p className={`text-xs ${textSecondary}`}>Septembre → Avril</p>
              </div>
              <Activity className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className={textSecondary}>
              <LineChart data={studentsEvolution} color="#6366f1" height={110} />
            </div>
            <div className="flex gap-4 mt-3">
              {monthLabels.map((m, i) => (
                <span key={i} className={`text-xs ${textSecondary} flex-1 text-center`}>{m}</span>
              ))}
            </div>
          </div>

          {/* Frais collectés — barres */}
          <div className={`${bgCard} rounded-xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Frais collectés (FC)</p>
                <p className={`text-xs ${textSecondary}`}>Par mois cette année scolaire</p>
              </div>
              <BarChart3 className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className={textSecondary}>
              <BarChart data={feesMonthly.map(v => Math.round(v / 1000))} labels={monthLabels} color="#10b981" height={120} />
            </div>
            <p className={`text-xs ${textSecondary} text-center mt-1`}>en milliers de FC</p>
          </div>
        </div>

        {/* ── Ligne 3 : Présence mensuelle + Répartition élèves ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Taux de présence mensuel — barres */}
          <div className={`lg:col-span-2 ${bgCard} rounded-xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Taux de présence mensuel</p>
                <p className={`text-xs ${textSecondary}`}>En % — toutes classes confondues</p>
              </div>
              <ClipboardCheck className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className={textSecondary}>
              <BarChart data={attendanceMonthly} labels={monthLabels} color="#a855f7" height={120} />
            </div>
          </div>

          {/* Répartition garçons/filles — donut */}
          <div className={`${bgCard} rounded-xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Répartition genre</p>
                <p className={`text-xs ${textSecondary}`}>Élèves inscrits</p>
              </div>
              <PieChart className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="flex flex-col items-center gap-4">
              <DonutChart segments={genderSplit} colors={["#6366f1", "#ec4899"]} size={110} />
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  <span className={`text-xs ${textSecondary}`}>Garçons: {genderSplit[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" />
                  <span className={`text-xs ${textSecondary}`}>Filles: {genderSplit[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ligne 4 : Niveaux + Activité récente ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Primaire vs Secondaire — donut */}
          <div className={`${bgCard} rounded-xl shadow-sm border ${borderColor} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>Niveau scolaire</p>
                <p className={`text-xs ${textSecondary}`}>Primaire / Secondaire</p>
              </div>
              <BookOpen className={`w-4 h-4 ${textSecondary}`} />
            </div>
            <div className="flex flex-col items-center gap-4">
              <DonutChart segments={levelSplit} colors={["#f59e0b", "#3b82f6"]} size={110} />
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className={`text-xs ${textSecondary}`}>Primaire: {levelSplit[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  <span className={`text-xs ${textSecondary}`}>Secondaire: {levelSplit[1]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className={`lg:col-span-2 ${bgCard} rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderColor} flex items-center gap-2`}>
              <Activity className={`w-4 h-4 ${textSecondary}`} />
              <h3 className={`text-sm font-semibold ${textColor}`}>Activité récente</h3>
            </div>
            <div className={`divide-y ${borderColor}`}>
              {[
                {
                  icon: GraduationCap,
                  bg: theme === "dark" ? "bg-indigo-900/50" : "bg-indigo-50",
                  color: theme === "dark" ? "text-indigo-400" : "text-indigo-600",
                  title: "Nouvel élève inscrit",
                  desc: "Jean Dupont ajouté en Terminale A",
                  time: "Il y a 2 h",
                },
                {
                  icon: BookOpen,
                  bg: theme === "dark" ? "bg-blue-900/50" : "bg-blue-50",
                  color: theme === "dark" ? "text-blue-400" : "text-blue-600",
                  title: "Nouvelle matière ajoutée",
                  desc: "Philosophie ajoutée au programme Terminale",
                  time: "Il y a 5 h",
                },
                {
                  icon: ClipboardCheck,
                  bg: theme === "dark" ? "bg-emerald-900/50" : "bg-emerald-50",
                  color: theme === "dark" ? "text-emerald-400" : "text-emerald-600",
                  title: "Présences mises à jour",
                  desc: "M. Martin a validé les présences — 1ère B",
                  time: "Hier",
                },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${textColor}`}>{item.title}</p>
                      <p className={`text-xs ${textSecondary} truncate`}>{item.desc}</p>
                    </div>
                    <span className={`text-xs ${textSecondary} shrink-0`}>{item.time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
