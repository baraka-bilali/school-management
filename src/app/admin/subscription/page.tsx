"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import {
  CreditCard, Calendar, AlertCircle, CheckCircle, Clock,
  Mail, Phone, Receipt, FileText, ChevronLeft,
  ChevronRight, Download, MessageCircle, X, Building2, User, Timer, Layers
} from "lucide-react"
import InvoiceDownloadButton from "@/components/invoice-download-button"
import Portal from "@/components/portal"
import {
  getSubscriptionPeriodMetrics,
  parseSubscriptionDate,
  type SubscriptionPeriodMetrics,
  type SubscriptionSegment,
} from "@/lib/subscription-period"

interface SubscriptionSummary {
  cumulativeStart: string | null
  cumulativeEnd: string | null
  totalDays: number
  subscriptionCount: number
  segments: SubscriptionSegment[]
  metrics: SubscriptionPeriodMetrics
}

interface School {
  id: number
  nomEtablissement: string
  etatCompte: string
  dateDebutAbonnement: string | null
  dateFinAbonnement: string | null
  typePaiement: string | null
  montantPaye: number | null
}

interface SubscriptionPayment {
  id: number
  numeroFacture: string
  montant: number
  devise: string
  typePaiement: string
  reference: string | null
  dateDebut: string
  dateFin: string
  periode: string
  plan: string
  statut: string
  notes: string | null
  createdAt: string
}

