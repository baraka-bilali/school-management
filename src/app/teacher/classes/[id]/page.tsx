"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Users,
  ClipboardList,
  PenLine,
  ArrowUpDown,
  Eye,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface StudentRow {
  id: number
  enrollmentId?: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  photoUrl: string | null
}

interface ClassDetail {
  class: {
    id: number
    name: string
    level: string
    section: string
    letter: string
    stream: string | null
  }
  subjects: Array<{
    id: number
    assignmentId: number
    name: string
    color: string | null
    weeklyHours: number
  }>
  students: StudentRow[]
}

type SortKey = "name" | "code" | "gender"
type SortDir = "asc" | "desc"

function studentLabel(s: StudentRow) {
  return [s.lastName, s.middleName, s.firstName].filter(Boolean).join(" ")
}

function isPrimary(section: string) {
  return section === "Primaire"
}

export default function TeacherClassDetailPage() {
  const params = useParams()
  const classId = params.id as string
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const res = await fetch(`/api/teacher/classes/${classId}`, {
          credentials: "include",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || "Impossible de charger la classe")
          return
        }
        const data = await res.json()
        setDetail({
          class: data.class,
          subjects: data.subjects,
          students: data.students,
        })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [classId])

  const filtered = useMemo(() => {
    if (!detail?.students) return []
    const q = search.trim().toLowerCase()
    let rows = detail.students
    if (q) {
      rows = rows.filter((s) => {
        const hay =
          `${s.code} ${s.lastName} ${s.middleName} ${s.firstName}`.toLowerCase()
        return hay.includes(q)
      })
    }
    const dir = sortDir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sortKey === "code") {
        return a.code.localeCompare(b.code, "fr", { numeric: true }) * dir
      }
      if (sortKey === "gender") {
        return a.gender.localeCompare(b.gender, "fr") * dir
      }
      return studentLabel(a).localeCompare(studentLabel(b), "fr") * dir
    })
  }, [detail?.students, search, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (loading) return <StudentLoading variant="list" />

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/classes"
          className={cn("inline-flex items-center gap-2 text-sm font-medium", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux classes
        </Link>
        <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
          <p className={text}>{error || "Classe introuvable"}</p>
        </div>
      </div>
    )
  }

  const { class: cls, subjects } = detail
  const primary = isPrimary(cls.section)
  const gradesHref = primary
    ? `/teacher/classes/${cls.id}/grades`
    : subjects[0]
      ? `/teacher/classes/${cls.id}/grades?assignmentId=${subjects[0].assignmentId}`
      : null

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/teacher/classes"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
            border,
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
          )}
        >
          <ArrowLeft className={cn("h-4 w-4", text)} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className={cn("text-xl font-bold lg:text-2xl", text)}>{cls.name}</h1>
          <p className={cn("mt-0.5 text-sm", textMuted)}>
            {cls.level} · {cls.section}
            {cls.letter ? ` · ${cls.letter}` : ""}
            {cls.stream ? ` · ${cls.stream}` : ""}
            {primary ? " · Titulaire" : ""}
          </p>
        </div>
        <div
          className={cn(
            "hidden sm:inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
            card,
            border
          )}
        >
          <Users className="h-4 w-4 text-teal-500" />
          <span className={textMuted}>
            {detail.students.length} élève
            {detail.students.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Actions compactes */}
      <div className="grid gap-3 sm:grid-cols-2">
        {gradesHref ? (
          <Link
            href={gradesHref}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
              border,
              isDark
                ? "bg-violet-500/5 hover:bg-violet-500/10"
                : "bg-violet-50/50 hover:bg-violet-50",
              shadow
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/10">
              <PenLine className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", text)}>Cotation / notes</p>
              <p className={cn("text-xs", textMuted)}>
                {primary
                  ? "Saisie trimestrielle ou annuelle"
                  : "Colonnes d'évaluation et examens"}
              </p>
            </div>
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              Ouvrir →
            </span>
          </Link>
        ) : null}

        <Link
          href={`/teacher/tasks/${cls.id}`}
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
            border,
            isDark
              ? "bg-indigo-500/5 hover:bg-indigo-500/10"
              : "bg-indigo-50/50 hover:bg-indigo-50",
            shadow
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10">
            <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-semibold", text)}>Tableau des tâches</p>
            <p className={cn("text-xs", textMuted)}>
              À faire et terminées pour cette classe
            </p>
          </div>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Ouvrir →
          </span>
        </Link>
      </div>

      {/* Secondaire uniquement : accès rapide par matière */}
      {!primary && subjects.length > 1 ? (
        <div className={cn("rounded-2xl border p-3", card, border)}>
          <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", textMuted)}>
            Matières
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Link
                key={s.assignmentId}
                href={`/teacher/classes/${cls.id}/grades?assignmentId=${s.assignmentId}`}
                className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  borderColor: `${s.color || "#4f46e5"}55`,
                  color: s.color || "#4f46e5",
                }}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Liste élèves — style journal */}
      <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
              <UserRound className="h-4 w-4 text-teal-500" />
            </div>
            <div>
              <h2 className={cn("text-base font-bold", text)}>Liste des élèves</h2>
              <p className={cn("text-xs", textMuted)}>
                {filtered.length} sur {detail.students.length}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                textMuted
              )}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un élève…"
              className={cn(
                "w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30",
                border,
                isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            "hidden grid-cols-[minmax(0,1.6fr)_7rem_6rem_7rem] gap-2 border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-wide sm:grid lg:px-5",
            isDark
              ? "border-gray-800 bg-gray-900/50 text-gray-500"
              : "border-gray-100 bg-gray-50/80 text-gray-500"
          )}
        >
          {(
            [
              ["name", "Élève"],
              ["code", "Matricule"],
              ["gender", "Sexe"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className="inline-flex items-center gap-1 text-left hover:text-indigo-500"
            >
              {label}
              <ArrowUpDown
                className={cn(
                  "h-3 w-3",
                  sortKey === key ? "text-indigo-500" : "opacity-30"
                )}
              />
            </button>
          ))}
          <span className="text-right">Action</span>
        </div>

        {filtered.length === 0 ? (
          <p className={cn("px-4 py-10 text-center text-sm", textMuted)}>
            {search
              ? "Aucun élève ne correspond à votre recherche."
              : "Aucun élève inscrit dans cette classe."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((student) => (
              <li
                key={student.id}
                className="grid grid-cols-1 items-center gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.6fr)_7rem_6rem_7rem] lg:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {studentLabel(student)}
                  </p>
                  <p className={cn("text-xs sm:hidden", textMuted)}>
                    Matricule {student.code} ·{" "}
                    {student.gender === "M" ? "Garçon" : "Fille"}
                  </p>
                </div>
                <p className={cn("hidden text-sm tabular-nums sm:block", text)}>
                  {student.code}
                </p>
                <p className={cn("hidden text-sm sm:block", textMuted)}>
                  {student.gender === "M" ? "Garçon" : "Fille"}
                </p>
                <div className="flex justify-start sm:justify-end">
                  {primary ? (
                    <Link
                      href={`/teacher/classes/${cls.id}/grades?enrollmentId=${student.enrollmentId ?? student.id}&bulletin=1`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 px-2.5 py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-500/10 dark:text-teal-400"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Bulletin
                    </Link>
                  ) : (
                    <span className={cn("text-xs", textMuted)}>—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
