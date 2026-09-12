"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import { toDisplayCode } from "@/lib/student-fields"
import {
  ArrowLeft,
  PieChart as PieIcon,
  Users,
  UserRound,
} from "lucide-react"
import { PrimaryTitulaireCard } from "@/components/admin/primary-titulaire-card"

const GenderChart = dynamic(
  () => import("@/components/dashboard-charts").then((m) => m.GenderChart),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-xl bg-gray-700/30" />,
  }
)

type Theme = "light" | "dark"
type GenderFilter = "all" | "M" | "F"

interface ClassInfo {
  id: number
  name: string
  level: string
  section: string
  letter: string | null
  stream: string | null
  titulaireTeacherId?: number | null
}

interface ClassStudent {
  id: number
  code?: string
  permanentCode?: string
  lastName: string
  middleName?: string | null
  firstName: string
  gender: string
  enrollments?: Array<{
    code?: string | null
    classId?: number
    yearId?: number
    year?: { id?: number; name?: string | null } | null
  }>
}

const MALE_COLOR = "#6366f1"
const FEMALE_COLOR = "#ec4899"

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = Number(params?.id)

  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [yearName, setYearName] = useState<string | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    if (savedTheme) setTheme(savedTheme)
    const onTheme = () => {
      const next = localStorage.getItem("theme") as Theme | null
      if (next) setTheme(next)
    }
    window.addEventListener("themeChange", onTheme)
    window.addEventListener("storage", onTheme)
    return () => {
      window.removeEventListener("themeChange", onTheme)
      window.removeEventListener("storage", onTheme)
    }
  }, [])

  const load = useCallback(async () => {
    if (!classId || Number.isNaN(classId)) {
      setError("Classe invalide")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [classRes, studentsRes] = await Promise.all([
        authFetch(`/api/admin/classes/${classId}`),
        authFetch(`/api/admin/students?classId=${classId}&pageSize=200&sort=name_asc`),
      ])

      if (!classRes.ok) {
        const data = await classRes.json().catch(() => ({}))
        throw new Error(data.error || "Classe introuvable")
      }

      const classData = await classRes.json()
      setClassInfo(classData.class)

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        const items = Array.isArray(studentsData.items) ? studentsData.items : []
        setStudents(items)
        const yn = items[0]?.enrollments?.[0]?.year?.name
        if (typeof yn === "string") setYearName(yn)
      } else {
        setStudents([])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
      setClassInfo(null)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  const maleCount = useMemo(
    () => students.filter((s) => s.gender === "M").length,
    [students]
  )
  const femaleCount = useMemo(
    () => students.filter((s) => s.gender === "F").length,
    [students]
  )

  const genderData = useMemo(
    () => [
      { name: "Garcons", value: maleCount, color: MALE_COLOR },
      { name: "Filles", value: femaleCount, color: FEMALE_COLOR },
    ],
    [maleCount, femaleCount]
  )

  const filteredStudents = useMemo(() => {
    if (genderFilter === "all") return students
    return students.filter((s) => s.gender === genderFilter)
  }, [students, genderFilter])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700/40" : "hover:bg-gray-50"
  const chipBase =
    theme === "dark"
      ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"

  return (
    <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/classes")}
              className={`mb-3 inline-flex items-center gap-1.5 text-sm ${textSecondary} hover:text-indigo-500 transition-colors`}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux classes
            </button>
            <h1 className={`text-2xl font-bold ${textColor}`}>
              {loading ? "Chargement…" : classInfo?.name || "Classe"}
            </h1>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              {classInfo
                ? `${classInfo.section}${classInfo.stream ? ` · ${classInfo.stream}` : ""}${
                    yearName ? ` · Année ${yearName}` : ""
                  }`
                : "Liste des élèves inscrits dans cette classe"}
            </p>
          </div>
          {!loading && classInfo && (
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${borderColor} ${textSecondary}`}
            >
              <Users className="h-4 w-4" />
              {students.length} élève{students.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && classInfo && (
          <PrimaryTitulaireCard
            classId={classInfo.id}
            section={classInfo.section}
            titulaireTeacherId={classInfo.titulaireTeacherId}
            onChanged={() => void load()}
          />
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
          <Card theme={theme}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Élèves de la classe</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "all", label: "Tous", count: students.length },
                      { key: "M", label: "Garçons", count: maleCount },
                      { key: "F", label: "Filles", count: femaleCount },
                    ] as const
                  ).map((opt) => {
                    const active = genderFilter === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setGenderFilter(opt.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? opt.key === "F"
                              ? "border-pink-500/40 bg-pink-500/15 text-pink-400"
                              : opt.key === "M"
                                ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400"
                                : "border-teal-500/40 bg-teal-500/15 text-teal-400"
                            : chipBase
                        }`}
                      >
                        {opt.label}
                        <span className="tabular-nums opacity-80">{opt.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-700/20" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className={`flex flex-col items-center justify-center gap-2 px-4 py-16 ${textSecondary}`}>
                  <UserRound className="h-10 w-10 opacity-50" />
                  <p>
                    {students.length === 0
                      ? "Aucun élève inscrit dans cette classe pour l'année en cours."
                      : "Aucun élève pour ce filtre."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile: nom + matricule + sexe */}
                  <div className="md:hidden space-y-2 p-3">
                    {filteredStudents.map((s) => {
                      const fullName = [s.lastName, s.middleName, s.firstName]
                        .filter(Boolean)
                        .join(" ")
                      const code = toDisplayCode(s.enrollments?.[0]?.code || s.code || s.permanentCode)
                      return (
                        <Link
                          key={`m-stu-${s.id}`}
                          href={`/admin/students/${s.id}`}
                          className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 ${borderColor} ${hoverBg}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-[15px] font-semibold leading-snug ${textColor}`}>{fullName}</p>
                            <p className="mt-1 font-mono text-xs font-semibold text-teal-500">{code}</p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              s.gender === "F"
                                ? "bg-pink-500/15 text-pink-400"
                                : "bg-indigo-500/15 text-indigo-400"
                            }`}
                          >
                            {s.gender === "F" ? "F" : "G"}
                          </span>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Desktop: tableau */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className={theme === "dark" ? "bg-gray-900/50 text-gray-400" : "bg-gray-50 text-gray-600"}>
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">#</th>
                          <th className="px-4 py-2.5 text-left font-medium">Matricule</th>
                          <th className="px-4 py-2.5 text-left font-medium">Nom</th>
                          <th className="px-4 py-2.5 text-left font-medium">Sexe</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${borderColor}`}>
                        {filteredStudents.map((s, index) => {
                          const fullName = [s.lastName, s.middleName, s.firstName]
                            .filter(Boolean)
                            .join(" ")
                          const code = toDisplayCode(s.enrollments?.[0]?.code || s.code || s.permanentCode)
                          return (
                            <tr key={s.id} className={hoverBg}>
                              <td className={`px-4 py-3 tabular-nums ${textSecondary}`}>{index + 1}</td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/admin/students/${s.id}`}
                                  className="font-mono text-sm font-semibold text-teal-500 hover:text-teal-400"
                                >
                                  {code}
                                </Link>
                              </td>
                              <td className={`px-4 py-3 font-medium ${textColor}`}>
                                <Link
                                  href={`/admin/students/${s.id}`}
                                  className="hover:text-indigo-400 transition-colors"
                                >
                                  {fullName}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    s.gender === "F"
                                      ? "bg-pink-500/15 text-pink-400"
                                      : "bg-indigo-500/15 text-indigo-400"
                                  }`}
                                >
                                  {s.gender === "F" ? "Fille" : "Garçon"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>Repartition genre</CardTitle>
                  <p className={`mt-1 text-xs ${textSecondary}`}>Effectif de cette classe</p>
                </div>
                <PieIcon className={`h-4 w-4 ${textSecondary}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[260px] animate-pulse rounded-xl bg-gray-700/20" />
              ) : students.length === 0 ? (
                <div className={`flex h-[220px] items-center justify-center text-sm ${textSecondary}`}>
                  Pas encore d&apos;effectif à afficher
                </div>
              ) : (
                <GenderChart data={genderData} theme={theme} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
