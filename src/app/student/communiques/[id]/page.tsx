"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { Megaphone, Clock, ArrowLeft, Loader2, User } from "lucide-react"

interface Communique {
  id: number
  title: string
  content: string
  createdAt: string
  createdBy: { name: string; nom?: string; prenom?: string }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function StudentCommuniqueViewPage() {
  const params = useParams()
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [communique, setCommunique] = useState<Communique | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
    const handleThemeChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  useEffect(() => {
    const fetchCommunique = async () => {
      try {
        const res = await fetch(`/api/student/communiques/${params.id}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setCommunique(data.communique)
          window.dispatchEvent(new Event("communiqueRead"))
        } else if (res.status === 404) {
          setNotFound(true)
        }
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchCommunique()
  }, [params.id])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
          <Loader2 className={`w-8 h-8 animate-spin ${textSecondary}`} />
        </div>
      </Layout>
    )
  }

  if (notFound || !communique) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPage} flex items-center justify-center`}>
          <div className="text-center">
            <Megaphone className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
            <p className={`font-medium ${textColor}`}>Communiqué introuvable</p>
            <button onClick={() => router.push("/student/communiques")} className="mt-4 text-sm text-indigo-500 hover:text-indigo-600">
              Retour aux communiqués
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={`min-h-screen ${bgPage}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <button
              onClick={() => router.push("/student/communiques")}
              className={`p-2 rounded-lg transition-colors ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className={`font-semibold ${textColor}`}>Communiqués</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${bgCard} border ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
            {/* Meta header */}
            <div className={`p-6 border-b ${borderColor} ${theme === "dark" ? "bg-indigo-900/10" : "bg-indigo-50/50"}`}>
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
                theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"
              }`}>
                <Megaphone className="w-3 h-3" />
                Communication officielle
              </div>
              <h1 className={`text-2xl font-bold ${textColor} mb-4`}>{communique.title}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`flex items-center gap-1.5 text-sm ${textSecondary}`}>
                  <Clock className="w-4 h-4" />
                  {formatDate(communique.createdAt)}
                </span>
                <span className={`flex items-center gap-1.5 text-sm ${textSecondary}`}>
                  <User className="w-4 h-4" />
                  Direction — {communique.createdBy.nom && communique.createdBy.prenom
                    ? `${communique.createdBy.prenom} ${communique.createdBy.nom}`
                    : communique.createdBy.name}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div
                className={`prose prose-base dark:prose-invert max-w-none ${textColor}`}
                dangerouslySetInnerHTML={{ __html: communique.content }}
              />
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${borderColor} ${theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"}`}>
              <button
                onClick={() => router.push("/student/communiques")}
                className={`flex items-center gap-2 text-sm ${textSecondary} hover:text-indigo-500 transition-colors`}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
