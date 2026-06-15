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
        await fetchTasks()
      } catch (error) {
        console.error("Erreur chargement:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const onNewTask = () => fetchTasks()
    window.addEventListener("newTaskReceived", onNewTask)
    return () => window.removeEventListener("newTaskReceived", onNewTask)
  }, [])

  if (loading) return <StudentLoading />

  return (
    <div className="space-y-5">
      {/* Salutation — sous la barre de navigation */}
      {studentInfo && (
        <p className={cn("text-xl font-bold tracking-tight", text)}>
          {getGreeting()}, {studentInfo.firstName}
        </p>
      )}

      {/* Cartes rapides : QR + Frais */}
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            "flex min-w-[9.5rem] shrink-0 flex-col items-center rounded-2xl border p-3",
            card,
            border,
            shadow
          )}
        >
          {qrValue && (
            <div className="mb-2 rounded-xl bg-white p-1.5 shadow-sm">
              <QRCodeSVG value={qrValue} size={56} level="M" />
            </div>
          )}
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400">MON QR</p>
          <p className={cn("mt-0.5 text-center text-[10px]", textMuted)}>Code {studentInfo?.code}</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/student/fees")}
          className={cn(
            "min-w-[9.5rem] shrink-0 rounded-2xl border p-4 text-left transition-transform active:scale-[0.98]",
            card,
            border,
            shadow
          )}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400">FRAIS SCOLAIRES</p>
          <p className={cn("mt-0.5 text-xs", textMuted)}>Paiements à jour</p>
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
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === selectedDate.toDateString()
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span className={cn("text-[10px] font-medium", textMuted)}>{DAY_LABELS[day.getDay()]}</span>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isToday || isSelected
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
  )
}
