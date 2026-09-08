"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CreditCard,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

type CurrencyBalance = { totalDu: number; totalPaye: number; solde: number }

type ChildDetail = {
  student: {
    id: number
    code: string
    lastName: string
    middleName: string
    firstName: string
    gender: string
    className: string | null
    yearName: string | null
    relationship: string | null
  }
  scolaire: { usd: CurrencyBalance; cdf: CurrencyBalance } | null
  autres: Array<{
    typeFrais: string
    usd: CurrencyBalance
    cdf: CurrencyBalance
  }>
  paiements: Array<{
    id: number
    numeroRecu: string
    montant: number
    devise: string
    typeFrais: string
    datePaiement: string
    modePaiement: string
  }>
  tasks: Array<{
    id: number
    title: string
    dueAt: string | null
    subject?: { name: string; color: string | null } | null
    teacher?: { firstName: string; lastName: string } | null
  }>
}

function formatMoney(amount?: number, devise = "USD") {
  if (amount == null || Number.isNaN(amount)) return "—"
  return `${Number(amount).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${devise}`
}

function pickPrimary(usd: CurrencyBalance, cdf: CurrencyBalance) {
  const hasUsd = usd.totalDu > 0 || usd.totalPaye > 0
  const hasCdf = cdf.totalDu > 0 || cdf.totalPaye > 0
  if (hasCdf && !hasUsd) return { ...cdf, devise: "CDF" as const }
  return { ...usd, devise: "USD" as const }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ParentChildDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const [tab, setTab] = useState<"fees" | "results">("fees")
  const [data, setData] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/parent/children/${params.studentId}`, {
          credentials: "include",
        })
        if (res.status === 403 || res.status === 404) {
          setError("Cet élève n’est pas lié à votre compte.")
          return
        }
        if (!res.ok) {
          setError("Impossible de charger le suivi.")
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError("Erreur réseau")
      } finally {
        setLoading(false)
      }
    }
    if (params.studentId) void run()
  }, [params.studentId])

  if (loading) return <StudentLoading variant="dashboard" />

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push("/parent/children")}
          className={cn("flex items-center gap-2 text-sm font-medium", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
          <p className={cn("font-medium", text)}>{error || "Introuvable"}</p>
        </div>
      </div>
    )
  }

  const fullName = [data.student.lastName, data.student.middleName, data.student.firstName]
    .filter(Boolean)
    .join(" ")
  const scolaireSummary = data.scolaire
    ? pickPrimary(data.scolaire.usd, data.scolaire.cdf)
    : { totalDu: 0, totalPaye: 0, solde: 0, devise: "USD" as const }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/parent/children")}
        className={cn("flex items-center gap-2 text-sm font-medium", textMuted)}
      >
        <ArrowLeft className="h-4 w-4" /> Mes enfants
      </button>

      <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
            {data.student.firstName?.charAt(0)?.toUpperCase() || "E"}
          </div>
          <div className="min-w-0">
            <h1 className={cn("truncate text-lg font-bold", text)}>{fullName}</h1>
            <p className={cn("text-xs", textMuted)}>
              {data.student.code}
              {data.student.className ? ` · ${data.student.className}` : ""}
              {data.student.relationship ? ` · ${data.student.relationship}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("flex rounded-xl border p-1", border, card)}>
        <button
          type="button"
          onClick={() => setTab("fees")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
            tab === "fees" ? "bg-indigo-600 text-white" : textMuted
          )}
        >
          <CreditCard className="h-4 w-4" /> Paiements
        </button>
        <button
          type="button"
          onClick={() => setTab("results")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
            tab === "results" ? "bg-indigo-600 text-white" : textMuted
          )}
        >
          <BookOpen className="h-4 w-4" /> Suivi
        </button>
      </div>

      {tab === "fees" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
              <p className={cn("text-xs", textMuted)}>Total dû</p>
              <p className={cn("mt-1 text-lg font-bold", text)}>
                {formatMoney(scolaireSummary.totalDu, scolaireSummary.devise)}
              </p>
            </div>
            <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
              <p className={cn("text-xs", textMuted)}>Payé</p>
              <p className={cn("mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400")}>
                {formatMoney(scolaireSummary.totalPaye, scolaireSummary.devise)}
              </p>
            </div>
            <div className={cn("col-span-2 rounded-2xl border p-4", card, border, shadow)}>
              <p className={cn("text-xs", textMuted)}>Solde restant</p>
              <p
                className={cn(
                  "mt-1 text-xl font-bold",
                  scolaireSummary.solde > 0 ? "text-amber-600 dark:text-amber-400" : text
                )}
              >
                {formatMoney(scolaireSummary.solde, scolaireSummary.devise)}
              </p>
            </div>
          </div>

          {(data.autres || []).length > 0 && (
            <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
              <p className={cn("mb-3 text-sm font-semibold", text)}>Autres frais</p>
              <div className="space-y-2">
                {data.autres.map((a, idx) => {
                  const summary = pickPrimary(a.usd, a.cdf)
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className={textMuted}>{a.typeFrais || "Frais"}</span>
                      <span className={text}>{formatMoney(summary.solde, summary.devise)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
            <div className={cn("border-b px-4 py-3", border)}>
              <p className={cn("text-sm font-semibold", text)}>Historique des paiements</p>
            </div>
            {data.paiements.length === 0 ? (
              <div className="p-6 text-center">
                <Receipt className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
                <p className={cn("text-sm", textMuted)}>Aucun paiement enregistré</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.paiements.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", text)}>{p.typeFrais}</p>
                      <p className={cn("text-xs", textMuted)}>
                        {formatDate(p.datePaiement)} · {p.numeroRecu}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(p.montant, p.devise)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="space-y-4">
          <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
            <p className={cn("text-sm font-semibold", text)}>Situation scolaire</p>
            <p className={cn("mt-1 text-sm", textMuted)}>
              Classe : {data.student.className || "—"}
              {data.student.yearName ? ` · ${data.student.yearName}` : ""}
            </p>
            <p className={cn("mt-2 text-xs", textMuted)}>
              Les bulletins officiels seront disponibles dès que le module Notes sera activé.
              En attendant, voici les devoirs et travaux communiqués par les enseignants.
            </p>
          </div>

          <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
            <div className={cn("border-b px-4 py-3", border)}>
              <p className={cn("text-sm font-semibold", text)}>Devoirs & travaux</p>
            </div>
            {data.tasks.length === 0 ? (
              <div className="p-6 text-center">
                <BookOpen className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
                <p className={cn("text-sm", textMuted)}>Aucun travail pour le moment</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.tasks.map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <p className={cn("text-sm font-medium", text)}>{t.title}</p>
                    <p className={cn("mt-0.5 text-xs", textMuted)}>
                      {t.subject?.name || "Cours"}
                      {t.dueAt ? ` · Échéance ${formatDate(t.dueAt)}` : ""}
                      {t.teacher
                        ? ` · ${t.teacher.firstName} ${t.teacher.lastName}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/parent/messages"
            className={cn(
              "flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold text-indigo-600",
              border
            )}
          >
            Voir les communiqués de l&apos;école
          </Link>
        </div>
      )}
    </div>
  )
}
