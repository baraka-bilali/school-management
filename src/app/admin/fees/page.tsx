"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
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
  ChevronLeft,
  ChevronRight,
  Hash,
  Calendar,
  Building,
  UserCheck,
  BadgeDollarSign,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Printer,
} from "lucide-react"
import Portal from "@/components/portal"
import { sortClasses, compareClasses, SECTION_ORDER, SECTION_LABELS } from "@/lib/class-sort"
import { formatAcademicYearOptionLabel, parseSchoolYearLabel } from "@/lib/school-year-utils"
import { formatRelativeDateLabel, formatDateSidebar, formatTimeLabel } from "@/lib/date-labels"
import { FeesStatsSkeleton, FeesTabSkeleton } from "@/components/fees/fees-tab-skeletons"
import type { ReceiptData } from "@/components/receipt-pdf"

const ReceiptDownloadButton = dynamic(
  () => import("@/components/receipt-download-button"),
  { ssr: false }
)

// ============================================================
// TYPES
// ============================================================

interface FeeStats {
  usd: {
    totalExpected: number
    totalCollected: number
    totalPending: number
    studentsFullyPaid: number
    studentsPartiallyPaid: number
    studentsUnpaid: number
  }
  cdf: {
    totalExpected: number
    totalCollected: number
    totalPending: number
    studentsFullyPaid: number
    studentsPartiallyPaid: number
    studentsUnpaid: number
  }
  totalStudents: number
  tarificationCount?: number
  studentsWithoutTarif?: number
  recentPayments: RecentPayment[]
  tarificationsSummary: TarificationSummary[]
  feeTypesSummary?: FeeTypeSummary[]
  otherTypesSummary?: FeeTypeSummary[]
  dailyCollected?: {
    usd: number
    cdf: number
    count: number
    date: string
  }
}

interface RecentPayment {
  id: number
  numeroRecu: string
  studentName: string
  studentCode: string
  className: string
  typeFrais: string
  montant: number
  devise: "USD" | "CDF"
  datePaiement: string
  modePaiement: string
}

interface TarificationSummary {
  id: number
  typeFrais: string
  classe: string
  montant: number
  devise: "USD" | "CDF"
  totalAttendu: number
  totalPercu: number
  nombrePaiements: number
  nombreEleves: number
}

interface FeeTypeSummary {
  typeFraisId: number
  typeFrais: string
  isDefault: boolean
  usd: { totalExpected: number; totalCollected: number; totalPending: number }
  cdf: { totalExpected: number; totalCollected: number; totalPending: number }
  tarificationCount: number
  nombreEleves: number
}

interface TypeFrais {
  id: number
  code: string
  nom: string
  description: string | null
  isActive: boolean
  isDefault?: boolean
  _count: { tarifications: number }
}

interface ClassOption {
  id: number
  name: string
  level: string
  section: string
  letter: string
}

interface AcademicYearOption {
  id: number
  name: string
  current: boolean
}

interface Tarification {
  id: number
  typeFraisId: number
  yearId: number
  classId: number | null
  montant: number
  devise: "USD" | "CDF"
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
    devise: "USD" | "CDF"
  }
  enrollment: { class: { name: string } }
}

interface BalanceInfo {
  montantTotal: number
  totalPaye: number
  solde: number
  nombrePaiements: number
  devise: "USD" | "CDF"
}

interface StudentFeeRow {
  studentId: number
  enrollmentId: number
  lastName: string
  middleName: string
  firstName: string
  code: string
  gender: string
  classId: number
  className: string
  usd: { expected: number; paid: number; remaining: number; percent: number }
  cdf: { expected: number; paid: number; remaining: number; percent: number }
  status: "solde" | "partiel" | "impaye"
  paymentCount: number
  lastPaymentDate: string | null
}

// ============================================================
// MODE DE PAIEMENT OPTIONS
// ============================================================

const SF_PAGE_SIZE = 10
const OVERVIEW_RECENT_PAYMENTS_LIMIT = 6

function getStudentPrimaryCurrency(row: StudentFeeRow): "USD" | "CDF" | null {
  const hasUsd = row.usd.expected > 0
  const hasCdf = row.cdf.expected > 0
  if (hasUsd && !hasCdf) return "USD"
  if (hasCdf && !hasUsd) return "CDF"
  if (hasUsd && hasCdf) return row.cdf.expected >= row.usd.expected ? "CDF" : "USD"
  return null
}

function getStudentPrimaryPaid(row: StudentFeeRow): number {
  const currency = getStudentPrimaryCurrency(row)
  if (currency === "USD") return row.usd.paid
  if (currency === "CDF") return row.cdf.paid
  return 0
}

function getStudentPrimaryRemaining(row: StudentFeeRow): number {
  const currency = getStudentPrimaryCurrency(row)
  if (currency === "USD") return row.usd.remaining
  if (currency === "CDF") return row.cdf.remaining
  return 0
}

function getStudentPaidInCurrency(row: StudentFeeRow, currency: "USD" | "CDF"): number {
  return currency === "USD" ? row.usd.paid : row.cdf.paid
}

function getStudentRemainingInCurrency(row: StudentFeeRow, currency: "USD" | "CDF"): number {
  return currency === "USD" ? row.usd.remaining : row.cdf.remaining
}

function getStudentAmountCurrency(row: StudentFeeRow, filter: "" | "USD" | "CDF"): "USD" | "CDF" | null {
  if (filter) return filter
  return getStudentPrimaryCurrency(row)
}

const MODES_PAIEMENT = [
  { value: "CASH", label: "Espèces", icon: Banknote, color: "text-green-500" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone, color: "text-blue-500" },
  { value: "VIREMENT", label: "Virement bancaire", icon: Building, color: "text-purple-500" },
  { value: "CHEQUE", label: "Chèque", icon: FileText, color: "text-orange-500" },
  { value: "AUTRE", label: "Autre", icon: CreditCard, color: "text-gray-500" },
]

// ============================================================
// HELPERS
// ============================================================

