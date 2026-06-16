"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Megaphone, Clock, ArrowLeft, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"

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
  const { card, text, textMuted, shadow, border } = useStudentTheme()
  const [communique, setCommunique] = useState<Communique | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  if (loading) return <StudentLoading variant="communiqueView" />

  if (notFound || !communique) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Megaphone className={cn("mb-4 h-12 w-12", textMuted)} />
        <p className={cn("font-medium", text)}>Communiqué introuvable</p>
        <button type="button" onClick={() => router.push("/student/communiques")} className="mt-4 text-sm font-semibold text-indigo-600">
          Retour aux communiqués
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push("/student/communiques")}
        className={cn("flex items-center gap-2 text-sm font-medium", textMuted)}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
        <div className="border-b border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-500/10 dark:bg-indigo-500/5">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Megaphone className="h-3 w-3" />
            Communication officielle
          </div>
          <h1 className={cn("text-xl font-bold leading-snug", text)}>{communique.title}</h1>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className={cn("flex items-center gap-1.5 text-xs", textMuted)}>
              <Clock className="h-3.5 w-3.5" />
              {formatDate(communique.createdAt)}
            </span>
            <span className={cn("flex items-center gap-1.5 text-xs", textMuted)}>
              <User className="h-3.5 w-3.5" />
              {communique.createdBy.nom && communique.createdBy.prenom
                ? `${communique.createdBy.prenom} ${communique.createdBy.nom}`
                : communique.createdBy.name}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className={cn("prose prose-sm max-w-none dark:prose-invert", text)} dangerouslySetInnerHTML={{ __html: communique.content }} />
        </div>
      </div>
    </div>
  )
}
