"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Calendar, FileText, Wallet, BookOpen, Clock, TrendingUp } from "lucide-react"

interface StudentInfo {
  id: number
  lastName: string
  middleName: string
  firstName: string
  code: string
  class?: string
  year?: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Charger le thème
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)

    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  useEffect(() => {
    // Récupérer les infos de l'élève
    const fetchStudentInfo = async () => {
      try {
        const res = await fetch("/api/student/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setStudentInfo(data.student)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des infos élève:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentInfo()
  }, [])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const quickActions = [
    {
      title: "Horaire des cours",
      description: "Consulter votre emploi du temps",
      icon: Calendar,
      href: "/student/schedule",
      color: "bg-blue-500",
    },
    {
      title: "Notes & Bulletins",
      description: "Voir vos résultats scolaires",
      icon: FileText,
      href: "/student/grades",
      color: "bg-green-500",
    },
    {
      title: "Frais scolaires",
      description: "Gérer vos paiements",
      icon: Wallet,
      href: "/student/fees",
      color: "bg-orange-500",
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className={`text-lg ${textSecondary}`}>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* En-tête de bienvenue */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
          <h1 className={`text-2xl font-bold ${textColor} mb-2`}>
            Bienvenue, {studentInfo?.firstName} ! 👋
          </h1>
          <p className={textSecondary}>
            {studentInfo?.class && studentInfo?.year 
              ? `${studentInfo.class} - Année scolaire ${studentInfo.year}`
              : "Votre espace élève"
            }
          </p>
        </div>

        {/* Carte d'information élève */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Mes informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <p className={`text-sm ${textSecondary} mb-1`}>Nom complet</p>
                <p className={`font-semibold ${textColor}`}>
                  {studentInfo?.lastName} {studentInfo?.middleName} {studentInfo?.firstName}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <p className={`text-sm ${textSecondary} mb-1`}>Code élève</p>
                <p className={`font-semibold ${textColor}`}>{studentInfo?.code || "-"}</p>
              </div>
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <p className={`text-sm ${textSecondary} mb-1`}>Classe</p>
                <p className={`font-semibold ${textColor}`}>{studentInfo?.class || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div>
          <h2 className={`text-lg font-semibold ${textColor} mb-4`}>Accès rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className={`${cardBg} border ${borderColor} rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group`}
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`font-semibold ${textColor} mb-1`}>{action.title}</h3>
                <p className={`text-sm ${textSecondary}`}>{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card theme={theme}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-blue-500" />
                Prochain cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={textSecondary}>Fonctionnalité à venir...</p>
            </CardContent>
          </Card>
          
          <Card theme={theme}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Dernière moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={textSecondary}>Fonctionnalité à venir...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
