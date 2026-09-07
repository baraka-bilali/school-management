"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import {
  CreditCard, Calendar, AlertCircle, CheckCircle, Clock,
  Mail, Phone, Receipt, FileText, ChevronLeft,
  ChevronRight, Eye, X, Info
} from "lucide-react"
import InvoiceDownloadButton from "@/components/invoice-download-button"
import Portal from "@/components/portal"
import SubscriptionSkeleton from "@/components/admin/subscription-skeleton"
import {
  getSubscriptionPeriodMetrics,
  isSubscriptionAccessBlocked,
  parseSubscriptionDate,
} from "@/lib/subscription-period"

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

function OverviewRing({
  remainingPercent,
  blocked,
  theme,
}: {
  remainingPercent: number
  blocked: boolean
  theme: "light" | "dark"
}) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const clamped = blocked ? 0 : Math.min(100, Math.max(0, remainingPercent))
  const strokeDashoffset = circumference - (clamped / 100) * circumference
  const stroke = blocked
    ? "#ef4444"
    : clamped <= 20
      ? "#f97316"
      : "#14b8a6"

  return (
    <div className="relative inline-flex h-[88px] w-[88px] items-center justify-center">
      <svg width="88" height="88" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
          strokeWidth="7"
          fill="none"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke={stroke}
          strokeWidth="7"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <Calendar
        className={`relative h-7 w-7 ${
          blocked ? "text-red-500" : theme === "dark" ? "text-gray-300" : "text-gray-600"
        }`}
      />
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
    ESPECES: "Espèces", CARTE: "Carte bancaire", OFFERT: "Offert",
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${bg} rounded-2xl border ${border} shadow-2xl w-full max-w-md flex flex-col animate-scale-up`}
        style={{ maxHeight: "88vh" }}>

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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className={`flex items-center justify-between text-sm border-b ${border} pb-3`}>
            <span className={sub}>Date d&apos;émission</span>
            <span className={`font-semibold ${text}`}>{fmt(payment.createdAt)}</span>
          </div>

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

          <div className={`border ${border} rounded-xl overflow-hidden`}>
            <div className={`${rowBg} px-4 py-2 flex justify-between border-b ${border}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Description</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>Montant</span>
            </div>
            <div className={`px-4 py-3 flex justify-between items-start border-b ${border}`}>
              <div>
                <p className={`font-semibold ${text} text-sm`}>
                  Abonnement Kelasi 360 — {periodeLabel[payment.periode] || payment.periode}
                  {payment.montant === 0 || payment.typePaiement === "OFFERT" ? " (mois offert)" : ""}
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
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview")

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

  useEffect(() => { void fetchSchoolData() }, [])

  useEffect(() => {
    const onFocus = () => { void fetchSchoolData() }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  useEffect(() => {
    if (activeTab === "history") void fetchPayments(page)
  }, [activeTab, page])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const schoolRes = await authFetch("/api/admin/school")
      const schoolData = await schoolRes.json()
      setSchool(schoolData.school)
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

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return "—"
    const d = parseSubscriptionDate(dateString)
    if (!d) return "—"
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const tableRowHover = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <SubscriptionSkeleton theme={theme} />
        </div>
      </Layout>
    )
  }

  if (!school) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-32">
            <p className={textColor}>Aucune donnée d&apos;abonnement disponible</p>
          </div>
        </div>
      </Layout>
    )
  }

  const now = new Date(todayTick)
  const metrics = getSubscriptionPeriodMetrics(
    school.dateDebutAbonnement,
    school.dateFinAbonnement,
    school.etatCompte,
    now
  )
  const blocked = isSubscriptionAccessBlocked(
    school.dateFinAbonnement,
    school.etatCompte,
    now
  )

  const status = (() => {
    if (school.etatCompte === "SUSPENDU" || blocked) {
      return { label: school.etatCompte === "SUSPENDU" ? "Suspendu" : "Expiré", tone: "red" as const, icon: AlertCircle }
    }
    if (metrics.phase === "upcoming") {
      return { label: "À venir", tone: "teal" as const, icon: Clock }
    }
    if (metrics.daysRemaining !== null && metrics.daysRemaining <= 7) {
      return { label: "Expire bientôt", tone: "orange" as const, icon: Clock }
    }
    return { label: "Actif", tone: "green" as const, icon: CheckCircle }
  })()

  const StatusIcon = status.icon
  const badgeClass =
    status.tone === "green"
      ? "bg-emerald-500/15 text-emerald-500"
      : status.tone === "orange"
        ? "bg-orange-500/15 text-orange-500"
        : status.tone === "teal"
          ? "bg-teal-500/15 text-teal-500"
          : "bg-red-500/15 text-red-500"

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${textColor} mb-1`}>Abonnement</h1>
          <p className={textSecondary}>Consultez l&apos;état de votre accès Kelasi 360</p>
        </div>

        <div className={`flex gap-1 p-1 rounded-xl ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? `${bgCard} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            Vue d&apos;ensemble
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "history"
                ? `${bgCard} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Paiements</span>
            <span className="hidden sm:inline">Journal des paiements</span>
            {activeTab === "history" && totalPayments > 0 && (
              <span className="ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-teal-500 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                {totalPayments}
              </span>
            )}
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className={`rounded-2xl border ${borderColor} ${bgCard} overflow-hidden`}>
              <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${borderColor}`}>
                <h2 className={`text-base sm:text-lg font-semibold truncate ${textColor}`}>
                  {school.nomEtablissement}
                </h2>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-5 px-5 py-6">
                <OverviewRing
                  remainingPercent={metrics.progressRemaining}
                  blocked={blocked}
                  theme={theme}
                />
                <div className="min-w-0 flex-1">
                  <div className={`flex items-center gap-1.5 text-sm ${textSecondary}`}>
                    <span>Date d&apos;expiration</span>
                    <span title="L'accès reste ouvert jusqu'à la fin de cette journée inclusive.">
                      <Info className="h-3.5 w-3.5 opacity-70" />
                    </span>
                  </div>
                  <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${textColor}`}>
                    {formatDateShort(school.dateFinAbonnement)}
                  </p>
                  {!blocked && metrics.daysRemaining !== null && (
                    <p className={`mt-1 text-sm ${textSecondary}`}>
                      {metrics.daysRemaining === 0
                        ? "Expire aujourd'hui"
                        : `${metrics.daysRemaining} jour${metrics.daysRemaining > 1 ? "s" : ""} restant${metrics.daysRemaining > 1 ? "s" : ""}`}
                    </p>
                  )}
                  <a
                    href="mailto:support@kelasi360.com?subject=Renouvellement%20abonnement%20Kelasi%20360"
                    className="mt-2 inline-block text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                  >
                    Demander un renouvellement
                  </a>
                </div>
              </div>

              <div className={`flex items-start justify-between gap-4 px-5 py-4 border-t ${borderColor} ${
                theme === "dark" ? "bg-gray-900/40" : "bg-gray-50/80"
              }`}>
                <div>
                  <p className={`text-sm font-medium ${textColor}`}>Renouvellement</p>
                  <p className={`text-xs mt-0.5 ${textSecondary}`}>
                    Activé uniquement par l&apos;équipe Kelasi 360 (super administrateurs).
                  </p>
                </div>
              </div>
            </div>

            {blocked && (
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${
                theme === "dark" ? "bg-red-950/30 border-red-800/50" : "bg-red-50 border-red-200"
              }`}>
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold ${theme === "dark" ? "text-red-300" : "text-red-800"}`}>
                    Accès aux fonctionnalités suspendu
                  </p>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-red-400" : "text-red-700"}`}>
                    Contactez Kelasi 360 pour réactiver votre abonnement. Les paramètres restent accessibles.
                  </p>
                </div>
              </div>
            )}

            <Card theme={theme}>
              <CardHeader><CardTitle>Contacter Kelasi 360</CardTitle></CardHeader>
              <CardContent>
                <p className={`${textSecondary} mb-6`}>
                  Pour renouveler ou toute question, contactez directement notre équipe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="mailto:support@kelasi360.com"
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all font-semibold"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Envoyer un email</span>
                  </a>
                  <a
                    href="tel:+243859628644"
                    className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-teal-600 text-teal-600 dark:text-teal-400 rounded-lg transition-all font-semibold ${
                      theme === "dark" ? "hover:bg-teal-900/20" : "hover:bg-teal-50"
                    }`}
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
                    Les paiements enregistrés par l&apos;administration apparaîtront ici.
                  </p>
                </div>
              ) : (
                <>
                  <ul className={`divide-y ${borderColor}`}>
                    {payments.map((p) => (
                      <li
                        key={p.id}
                        className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 transition-colors ${tableRowHover}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-sm font-semibold text-teal-500 truncate block">
                              {p.numeroFacture}
                            </span>
                            <span className={`text-xs tabular-nums ${textSecondary}`}>
                              {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-500/10 px-3.5 py-2 text-xs font-semibold text-teal-500 transition-colors hover:bg-teal-500/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir
                        </button>
                      </li>
                    ))}
                  </ul>

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
