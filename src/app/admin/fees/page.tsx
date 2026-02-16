"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import {
  Wallet,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Check,
  X,
  Eye,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Receipt,
  TrendingUp,
  ArrowRight,
  Loader2,
  ChevronDown,
  Hash,
  Calendar,
  Building,
  UserCheck,
  BadgeDollarSign,
} from "lucide-react"
import Portal from "@/components/portal"

// ============================================================
// TYPES
// ============================================================

interface FeeStats {
  totalExpected: number
  totalCollected: number
  totalPending: number
  studentsFullyPaid: number
  studentsPartiallyPaid: number
  studentsUnpaid: number
  totalStudents: number
  recentPayments: RecentPayment[]
  tarificationsSummary: TarificationSummary[]
}

interface RecentPayment {
  id: number
  numeroRecu: string
  studentName: string
  studentCode: string
  className: string
  typeFrais: string
  montant: number
  datePaiement: string
  modePaiement: string
}

interface TarificationSummary {
  id: number
  typeFrais: string
  classe: string
  montant: number
  totalAttendu: number
  totalPercu: number
  nombrePaiements: number
  nombreEleves: number
}

interface TypeFrais {
  id: number
  code: string
  nom: string
  description: string | null
  isActive: boolean
  _count: { tarifications: number }
}

interface Tarification {
  id: number
  typeFraisId: number
  yearId: number
  classId: number | null
  montant: number
  description: string | null
  isActive: boolean
  typeFrais: { id: number; nom: string; code: string }
  year: { id: number; name: string }
  class: { id: number; name: string } | null
  _count: { paiements: number }
}

interface EnrollmentOption {
  enrollmentId: number
  studentId: number
  studentName: string
  studentCode: string
  classId: number
  className: string
  yearId: number
  yearName: string
}

interface PaiementRecord {
  id: number
  numeroRecu: string
  montant: number
  datePaiement: string
  modePaiement: string
  reference: string | null
  notes: string | null
  isAnnule: boolean
  student: { firstName: string; lastName: string; middleName: string; code: string }
  tarification: {
    typeFrais: { nom: string; code: string }
    year: { name: string }
  }
  enrollment: { class: { name: string } }
}

interface BalanceInfo {
  montantTotal: number
  totalPaye: number
  solde: number
  nombrePaiements: number
}

// ============================================================
// MODE DE PAIEMENT OPTIONS
// ============================================================

