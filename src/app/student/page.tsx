"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Wallet,
  ClipboardList,
  Megaphone,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"
import TaskCard from "@/components/student/task-card"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false, loading: () => <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-100" /> }
)

interface StudentInfo {
  id: number
  firstName: string
  code: string
  class?: string
  year?: string
}

interface Communique {
  id: number
  title: string
  createdAt: string
  isRead: boolean
}

interface Task {
  id: number
  title: string
  question: string | null
  description: string | null
  dueAt: string
  createdAt: string
  subject: { name: string; color: string | null } | null
}

interface FeeBalance {
  usd: { totalDu: number; totalPaye: number; solde: number }
  cdf: { totalDu: number; totalPaye: number; solde: number }
}

function computeFeeProgress(balance: FeeBalance | null) {
  if (!balance) {
    return { percent: 0, status: "unknown" as const, subtitle: "Chargement…" }
  }

  const { usd, cdf } = balance
  const hasUsd = usd.totalDu > 0 || usd.totalPaye > 0
  const hasCdf = cdf.totalDu > 0 || cdf.totalPaye > 0

  const usdPercent = usd.totalDu > 0 ? Math.min(100, Math.round((usd.totalPaye / usd.totalDu) * 100)) : 100
  const cdfPercent = cdf.totalDu > 0 ? Math.min(100, Math.round((cdf.totalPaye / cdf.totalDu) * 100)) : 100

  let percent = 0
  if (hasCdf && hasUsd) {
    const active = [usd.totalDu > 0 ? usdPercent : null, cdf.totalDu > 0 ? cdfPercent : null].filter(
      (v): v is number => v !== null
    )
    percent = active.length > 0 ? Math.round(active.reduce((a, b) => a + b, 0) / active.length) : 100
  } else if (hasCdf) {
    percent = cdfPercent
  } else if (hasUsd) {
    percent = usdPercent
  } else {
    percent = 100
  }

  const usdOk = usd.totalDu === 0 || usd.solde <= 0
  const cdfOk = cdf.totalDu === 0 || cdf.solde <= 0
  const hasFees = usd.totalDu > 0 || cdf.totalDu > 0
  const fullyPaid = hasFees && usdOk && cdfOk

  if (fullyPaid || percent >= 100) {
    return { percent: 100, status: "paid" as const, subtitle: "Paiements à jour" }
  }
  if (percent > 0) {
    return { percent, status: "partial" as const, subtitle: `${percent}% payé` }
  }
  return { percent: 0, status: "unpaid" as const, subtitle: "Aucun paiement enregistré" }
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function getGreeting(): "Bonjour" | "Bonsoir" {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour"
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "Publié à l'instant"
  if (hours < 24) return `Publié il y a ${hours} heure${hours > 1 ? "s" : ""}`
  const days = Math.floor(hours / 24)
  return `Publié il y a ${days} jour${days > 1 ? "s" : ""}`
}

export default function StudentDashboard() {
  const router = useRouter()
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [latestCommunique, setLatestCommunique] = useState<Communique | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [feeBalance, setFeeBalance] = useState<FeeBalance | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekDays = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() + 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [])

  const monthLabel = selectedDate.toLocaleDateString("fr-FR", { month: "long" })
  const qrValue = studentInfo ? `STUDENT:${studentInfo.code}:${studentInfo.id}` : ""

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/student/tasks?limit=1", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch {}
  }

  const fetchFees = async () => {
    try {
      const res = await fetch("/api/student/fees", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.balance) setFeeBalance(data.balance)
      }
    } catch {}
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, commRes] = await Promise.all([
          fetch("/api/student/me", { credentials: "include" }),
          fetch("/api/student/communiques?page=1&limit=1", { credentials: "include" }),
        ])
        if (meRes.ok) {
          const data = await meRes.json()
          setStudentInfo(data.student)
        }
        if (commRes.ok) {
          const data = await commRes.json()
          if (data.communiques?.length > 0) setLatestCommunique(data.communiques[0])
        }
        await Promise.all([fetchTasks(), fetchFees()])
      } catch (error) {
        console.error("Erreur chargement:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const onNewTask = () => fetchTasks()
    const onPayment = () => fetchFees()
    window.addEventListener("newTaskReceived", onNewTask)
    window.addEventListener("feePaymentReceived", onPayment)
    return () => {
      window.removeEventListener("newTaskReceived", onNewTask)
      window.removeEventListener("feePaymentReceived", onPayment)
    }
  }, [])

  if (loading) return <StudentLoading variant="dashboard" />

  const feeProgress = computeFeeProgress(feeBalance)

  return (
    <div className="space-y-5 lg:space-y-8">
      {/* Salutation */}
      {studentInfo && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={cn("text-xl font-bold tracking-tight lg:text-3xl", text)}>
              {getGreeting()}, {studentInfo.firstName}
            </p>
            <p className={cn("mt-1 hidden text-sm lg:block", textMuted)}>
              Prêt pour vos cours de demain ?
            </p>
          </div>
          {studentInfo.year && (
            <div
              className={cn(
                "shrink-0 rounded-2xl border px-4 py-2.5 lg:px-5 lg:py-3 lg:text-right",
                card,
                border,
                shadow
              )}
            >
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>
                Année scolaire
              </p>
              <p className={cn("mt-0.5 text-sm font-bold lg:text-lg", text)}>
                Session {studentInfo.year}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cartes rapides : QR + Frais */}
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "flex min-w-[9.5rem] shrink-0 flex-col items-center rounded-2xl border p-3 lg:min-w-0 lg:p-6",
            card,
            border,
            shadow
          )}
        >
          {qrValue && (
            <>
              <div className="mb-2 rounded-xl bg-white p-1.5 shadow-sm lg:hidden">
                <QRCodeSVG value={qrValue} size={56} level="M" />
              </div>
              <div className="mb-4 hidden rounded-xl bg-white p-3 shadow-sm lg:block">
                <QRCodeSVG value={qrValue} size={120} level="M" />
              </div>
            </>
          )}
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400 lg:text-xs">MON QR CODE</p>
          <p className={cn("mt-0.5 text-center text-[10px] lg:text-sm", textMuted)}>Identifiant numérique · Code {studentInfo?.code}</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/student/fees")}
          className={cn(
            "min-w-[9.5rem] shrink-0 rounded-2xl border p-4 text-left transition-transform active:scale-[0.98] lg:min-w-0 lg:p-6",
            card,
            border,
            shadow
          )}
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 lg:h-12 lg:w-12">
              <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400 lg:h-6 lg:w-6" />
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                feeProgress.status === "paid"
                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : feeProgress.status === "partial"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              )}
            >
              {feeProgress.status === "paid" ? "PAYÉ" : feeProgress.status === "partial" ? "PARTIEL" : "IMPAYÉ"}
            </span>
          </div>
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400 lg:text-xs">FRAIS SCOLAIRES</p>
          <p className={cn("mt-0.5 text-xs lg:text-base lg:font-medium", text)}>{feeProgress.subtitle}</p>
          <div className="mt-3 flex items-center gap-2 lg:mt-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  feeProgress.status === "paid"
                    ? "bg-green-500"
                    : feeProgress.status === "partial"
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                )}
                style={{ width: `${feeProgress.percent}%` }}
              />
            </div>
            <span className={cn("shrink-0 text-xs font-bold tabular-nums lg:text-sm", text)}>
              {feeProgress.percent}%
            </span>
          </div>
        </button>
      </div>

      {/* Calendrier hebdomadaire */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Calendrier hebdomadaire</h2>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium capitalize",
              isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700 shadow-sm"
            )}
          >
            {monthLabel}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className={cn("rounded-2xl border p-3", card, border, shadow)}>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSunday = day.getDay() === 0
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === selectedDate.toDateString()
              const isHighlighted = !isSunday && (isToday || isSelected)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1 py-1"
                  title={isSunday ? "Dimanche — école fermée" : undefined}
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isSunday ? "text-red-500" : textMuted
                    )}
                  >
                    {DAY_LABELS[day.getDay()]}
                  </span>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isSunday
                        ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                        : isHighlighted
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : cn(text, "hover:bg-gray-100 dark:hover:bg-gray-800")
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tâches + Communiqués — 2 colonnes sur desktop */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
      {/* Mes tâches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Mes tâches</h2>
          <Link href="/student/tasks" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Voir tout
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
            <ClipboardList className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
            <p className={cn("text-sm", textMuted)}>Aucune tâche pour le moment</p>
          </div>
        ) : (
          <TaskCard task={tasks[0]} compact />
        )}
      </section>

      {/* Communiqués récents */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Communiqués récents</h2>
          <Link href="/student/notifications?tab=communiques" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Voir tout
          </Link>
        </div>
        {latestCommunique ? (
          <Link
            href={`/student/communiques/${latestCommunique.id}`}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 transition-colors active:bg-gray-50 dark:active:bg-gray-800/50",
              card,
              border,
              shadow
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <Megaphone className="h-5 w-5 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-semibold", text)}>{latestCommunique.title}</p>
              <p className={cn("text-xs", textMuted)}>{timeAgo(latestCommunique.createdAt)}</p>
            </div>
            <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
          </Link>
        ) : (
          <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
            <Megaphone className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
            <p className={cn("text-sm", textMuted)}>Aucun communiqué pour le moment</p>
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