function formatMontant(amount: number, devise: "USD" | "CDF"): string {
  if (devise === "CDF") {
    return new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " FC"
  }
  return new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " $"
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminFeesPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isCashier, setIsCashier] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "types" | "tarifications" | "students" | "payments">("overview")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Devise
  const [currency, setCurrency] = useState<"USD" | "CDF">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("schoolCurrency") as "USD" | "CDF") || "USD"
    }
    return "USD"
  })
  const [exchangeRate, setExchangeRate] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("schoolExchangeRate")) || 2800
    }
    return 2800
  })

  // Données
  const [stats, setStats] = useState<FeeStats | null>(null)
  const [typesFrais, setTypesFrais] = useState<TypeFrais[]>([])
  const [tarifications, setTarifications] = useState<Tarification[]>([])
  const [paiements, setPaiements] = useState<PaiementRecord[]>([])
  const [paiementsPagination, setPaiementsPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [years, setYears] = useState<AcademicYearOption[]>([])
  const [currentYearId, setCurrentYearId] = useState<number | null>(null)

  // Par élève
  const [studentFees, setStudentFees] = useState<StudentFeeRow[]>([])
  const [studentFeesLoading, setStudentFeesLoading] = useState(false)
  const [studentFeesFetched, setStudentFeesFetched] = useState(false)
  const [sfSearch, setSfSearch] = useState("")
  const [sfClassFilter, setSfClassFilter] = useState("")
  const [sfStatusFilter, setSfStatusFilter] = useState<"" | "solde" | "partiel" | "impaye">("")
  const [sfAmountThreshold, setSfAmountThreshold] = useState("")
  const [sfAmountMode, setSfAmountMode] = useState<"gte" | "lt">("gte")
  const [sfCurrencyFilter, setSfCurrencyFilter] = useState<"" | "USD" | "CDF">("")
  const [sfTypeFilter, setSfTypeFilter] = useState<string>("")
  const [paymentsTypeFilter, setPaymentsTypeFilter] = useState<string>("")
  const [paymentsYearFilter, setPaymentsYearFilter] = useState<number | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paiementsLoading, setPaiementsLoading] = useState(false)
  const [sfSortKey, setSfSortKey] = useState<"name" | "paid" | "remaining" | "percent" | "class">("name")
  const [sfSortDir, setSfSortDir] = useState<"asc" | "desc">("asc")
  const [sfPage, setSfPage] = useState(1)
  const [exportingPaiements, setExportingPaiements] = useState(false)

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInitialEnrollment, setPaymentInitialEnrollment] = useState<EnrollmentOption | null>(null)
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false)
  const [showCreateTarifModal, setShowCreateTarifModal] = useState(false)
  const [cashierTabInitialized, setCashierTabInitialized] = useState(false)

  // Theme listener
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const token = localStorage.getItem("token")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setIsCashier(payload.role === "CAISSIER")
      } catch { /* ignore */ }
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

  // Charger les paramètres devise (sync avec API + localStorage)
  useEffect(() => {
    const loadSchoolSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          const c = data.currency || "USD"
          const r = Number(data.exchangeRate) || 2800
          setCurrency(c)
          setExchangeRate(r)
          localStorage.setItem("schoolCurrency", c)
          localStorage.setItem("schoolExchangeRate", String(r))
        }
      } catch { /* ignore */ }
    }
    loadSchoolSettings()
    const handleSettingsChange = () => {
      const c = localStorage.getItem("schoolCurrency") as "USD" | "CDF" | null
      const r = localStorage.getItem("schoolExchangeRate")
      if (c) setCurrency(c)
      if (r) setExchangeRate(Number(r))
    }
    window.addEventListener("schoolSettingsChange", handleSettingsChange)
    return () => window.removeEventListener("schoolSettingsChange", handleSettingsChange)
  }, [])

  // Charger les données initiales
  const fetchAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const metaRes = await fetch("/api/admin/meta")
      let resolvedYearId: number | null = null

      if (metaRes.ok) {
        const meta = await metaRes.json()
        resolvedYearId = meta.currentYearId ?? null
        setClasses(meta.classes || [])
        setCurrentYearId(resolvedYearId)
        setYears((meta.years || []).map((y: { id: number; name: string; current: boolean }) => ({
          ...y,
          current: y.id === meta.currentYearId,
        })))
      }

      const yearQs = resolvedYearId ? `?yearId=${resolvedYearId}` : ""
      const [statsRes, typesRes, tarifsRes, paiementsRes] = await Promise.all([
        fetch(`/api/admin/fees/stats${yearQs}`),
        fetch("/api/admin/fees/types"),
        fetch(`/api/admin/fees/tarifications${yearQs}`),
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
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Recharger quand l'année scolaire change dans Paramètres
  useEffect(() => {
    const handleYearChange = () => {
      const stored = localStorage.getItem("schoolCurrentYearId")
      if (stored) setCurrentYearId(Number(stored))
      setLoading(true)
      void fetchAll()
      setStudentFeesFetched(false)
    }
    window.addEventListener("schoolSettingsChange", handleYearChange)
    return () => window.removeEventListener("schoolSettingsChange", handleYearChange)
  }, [fetchAll])

  // Charger les élèves quand l'onglet "students" est actif
  const fetchStudentFees = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setStudentFeesLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentYearId) params.set("yearId", String(currentYearId))
      if (sfTypeFilter) params.set("typeFraisId", sfTypeFilter)
      const qs = params.toString() ? `?${params}` : ""
      const res = await fetch(`/api/admin/fees/students${qs}`)
      if (res.ok) {
        const { data } = await res.json()
        setStudentFees(data)
      }
    } catch (error) {
      console.error("Erreur chargement élèves:", error)
    } finally {
      if (!opts?.silent) setStudentFeesLoading(false)
      setStudentFeesFetched(true)
    }
  }, [currentYearId, sfTypeFilter])

  // Précharger les élèves en arrière-plan pour un onglet « Par élève » plus rapide
  useEffect(() => {
    if (!loading && currentYearId && !studentFeesFetched) {
      void fetchStudentFees()
    }
  }, [loading, currentYearId, studentFeesFetched, fetchStudentFees])

  const fetchPaiements = useCallback(async () => {
    setPaiementsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(paymentsPage),
        pageSize: "20",
      })
      if (paymentsTypeFilter) params.set("typeFraisId", paymentsTypeFilter)
      if (paymentsYearFilter != null) params.set("yearId", String(paymentsYearFilter))
      const res = await fetch(`/api/admin/fees/paiements?${params}`)
      if (res.ok) {
        const result = await res.json()
        setPaiements(result.data)
        setPaiementsPagination(result.pagination)
      }
    } catch (error) {
      console.error("Erreur chargement paiements:", error)
    } finally {
      setPaiementsLoading(false)
    }
  }, [paymentsTypeFilter, paymentsYearFilter, paymentsPage])

  const refreshFeesData = useCallback(async () => {
    await fetchAll({ silent: true })
    await fetchStudentFees({ silent: true })
    if (activeTab === "payments") {
      await fetchPaiements()
    }
  }, [fetchAll, fetchStudentFees, fetchPaiements, activeTab])

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudentFees()
    }
  }, [activeTab, currentYearId, sfTypeFilter, fetchStudentFees])

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPaiements()
    }
  }, [activeTab, paymentsTypeFilter, paymentsYearFilter, paymentsPage, fetchPaiements])

  const applyPaymentsYearFilter = (yearId: number | null) => {
    setPaiements([])
    setPaymentsPage(1)
    setPaymentsYearFilter(yearId)
  }

  const applyPaymentsTypeFilter = (typeId: string) => {
    setPaiements([])
    setPaymentsPage(1)
    setPaymentsTypeFilter(typeId)
  }

  useEffect(() => {
    setSfPage(1)
  }, [sfSearch, sfClassFilter, sfStatusFilter, sfAmountThreshold, sfAmountMode, sfCurrencyFilter, sfTypeFilter, sfSortKey, sfSortDir])

  const sortedClasses = sortClasses(classes)

  const studentRowToEnrollment = (row: StudentFeeRow): EnrollmentOption => ({
    enrollmentId: row.enrollmentId,
    studentId: row.studentId,
    studentName: `${row.lastName} ${row.middleName} ${row.firstName}`.trim(),
    studentCode: row.code,
    classId: row.classId,
    className: row.className,
    yearId: currentYearId ?? 0,
    yearName: years.find((y) => y.id === currentYearId)?.name ?? "",
  })

  const openPaymentModal = (enrollment?: EnrollmentOption | null) => {
    setPaymentInitialEnrollment(enrollment ?? null)
    setShowPaymentModal(true)
  }

  // Filtrer et trier les élèves
  const filteredStudentFees = (() => {
    let list = [...studentFees]

    // Recherche par nom/code
    if (sfSearch.trim()) {
      const q = sfSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.lastName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          s.middleName.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      )
    }

    // Filtre par classe
    if (sfClassFilter) {
      list = list.filter((s) => s.classId === parseInt(sfClassFilter))
    }

    // Filtre par statut
    if (sfStatusFilter) {
      list = list.filter((s) => s.status === sfStatusFilter)
    }

    // Filtre par devise (USD / CDF selon la classe)
    if (sfCurrencyFilter) {
      list = list.filter((s) => getStudentPrimaryCurrency(s) === sfCurrencyFilter)
    }

    // Filtre par montant seuil (dans la devise sélectionnée ou celle de la classe)
    if (sfAmountThreshold) {
      const threshold = parseFloat(sfAmountThreshold)
      if (!isNaN(threshold)) {
        list = list.filter((s) => {
          const currency = getStudentAmountCurrency(s, sfCurrencyFilter)
          if (!currency) return false
          const paid = getStudentPaidInCurrency(s, currency)
          return sfAmountMode === "gte" ? paid >= threshold : paid < threshold
        })
      }
    }

    // Tri
    list.sort((a, b) => {
      let cmp = 0
      switch (sfSortKey) {
        case "name":
          cmp = a.lastName.localeCompare(b.lastName)
          break
        case "paid": {
          const curA = getStudentAmountCurrency(a, sfCurrencyFilter)
          const curB = getStudentAmountCurrency(b, sfCurrencyFilter)
          const paidA = curA ? getStudentPaidInCurrency(a, curA) : getStudentPrimaryPaid(a)
          const paidB = curB ? getStudentPaidInCurrency(b, curB) : getStudentPrimaryPaid(b)
          cmp = paidA - paidB
          break
        }
        case "remaining": {
          const curA = getStudentAmountCurrency(a, sfCurrencyFilter)
          const curB = getStudentAmountCurrency(b, sfCurrencyFilter)
          const remA = curA ? getStudentRemainingInCurrency(a, curA) : getStudentPrimaryRemaining(a)
          const remB = curB ? getStudentRemainingInCurrency(b, curB) : getStudentPrimaryRemaining(b)
          cmp = remA - remB
          break
        }
        case "percent":
          cmp = getStudentPercent(a) - getStudentPercent(b)
          break
        case "class": {
          const classA = classes.find((c) => c.id === a.classId)
          const classB = classes.find((c) => c.id === b.classId)
          if (classA && classB) cmp = compareClasses(classA, classB)
          else cmp = a.className.localeCompare(b.className)
          break
        }
      }
      return sfSortDir === "asc" ? cmp : -cmp
    })

    return list
  })()

  const sfTotalPages = Math.max(1, Math.ceil(filteredStudentFees.length / SF_PAGE_SIZE))
  const paginatedStudentFees = filteredStudentFees.slice(
    (sfPage - 1) * SF_PAGE_SIZE,
    sfPage * SF_PAGE_SIZE
  )

  // Export Excel (CSV UTF-8 avec BOM pour Excel)
  const exportStudentsExcel = () => {
    const rows = filteredStudentFees
    if (rows.length === 0) return

    const headers = ["Code", "Nom", "Post-nom", "Prénom", "Sexe", "Classe", "Attendu USD ($)", "Payé USD ($)", "Reste USD ($)", "Attendu CDF (FC)", "Payé CDF (FC)", "Reste CDF (FC)", "Statut", "Nb Paiements", "Dernier Paiement"]
    const csvRows = [headers.join(";")]

    for (const r of rows) {
      csvRows.push([
        r.code,
        r.lastName,
        r.middleName,
        r.firstName,
        r.gender === "M" ? "Masculin" : "Féminin",
        r.className,
        r.usd.expected,
        r.usd.paid,
        r.usd.remaining,
        r.cdf.expected,
        r.cdf.paid,
        r.cdf.remaining,
        r.status === "solde" ? "Soldé" : r.status === "partiel" ? "Partiel" : "Impayé",
        r.paymentCount,
        r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString("fr-FR") : "—",
      ].join(";"))
    }

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `frais-par-eleve-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPaiementsExcel = async () => {
    setExportingPaiements(true)
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "10000" })
      if (paymentsTypeFilter) params.set("typeFraisId", paymentsTypeFilter)
      if (paymentsYearFilter != null) params.set("yearId", String(paymentsYearFilter))
      const res = await fetch(`/api/admin/fees/paiements?${params}`)
      if (!res.ok) return
      const { data } = await res.json() as { data: PaiementRecord[] }
      if (!data?.length) return

      const headers = ["N° Reçu", "Nom", "Prénom", "Code", "Classe", "Année scolaire", "Type de frais", "Montant", "Devise", "Date", "Mode", "Référence", "Statut"]
      const csvRows = [headers.join(";")]

      for (const p of data) {
        csvRows.push([
          p.numeroRecu,
          p.student.lastName,
          p.student.firstName,
          p.student.code,
          p.enrollment.class.name,
          p.tarification.year.name,
          p.tarification.typeFrais.nom,
          p.montant,
          p.tarification.devise,
          new Date(p.datePaiement).toLocaleDateString("fr-FR"),
          getModePaiementLabel(p.modePaiement),
          p.reference || "",
          p.isAnnule ? "Annulé" : "Valide",
        ].join(";"))
      }

      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `historique-paiements-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur export paiements:", error)
    } finally {
      setExportingPaiements(false)
    }
  }

  // Couleurs thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
  const hoverRow = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
  const headerBg = theme === "dark" ? "bg-gray-700" : "bg-gray-50"

  const formatStudentAmounts = (row: StudentFeeRow, field: "paid" | "remaining") => {
    const parts: string[] = []
    if (row.usd.expected > 0) {
      parts.push(formatMontant(row.usd[field], "USD"))
    }
    if (row.cdf.expected > 0) {
      parts.push(formatMontant(row.cdf[field], "CDF"))
    }
    if (parts.length === 0) return "—"
    return parts.join(" + ")
  }

  const getStudentPercent = (row: StudentFeeRow) => {
    if (row.usd.expected > 0 && row.cdf.expected === 0) return row.usd.percent
    if (row.cdf.expected > 0 && row.usd.expected === 0) return row.cdf.percent
    if (row.usd.expected > 0 && row.cdf.expected > 0) {
      return Math.round((row.usd.percent + row.cdf.percent) / 2)
    }
    return 0
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getModePaiementLabel = (mode: string) => {
    return MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode
  }

  const paymentTypeFilters = useMemo(() => {
    const filters: { id: string; label: string }[] = [{ id: "", label: "Tous les types de frais" }]
    for (const t of typesFrais.filter((x) => x.isActive)) {
      filters.push({
        id: String(t.id),
        label: t.isDefault ? `${t.nom} (défaut)` : t.nom,
      })
    }
    return filters
  }, [typesFrais])

  const paymentYearFilters = useMemo(() => {
    const filters: { id: number | null; label: string }[] = [
      { id: null, label: "Toute l'historique" },
    ]
    const current = years.find((y) => y.id === currentYearId)
    if (!current) return filters
    filters.push({
      id: current.id,
      label: formatAcademicYearOptionLabel(current.name, true),
    })
    const parsed = parseSchoolYearLabel(current.name)
    if (parsed) {
      const nextLabel = `${parsed.endYear}-${parsed.endYear + 1}`
      const next = years.find((y) => y.name === nextLabel)
      if (next && next.id !== current.id) {
        filters.push({ id: next.id, label: next.name })
      }
    }
    return filters
  }, [years, currentYearId])

  const paiementsGrouped = useMemo(() => {
    const groups = new Map<
      string,
      {
        title: string
        sidebar: ReturnType<typeof formatDateSidebar>
        items: PaiementRecord[]
      }
    >()
    for (const p of paiements) {
      const sidebar = formatDateSidebar(p.datePaiement)
      const title = formatRelativeDateLabel(p.datePaiement)
      if (!groups.has(sidebar.groupKey)) {
        groups.set(sidebar.groupKey, { title, sidebar, items: [] })
      }
      groups.get(sidebar.groupKey)!.items.push(p)
    }
    return Array.from(groups.values())
  }, [paiements])

  const getStudentInitials = (p: PaiementRecord) => {
    const a = p.student.firstName?.[0] ?? ""
    const b = p.student.lastName?.[0] ?? ""
    return `${b}${a}`.toUpperCase()
  }

  const tabs = [
    { key: "overview", label: "Vue d'ensemble", icon: TrendingUp },
    { key: "types", label: "Types de frais", icon: FileText },
    { key: "tarifications", label: "Tarifications", icon: Wallet },
    { key: "students", label: "Par élève", icon: Users },
    { key: "payments", label: "Paiements", icon: Receipt },
  ].filter((tab) => !(isCashier && tab.key === "tarifications"))

  useEffect(() => {
    if (isCashier && activeTab === "tarifications") {
      setActiveTab("overview")
    }
  }, [isCashier, activeTab])

  useEffect(() => {
    if (isCashier && !cashierTabInitialized) {
      setActiveTab("students")
      setCashierTabInitialized(true)
    }
  }, [isCashier, cashierTabInitialized])

  const percentPaidUsd = stats ? Math.round((stats.usd.totalCollected / Math.max(stats.usd.totalExpected, 1)) * 100) : 0
  const percentPaidCdf = stats ? Math.round((stats.cdf.totalCollected / Math.max(stats.cdf.totalExpected, 1)) * 100) : 0
  const hasUsd = stats ? stats.usd.totalExpected > 0 : false
  const hasCdf = stats ? stats.cdf.totalExpected > 0 : false
  const configuredTarifCount =
    stats?.tarificationCount ??
    stats?.feeTypesSummary?.reduce((sum, t) => sum + t.tarificationCount, 0) ??
    stats?.tarificationsSummary?.length ??
    0
  const studentsWithoutTarif = stats?.studentsWithoutTarif ?? 0
  const isInitialLoad = loading && !stats
  const isRefreshing = loading && !!stats
  const showTabSkeleton = isInitialLoad || isRefreshing

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
            <p className={`${textSecondary} mt-1`}>
              {isCashier ? "Encaissement et suivi des paiements" : "Gestion des frais et paiements des élèves"}
              {currentYearId && years.find((y) => y.id === currentYearId) && (
                <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                  Année {formatAcademicYearOptionLabel(years.find((y) => y.id === currentYearId)!.name, true)}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => openPaymentModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/25 text-sm md:text-base font-medium"
            >
              <DollarSign className="w-4 h-4" />
              <span className="md:hidden">Paiement</span>
              <span className="hidden md:inline">Enregistrer un paiement</span>
            </button>
            {!isCashier && (
            <button
              onClick={() => setShowCreateTypeModal(true)}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau type de frais
            </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {isInitialLoad ? (
          <FeesStatsSkeleton theme={theme} isCashier={isCashier} />
        ) : stats ? (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCashier ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4 transition-opacity ${isRefreshing ? "opacity-50" : ""}`}>
            {isCashier && stats.dailyCollected && (
            <Card theme={theme} className="relative overflow-hidden border-green-500/30">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Total du jour</p>
                    {stats.dailyCollected.usd > 0 && (
                      <p className="text-lg font-bold text-green-500 mt-0.5">{formatMontant(stats.dailyCollected.usd, "USD")}</p>
                    )}
                    {stats.dailyCollected.cdf > 0 && (
                      <p className={`text-lg font-bold text-green-500 ${stats.dailyCollected.usd > 0 ? "" : "mt-0.5"}`}>
                        {formatMontant(stats.dailyCollected.cdf, "CDF")}
                      </p>
                    )}
                    {stats.dailyCollected.usd === 0 && stats.dailyCollected.cdf === 0 && (
                      <p className={`text-lg font-bold ${textColor} mt-0.5`}>0</p>
                    )}
                    <p className={`text-[10px] ${textSecondary} mt-1`}>
                      {stats.dailyCollected.count} paiement{stats.dailyCollected.count !== 1 ? "s" : ""} aujourd&apos;hui
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
            {!isCashier && (
            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Total attendu (frais scolaire)</p>
                    {hasUsd && <p className={`text-lg font-bold ${textColor} mt-0.5`}>{formatMontant(stats.usd.totalExpected, "USD")}</p>}
                    {hasCdf && <p className={`text-lg font-bold ${textColor} ${hasUsd ? "mt-0" : "mt-0.5"}`}>{formatMontant(stats.cdf.totalExpected, "CDF")}</p>}
                    {!hasUsd && !hasCdf && <p className={`text-lg font-bold ${textColor} mt-0.5`}>—</p>}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              </CardContent>
            </Card>
            )}

            {!isCashier && (
            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/15 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Total perçu (frais scolaire)</p>
                    {hasUsd && (
                      <div>
                        <p className="text-lg font-bold text-green-500 mt-0.5">{formatMontant(stats.usd.totalCollected, "USD")}</p>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className={textSecondary}>Progression USD</span>
                          <span className="text-green-500 font-semibold">{percentPaidUsd}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percentPaidUsd}%` }} />
                        </div>
                      </div>
                    )}
                    {hasCdf && (
                      <div className={hasUsd ? "mt-2" : ""}>
                        <p className={`text-lg font-bold text-green-500 ${hasUsd ? "" : "mt-0.5"}`}>{formatMontant(stats.cdf.totalCollected, "CDF")}</p>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className={textSecondary}>Progression CDF</span>
                          <span className="text-green-500 font-semibold">{percentPaidCdf}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percentPaidCdf}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            <Card theme={theme} className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/15 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>En attente (frais scolaire)</p>
                    {hasUsd && <p className={`text-lg font-bold text-orange-500 mt-0.5`}>{formatMontant(stats.usd.totalPending, "USD")}</p>}
                    {hasCdf && <p className={`text-lg font-bold text-orange-500 ${hasUsd ? "" : "mt-0.5"}`}>{formatMontant(stats.cdf.totalPending, "CDF")}</p>}
                    {!hasUsd && !hasCdf && <p className={`text-lg font-bold text-orange-500 mt-0.5`}>—</p>}
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
                    <p className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Élèves à jour (frais scolaire)</p>
                    <p className={`text-xl font-bold ${textColor} mt-0.5`}>
                      {Math.max(stats.usd.studentsFullyPaid, stats.cdf.studentsFullyPaid)}
                      <span className={`text-sm font-normal ${textSecondary}`}> / {stats.totalStudents}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {hasUsd && (
                    <>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-600 dark:text-green-400">
                        {stats.usd.studentsFullyPaid} soldés $
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                        {stats.usd.studentsPartiallyPaid} partiels $
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
                        {stats.usd.studentsUnpaid} impayés $
                      </span>
                    </>
                  )}
                  {hasCdf && (
                    <>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-600 dark:text-green-400">
                        {stats.cdf.studentsFullyPaid} soldés FC
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                        {stats.cdf.studentsPartiallyPaid} partiels FC
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-600 dark:text-red-400">
                        {stats.cdf.studentsUnpaid} impayés FC
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {stats && stats.totalStudents > 0 && configuredTarifCount === 0 && !isCashier && (
          <div
            className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              theme === "dark"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Aucune tarification pour {years.find((y) => y.id === currentYearId)?.name ?? "cette année"}</p>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-amber-100/80" : "text-amber-800"}`}>
                  {stats.totalStudents} élève{stats.totalStudents > 1 ? "s" : ""} inscrit{stats.totalStudents > 1 ? "s" : ""}, mais aucun tarif n&apos;a encore été créé pour cette année.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("tarifications")}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Configurer les tarifs
            </button>
          </div>
        )}

        {stats && stats.totalStudents > 0 && configuredTarifCount > 0 && studentsWithoutTarif > 0 && !isCashier && (
          <div
            className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              theme === "dark"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  {configuredTarifCount} tarification{configuredTarifCount > 1 ? "s" : ""} créée{configuredTarifCount > 1 ? "s" : ""}, mais {studentsWithoutTarif} élève{studentsWithoutTarif > 1 ? "s" : ""} sans tarif applicable
                </p>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-blue-100/80" : "text-blue-800"}`}>
                  Les totaux restent à 0 tant que les élèves inscrits ne sont pas dans une classe tarifée.
                  Ajoutez une tarification pour leurs classes ou réinscrivez-les dans une classe déjà configurée.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("tarifications")}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Voir les tarifications
            </button>
          </div>
        )}

        {/* Onglets */}
        <div className={`flex items-center gap-1 border-b ${borderColor} overflow-x-auto scrollbar-hide`}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors whitespace-nowrap ${
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
        {showTabSkeleton ? (
          <FeesTabSkeleton tab={activeTab} theme={theme} />
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
                    <p className={`text-xs ${textSecondary} mt-1`}>Frais scolaire uniquement</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {(() => {
                        const items: { label: string; count: number; color: string; textColor: string }[] = []
                        if (hasUsd && stats) {
                          items.push(
                            { label: hasCdf ? "Soldés $" : "Soldés", count: stats.usd.studentsFullyPaid, color: "bg-green-500", textColor: "text-green-500" },
                            { label: hasCdf ? "Partiels $" : "Partiels", count: stats.usd.studentsPartiallyPaid, color: "bg-yellow-500", textColor: "text-yellow-500" },
                            { label: hasCdf ? "Impayés $" : "Impayés", count: stats.usd.studentsUnpaid, color: "bg-red-500", textColor: "text-red-500" },
                          )
                        }
                        if (hasCdf && stats) {
                          items.push(
                            { label: hasUsd ? "Soldés FC" : "Soldés", count: stats.cdf.studentsFullyPaid, color: "bg-green-500", textColor: "text-green-500" },
                            { label: hasUsd ? "Partiels FC" : "Partiels", count: stats.cdf.studentsPartiallyPaid, color: "bg-yellow-500", textColor: "text-yellow-500" },
                            { label: hasUsd ? "Impayés FC" : "Impayés", count: stats.cdf.studentsUnpaid, color: "bg-red-500", textColor: "text-red-500" },
                          )
                        }
                        if (items.length === 0) {
                          items.push(
                            { label: "Soldés", count: 0, color: "bg-green-500", textColor: "text-green-500" },
                            { label: "Partiels", count: 0, color: "bg-yellow-500", textColor: "text-yellow-500" },
                            { label: "Impayés", count: 0, color: "bg-red-500", textColor: "text-red-500" },
                          )
                        }
                        return items.map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-sm font-medium ${textSecondary}`}>{item.label}</span>
                              <span className={`text-sm font-bold ${item.textColor}`}>{item.count} élèves</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div
                                className={`${item.color} h-2.5 rounded-full transition-all duration-700`}
                                style={{ width: `${Math.max((item.count / Math.max(stats?.totalStudents ?? 1, 1)) * 100, item.count > 0 ? 4 : 0)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      })()}
                    </div>

                    {/* Résumé par type de frais (vue compacte) */}
                    {(stats.feeTypesSummary?.length ?? 0) > 0 && (
                      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                        <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Synthèse par type de frais</h4>
                        <div className="space-y-2">
                          {stats.feeTypesSummary!.map((t) => {
                            const totalAttendu = t.usd.totalExpected + t.cdf.totalExpected
                            const totalPercu = t.usd.totalCollected + t.cdf.totalCollected
                            const pct = Math.round((totalPercu / Math.max(totalAttendu, 1)) * 100)
                            return (
                              <div key={t.typeFraisId} className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-medium ${textColor}`}>
                                    {t.typeFrais}
                                    {t.isDefault && (
                                      <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                        Par défaut
                                      </span>
                                    )}
                                  </span>
                                  <span className={`text-xs ${textSecondary}`}>{pct}%</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                                  <span className={textSecondary}>{t.tarificationCount} tarif{t.tarificationCount > 1 ? "s" : ""}</span>
                                  <span className={textSecondary}>
                                    {t.usd.totalExpected > 0 && `${formatMontant(t.usd.totalCollected, "USD")} / ${formatMontant(t.usd.totalExpected, "USD")}`}
                                    {t.usd.totalExpected > 0 && t.cdf.totalExpected > 0 && " · "}
                                    {t.cdf.totalExpected > 0 && `${formatMontant(t.cdf.totalCollected, "CDF")} / ${formatMontant(t.cdf.totalExpected, "CDF")}`}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                  <div className={`${t.isDefault ? "bg-indigo-500" : "bg-violet-500"} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
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
                          onClick={() => openPaymentModal()}
                          className="mt-3 text-sm text-indigo-500 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                        >
                          Enregistrer le premier paiement <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats.recentPayments.slice(0, OVERVIEW_RECENT_PAYMENTS_LIMIT).map((payment) => (
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
                              <p className="text-sm font-bold text-green-500">+{formatMontant(payment.montant, payment.devise)}</p>
                              <p className={`text-xs ${textSecondary}`}>{formatDate(payment.datePaiement)}</p>
                            </div>
                          </div>
                        ))}
                        {stats.recentPayments.length > OVERVIEW_RECENT_PAYMENTS_LIMIT && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("payments")}
                            className="w-full mt-2 py-2 text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                          >
                            Voir tous les paiements ({stats.recentPayments.length})
                          </button>
                        )}
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
                      <p className={`text-sm ${textSecondary} mt-1`}>Commencez par créer un type de frais pour pouvoir configurer les tarifications</p>
                      {!isCashier && (
                      <button
                        onClick={() => setShowCreateTypeModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Créer un type de frais
                      </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={headerBg}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Nom</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Description</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Tarifications</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Statut</th>
                            {!isCashier && (
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                          {typesFrais.map((t) => (
                            <tr key={t.id} className={hoverRow}>
                              <td className={`px-4 py-3 ${textColor} font-medium`}>
                                {t.nom}
                                {t.isDefault && (
                                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                    Par défaut
                                  </span>
                                )}
                              </td>
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
                              {!isCashier && (
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
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* === TARIFICATIONS (Grille tarifaire par classe) === */}
            {activeTab === "tarifications" && !isCashier && (
              <TarificationsTab
                theme={theme}
                tarifications={tarifications}
                typesFrais={typesFrais}
                classes={classes}
                years={years}
                activeYearId={currentYearId}
                textColor={textColor}
                textSecondary={textSecondary}
                borderColor={borderColor}
                headerBg={headerBg}
                hoverRow={hoverRow}
                onCreateTarif={() => setShowCreateTarifModal(true)}
                onRefresh={fetchAll}
              />
            )}

            {/* === PAIEMENTS === */}
            {activeTab === "payments" && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide md:flex-wrap">
                          {paymentYearFilters.map((f) => {
                            const active = paymentsYearFilter === f.id
                            return (
                              <button
                                key={f.id ?? "all"}
                                type="button"
                                onClick={() => applyPaymentsYearFilter(f.id)}
                                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  active
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : theme === "dark"
                                      ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25"
                                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                }`}
                              >
                                {f.label}
                                {active && f.id != null && (
                                  <X
                                    className="w-3.5 h-3.5 opacity-80"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      applyPaymentsYearFilter(null)
                                    }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide md:flex-wrap">
                          {paymentTypeFilters.map((f) => {
                            const active = paymentsTypeFilter === f.id
                            return (
                              <button
                                key={f.id || "all-types"}
                                type="button"
                                onClick={() => applyPaymentsTypeFilter(f.id)}
                                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  active
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : theme === "dark"
                                      ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25"
                                      : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                }`}
                              >
                                {f.label}
                                {active && f.id !== "" && (
                                  <X
                                    className="w-3.5 h-3.5 opacity-80"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      applyPaymentsTypeFilter("")
                                    }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={exportPaiementsExcel}
                        disabled={exportingPaiements}
                        title="Télécharger l'historique en Excel"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
                      >
                        {exportingPaiements ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Excel
                      </button>
                    </div>

                    {paiementsLoading ? (
                      <div className="space-y-6" aria-live="polite" aria-busy="true">
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          <span className={`text-sm ${textSecondary}`}>Chargement des paiements…</span>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-4 sm:gap-6 animate-pulse">
                            <div className="w-12 sm:w-14 shrink-0">
                              <div className={`h-8 w-10 mx-auto rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                            </div>
                            <div className={`flex-1 rounded-2xl border ${borderColor} p-4 space-y-3`}>
                              <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full shrink-0 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                                <div className="flex-1 space-y-2">
                                  <div className={`h-4 w-2/3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                                  <div className={`h-3 w-1/2 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                                </div>
                                <div className={`h-5 w-16 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : paiements.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
                        <p className={`text-lg font-medium ${textColor}`}>Aucun paiement</p>
                        <p className={`text-sm ${textSecondary} mt-1`}>
                          {paymentsYearFilter != null || paymentsTypeFilter
                            ? "Aucun résultat pour ces filtres"
                            : "Les paiements enregistrés apparaîtront ici"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {paiementsGrouped.map((group) => (
                          <div key={group.sidebar.groupKey} className="flex gap-3 sm:gap-6">
                            <div className="w-8 sm:w-14 shrink-0 text-left sm:text-center pt-1">
                              <p className={`text-base sm:text-2xl font-bold leading-none ${textColor}`}>
                                {group.sidebar.primary}
                              </p>
                              {group.sidebar.secondary && (
                                <p className={`text-[10px] sm:text-xs font-medium uppercase mt-0.5 sm:mt-1 ${textSecondary}`}>
                                  {group.sidebar.secondary}
                                </p>
                              )}
                            </div>
                            <div className={`flex-1 rounded-2xl border ${borderColor} ${cardBg} shadow-sm overflow-hidden`}>
                              <div className={`px-4 py-2 border-b ${borderColor} ${headerBg}`}>
                                <p className={`text-xs font-semibold ${textSecondary}`}>{group.title}</p>
                              </div>
                              <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                                {group.items.map((p) => (
                                  <div key={p.id} className={`flex items-start gap-3 p-3 sm:p-4 ${hoverRow}`}>
                                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 items-center justify-center text-xs font-bold shrink-0">
                                      {getStudentInitials(p)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-semibold ${textColor} truncate`}>
                                        {p.student.lastName} {p.student.firstName}
                                      </p>
                                      <p className={`text-xs ${textSecondary} mt-0.5 truncate`}>
                                        {p.tarification.typeFrais.nom}
                                      </p>
                                      <p className={`hidden sm:block text-xs ${textSecondary} mt-0.5`}>
                                        {formatTimeLabel(p.datePaiement)} · {p.enrollment.class.name} · {p.tarification.year.name}
                                      </p>
                                      <p className={`hidden sm:block text-xs ${textSecondary} mt-0.5`}>
                                        {getModePaiementLabel(p.modePaiement)} ·{" "}
                                        <span className="font-mono">{p.numeroRecu}</span>
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 space-y-1">
                                      <p className="text-sm font-bold text-green-500">
                                        {formatMontant(p.montant, p.tarification.devise)}
                                      </p>
                                      {p.isAnnule ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                          <X className="w-3 h-3" /> Annulé
                                        </span>
                                      ) : (
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                          <Check className="w-3 h-3" /> Valide
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        {paiementsPagination.totalPages > 1 && (
                          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${borderColor}`}>
                            <p className={`text-sm ${textSecondary}`}>
                              {paiementsPagination.total} paiement{paiementsPagination.total > 1 ? "s" : ""} · page {paiementsPagination.page} / {paiementsPagination.totalPages}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={paymentsPage <= 1}
                                onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                                className={`p-2 rounded-lg border ${borderColor} disabled:opacity-40 ${hoverRow}`}
                                aria-label="Page précédente"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              {Array.from({ length: Math.min(paiementsPagination.totalPages, 5) }, (_, i) => {
                                const start = Math.max(
                                  1,
                                  Math.min(paymentsPage - 2, paiementsPagination.totalPages - 4)
                                )
                                const pageNum = start + i
                                if (pageNum > paiementsPagination.totalPages) return null
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setPaymentsPage(pageNum)}
                                    className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                                      pageNum === paymentsPage
                                        ? "bg-indigo-600 text-white"
                                        : `${borderColor} border ${hoverRow} ${textSecondary}`
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                )
                              })}
                              <button
                                type="button"
                                disabled={paymentsPage >= paiementsPagination.totalPages}
                                onClick={() => setPaymentsPage((p) => Math.min(paiementsPagination.totalPages, p + 1))}
                                className={`p-2 rounded-lg border ${borderColor} disabled:opacity-40 ${hoverRow}`}
                                aria-label="Page suivante"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* === PAR ÉLÈVE === */}
            {activeTab === "students" && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  {studentFeesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : studentFeesFetched && studentFees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Users className={`w-12 h-12 ${textSecondary} opacity-40`} />
                      <p className={`text-base font-medium ${textSecondary}`}>Aucun élève inscrit pour cette année scolaire</p>
                      <p className={`text-sm ${textSecondary} opacity-70`}>Inscrivez des élèves pour voir leurs informations de paiement ici.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Barre de filtres */}
                      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
                        {/* Recherche */}
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                          <input
                            type="text"
                            placeholder="Rechercher un élève..."
                            value={sfSearch}
                            onChange={(e) => setSfSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-xl border ${inputBg} ${textColor} text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                          />
                        </div>

                        {/* Filtre classe */}
                        <select
                          value={sfClassFilter}
                          onChange={(e) => setSfClassFilter(e.target.value)}
                          className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[180px] max-w-[280px]`}
                        >
                          <option value="">Toutes les classes</option>
                          {SECTION_ORDER.map((section) => {
                            const sectionClasses = sortedClasses.filter((c) => c.section === section)
                            if (sectionClasses.length === 0) return null
                            return (
                              <optgroup key={section} label={SECTION_LABELS[section] ?? section}>
                                {sectionClasses.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </optgroup>
                            )
                          })}
                        </select>

                        {/* Filtre type de frais */}
                        <select
                          value={sfTypeFilter}
                          onChange={(e) => setSfTypeFilter(e.target.value)}
                          className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[200px]`}
                        >
                          <option value="">Frais scolaire (défaut)</option>
                          <option value="all">Tous les types combinés</option>
                          {typesFrais.filter((t) => t.isActive && !t.isDefault).map((t) => (
                            <option key={t.id} value={t.id}>{t.nom}</option>
                          ))}
                        </select>

                        {/* Filtre statut */}
                        <select
                          value={sfStatusFilter}
                          onChange={(e) => setSfStatusFilter(e.target.value as typeof sfStatusFilter)}
                          className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[130px]`}
                        >
                          <option value="">Tous les statuts</option>
                          <option value="solde">Soldé</option>
                          <option value="partiel">Partiel</option>
                          <option value="impaye">Impayé</option>
                        </select>

                        {/* Filtre montant + devise */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className={`inline-flex rounded-xl border ${borderColor} overflow-hidden shrink-0`}>
                            {([
                              { value: "" as const, label: "Tous" },
                              { value: "USD" as const, label: "$" },
                              { value: "CDF" as const, label: "FC" },
                            ]).map((opt) => (
                              <button
                                key={opt.value || "all"}
                                type="button"
                                onClick={() => setSfCurrencyFilter(opt.value)}
                                className={`px-3 py-2 text-xs font-medium transition-colors ${
                                  sfCurrencyFilter === opt.value
                                    ? "bg-indigo-600 text-white"
                                    : `${textSecondary} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`
                                }`}
                                title={opt.value === "" ? "Toutes les devises" : opt.value === "USD" ? "Élèves en dollars" : "Élèves en francs congolais"}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <select
                            value={sfAmountMode}
                            onChange={(e) => setSfAmountMode(e.target.value as "gte" | "lt")}
                            className={`px-2 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}
                          >
                            <option value="gte">Payé ≥</option>
                            <option value="lt">Payé &lt;</option>
                          </select>
                          <input
                            type="number"
                            placeholder={sfCurrencyFilter === "USD" ? "Montant $" : sfCurrencyFilter === "CDF" ? "Montant FC" : "Montant"}
                            value={sfAmountThreshold}
                            onChange={(e) => setSfAmountThreshold(e.target.value)}
                            className={`w-[110px] px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}
                            title="Filtre selon le montant payé dans la devise sélectionnée"
                          />
                        </div>

                        {/* Bouton export */}
                        <button
                          onClick={exportStudentsExcel}
                          disabled={filteredStudentFees.length === 0}
                          title="Télécharger en Excel"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Excel
                        </button>
                      </div>

                      {/* Résumé rapide */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} ${textSecondary}`}>
                          {filteredStudentFees.length} élève{filteredStudentFees.length > 1 ? "s" : ""}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {filteredStudentFees.filter((s) => s.status === "solde").length} soldé{filteredStudentFees.filter((s) => s.status === "solde").length > 1 ? "s" : ""}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          {filteredStudentFees.filter((s) => s.status === "partiel").length} partiel{filteredStudentFees.filter((s) => s.status === "partiel").length > 1 ? "s" : ""}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          {filteredStudentFees.filter((s) => s.status === "impaye").length} impayé{filteredStudentFees.filter((s) => s.status === "impaye").length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Tableau */}
                      {filteredStudentFees.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
                          <p className={`text-lg font-medium ${textColor}`}>Aucun élève trouvé</p>
                          <p className={`text-sm ${textSecondary} mt-1`}>Modifiez les filtres pour afficher des résultats</p>
                        </div>
                      ) : (
                        <div className={`overflow-x-auto rounded-xl border ${borderColor}`}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className={headerBg}>
                                {[
                                  { key: "name" as const, label: "Élève" },
                                  { key: "class" as const, label: "Classe" },
                                  { key: "paid" as const, label: "Payé" },
                                  { key: "remaining" as const, label: "Reste" },
                                  { key: "percent" as const, label: "Progression" },
                                ].map((col) => (
                                  <th
                                    key={col.key}
                                    onClick={() => {
                                      if (sfSortKey === col.key) {
                                        setSfSortDir(sfSortDir === "asc" ? "desc" : "asc")
                                      } else {
                                        setSfSortKey(col.key)
                                        setSfSortDir("asc")
                                      }
                                    }}
                                    className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase cursor-pointer select-none hover:text-indigo-500 transition-colors`}
                                  >
                                    <span className="inline-flex items-center gap-1">
                                      {col.label}
                                      <ArrowUpDown className={`w-3 h-3 ${sfSortKey === col.key ? "text-indigo-500" : "opacity-30"}`} />
                                    </span>
                                  </th>
                                ))}
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Statut</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Nb Paie.</th>
                                <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Action</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${borderColor}`}>
                              {paginatedStudentFees.map((s) => (
                                <tr key={s.studentId} className={`${hoverRow} transition-colors`}>
                                  <td className={`px-4 py-3 ${textColor}`}>
                                    <div className="font-medium">{s.lastName} {s.middleName} {s.firstName}</div>
                                    <div className={`text-xs ${textSecondary}`}>{s.code}</div>
                                  </td>
                                  <td className={`px-4 py-3 ${textSecondary}`}>{s.className}</td>
                                  <td className={`px-4 py-3 font-medium ${textColor}`}>{formatStudentAmounts(s, "paid")}</td>
                                  <td className={`px-4 py-3 font-medium ${getStudentPrimaryRemaining(s) > 0 ? "text-red-500" : "text-green-500"}`}>
                                    {formatStudentAmounts(s, "remaining")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-20 h-2 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                                        <div
                                          className={`h-full rounded-full ${
                                            getStudentPercent(s) >= 100 ? "bg-green-500" : getStudentPercent(s) >= 50 ? "bg-orange-400" : "bg-red-400"
                                          }`}
                                          style={{ width: `${Math.min(getStudentPercent(s), 100)}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-medium ${textSecondary}`}>{getStudentPercent(s)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                        s.status === "solde"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                          : s.status === "partiel"
                                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      }`}
                                    >
                                      {s.status === "solde" ? (
                                        <><CheckCircle className="w-3 h-3" /> Soldé</>
                                      ) : s.status === "partiel" ? (
                                        <><Clock className="w-3 h-3" /> Partiel</>
                                      ) : (
                                        <><AlertCircle className="w-3 h-3" /> Impayé</>
                                      )}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-center ${textSecondary}`}>{s.paymentCount}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/admin/students/${s.studentId}`)}
                                        className={`inline-flex items-center justify-center p-1.5 rounded-lg border ${borderColor} ${textSecondary} hover:text-indigo-600 hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors`}
                                        title="Voir la fiche élève"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openPaymentModal(studentRowToEnrollment(s))}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                                        title="Enregistrer un paiement pour cet élève"
                                      >
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Payer
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {filteredStudentFees.length > 0 && sfTotalPages > 1 && (
                        <div className={`flex items-center justify-between pt-4 border-t ${borderColor}`}>
                          <p className={`text-sm ${textSecondary}`}>
                            {(sfPage - 1) * SF_PAGE_SIZE + 1}–{Math.min(sfPage * SF_PAGE_SIZE, filteredStudentFees.length)} sur {filteredStudentFees.length} élève{filteredStudentFees.length > 1 ? "s" : ""}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSfPage((p) => Math.max(1, p - 1))}
                              disabled={sfPage <= 1}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Préc.
                            </button>
                            <span className={`text-sm ${textSecondary} px-2`}>
                              {sfPage} / {sfTotalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSfPage((p) => Math.min(sfTotalPages, p + 1))}
                              disabled={sfPage >= sfTotalPages}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Suiv.
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
          key={paymentInitialEnrollment?.enrollmentId ?? "new"}
          theme={theme}
          tarifications={tarifications}
          initialEnrollment={paymentInitialEnrollment}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentInitialEnrollment(null)
          }}
          onPaymentRecorded={() => { void refreshFeesData() }}
          onSuccess={() => {
            setShowPaymentModal(false)
            setPaymentInitialEnrollment(null)
            void refreshFeesData()
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL : CRÉER UN TYPE DE FRAIS */}
      {/* ============================================================ */}
      {showCreateTypeModal && !isCashier && (
        <CreateFeeTypeModal
          theme={theme}
          onClose={() => setShowCreateTypeModal(false)}
          onSuccess={() => {
            setShowCreateTypeModal(false)
            fetchAll()
          }}
        />
      )}

      {showCreateTarifModal && !isCashier && (
        <CreateTarificationModal
          theme={theme}
          typesFrais={typesFrais}
          classes={classes}
          years={years}
          activeYearId={currentYearId}
          existingTarifications={tarifications}
          onClose={() => setShowCreateTarifModal(false)}
          onSuccess={() => {
            setShowCreateTarifModal(false)
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
  initialEnrollment,
  onClose,
  onSuccess,
  onPaymentRecorded,
}: {
  theme: "light" | "dark"
  tarifications: Tarification[]
  initialEnrollment?: EnrollmentOption | null
  onClose: () => void
  onSuccess: () => void
  onPaymentRecorded?: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(initialEnrollment ? 2 : 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Step 1: Recherche élève
  const [studentSearch, setStudentSearch] = useState("")
  const [searchResults, setSearchResults] = useState<EnrollmentOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentOption | null>(initialEnrollment ?? null)

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
    devise: "USD" | "CDF"
    studentName: string
    id: number
  } | null>(null)
  const [receiptPdfData, setReceiptPdfData] = useState<ReceiptData | null>(null)

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fetch receipt data for PDF when payment succeeds
  useEffect(() => {
    if (success && createdPayment) {
      setReceiptPdfData(null)
      fetch(`/api/admin/fees/paiements/${createdPayment.id}/receipt`)
        .then(r => r.json())
        .then(({ data }) => setReceiptPdfData(data as ReceiptData))
        .catch(console.error)
    }
  }, [success, createdPayment])

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
          setMontant("")
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
        id: data.id,
        numeroRecu: data.numeroRecu,
        montant: data.montant,
        devise: selectedTarif.devise,
        studentName: `${data.student.lastName} ${data.student.middleName} ${data.student.firstName}`,
      })
      setSuccess(true)
      onPaymentRecorded?.()
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
              <div className="py-4">
                {/* Icône succès */}
                <div className="flex flex-col items-center mb-5">
                  <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className={`text-xl font-bold ${textColor}`}>Paiement enregistré !</h4>
                  <p className={`${textSecondary} mt-1 text-sm`}>{createdPayment.studentName}</p>
                </div>

                {/* Récapitulatif */}
                <div className={`rounded-2xl ${theme === "dark" ? "bg-gray-700/50 border border-gray-600" : "bg-gray-50 border border-gray-200"} p-4 mb-5 space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>N° Reçu</span>
                    <span className={`font-mono font-bold text-sm ${textColor}`}>{createdPayment.numeroRecu}</span>
                  </div>
                  <div className={`border-t ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`} />
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${textSecondary}`}>Montant</span>
                    <span className="text-xl font-bold text-green-500">{formatMontant(createdPayment.montant, createdPayment.devise)}</span>
                  </div>
                </div>

                {/* Boutons principaux */}
                <div className="grid grid-cols-2 gap-3">
                  {receiptPdfData ? (
                    <ReceiptDownloadButton
                      data={receiptPdfData}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm transition-colors w-full"
                    />
                  ) : (
                    <button disabled className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-400 text-white font-medium text-sm cursor-wait">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Préparation…</span>
                    </button>
                  )}

                  <button
                    onClick={onSuccess}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau paiement
                  </button>
                </div>

                {/* Ouvrir PDF pour impression propre */}
                {receiptPdfData && (
                  <button
                    onClick={async () => {
                      if (!receiptPdfData) return
                      try {
                        const { pdf } = await import("@react-pdf/renderer")
                        const { default: ReceiptPDF } = await import("@/components/receipt-pdf")
                        const blob = await pdf(<ReceiptPDF data={receiptPdfData} />).toBlob()
                        const url = URL.createObjectURL(blob)
                        window.open(url, "_blank")
                      } catch {
                        alert("Impossible de générer le PDF pour impression")
                      }
                    }}
                    className={`mt-2.5 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border ${theme === "dark" ? "border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500" : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400"} text-sm transition-colors`}
                  >
                    <Printer className="w-4 h-4" />
                    Ouvrir pour imprimer
                  </button>
                )}
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
                              <p className={`font-medium ${textColor}`}>{t.typeFrais?.nom ?? "Frais scolaire"}</p>
                              <p className={`text-xs ${textSecondary} mt-0.5`}>
                                {t.class?.name || "Toutes les classes"} · {t.year?.name ?? "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${textColor}`}>{formatMontant(t.montant, t.devise)}</p>
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
                          <span className={`font-medium ${textColor}`}>{formatMontant(balanceInfo.montantTotal, balanceInfo.devise)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={textSecondary}>Déjà payé ({balanceInfo.nombrePaiements} paiement{balanceInfo.nombrePaiements > 1 ? "s" : ""})</span>
                          <span className="font-medium text-green-500">{formatMontant(balanceInfo.totalPaye, balanceInfo.devise)}</span>
                        </div>
                        <div className={`flex justify-between text-sm pt-1.5 border-t ${borderColor}`}>
                          <span className={`font-semibold ${textColor}`}>Reste à payer</span>
                          <span className={`font-bold ${balanceInfo.solde > 0 ? "text-orange-500" : "text-green-500"}`}>
                            {formatMontant(balanceInfo.solde, balanceInfo.devise)}
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
                    <p className={`text-xs ${textSecondary}`}>{selectedTarif.typeFrais?.nom ?? "Frais"} — Reste: {formatMontant(balanceInfo?.solde ?? 0, selectedTarif.devise)}</p>
                  </div>
                </div>

                {/* Montant reçu */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Montant reçu ({selectedTarif.devise === "CDF" ? "FC" : "$"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      placeholder="Entrez le montant reçu"
                      className={`${inputClasses} text-xl font-bold pr-10`}
                      autoFocus
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-bold ${textSecondary}`}>{selectedTarif.devise === "CDF" ? "FC" : "$"}</span>
                  </div>
                  {balanceInfo && parseFloat(montant) > balanceInfo.solde && (
                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Ce montant dépasse le reste à payer ({formatMontant(balanceInfo.solde, balanceInfo.devise)})
                    </p>
                  )}

                  {/* Raccourcis montants */}
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
                          {amount === balanceInfo.solde ? "Tout payer" : formatMontant(amount, selectedTarif.devise)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Calcul en direct du reste à payer */}
                  {balanceInfo && montant && parseFloat(montant) > 0 && (
                    <div className={`mt-3 p-3 rounded-xl ${theme === "dark" ? "bg-gray-700/50" : "bg-green-50"} space-y-1.5`}>
                      <div className="flex justify-between text-sm">
                        <span className={textSecondary}>Reste à payer actuel</span>
                        <span className={`font-medium ${textColor}`}>{formatMontant(balanceInfo.solde, selectedTarif.devise)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={textSecondary}>Ce paiement</span>
                        <span className="font-medium text-green-500">- {formatMontant(parseFloat(montant), selectedTarif.devise)}</span>
                      </div>
                      <div className={`flex justify-between text-sm pt-1.5 border-t ${borderColor}`}>
                        <span className={`font-semibold ${textColor}`}>Nouveau solde</span>
                        {(() => {
                          const newBalance = balanceInfo.solde - parseFloat(montant)
                          return (
                            <span className={`font-bold ${newBalance <= 0 ? "text-green-500" : "text-orange-500"}`}>
                              {newBalance <= 0 ? formatMontant(0, selectedTarif.devise) : formatMontant(newBalance, selectedTarif.devise)}
                              {newBalance <= 0 && " ✓ Soldé"}
                            </span>
                          )
                        })()}
                      </div>
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
    if (!nom) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/admin/fees/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, description: description || undefined }),
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
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Frais de scolarité"
                className={inputClasses}
                autoFocus
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
              disabled={submitting || !nom}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                submitting || !nom
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


// ============================================================
// ONGLET TARIFICATIONS - GRILLE TARIFAIRE PAR CLASSE
// ============================================================

function TarificationsTab({
  theme,
  tarifications,
  typesFrais,
  classes,
  years,
  activeYearId,
  textColor,
  textSecondary,
  borderColor,
  headerBg,
  hoverRow,
  onCreateTarif,
  onRefresh,
}: {
  theme: "light" | "dark"
  tarifications: Tarification[]
  typesFrais: TypeFrais[]
  classes: ClassOption[]
  years: AcademicYearOption[]
  activeYearId: number | null
  textColor: string
  textSecondary: string
  borderColor: string
  headerBg: string
  hoverRow: string
  onCreateTarif: () => void
  onRefresh: () => void
}) {
  const defaultType = typesFrais.find((t) => t.isDefault) ?? typesFrais.find((t) => t.isActive)
  const [selectedTypeId, setSelectedTypeId] = useState<number | "">("")
  const [editingTarif, setEditingTarif] = useState<number | null>(null)
  const [editMontant, setEditMontant] = useState("")
  const [saving, setSaving] = useState(false)

  const activeYear = years.find((y) => y.id === activeYearId) ?? years.find((y) => y.current)

  useEffect(() => {
    if (!selectedTypeId && defaultType) {
      setSelectedTypeId(defaultType.id)
    }
  }, [defaultType, selectedTypeId])

  const filteredTarifs = tarifications.filter(
    (t) => t.yearId === activeYearId && t.isActive && (selectedTypeId ? t.typeFraisId === Number(selectedTypeId) : true)
  )

  const selectedType = typesFrais.find((t) => t.id === Number(selectedTypeId))

  const handleSaveMontant = async (tarifId: number) => {
    const montant = parseFloat(editMontant)
    if (!montant || montant <= 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/fees/tarifications/${tarifId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant }),
      })
      if (res.ok) {
        setEditingTarif(null)
        onRefresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTarif = async (tarifId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tarification ?")) return

    try {
      const res = await fetch(`/api/admin/fees/tarifications/${tarifId}`, {
        method: "DELETE",
      })
      if (res.ok) onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  if (typesFrais.filter((t) => t.isActive).length === 0) {
    return (
      <Card theme={theme}>
        <CardContent className="pt-5">
          <div className="text-center py-12">
            <Wallet className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-20`} />
            <p className={`text-lg font-medium ${textColor}`}>Aucun type de frais configuré</p>
            <p className={`text-sm ${textSecondary} mt-1`}>
              Créez d&apos;abord un type de frais dans l&apos;onglet &quot;Types de frais&quot;, puis configurez les tarifs par classe ici.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtre par année + bouton ajouter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className={`w-5 h-5 ${textSecondary}`} />
          {activeYear ? (
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
              theme === "dark"
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-indigo-50 border-indigo-200 text-indigo-700"
            }`}>
              {activeYear.name} (en cours)
            </span>
          ) : (
            <span className={`text-sm ${textSecondary}`}>Aucune année active — configurez-la dans Paramètres</span>
          )}
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(parseInt(e.target.value))}
            className={`px-3 py-2 rounded-xl border text-sm font-medium min-w-[200px] ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-gray-100"
                : "bg-white border-gray-300 text-gray-800"
            } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
          >
            {typesFrais.filter((t) => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}{t.isDefault ? " (défaut)" : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onCreateTarif}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          Ajouter une tarification
        </button>
      </div>

      {/* Tarifications du type sélectionné */}
      {selectedType && (
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-indigo-500" />
                <span>{selectedType.nom}</span>
                {selectedType.description && (
                  <span className={`text-xs font-normal ${textSecondary}`}>— {selectedType.description}</span>
                )}
              </div>
              <span className={`text-xs font-normal px-2 py-1 rounded-full ${
                theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>
                {filteredTarifs.length} classe{filteredTarifs.length > 1 ? "s" : ""} configurée{filteredTarifs.length > 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTarifs.length === 0 ? (
              <div className={`text-center py-6 border-2 border-dashed ${borderColor} rounded-xl`}>
                <p className={`text-sm ${textSecondary}`}>Aucune tarification pour cette année</p>
                <button
                  onClick={onCreateTarif}
                  className="mt-2 text-sm text-indigo-500 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter un tarif
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={headerBg}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Classe</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Montant</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Paiements</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Description</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                    {filteredTarifs
                      .sort((a, b) => (a.class?.name || "").localeCompare(b.class?.name || ""))
                      .map((tarif) => (
                        <tr key={tarif.id} className={hoverRow}>
                          <td className={`px-4 py-3`}>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-indigo-400" />
                              <span className={`font-medium ${textColor}`}>
                                {tarif.class?.name || "Toutes les classes"}
                              </span>
                            </div>
                          </td>
                          <td className={`px-4 py-3`}>
                            {editingTarif === tarif.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editMontant}
                                  onChange={(e) => setEditMontant(e.target.value)}
                                  className={`w-28 px-2 py-1 rounded-lg border text-sm ${
                                    theme === "dark"
                                      ? "bg-gray-700 border-gray-600 text-gray-100"
                                      : "bg-white border-gray-300 text-gray-800"
                                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveMontant(tarif.id)
                                    if (e.key === "Escape") setEditingTarif(null)
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveMontant(tarif.id)}
                                  disabled={saving}
                                  className="p-1 rounded text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setEditingTarif(null)}
                                  className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatMontant(tarif.montant, tarif.devise)}
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-3`}>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              tarif._count.paiements > 0
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
                            }`}>
                              {tarif._count.paiements} paiement{tarif._count.paiements > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                            {tarif.description || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTarif(tarif.id)
                                  setEditMontant(String(tarif.montant))
                                }}
                                className={`p-1.5 rounded-lg ${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors`}
                                title="Modifier le montant"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTarif(tarif.id)}
                                className={`p-1.5 rounded-lg ${textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors`}
                                title="Supprimer"
                              >
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
    </div>
  )
}


// ============================================================
// MODAL : CRÉER UNE TARIFICATION
// ============================================================

function CreateTarificationModal({
  theme,
  typesFrais,
  classes,
  years,
  activeYearId,
  existingTarifications,
  onClose,
  onSuccess,
}: {
  theme: "light" | "dark"
  typesFrais: TypeFrais[]
  classes: ClassOption[]
  years: AcademicYearOption[]
  activeYearId: number | null
  existingTarifications: Tarification[]
  onClose: () => void
  onSuccess: () => void
}) {
  const activeYear = years.find((y) => y.id === activeYearId)
  const [typeFraisId, setTypeFraisId] = useState<number | "">(
    typesFrais.find((t) => t.isDefault)?.id ?? typesFrais[0]?.id ?? ""
  )
  const yearId = activeYearId ?? ""
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])

  // Classes déjà assignées à ce type de frais + cette année
  const alreadyAssignedClassIds = typeFraisId && yearId
    ? existingTarifications
        .filter((t) => t.typeFraisId === Number(typeFraisId) && t.yearId === Number(yearId) && t.classId !== null)
        .map((t) => t.classId as number)
    : []

  // Classes disponibles (pas encore assignées), triées de la plus petite à la plus grande
  const availableClasses = sortClasses(classes.filter((c) => !alreadyAssignedClassIds.includes(c.id)))
  const [montant, setMontant] = useState("")
  const [devise, setDevise] = useState<"USD" | "CDF">("USD")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successCount, setSuccessCount] = useState(0)

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputClasses = `w-full px-3 py-2.5 rounded-xl border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`
  const selectClasses = `${inputClasses} appearance-none`

  const activeTypes = typesFrais.filter((t) => t.isActive)

  const toggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const toggleAllClasses = () => {
    if (selectedClassIds.length === availableClasses.length) {
      setSelectedClassIds([])
    } else {
      setSelectedClassIds(availableClasses.map((c) => c.id))
    }
  }

  // Réinitialiser la sélection si le type ou l'année change
  const handleTypeFraisChange = (val: number | "") => {
    setTypeFraisId(val)
    setSelectedClassIds([])
  }

  const handleSubmit = async () => {
    if (!typeFraisId || !yearId || selectedClassIds.length === 0 || !montant) return
    setSubmitting(true)
    setError("")
    setSuccessCount(0)

    let created = 0
    const errors: string[] = []

    for (const classId of selectedClassIds) {
      try {
        const res = await fetch("/api/admin/fees/tarifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeFraisId: Number(typeFraisId),
            yearId: Number(yearId),
            classId,
            montant: parseFloat(montant),
            devise,
            description: description || undefined,
          }),
        })

        if (res.ok) {
          created++
        } else {
          const err = await res.json()
          const className = classes.find((c) => c.id === classId)?.name || `Classe ${classId}`
          errors.push(`${className}: ${err.error}`)
        }
      } catch {
        const className = classes.find((c) => c.id === classId)?.name || `Classe ${classId}`
        errors.push(`${className}: Erreur réseau`)
      }
    }

    setSuccessCount(created)

    if (errors.length > 0) {
      setError(`${created} tarification(s) créée(s). Erreurs :\n${errors.join("\n")}`)
      if (created > 0) {
        // Partial success - refresh but keep modal open to show errors
        setTimeout(() => onSuccess(), 2000)
      }
    } else {
      onSuccess()
    }

    setSubmitting(false)
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-up`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nouvelle tarification</h3>
                  <p className="text-indigo-100 text-xs">Définir le montant par classe</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            {successCount > 0 && !error && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
                {successCount} tarification(s) créée(s) avec succès !
              </div>
            )}

            {/* Type de frais */}
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Type de frais</label>
              <select
                value={typeFraisId}
                onChange={(e) => handleTypeFraisChange(e.target.value ? parseInt(e.target.value) : "")}
                className={selectClasses}
              >
                <option value="">Sélectionner un type</option>
                {activeTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>

            {/* Année scolaire (depuis Paramètres) */}
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Année scolaire</label>
              {activeYear ? (
                <div className={`px-3 py-2.5 rounded-xl border text-sm font-medium ${
                  theme === "dark"
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}>
                  {activeYear.name} (en cours)
                </div>
              ) : (
                <p className={`text-sm ${textSecondary}`}>
                  Aucune année active. Définissez-la dans Paramètres avant d&apos;ajouter une tarification.
                </p>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Montant</label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="Ex: 50000"
                min="0"
                step="100"
                className={inputClasses}
              />
            </div>

            {/* Devise */}
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>Devise</label>
              <div className="flex gap-2">
                {(["USD", "CDF"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevise(d)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      devise === d
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : `${borderColor} ${textSecondary} hover:border-gray-400`
                    }`}
                  >
                    {d === "USD" ? "$ USD" : "FC CDF"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                Description <span className={`font-normal ${textSecondary}`}>(optionnel)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Frais annuels de scolarité"
                className={inputClasses}
              />
            </div>

            {/* Sélection de classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-semibold ${textColor}`}>Classes</label>
                {availableClasses.length > 0 && (
                  <button
                    onClick={toggleAllClasses}
                    className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
                  >
                    {selectedClassIds.length === availableClasses.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                )}
              </div>

              {/* Avertissement classes déjà attribuées */}
              {alreadyAssignedClassIds.length > 0 && (
                <div className={`flex items-start gap-2 px-3 py-2 mb-2 rounded-lg text-xs ${
                  theme === "dark" ? "bg-amber-500/10 text-amber-300" : "bg-amber-50 text-amber-700"
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {alreadyAssignedClassIds.length} classe{alreadyAssignedClassIds.length > 1 ? "s ont" : " a"} déjà une tarification pour ce type de frais et cette année — elles ne s&apos;affichent pas.
                  </span>
                </div>
              )}

              <div className={`border ${borderColor} rounded-xl p-3 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1`}>
                {availableClasses.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                      theme === "dark" ? "text-green-400" : "text-green-500"
                    } opacity-70`} />
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-green-400" : "text-green-600"
                    }`}>
                      {classes.length === 0
                        ? "Aucune classe disponible"
                        : "Toutes les classes ont déjà ce type de frais"}
                    </p>
                    {classes.length > 0 && typeFraisId && (
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        Pour modifier les montants, utilisez la grille tarifaire.
                      </p>
                    )}
                  </div>
                ) : (
                  availableClasses.map((cls) => (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          selectedClassIds.includes(cls.id)
                            ? theme === "dark"
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "bg-indigo-50 text-indigo-700"
                            : theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => toggleClass(cls.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 opacity-50" />
                          <span className="text-sm font-medium">{cls.name}</span>
                        </div>
                      </label>
                    ))
                )}
              </div>
              {selectedClassIds.length > 0 && (
                <p className={`text-xs ${textSecondary} mt-1`}>
                  {selectedClassIds.length} classe{selectedClassIds.length > 1 ? "s" : ""} sélectionnée{selectedClassIds.length > 1 ? "s" : ""}
                </p>
              )}
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
              disabled={submitting || !typeFraisId || !yearId || selectedClassIds.length === 0 || !montant}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
                submitting || !typeFraisId || !yearId || selectedClassIds.length === 0 || !montant
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {selectedClassIds.length > 1
                ? `Créer ${selectedClassIds.length} tarifications`
                : "Créer la tarification"
              }
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