const CircularProgress = ({
  remainingPercent,
  daysRemaining,
  daysElapsed,
  totalDays,
  daysUntilStart,
  phase,
  theme,
}: {
  remainingPercent: number
  daysRemaining: number | null
  daysElapsed: number
  totalDays: number
  daysUntilStart: number
  phase: string
  theme: "light" | "dark"
}) => {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, remainingPercent))
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  const getGradientColors = () => {
    if (phase === "expired" || phase === "suspended" || (daysRemaining !== null && daysRemaining <= 0)) {
      return { from: "#ef4444", to: "#dc2626" }
    }
    if (daysRemaining !== null && daysRemaining <= 7) {
      return { from: "#ef4444", to: "#f97316" }
    }
    if (daysRemaining !== null && daysRemaining <= 15) {
      return { from: "#f97316", to: "#ea580c" }
    }
    return { from: "#14b8a6", to: "#0d9488" }
  }

  const colors = getGradientColors()
  const gradientId = `subscriptionRemaining-${theme}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <div
          className={`absolute -top-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md ${
            theme === "dark" ? "border-gray-700 bg-gray-800" : "border-white bg-white"
          } ${
            daysRemaining !== null && daysRemaining <= 7
              ? "text-red-500 animate-pulse"
              : daysRemaining !== null && daysRemaining <= 15
                ? "text-orange-500"
                : "text-teal-500"
          }`}
        >
          <Timer className="h-4 w-4" />
        </div>
        <svg width="200" height="200" className="transform -rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.from, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: colors.to, stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={radius} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} strokeWidth="12" fill="none" />
          <circle
            cx="100" cy="100" r={radius}
            stroke={`url(#${gradientId})`} strokeWidth="12" fill="none"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out"
            style={{ filter: "drop-shadow(0 0 8px rgba(20, 184, 166, 0.35))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="text-center">
            {phase === "upcoming" && daysUntilStart > 0 ? (
              <>
                <div className="text-4xl font-bold text-teal-500">{totalDays}</div>
                <div className={`text-sm font-medium mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  jours au total
                </div>
                <div className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                  début dans {daysUntilStart} j.
                </div>
              </>
            ) : daysRemaining !== null && daysRemaining > 0 ? (
              <>
                <div className={`text-5xl font-bold tabular-nums ${daysRemaining <= 7 ? "text-red-500" : daysRemaining <= 15 ? "text-orange-500" : "text-teal-500"}`}>
                  {daysRemaining}
                </div>
                <div className={`text-sm font-medium mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  jours restants
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-red-500">
                  {phase === "suspended" ? "Résilié" : "Expiré"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {phase === "active" && totalDays > 0 && (
        <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
          {daysElapsed} consommé{daysElapsed > 1 ? "s" : ""} · {daysRemaining ?? 0} restant{(daysRemaining ?? 0) > 1 ? "s" : ""} · {totalDays} j. total
        </p>
      )}
    </div>
  )
}

function InvoicePrintModal({
  payment, school, onClose, theme,
}: {
  payment: SubscriptionPayment
  school: School
  onClose: () => void
  theme: "light" | "dark"
}) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

  const periodeLabel: Record<string, string> = {
    MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
    SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
  }
  const typePaiementLabel: Record<string, string> = {
    MOBILE_MONEY: "Mobile Money", VIREMENT: "Virement bancaire",
    ESPECES: "Espèces", CARTE: "Carte bancaire",
  }

  const bg     = theme === "dark" ? "bg-[#1a1f2e]"    : "bg-white"
  const border = theme === "dark" ? "border-gray-700"  : "border-gray-200"
  const text   = theme === "dark" ? "text-white"       : "text-gray-900"
  const sub    = theme === "dark" ? "text-gray-400"    : "text-gray-500"
  const rowBg  = theme === "dark" ? "bg-gray-800/50"   : "bg-gray-50"
  const totalBg= theme === "dark" ? "bg-teal-900/30"   : "bg-teal-50"

  const invoiceData = {
    numeroFacture: payment.numeroFacture,
    createdAt: payment.createdAt,
    plan: payment.plan,
    periode: payment.periode,
    dateDebut: payment.dateDebut,
    dateFin: payment.dateFin,
    montant: payment.montant,
    devise: payment.devise,
    typePaiement: payment.typePaiement,
    reference: payment.reference,
    notes: payment.notes,
    schoolName: school.nomEtablissement,
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay flou — même pattern que le modal de déconnexion */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Carte du modal */}
      <div className={`relative ${bg} rounded-2xl border ${border} shadow-2xl w-full max-w-md flex flex-col animate-scale-up`}
        style={{ maxHeight: "88vh" }}>

        {/* Header */}
        <div className={`p-5 border-b ${border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Receipt className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${text}`}>Facture</h3>
              <p className="text-xs text-blue-500 font-mono">{payment.numeroFacture}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold">
              Payé
            </span>
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-gray-400" : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Date */}
          <div className={`flex items-center justify-between text-sm border-b ${border} pb-3`}>
            <span className={sub}>Date d'émission</span>
            <span className={`font-semibold ${text}`}>{fmt(payment.createdAt)}</span>
          </div>

          {/* Émetteur / Destinataire */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${rowBg} rounded-xl p-3`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${sub} mb-1.5`}>Émetteur</p>
              <p className={`font-bold ${text} text-sm`}>Kelasi 360</p>
              <p className={`text-xs ${sub} mt-0.5`}>support@kelasi360.com</p>
            </div>
            <div className={`${rowBg} rounded-xl p-3`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${sub} mb-1.5`}>Destinataire</p>
              <p className={`font-bold ${text} text-sm`}>{school.nomEtablissement}</p>
            </div>
          </div>

          {/* Tableau */}
          <div className={`border ${border} rounded-xl overflow-hidden`}>
            <div className={`${rowBg} px-4 py-2 flex justify-between border-b ${border}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Description</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Montant</span>
            </div>
            <div className={`px-4 py-3 flex justify-between items-start border-b ${border}`}>
              <div>
                <p className={`font-semibold ${text} text-sm`}>
                  Abonnement {payment.plan} — {periodeLabel[payment.periode] || payment.periode}
                </p>
                <p className={`text-xs ${sub} mt-0.5`}>
                  {fmt(payment.dateDebut)} → {fmt(payment.dateFin)}
                </p>
              </div>
              <p className={`font-bold ${text} text-sm whitespace-nowrap ml-3`}>
                {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(payment.montant)} {payment.devise}
              </p>
            </div>
            <div className={`${totalBg} px-4 py-2.5 flex justify-between items-center`}>
              <span className={`font-bold ${text} text-sm`}>TOTAL</span>
              <span className="font-bold text-teal-500 text-base">
                {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(payment.montant)} {payment.devise}
              </span>
            </div>
          </div>

          {/* Mode paiement + Référence */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${sub} mb-1`}>Mode de paiement</p>
              <p className={`font-semibold ${text}`}>{typePaiementLabel[payment.typePaiement] || payment.typePaiement}</p>
            </div>
            {payment.reference && (
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${sub} mb-1`}>Référence</p>
                <p className={`font-semibold font-mono ${text}`}>{payment.reference}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Notes</p>
              <p className="text-sm text-amber-400">{payment.notes}</p>
            </div>
          )}

          <p className={`text-center text-[11px] ${sub} pt-1`}>
            Merci de votre confiance — Kelasi 360
          </p>
        </div>

        {/* Boutons */}
        <div className={`flex-shrink-0 flex gap-3 p-4 border-t ${border}`}>
          <InvoiceDownloadButton data={invoiceData} />
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

export default function SubscriptionPage() {
  const [school, setSchool] = useState<School | null>(null)
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview")

  // Payments journal
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null)
  const [todayTick, setTodayTick] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setTodayTick(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
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

  useEffect(() => { fetchSchoolData() }, [])

  useEffect(() => {
    const onFocus = () => { void fetchSchoolData() }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  useEffect(() => {
    if (activeTab === "history") fetchPayments(page)
  }, [activeTab, page])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const [schoolRes, summaryRes] = await Promise.all([
        authFetch("/api/admin/school"),
        authFetch("/api/admin/subscription/summary"),
      ])
      const schoolData = await schoolRes.json()
      setSchool(schoolData.school)
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSubscriptionSummary(summaryData)
        setTotalPayments(summaryData.subscriptionCount ?? 0)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async (p: number) => {
    setPaymentsLoading(true)
    try {
      const response = await authFetch(`/api/admin/subscription/payments?page=${p}&limit=15`)
      const data = await response.json()
      setPayments(data.payments || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalPayments(data.pagination?.total || 0)
    } catch (error) {
      console.error("Erreur chargement paiements:", error)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini"
    const d = parseSubscriptionDate(dateString)
    if (!d) return "Non défini"
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  }

  const formatMontant = (montant: number | null) => {
    if (!montant) return "0"
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(montant)
  }

  const getStatusInfo = (metrics: SubscriptionPeriodMetrics) => {
    if (!school) return { label: "Inconnu", color: "gray", icon: AlertCircle, status: "INCONNU" }
    const daysRemaining = metrics.daysRemaining

    if (school.etatCompte === "ACTIF") {
      if (metrics.phase === "upcoming") {
        return { label: "À venir", color: "teal", icon: Clock, status: "A_VENIR" }
      }
      if (daysRemaining === null) return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
      if (daysRemaining <= 0) return { label: "Expiré", color: "red", icon: AlertCircle, status: "EXPIRÉ" }
      if (daysRemaining <= 15) return { label: "Expire bientôt", color: "orange", icon: Clock, status: "EXPIRE_BIENTOT" }
      return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
    }
    if (school.etatCompte === "SUSPENDU") return { label: "Suspendu", color: "red", icon: AlertCircle, status: "SUSPENDU" }
    if (school.etatCompte === "INACTIF") return { label: "Inactif", color: "gray", icon: AlertCircle, status: "INACTIF" }
    return { label: school.etatCompte, color: "gray", icon: AlertCircle, status: school.etatCompte }
  }

  const periodeLabel: Record<string, string> = {
    MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
    SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const tableRowHover = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={textSecondary}>Chargement...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!school) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-32">
            <p className={textColor}>Aucune donnée d'abonnement disponible</p>
          </div>
        </div>
      </Layout>
    )
  }

  const fallbackMetrics = getSubscriptionPeriodMetrics(
    school.dateDebutAbonnement,
    school.dateFinAbonnement,
    school.etatCompte,
    new Date(todayTick)
  )
  const periodMetrics = subscriptionSummary
    ? getSubscriptionPeriodMetrics(
        subscriptionSummary.cumulativeStart,
        subscriptionSummary.cumulativeEnd,
        school.etatCompte,
        new Date(todayTick),
        subscriptionSummary.totalDays
      )
    : fallbackMetrics
  const cumulativeStart = subscriptionSummary?.cumulativeStart ?? school.dateDebutAbonnement
  const cumulativeEnd = subscriptionSummary?.cumulativeEnd ?? school.dateFinAbonnement
  const totalDaysCumulative = subscriptionSummary?.totalDays ?? periodMetrics.totalDays
  const subscriptionCount = subscriptionSummary?.subscriptionCount ?? 1
  const segments = subscriptionSummary?.segments ?? []

  const statusInfo = getStatusInfo(periodMetrics)
  const StatusIcon = statusInfo.icon
  const daysRemaining = periodMetrics.daysRemaining
  const progressRemaining = periodMetrics.progressRemaining
  const progressElapsed = periodMetrics.progressElapsed

  const statusColors = {
    teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>Abonnement</h1>
            <p className={textSecondary}>Gérez votre abonnement et consultez les informations</p>
          </div>
          <span className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 ${statusColors[statusInfo.color as keyof typeof statusColors]}`}>
            <StatusIcon className="w-4 h-4" />
            {statusInfo.label}
          </span>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? `${bgCard} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "history"
                ? `${bgCard} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <Receipt className="w-4 h-4" />
            Journal des paiements
            {totalPayments > 0 && (
              <span className="bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
                {totalPayments}
              </span>
            )}
          </button>
        </div>

        {/* TAB: Overview */}
        {activeTab === "overview" && (
          <>
            {/* Carte principale */}
            <Card theme={theme}>
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex-shrink-0">
                    <CircularProgress
                      remainingPercent={progressRemaining}
                      daysRemaining={daysRemaining}
                      daysElapsed={periodMetrics.daysElapsed}
                      totalDays={totalDaysCumulative}
                      daysUntilStart={periodMetrics.daysUntilStart}
                      phase={periodMetrics.phase}
                      theme={theme}
                    />
                  </div>
                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <p className={`${textSecondary} text-sm font-medium mb-1`}>Établissement</p>
                      <h2 className={`${textColor} text-2xl font-bold`}>{school.nomEtablissement}</h2>
                    </div>
                    <div className="space-y-4">
                      {/* Couverture totale cumulée */}
                      <div className={`rounded-xl border p-4 ${theme === "dark" ? "bg-teal-900/10 border-teal-800/40" : "bg-teal-50/80 border-teal-200"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <p className={`text-xs font-semibold uppercase tracking-wide ${theme === "dark" ? "text-teal-300" : "text-teal-800"}`}>
                              Couverture totale
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                            {subscriptionCount} abonnement{subscriptionCount > 1 ? "s" : ""} · {totalDaysCumulative} jours
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} mb-1`}>Début global</p>
                            <p className={`${textColor} text-base font-semibold`}>{formatDate(cumulativeStart)}</p>
                          </div>
                          <div className={`hidden sm:flex items-center justify-center ${textSecondary}`}>
                            <span className="text-lg">→</span>
                          </div>
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-500" : textSecondary} mb-1`}>
                              Expiration globale
                            </p>
                            <p className={`${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-600 dark:text-orange-400" : textColor} text-base font-semibold`}>
                              {formatDate(cumulativeEnd)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Détail par abonnement */}
                      {segments.length > 0 && (
                        <div className={`rounded-xl border p-4 ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-3`}>
                            Détail des périodes souscrites
                          </p>
                          <div className="space-y-2">
                            {segments.map((seg) => (
                              <div
                                key={`${seg.index}-${seg.dateDebut}`}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                                  theme === "dark" ? "bg-gray-900/60" : "bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                                    {seg.index}
                                  </span>
                                  <span className={`font-medium ${textColor}`}>
                                    Abonnement {seg.index}
                                    {seg.plan ? ` · ${seg.plan}` : ""}
                                  </span>
                                </div>
                                <span className={`tabular-nums ${textSecondary}`}>
                                  {formatDate(seg.dateDebut)} → {formatDate(seg.dateFin)}
                                </span>
                                <span className="rounded-md bg-teal-500/15 px-2 py-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                                  {seg.days} j.
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {daysRemaining !== null && daysRemaining <= 30 && (
                      <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                        theme === "dark" ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"
                      }`}>
                        <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className={`text-sm font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                            Pour renouveler votre abonnement
                          </p>
                          <p className={`text-sm mt-1 ${theme === "dark" ? "text-blue-400" : "text-blue-700"}`}>
                            Contactez l'équipe Kelasi 360 via email ou téléphone ci-dessous.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${textSecondary}`} />
                      <p className={`${textSecondary} text-sm font-medium`}>Progression vers l&apos;expiration</p>
                    </div>
                    <p className={`${textColor} text-sm font-semibold tabular-nums`}>{Math.round(progressElapsed)}%</p>
                  </div>
                  <div className={`h-2.5 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        school.etatCompte === "SUSPENDU" || periodMetrics.phase === "expired" || (daysRemaining !== null && daysRemaining <= 0)
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : daysRemaining !== null && daysRemaining <= 7
                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                            : daysRemaining !== null && daysRemaining <= 15
                              ? "bg-gradient-to-r from-orange-500 to-orange-600"
                              : "bg-gradient-to-r from-teal-500 to-teal-600"
                      }`}
                      style={{ width: `${progressElapsed}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-between mt-2 text-xs ${textSecondary}`}>
                    <span>
                      {periodMetrics.phase === "upcoming"
                        ? `Début le ${formatDate(cumulativeStart)} · ${totalDaysCumulative} jours au total`
                        : `${periodMetrics.daysElapsed} jour${periodMetrics.daysElapsed > 1 ? "s" : ""} consommé${periodMetrics.daysElapsed > 1 ? "s" : ""}`}
                    </span>
                    <span className="tabular-nums">
                      {daysRemaining ?? 0} restant{(daysRemaining ?? 0) > 1 ? "s" : ""} / {totalDaysCumulative} j.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de paiement */}
            <Card theme={theme}>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informations de paiement
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className={`${textSecondary} text-sm font-medium mb-2`}>Type de paiement</p>
                    <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                      <p className={`${textColor} font-semibold`}>{school.typePaiement || "Non défini"}</p>
                    </div>
                  </div>
                  <div>
                    <p className={`${textSecondary} text-sm font-medium mb-2`}>Montant du dernier paiement</p>
                    <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                      <p className={`${textColor} text-2xl font-bold`}>
                        {formatMontant(school.montantPaye)} <span className="text-lg font-normal">USD</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Besoin d'aide */}
            <Card theme={theme}>
              <CardHeader><CardTitle>Contacter Kelasi 360</CardTitle></CardHeader>
              <CardContent>
                <p className={`${textSecondary} mb-6`}>
                  Pour renouveler votre abonnement, signaler un problème ou toute autre question,
                  contactez directement notre équipe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="mailto:support@kelasi360.com"
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Envoyer un email</span>
                  </a>
                  <a
                    href="tel:+243859628644"
                    className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all font-semibold"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Appeler le support</span>
                  </a>
                </div>
                <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                  <p className={`${textSecondary} text-sm leading-relaxed`}>
                    <strong className={textColor}>Email :</strong> support@kelasi360.com<br />
                    <strong className={textColor}>Téléphone :</strong> +243 859 628 644<br />
                    <strong className={textColor}>Horaires :</strong> Lun - Sam : 7h00 - 15h00 (fermé le dimanche)
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* TAB: Journal des paiements */}
        {activeTab === "history" && (
          <Card theme={theme}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-500" />
                    Journal des paiements
                  </div>
                  <span className={`text-sm font-normal ${textSecondary}`}>{totalPayments} paiement(s)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                  <FileText className={`w-12 h-12 ${textSecondary}`} />
                  <p className={textSecondary}>Aucun paiement enregistré.</p>
                  <p className={`text-sm ${textSecondary}`}>
                    Les paiements enregistrés par l'administration apparaîtront ici.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${borderColor}`}>
                          <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>N° Facture</th>
                          <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Date</th>
                          <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Abonnement</th>
                          <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Montant</th>
                          <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Référence</th>
                          <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Facture</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${borderColor}`}>
                        {payments.map((p) => (
                          <tr key={p.id} className={`${tableRowHover} transition-colors`}>
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-teal-500 font-semibold">{p.numeroFacture}</span>
                            </td>
                            <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                              {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-6 py-4">
                              <p className={`text-sm font-medium ${textColor}`}>
                                {p.plan} · {periodeLabel[p.periode] || p.periode}
                              </p>
                              <p className={`text-xs ${textSecondary}`}>
                                {new Date(p.dateDebut).toLocaleDateString("fr-FR")} → {new Date(p.dateFin).toLocaleDateString("fr-FR")}
                              </p>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${textColor}`}>
                              {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(p.montant)} {p.devise}
                            </td>
                            <td className={`px-6 py-4 text-sm font-mono ${textSecondary}`}>
                              {p.reference || "—"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setSelectedPayment(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors text-xs font-medium"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Voir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between px-6 py-4 border-t ${borderColor}`}>
                      <span className={`text-sm ${textSecondary}`}>Page {page} / {totalPages}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className={`p-2 rounded-lg border ${borderColor} ${textSecondary} disabled:opacity-40 transition-colors`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className={`p-2 rounded-lg border ${borderColor} ${textSecondary} disabled:opacity-40 transition-colors`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal facture */}
      {selectedPayment && school && (
        <InvoicePrintModal
          payment={selectedPayment}
          school={school}
          onClose={() => setSelectedPayment(null)}
          theme={theme}
        />
      )}
    </Layout>
  )
}