const MODES_PAIEMENT = [
  { value: "CASH", label: "Espèces", icon: Banknote, color: "text-green-500" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone, color: "text-blue-500" },
  { value: "VIREMENT", label: "Virement bancaire", icon: Building, color: "text-purple-500" },
  { value: "CHEQUE", label: "Chèque", icon: FileText, color: "text-orange-500" },
  { value: "AUTRE", label: "Autre", icon: CreditCard, color: "text-gray-500" },
]

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminFeesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState<"overview" | "types" | "students" | "payments">("overview")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Données
  const [stats, setStats] = useState<FeeStats | null>(null)
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>([])
  const [tarifications, setTarifications] = useState<Tarification[]>([])
  const [paiements, setPaiements] = useState<PaiementRecord[]>([])
  const [paiementsPagination, setPaiementsPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false)

  // Theme listener
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

  // Charger les données initiales
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, typesRes, tarifsRes, paiementsRes] = await Promise.all([
        fetch("/api/admin/fees/stats"),
        fetch("/api/admin/fees/types"),
        fetch("/api/admin/fees/tarifications"),
        fetch("/api/admin/fees/paiements?pageSize=15"),
      ])

      if (statsRes.ok) {
        const { data } = await statsRes.json()
        setStats(data)
      }
      if (typesRes.ok) {
        const { data } = await typesRes.json()
        setTypesFrais(data)
      }
      if (tarifsRes.ok) {
        const { data } = await tarifsRes.json()
        setTarifications(data)
      }
      if (paiementsRes.ok) {
        const result = await paiementsRes.json()
        setPaiements(result.data)
        setPaiementsPagination(result.pagination)
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Couleurs thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
  const hoverRow = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
  const headerBg = theme === "dark" ? "bg-gray-700" : "bg-gray-50"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " $"
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getModePaiementLabel = (mode: string) => {
    return MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode
  }

  const tabs = [
    { key: "overview", label: "Vue d'ensemble", icon: TrendingUp },
    { key: "types", label: "Types de frais", icon: FileText },
    { key: "students", label: "Par élève", icon: Users },
    { key: "payments", label: "Paiements", icon: Receipt },
  ]

  const percentPaid = stats ? Math.round((stats.totalCollected / Math.max(stats.totalExpected, 1)) * 100) : 0

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textColor} flex items-center gap-2`}>
              <BadgeDollarSign className="w-7 h-7 text-green-500" />
              Frais scolaires
            </h1>
            <p className={`${textSecondary} mt-1`}>Gestion des frais et paiements des élèves</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/25 font-medium"
            >
              <DollarSign className="w-4 h-4" />
              Enregistrer un paiement
            </button>
            <button
              onClick={() => setShowCreateTypeModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau type de frais
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Total attendu</p>
                    <p className={`text-xl font-bold ${textColor} mt-0.5`}>{formatCurrency(stats.totalExpected)}</p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </CardContent>
            </Card>

            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/15 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Total perçu</p>
                    <p className={`text-xl font-bold text-green-500 mt-0.5`}>{formatCurrency(stats.totalCollected)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={textSecondary}>Progression</span>
                    <span className="text-green-500 font-semibold">{percentPaid}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percentPaid}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/15 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>En attente</p>
                    <p className={`text-xl font-bold text-orange-500 mt-0.5`}>{formatCurrency(stats.totalPending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Élèves à jour</p>
                    <p className={`text-xl font-bold ${textColor} mt-0.5`}>
                      {stats.studentsFullyPaid}
                      <span className={`text-sm font-normal ${textSecondary}`}> / {stats.totalStudents}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-600 dark:text-green-400">
                    {stats.studentsFullyPaid} soldés
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                    {stats.studentsPartiallyPaid} partiels
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
                    {stats.studentsUnpaid} impayés
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglets */}
        <div className={`flex items-center gap-1 border-b ${borderColor} overflow-x-auto`}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : `border-transparent ${textSecondary} hover:text-indigo-500`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className={textSecondary}>Chargement des données...</p>
            </div>
          </div>
        ) : (
          <>
            {/* === VUE D'ENSEMBLE === */}
            {activeTab === "overview" && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Répartition */}
                <Card theme={theme}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Répartition des paiements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {[
                        { label: "Soldés", count: stats.studentsFullyPaid, color: "bg-green-500", textColor: "text-green-500" },
                        { label: "Partiels", count: stats.studentsPartiallyPaid, color: "bg-yellow-500", textColor: "text-yellow-500" },
                        { label: "Impayés", count: stats.studentsUnpaid, color: "bg-red-500", textColor: "text-red-500" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-sm font-medium ${textSecondary}`}>{item.label}</span>
                            <span className={`text-sm font-bold ${item.textColor}`}>{item.count} élèves</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className={`${item.color} h-2.5 rounded-full transition-all duration-700`}
                              style={{ width: `${Math.max((item.count / Math.max(stats.totalStudents, 1)) * 100, item.count > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Résumé tarifications */}
                    {stats.tarificationsSummary.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                        <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Par type de frais</h4>
                        <div className="space-y-2">
                          {stats.tarificationsSummary.map((t) => {
                            const pct = Math.round((t.totalPercu / Math.max(t.totalAttendu, 1)) * 100)
                            return (
                              <div key={t.id} className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-medium ${textColor}`}>{t.typeFrais}</span>
                                  <span className={`text-xs ${textSecondary}`}>{pct}%</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                  <span className={textSecondary}>{t.classe} · {t.nombreEleves} élèves</span>
                                  <span className={textSecondary}>{formatCurrency(t.totalPercu)} / {formatCurrency(t.totalAttendu)}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Derniers paiements */}
                <Card theme={theme}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-green-500" />
                      Derniers paiements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-30`} />
                        <p className={textSecondary}>Aucun paiement enregistré</p>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="mt-3 text-sm text-indigo-500 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                        >
                          Enregistrer le premier paiement <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats.recentPayments.map((payment) => (
                          <div key={payment.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${theme === "dark" ? "bg-gray-700/40 hover:bg-gray-700/70" : "bg-gray-50 hover:bg-gray-100"}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-green-500/15 rounded-full flex items-center justify-center shrink-0">
                                <DollarSign className="w-4 h-4 text-green-500" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${textColor} truncate`}>{payment.studentName}</p>
                                <p className={`text-xs ${textSecondary} truncate`}>{payment.typeFrais} · {payment.className}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold text-green-500">+{formatCurrency(payment.montant)}</p>
                              <p className={`text-xs ${textSecondary}`}>{formatDate(payment.datePaiement)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === TYPES DE FRAIS === */}
            {activeTab === "types" && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  {typesFrais.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
                      <p className={`text-lg font-medium ${textColor}`}>Aucun type de frais</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Commencez par créer un type de frais pour pouvoir enregistrer des paiements</p>
                      <button
                        onClick={() => setShowCreateTypeModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Créer un type de frais
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={headerBg}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Code</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Nom</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Description</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Tarifications</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Statut</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                          {typesFrais.map((t) => (
                            <tr key={t.id} className={hoverRow}>
                              <td className={`px-4 py-3`}>
                                <span className="font-mono text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{t.code}</span>
                              </td>
                              <td className={`px-4 py-3 ${textColor} font-medium`}>{t.nom}</td>
                              <td className={`px-4 py-3 ${textSecondary} text-sm`}>{t.description || "—"}</td>
                              <td className={`px-4 py-3 ${textColor}`}>{t._count.tarifications}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  t.isActive
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
                                }`}>
                                  {t.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {t.isActive ? "Actif" : "Inactif"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button className={`p-1.5 rounded-lg ${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors`}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button className={`p-1.5 rounded-lg ${textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* === PAIEMENTS === */}
            {activeTab === "payments" && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  {paiements.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
                      <p className={`text-lg font-medium ${textColor}`}>Aucun paiement</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Les paiements enregistrés apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={headerBg}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>N° Reçu</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Élève</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Classe</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Type</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Montant</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Date</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mode</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Statut</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                          {paiements.map((p) => (
                            <tr key={p.id} className={hoverRow}>
                              <td className={`px-4 py-3`}>
                                <span className="font-mono text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400">{p.numeroRecu}</span>
                              </td>
                              <td className={`px-4 py-3`}>
                                <p className={`text-sm font-medium ${textColor}`}>{p.student.lastName} {p.student.firstName}</p>
                                <p className={`text-xs ${textSecondary}`}>{p.student.code}</p>
                              </td>
                              <td className={`px-4 py-3 text-sm ${textSecondary}`}>{p.enrollment.class.name}</td>
                              <td className={`px-4 py-3 text-sm ${textSecondary}`}>{p.tarification.typeFrais.nom}</td>
                              <td className="px-4 py-3 text-sm font-bold text-green-500">{formatCurrency(p.montant)}</td>
                              <td className={`px-4 py-3 text-sm ${textSecondary}`}>{formatDate(p.datePaiement)}</td>
                              <td className={`px-4 py-3 text-sm ${textSecondary}`}>{getModePaiementLabel(p.modePaiement)}</td>
                              <td className="px-4 py-3">
                                {p.isAnnule ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                    <X className="w-3 h-3" /> Annulé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                    <Check className="w-3 h-3" /> Valide
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {paiementsPagination.totalPages > 1 && (
                        <div className={`flex items-center justify-between pt-4 border-t ${borderColor} mt-4`}>
                          <p className={`text-sm ${textSecondary}`}>
                            {paiementsPagination.total} paiements au total
                          </p>
                          <div className="flex gap-2">
                            <span className={`text-sm ${textSecondary}`}>
                              Page {paiementsPagination.page} / {paiementsPagination.totalPages}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* === PAR ÉLÈVE === */}
            {activeTab === "students" && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="text-center py-12">
                    <Users className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
                    <p className={`text-lg font-medium ${textColor}`}>Vue par élève</p>
                    <p className={`text-sm ${textSecondary} mt-1`}>La vue détaillée par élève sera disponible prochainement</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL : ENREGISTRER UN PAIEMENT */}
      {/* ============================================================ */}
      {showPaymentModal && (
        <PaymentFormModal
          theme={theme}
          tarifications={tarifications}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false)
            fetchAll()
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL : CRÉER UN TYPE DE FRAIS */}
      {/* ============================================================ */}
      {showCreateTypeModal && (
        <CreateFeeTypeModal
          theme={theme}
          onClose={() => setShowCreateTypeModal(false)}
          onSuccess={() => {
            setShowCreateTypeModal(false)
            fetchAll()
          }}
        />
      )}
    </Layout>
  )
}


// ============================================================
// FORMULAIRE DE PAIEMENT
// ============================================================

function PaymentFormModal({
  theme,
  tarifications,
  onClose,
  onSuccess,
}: {
  theme: "light" | "dark"
  tarifications: Tarification[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Step 1: Recherche élève
  const [studentSearch, setStudentSearch] = useState("")
  const [searchResults, setSearchResults] = useState<EnrollmentOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentOption | null>(null)

  // Step 2: Sélection tarification + montant
  const [selectedTarif, setSelectedTarif] = useState<Tarification | null>(null)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Step 3: Détails paiement
  const [montant, setMontant] = useState("")
  const [modePaiement, setModePaiement] = useState("CASH")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split("T")[0])

  // Résultat
  const [createdPayment, setCreatedPayment] = useState<{
    numeroRecu: string
    montant: number
    studentName: string
  } | null>(null)

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Couleurs
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputClasses = `w-full px-3 py-2.5 rounded-xl border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all`

  // Recherche d'élèves avec debounce
  useEffect(() => {
    if (studentSearch.trim().length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/fees/enrollments?q=${encodeURIComponent(studentSearch)}`)
        if (res.ok) {
          const { data } = await res.json()
          setSearchResults(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [studentSearch])

  // Charger le solde quand une tarification est sélectionnée
  useEffect(() => {
    if (!selectedEnrollment || !selectedTarif) return

    const loadBalance = async () => {
      setLoadingBalance(true)
      try {
        const res = await fetch(
          `/api/admin/fees/balance?studentId=${selectedEnrollment.studentId}&tarificationId=${selectedTarif.id}`
        )
        if (res.ok) {
          const { data } = await res.json()
          setBalanceInfo(data)
          // Pré-remplir le montant avec le solde restant
          if (data.solde > 0) {
            setMontant(String(data.solde))
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingBalance(false)
      }
    }
    loadBalance()
  }, [selectedEnrollment, selectedTarif])

  // Tarifications applicables à l'élève sélectionné
  const applicableTarifs = tarifications.filter((t) => {
    if (!selectedEnrollment) return false
    return t.isActive && (t.classId === null || t.classId === selectedEnrollment.classId)
  })

  const handleSubmit = async () => {
    if (!selectedEnrollment || !selectedTarif || !montant) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/admin/fees/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.enrollmentId,
          tarificationId: selectedTarif.id,
          montant: parseFloat(montant),
          datePaiement: datePaiement || undefined,
          modePaiement,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'enregistrement")
      }

      const { data } = await res.json()
      setCreatedPayment({
        numeroRecu: data.numeroRecu,
        montant: data.montant,
        studentName: `${data.student.lastName} ${data.student.middleName} ${data.student.firstName}`,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-lg overflow-hidden`}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enregistrer un paiement</h3>
                  <p className="text-green-100 text-xs">
                    {!success && `Étape ${step}/3 — ${step === 1 ? "Sélection de l'élève" : step === 2 ? "Type de frais" : "Détails du paiement"}`}
                    {success && "Paiement enregistré !"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            {!success && (
              <div className="flex gap-1.5 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      s <= step ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* === SUCCÈS === */}
            {success && createdPayment && (
              <div className="text-center py-4 space-y-4">
                <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h4 className={`text-xl font-bold ${textColor}`}>Paiement enregistré !</h4>
                  <p className={`${textSecondary} mt-1`}>{createdPayment.studentName}</p>
                </div>

                <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>N° Reçu</span>
                    <span className={`font-mono font-bold ${textColor}`}>{createdPayment.numeroRecu}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>Montant</span>
                    <span className="text-lg font-bold text-green-500">{createdPayment.montant} $</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={onClose}
                    className={`flex-1 px-4 py-2.5 rounded-xl border ${borderColor} ${textColor} font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  >
                    Fermer
                  </button>
                  <button
                    onClick={onSuccess}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
                  >
                    Nouveau paiement
                  </button>
                </div>
              </div>
            )}

            {/* === ÉTAPE 1 : RECHERCHE ÉLÈVE === */}
            {!success && step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <UserCheck className="w-4 h-4 inline mr-1.5" />
                    Rechercher un élève
                  </label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                    <input
                      type="text"
                      placeholder="Nom, prénom ou code de l'élève..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={`${inputClasses} pl-10`}
                      autoFocus
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Résultats */}
                {searchResults.length > 0 && (
                  <div className={`rounded-xl border ${borderColor} overflow-hidden max-h-60 overflow-y-auto`}>
                    {searchResults.map((enrollment) => (
                      <button
                        key={enrollment.enrollmentId}
                        onClick={() => {
                          setSelectedEnrollment(enrollment)
                          setStudentSearch("")
                          setSearchResults([])
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                          selectedEnrollment?.enrollmentId === enrollment.enrollmentId
                            ? "bg-green-500/10"
                            : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        } border-b last:border-b-0 ${borderColor}`}
                      >
                        <div className="w-9 h-9 bg-indigo-500/15 rounded-full flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${textColor} truncate`}>{enrollment.studentName}</p>
                          <p className={`text-xs ${textSecondary}`}>
                            {enrollment.className} · Code: {enrollment.studentCode}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {studentSearch.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className={`text-sm ${textSecondary} text-center py-4`}>Aucun élève trouvé</p>
                )}

                {/* Élève sélectionné */}
                {selectedEnrollment && (
                  <div className={`p-4 rounded-xl border-2 border-green-500/50 ${theme === "dark" ? "bg-green-500/5" : "bg-green-50"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className={`font-semibold ${textColor}`}>{selectedEnrollment.studentName}</p>
                          <p className={`text-xs ${textSecondary}`}>
                            {selectedEnrollment.className} · {selectedEnrollment.yearName} · Code: {selectedEnrollment.studentCode}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedEnrollment(null)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === ÉTAPE 2 : TYPE DE FRAIS === */}
            {!success && step === 2 && selectedEnrollment && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <FileText className="w-4 h-4 inline mr-1.5" />
                    Sélectionner le type de frais
                  </label>

                  {applicableTarifs.length === 0 ? (
                    <div className={`text-center py-6 ${textSecondary}`}>
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune tarification disponible pour cet élève</p>
                      <p className="text-xs mt-1">Créez d'abord une tarification pour la classe {selectedEnrollment.className}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {applicableTarifs.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTarif(t)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedTarif?.id === t.id
                              ? "border-green-500 bg-green-500/5 dark:bg-green-500/10"
                              : `${borderColor} ${theme === "dark" ? "hover:border-gray-600 hover:bg-gray-700/50" : "hover:border-gray-300 hover:bg-gray-50"}`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${textColor}`}>{t.typeFrais.nom}</p>
                              <p className={`text-xs ${textSecondary} mt-0.5`}>
                                {t.class?.name || "Toutes les classes"} · {t.year.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${textColor}`}>{t.montant} $</p>
                              {selectedTarif?.id === t.id && (
                                <Check className="w-4 h-4 text-green-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Solde */}
                {selectedTarif && (
                  <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700/50" : "bg-blue-50"} space-y-2`}>
                    <h4 className={`text-sm font-semibold ${textColor} flex items-center gap-1.5`}>
                      <Wallet className="w-4 h-4 text-blue-500" />
                      Situation de paiement
                    </h4>
                    {loadingBalance ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className={`text-sm ${textSecondary}`}>Calcul du solde...</span>
                      </div>
                    ) : balanceInfo ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className={textSecondary}>Montant total</span>
                          <span className={`font-medium ${textColor}`}>{balanceInfo.montantTotal} $</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={textSecondary}>Déjà payé ({balanceInfo.nombrePaiements} paiement{balanceInfo.nombrePaiements > 1 ? "s" : ""})</span>
                          <span className="font-medium text-green-500">{balanceInfo.totalPaye} $</span>
                        </div>
                        <div className={`flex justify-between text-sm pt-1.5 border-t ${borderColor}`}>
                          <span className={`font-semibold ${textColor}`}>Reste à payer</span>
                          <span className={`font-bold ${balanceInfo.solde > 0 ? "text-orange-500" : "text-green-500"}`}>
                            {balanceInfo.solde} $
                          </span>
                        </div>
                        {balanceInfo.solde <= 0 && (
                          <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ce frais est entièrement soldé
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* === ÉTAPE 3 : DÉTAILS DU PAIEMENT === */}
            {!success && step === 3 && selectedEnrollment && selectedTarif && (
              <div className="space-y-4">
                {/* Résumé élève + frais */}
                <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"} flex items-center gap-3`}>
                  <div className="w-9 h-9 bg-green-500/15 rounded-full flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${textColor} truncate`}>{selectedEnrollment.studentName}</p>
                    <p className={`text-xs ${textSecondary}`}>{selectedTarif.typeFrais.nom} — Reste: {balanceInfo?.solde ?? "?"} $</p>
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Montant à payer
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={balanceInfo?.solde ?? undefined}
                      step="any"
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      placeholder="0"
                      className={`${inputClasses} text-xl font-bold pr-10`}
                      autoFocus
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-bold ${textSecondary}`}>$</span>
                  </div>
                  {balanceInfo && parseFloat(montant) > balanceInfo.solde && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Le montant dépasse le solde restant ({balanceInfo.solde} $)
                    </p>
                  )}

                  {/* Quick amounts */}
                  {balanceInfo && balanceInfo.solde > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[
                        ...(balanceInfo.solde >= 50 ? [Math.round(balanceInfo.solde / 4)] : []),
                        ...(balanceInfo.solde >= 20 ? [Math.round(balanceInfo.solde / 2)] : []),
                        balanceInfo.solde,
                      ].filter((v, i, a) => a.indexOf(v) === i && v > 0).map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setMontant(String(amount))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            parseFloat(montant) === amount
                              ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                              : `${borderColor} ${textSecondary} hover:border-green-500`
                          }`}
                        >
                          {amount === balanceInfo.solde ? "Totalité" : `${amount} $`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Mode de paiement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODES_PAIEMENT.map((mode) => {
                      const Icon = mode.icon
                      return (
                        <button
                          key={mode.value}
                          onClick={() => setModePaiement(mode.value)}
                          className={`p-3 rounded-xl border-2 text-left flex items-center gap-2.5 transition-all ${
                            modePaiement === mode.value
                              ? "border-green-500 bg-green-500/5 dark:bg-green-500/10"
                              : `${borderColor} ${theme === "dark" ? "hover:border-gray-600" : "hover:border-gray-300"}`
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${mode.color}`} />
                          <span className={`text-sm font-medium ${textColor}`}>{mode.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={datePaiement}
                    onChange={(e) => setDatePaiement(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                {/* Référence (optionnel) */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <Hash className="w-4 h-4 inline mr-1" />
                    Référence <span className={`font-normal ${textSecondary}`}>(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Numéro de transaction, etc."
                    className={inputClasses}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    Notes <span className={`font-normal ${textSecondary}`}>(optionnel)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Remarques sur ce paiement..."
                    rows={2}
                    className={inputClasses}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className={`px-6 py-4 border-t ${borderColor} flex items-center justify-between`}>
              <button
                onClick={() => {
                  if (step === 1) onClose()
                  else setStep((s) => (s - 1) as 1 | 2 | 3)
                }}
                className={`px-4 py-2 rounded-xl border ${borderColor} ${textColor} text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              >
                {step === 1 ? "Annuler" : "Retour"}
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                  disabled={
                    (step === 1 && !selectedEnrollment) ||
                    (step === 2 && (!selectedTarif || (balanceInfo?.solde ?? 0) <= 0))
                  }
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                    (step === 1 && !selectedEnrollment) || (step === 2 && (!selectedTarif || (balanceInfo?.solde ?? 0) <= 0))
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                  }`}
                >
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !montant || parseFloat(montant) <= 0}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                    submitting || !montant || parseFloat(montant) <= 0
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Enregistrer le paiement
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}


// ============================================================
// MODAL : CRÉER UN TYPE DE FRAIS
// ============================================================

function CreateFeeTypeModal({
  theme,
  onClose,
  onSuccess,
}: {
  theme: "light" | "dark"
  onClose: () => void
  onSuccess: () => void
}) {
  const [code, setCode] = useState("")
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputClasses = `w-full px-3 py-2.5 rounded-xl border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`

  const handleSubmit = async () => {
    if (!code || !nom) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/admin/fees/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), nom, description: description || undefined }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur")
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-md overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Nouveau type de frais</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="Ex: SCOLARITE, INSCRIPTION"
                className={`${inputClasses} font-mono`}
                maxLength={20}
                autoFocus
              />
              <p className={`text-xs ${textSecondary} mt-1`}>Majuscules, chiffres et underscores uniquement</p>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Frais de scolarité"
                className={inputClasses}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                Description <span className={`font-normal ${textSecondary}`}>(optionnel)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du type de frais..."
                rows={2}
                className={inputClasses}
              />
            </div>
          </div>

          <div className={`px-6 py-4 border-t ${borderColor} flex justify-end gap-3`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border ${borderColor} ${textColor} text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !code || !nom}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                submitting || !code || !nom
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
