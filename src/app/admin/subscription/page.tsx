"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import {
  CreditCard, Calendar, AlertCircle, CheckCircle, Clock,
  Mail, Phone, Receipt, FileText, ChevronLeft,
  ChevronRight, Download, MessageCircle
} from "lucide-react"

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
  percentage, daysRemaining, status, theme
}: {
  percentage: number
  daysRemaining: number | null
  status: string
  theme: "light" | "dark"
}) => {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getGradientColors = () => {
    if (status === "EXPIRÉ" || (daysRemaining !== null && daysRemaining <= 0)) {
      return { from: "#ef4444", to: "#dc2626" }
    }
    if (daysRemaining !== null && daysRemaining <= 15) {
      return { from: "#f97316", to: "#ea580c" }
    }
    return { from: "#14b8a6", to: "#0d9488" }
  }

  const colors = getGradientColors()

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.from, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.to, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} stroke={theme === "dark" ? "#374151" : "#e5e7eb"} strokeWidth="12" fill="none" />
        <circle
          cx="100" cy="100" r={radius}
          stroke="url(#progressGradient)" strokeWidth="12" fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
          style={{ filter: "drop-shadow(0 0 8px rgba(20, 184, 166, 0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          {daysRemaining !== null && daysRemaining > 0 ? (
            <>
              <div className={`text-5xl font-bold ${daysRemaining <= 15 ? "text-orange-500" : "text-teal-500"}`}>
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
                {status === "SUSPENDU" ? "Résilié" : "Expiré"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InvoicePrintModal({
  payment, school, onClose, theme
}: {
  payment: SubscriptionPayment
  school: School
  onClose: () => void
  theme: "light" | "dark"
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

  const periodeLabel: Record<string, string> = {
    MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
    SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
  }

  const typePaiementLabel: Record<string, string> = {
    MOBILE_MONEY: "Mobile Money", VIREMENT: "Virement bancaire",
    ESPECES: "Espèces", CARTE: "Carte bancaire",
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Invoice content */}
        <div className="p-8" id="invoice-print">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FACTURE</h1>
              <p className="text-lg font-mono text-blue-600 mt-1">{payment.numeroFacture}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Date d'émission</p>
              <p className="font-semibold text-gray-900">{formatDate(payment.createdAt)}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Émetteur</p>
              <p className="font-bold text-gray-900">DigiSchool Platform</p>
              <p className="text-sm text-gray-600">support@digischool.com</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Destinataire</p>
              <p className="font-bold text-gray-900">{school.nomEtablissement}</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Description</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500 pb-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-semibold text-gray-900">
                      Abonnement {payment.plan} — {periodeLabel[payment.periode] || payment.periode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Période : {formatDate(payment.dateDebut)} → {formatDate(payment.dateFin)}
                    </p>
                  </td>
                  <td className="py-4 text-right font-bold text-gray-900 text-lg">
                    {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(payment.montant)} {payment.devise}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 font-bold text-gray-900">TOTAL</td>
                  <td className="pt-4 text-right font-bold text-teal-600 text-xl">
                    {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(payment.montant)} {payment.devise}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-gray-500">Mode de paiement</p>
              <p className="font-semibold text-gray-900">{typePaiementLabel[payment.typePaiement] || payment.typePaiement}</p>
            </div>
            {payment.reference && (
              <div>
                <p className="text-gray-500">Référence</p>
                <p className="font-semibold font-mono text-gray-900">{payment.reference}</p>
              </div>
            )}
          </div>

          {payment.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-yellow-800">{payment.notes}</p>
            </div>
          )}

          <div className="text-center text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
            <p>Merci de votre confiance — DigiSchool Platform</p>
            <p>Ce document tient lieu de facture officielle</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Imprimer / Télécharger
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  const [school, setSchool] = useState<School | null>(null)
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
    if (activeTab === "history") fetchPayments(page)
  }, [activeTab, page])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const response = await authFetch("/api/admin/school")
      const data = await response.json()
      setSchool(data.school)
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

  const calculateDaysRemaining = () => {
    if (!school?.dateFinAbonnement) return null
    if (school.etatCompte === "SUSPENDU") return 0
    const today = new Date()
    const endDate = new Date(school.dateFinAbonnement)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  }

  const formatMontant = (montant: number | null) => {
    if (!montant) return "0"
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(montant)
  }

  const getStatusInfo = () => {
    if (!school) return { label: "Inconnu", color: "gray", icon: AlertCircle, status: "INCONNU" }
    const daysRemaining = calculateDaysRemaining()
    if (school.etatCompte === "ACTIF") {
      if (daysRemaining === null) return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
      if (daysRemaining <= 0) return { label: "Expiré", color: "red", icon: AlertCircle, status: "EXPIRÉ" }
      if (daysRemaining <= 15) return { label: "Expire bientôt", color: "orange", icon: Clock, status: "EXPIRE_BIENTOT" }
      return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
    }
    if (school.etatCompte === "SUSPENDU") return { label: "Suspendu", color: "red", icon: AlertCircle, status: "SUSPENDU" }
    if (school.etatCompte === "INACTIF") return { label: "Inactif", color: "gray", icon: AlertCircle, status: "INACTIF" }
    return { label: school.etatCompte, color: "gray", icon: AlertCircle, status: school.etatCompte }
  }

  const calculateProgress = () => {
    if (school?.etatCompte === "SUSPENDU") return 100
    if (!school?.dateDebutAbonnement || !school?.dateFinAbonnement) return 0
    const now = new Date().getTime()
    const start = new Date(school.dateDebutAbonnement).getTime()
    const end = new Date(school.dateFinAbonnement).getTime()
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
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

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  const daysRemaining = calculateDaysRemaining()
  const progress = calculateProgress()

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
                      percentage={progress}
                      daysRemaining={daysRemaining}
                      status={statusInfo.status}
                      theme={theme}
                    />
                  </div>
                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <p className={`${textSecondary} text-sm font-medium mb-1`}>Établissement</p>
                      <h2 className={`${textColor} text-2xl font-bold`}>{school.nomEtablissement}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={`w-4 h-4 ${textSecondary}`} />
                          <p className={`${textSecondary} text-xs font-semibold uppercase tracking-wide`}>Date de début</p>
                        </div>
                        <p className={`${textColor} text-lg font-semibold`}>{formatDate(school.dateDebutAbonnement)}</p>
                      </div>
                      <div className={`p-4 rounded-lg border ${
                        daysRemaining !== null && daysRemaining <= 15
                          ? theme === "dark" ? "bg-orange-900/20 border-orange-700" : "bg-orange-50 border-orange-200"
                          : theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={`w-4 h-4 ${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-500" : textSecondary}`} />
                          <p className={`${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-500" : textSecondary} text-xs font-semibold uppercase tracking-wide`}>
                            Date d'expiration
                          </p>
                        </div>
                        <p className={`${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-600 dark:text-orange-400" : textColor} text-lg font-semibold`}>
                          {formatDate(school.dateFinAbonnement)}
                        </p>
                      </div>
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
                            Contactez l'équipe DigiSchool via email ou téléphone ci-dessous.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${textSecondary} text-sm font-medium`}>Progression de la période</p>
                    <p className={`${textColor} text-sm font-semibold`}>{Math.round(progress)}%</p>
                  </div>
                  <div className={`h-2 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        school.etatCompte === "SUSPENDU" || (daysRemaining !== null && daysRemaining <= 0)
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : "bg-gradient-to-r from-teal-500 to-teal-600"
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
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
              <CardHeader><CardTitle>Contacter DigiSchool</CardTitle></CardHeader>
              <CardContent>
                <p className={`${textSecondary} mb-6`}>
                  Pour renouveler votre abonnement, signaler un problème ou toute autre question,
                  contactez directement notre équipe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="mailto:support@digischool.com"
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Envoyer un email</span>
                  </a>
                  <a
                    href="tel:+243000000000"
                    className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all font-semibold"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Appeler le support</span>
                  </a>
                </div>
                <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                  <p className={`${textSecondary} text-sm leading-relaxed`}>
                    <strong className={textColor}>Email :</strong> support@digischool.com<br />
                    <strong className={textColor}>Téléphone :</strong> +243 000 000 000<br />
                    <strong className={textColor}>Horaires :</strong> Lun - Ven : 8h00 - 17h00
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
