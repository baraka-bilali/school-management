"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "@/components/layout"
import { Card, CardContent } from "@/components/ui/cards"
import { SelecteurAnneeScolaire } from "@/components/treasury/school-year-select"
import { SelecteurMois } from "@/components/treasury/school-month-select"
import { TreasuryPeriodShortcuts } from "@/components/treasury/treasury-period-shortcuts"
import { TreasurySummaryCards, TreasuryIncomeBreakdown } from "@/components/treasury/treasury-summary-cards"
import {
  TreasuryPageSkeleton,
  TreasuryOverviewContentSkeleton,
  TreasuryOutflowsContentSkeleton,
} from "@/components/treasury/treasury-skeletons"
import {
  computePeriodBounds,
  formatPeriodSubtitle,
  getSchoolYearMonths,
  mapAcademicYearsToAnnees,
  type AnneeScolaire,
  type MoisScolaire,
  type PeriodShortcut,
} from "@/lib/school-year-utils"
import {
  Landmark,
  ArrowUpCircle,
  Users,
  Download,
  Plus,
  Loader2,
  Banknote,
  Smartphone,
  Building,
  FileText,
  CreditCard,
} from "lucide-react"

// ============================================================
// TYPES
// ============================================================

interface SalaryPaymentRow {
  id: number
  kind: "teacher" | "staff"
  payeeKey: string
  teacherId: number
  teacherName: string
  payeeName: string
  specialty: string | null
  roleLabel: string
  montant: number
  type: string
  mois: string
  description: string | null
  modePaiement: string
  reference: string | null
  datePaiement: string
}

interface PayeeOption {
  id: number
  key: string
  kind: "teacher" | "staff"
  name: string
  specialty: string | null
  roleLabel: string
}

interface ExpenseRow {
  id: number
  categorie: string
  motif: string
  montant: number
  devise: "USD" | "CDF"
  beneficiaire: string | null
  modePaiement: string
  reference: string | null
  dateDepense: string
}

interface TreasuryData {
  selectedYearId?: number | null
  selectedYearName?: string | null
  totalIncomeUsd: number
  totalIncomeCdf: number
  scolaireIncomeUsd: number
  scolaireIncomeCdf: number
  otherIncomeUsd: number
  otherIncomeCdf: number
  incomeByType: Array<{
    typeFraisId: number
    typeFrais: string
    isDefault: boolean
    usd: number
    cdf: number
  }>
  totalTeacherPayments: number
  totalExpensesUsd: number
  totalExpensesCdf: number
  balanceUsd: number
  balanceCdf: number
  teacherPayments: SalaryPaymentRow[]
  expenses: ExpenseRow[]
  payees: PayeeOption[]
  teachers: PayeeOption[]
}

// ============================================================
// CONSTANTES
// ============================================================

const PAYMENT_TYPES = [
  { value: "SALAIRE", label: "Salaire" },
  { value: "PRIME", label: "Prime" },
  { value: "BONUS", label: "Bonus" },
  { value: "AVANCE", label: "Avance" },
  { value: "AUTRE", label: "Autre" },
]

const EXPENSE_CATEGORIES = [
  { value: "FOURNITURES", label: "Fournitures" },
  { value: "EQUIPEMENT", label: "Équipement" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "EVENEMENT", label: "Événement" },
  { value: "AUTRE", label: "Autre" },
]

const MODES_PAIEMENT = [
  { value: "CASH", label: "Espèces", icon: Banknote, color: "text-green-500" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone, color: "text-blue-500" },
  { value: "VIREMENT", label: "Virement bancaire", icon: Building, color: "text-purple-500" },
  { value: "CHEQUE", label: "Chèque", icon: FileText, color: "text-orange-500" },
  { value: "AUTRE", label: "Autre", icon: CreditCard, color: "text-gray-500" },
]

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function formatMoisLabel(mois: string, months: MoisScolaire[]) {
  const m = months.find((x) => x.value === mois)
  if (m) return m.label
  const [y, mo] = mois.split("-")
  const idx = parseInt(mo ?? "", 10) - 1
  if (y && idx >= 0 && idx < 12) return `${MONTH_NAMES_FR[idx]} ${y}`
  return mois
}

type TreasuryMainTab = "overview" | "outflows"

export default function AdminTreasuryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))
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

  // Trésorerie
  const [treasury, setTreasury] = useState<TreasuryData | null>(null)
  const [treasuryLoading, setTreasuryLoading] = useState(false)
  const [treasuryMainTab, setTreasuryMainTab] = useState<TreasuryMainTab>("overview")
  const [treasurySubTab, setTreasurySubTab] = useState<"overview" | "salaires" | "depenses">("overview")
  const [academicYears, setAcademicYears] = useState<AnneeScolaire[]>([])
  const [trFilterYearId, setTrFilterYearId] = useState<number | null>(null)
  const [trFilterMonth, setTrFilterMonth] = useState("")
  const [periodShortcut, setPeriodShortcut] = useState<PeriodShortcut>("this_month")
  const [trFilterPayee, setTrFilterPayee] = useState("")
  const [trFilterType, setTrFilterType] = useState("")
  const [trFilterCategorie, setTrFilterCategorie] = useState("")
  const [showSalaryPaymentForm, setShowSalaryPaymentForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [tpPayeeKey, setTpPayeeKey] = useState("")
  const [tpMontant, setTpMontant] = useState("")
  const [tpType, setTpType] = useState("SALAIRE")
  const [tpMois, setTpMois] = useState(new Date().toISOString().slice(0, 7))
  const [tpDescription, setTpDescription] = useState("")
  const [tpModePaiement, setTpModePaiement] = useState("CASH")
  const [tpReference, setTpReference] = useState("")
  const [tpSubmitting, setTpSubmitting] = useState(false)
  const [expCategorie, setExpCategorie] = useState("AUTRE")
  const [expMotif, setExpMotif] = useState("")
  const [expMontant, setExpMontant] = useState("")
  const [expDevise, setExpDevise] = useState<"USD" | "CDF">("USD")
  const [expBeneficiaire, setExpBeneficiaire] = useState("")
  const [expModePaiement, setExpModePaiement] = useState("CASH")
  const [expReference, setExpReference] = useState("")
  const [expSubmitting, setExpSubmitting] = useState(false)

  // Theme listener
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) setTheme(currentTheme)
    }

    window.addEventListener("storage", handleThemeChange)
    window.addEventListener("themeChange", handleThemeChange)
    return () => {
      window.removeEventListener("storage", handleThemeChange)
      window.removeEventListener("themeChange", handleThemeChange)
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

  // Charger les années scolaires (meta)
  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await fetch("/api/admin/meta")
        if (!res.ok) return
        const meta = await res.json()
        const mapped = mapAcademicYearsToAnnees(meta.years || [], meta.currentYearId)
        setAcademicYears(mapped)

        const urlYear = searchParams.get("yearId")
        const urlMonth = searchParams.get("month") ?? ""
        const urlShortcut = (searchParams.get("period") as PeriodShortcut | null) ?? "this_month"

        const defaultYearId = urlYear
          ? Number(urlYear)
          : meta.currentYearId ?? mapped[0]?.id ?? null

        setTrFilterYearId(defaultYearId)
        setTrFilterMonth(urlMonth)
        setPeriodShortcut(
          ["this_month", "this_quarter", "this_school_year", "custom"].includes(urlShortcut)
            ? urlShortcut
            : "this_month"
        )

        const urlView = searchParams.get("view")
        if (urlView === "outflows") setTreasuryMainTab("outflows")
      } catch {
        /* ignore */
      }
    }
    void loadYears()
  }, [searchParams])

  const selectedSchoolYear = useMemo(
    () => academicYears.find((y) => y.id === trFilterYearId) ?? academicYears[0] ?? null,
    [academicYears, trFilterYearId]
  )

  const schoolYearMonths = useMemo(
    () => (selectedSchoolYear ? getSchoolYearMonths(selectedSchoolYear) : []),
    [selectedSchoolYear]
  )

  const periodBounds = useMemo(() => {
    if (!selectedSchoolYear) {
      return { monthValues: [] as string[], dateFrom: new Date(), dateTo: new Date(), shortcut: periodShortcut }
    }
    if (periodShortcut === "custom") {
      return computePeriodBounds("custom", selectedSchoolYear, trFilterMonth || undefined)
    }
    return computePeriodBounds(periodShortcut, selectedSchoolYear)
  }, [selectedSchoolYear, periodShortcut, trFilterMonth])

  const periodSubtitle = useMemo(
    () =>
      selectedSchoolYear
        ? formatPeriodSubtitle(periodShortcut, periodBounds.monthValues, schoolYearMonths)
        : "Période sélectionnée",
    [selectedSchoolYear, periodShortcut, periodBounds.monthValues, schoolYearMonths]
  )

  const yearLabel =
    treasury?.selectedYearName ?? selectedSchoolYear?.label ?? "Année scolaire"

  const fetchIdRef = useRef(0)

  const fetchTreasury = useCallback(async () => {
    if (!trFilterYearId) return
    const fetchId = ++fetchIdRef.current
    setTreasuryLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("yearId", String(trFilterYearId))
      params.set("dateFrom", periodBounds.dateFrom.toISOString())
      params.set("dateTo", periodBounds.dateTo.toISOString())
      if (periodBounds.monthValues.length > 0) {
        params.set("months", periodBounds.monthValues.join(","))
      }
      const res = await fetch(`/api/admin/fees/treasury?${params}`)
      if (fetchId !== fetchIdRef.current) return
      if (res.ok) {
        const { data } = await res.json()
        setTreasury(data)
      }
    } catch (error) {
      if (fetchId === fetchIdRef.current) {
        console.error("Erreur chargement trésorerie:", error)
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setTreasuryLoading(false)
      }
    }
  }, [trFilterYearId, periodBounds])

  useEffect(() => {
    if (!trFilterYearId) return
    const timer = setTimeout(() => {
      void fetchTreasury()
    }, 180)
    return () => clearTimeout(timer)
  }, [fetchTreasury, trFilterYearId])

  const syncUrlParams = useCallback(
    (yearId: number | null, month: string, shortcut: PeriodShortcut) => {
      const params = new URLSearchParams()
      if (yearId) params.set("yearId", String(yearId))
      if (month) params.set("month", month)
      if (shortcut !== "this_month") params.set("period", shortcut)
      const qs = params.toString()
      router.replace(qs ? `/admin/treasury?${qs}` : "/admin/treasury", { scroll: false })
    },
    [router]
  )

  const handleMainTabChange = (tab: TreasuryMainTab) => {
    setTreasuryMainTab(tab)
    if (tab === "overview") {
      setShowSalaryPaymentForm(false)
      setShowExpenseForm(false)
    }
    const params = new URLSearchParams()
    if (trFilterYearId) params.set("yearId", String(trFilterYearId))
    if (trFilterMonth) params.set("month", trFilterMonth)
    if (periodShortcut !== "this_month") params.set("period", periodShortcut)
    if (tab === "outflows") params.set("view", "outflows")
    const qs = params.toString()
    router.replace(qs ? `/admin/treasury?${qs}` : "/admin/treasury", { scroll: false })
  }

  const handleYearChange = (yearId: number) => {
    setTrFilterYearId(yearId)
    setTrFilterMonth("")
    setPeriodShortcut("this_month")
    syncUrlParams(yearId, "", "this_month")
  }

  const handleMonthChange = (month: string) => {
    setTrFilterMonth(month)
    setPeriodShortcut("custom")
    syncUrlParams(trFilterYearId, month, "custom")
  }

  const handleShortcutChange = (shortcut: PeriodShortcut) => {
    setPeriodShortcut(shortcut)
    if (shortcut !== "custom") setTrFilterMonth("")
    syncUrlParams(trFilterYearId, shortcut === "custom" ? trFilterMonth : "", shortcut)
  }

  // Recharger quand l'année scolaire change dans Paramètres
  useEffect(() => {
    const handleSettingsYearChange = async () => {
      const stored = localStorage.getItem("schoolCurrentYearId")
      if (stored) {
        const yearId = Number(stored)
        if (!Number.isNaN(yearId)) {
          setTrFilterYearId(yearId)
          setTrFilterMonth("")
          setPeriodShortcut("this_month")
          syncUrlParams(yearId, "", "this_month")
          return
        }
      }
      try {
        const res = await fetch("/api/admin/meta")
        if (!res.ok) return
        const meta = await res.json()
        const mapped = mapAcademicYearsToAnnees(meta.years || [], meta.currentYearId)
        setAcademicYears(mapped)
        const yearId = meta.currentYearId ?? mapped[0]?.id ?? null
        if (yearId) {
          setTrFilterYearId(yearId)
          setTrFilterMonth("")
          setPeriodShortcut("this_month")
          syncUrlParams(yearId, "", "this_month")
        }
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("schoolSettingsChange", handleSettingsYearChange)
    return () => window.removeEventListener("schoolSettingsChange", handleSettingsYearChange)
  }, [syncUrlParams])

  const handleSubmitSalaryPayment = async () => {
    if (!tpPayeeKey || !tpMontant || !tpMois) return
    setTpSubmitting(true)
    try {
      const [kind, idStr] = tpPayeeKey.split(":")
      const id = parseInt(idStr)
      const isTeacher = kind === "teacher"
      const url = isTeacher
        ? "/api/admin/fees/treasury/teacher-payments"
        : "/api/admin/fees/treasury/staff-payments"
      const body = isTeacher
        ? {
            teacherId: id,
            montant: parseFloat(tpMontant),
            type: tpType,
            mois: tpMois,
            description: tpDescription || null,
            modePaiement: tpModePaiement,
            reference: tpReference || null,
          }
        : {
            userId: id,
            montant: parseFloat(tpMontant),
            type: tpType,
            mois: tpMois,
            description: tpDescription || null,
            modePaiement: tpModePaiement,
            reference: tpReference || null,
          }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowSalaryPaymentForm(false)
        setTpPayeeKey("")
        setTpMontant("")
        setTpType("SALAIRE")
        setTpDescription("")
        setTpReference("")
        void fetchTreasury()
      } else {
        const err = await res.json()
        alert(err.error || "Erreur lors de l'enregistrement")
      }
    } catch {
      alert("Erreur réseau")
    } finally {
      setTpSubmitting(false)
    }
  }

  const handleSubmitExpense = async () => {
    if (!expMotif || !expMontant) return
    setExpSubmitting(true)
    try {
      const res = await fetch("/api/admin/fees/treasury/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorie: expCategorie,
          motif: expMotif,
          montant: parseFloat(expMontant),
          beneficiaire: expBeneficiaire || null,
          modePaiement: expModePaiement,
          reference: expReference || null,
          devise: expDevise,
        }),
      })
      if (res.ok) {
        setShowExpenseForm(false)
        setExpMotif(""); setExpMontant(""); setExpCategorie("AUTRE"); setExpBeneficiaire(""); setExpReference(""); setExpDevise("USD")
        void fetchTreasury()
      } else {
        const err = await res.json()
        alert(err.error || "Erreur lors de l'enregistrement")
      }
    } catch { alert("Erreur réseau") } finally { setExpSubmitting(false) }
  }

  const exportTreasury = () => {
    if (!treasury) return
    const sub = treasurySubTab
    const BOM = "\uFEFF"
    let csvRows: string[] = []

    if (sub === "salaires" || sub === "overview") {
      csvRows.push(["Personnel", "Rôle", "Type", "Mois", "Montant ($)", "Mode", "Référence", "Description", "Date"].join(";"))
      for (const tp of filteredSalaryPayments) {
        csvRows.push([
          tp.payeeName,
          tp.roleLabel,
          PAYMENT_TYPES.find(p => p.value === tp.type)?.label || tp.type,
          tp.mois,
          tp.montant,
          tp.modePaiement,
          tp.reference || "—",
          tp.description || "—",
          new Date(tp.datePaiement).toLocaleDateString("fr-FR"),
        ].join(";"))
      }
    }
    if (sub === "depenses" || sub === "overview") {
      if (csvRows.length > 0) csvRows.push("", "DÉPENSES")
      csvRows.push(["Catégorie", "Motif", "Montant ($)", "Bénéficiaire", "Mode", "Référence", "Date"].join(";"))
      for (const e of filteredExpenses) {
        csvRows.push([
          EXPENSE_CATEGORIES.find(c => c.value === e.categorie)?.label || e.categorie,
          e.motif,
          e.montant,
          e.beneficiaire || "—",
          e.modePaiement,
          e.reference || "—",
          new Date(e.dateDepense).toLocaleDateString("fr-FR"),
        ].join(";"))
      }
    }

    const blob = new Blob([BOM + csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tresorerie-${treasurySubTab}${trFilterMonth ? "-" + trFilterMonth : ""}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtrer salaires / dépenses par période scolaire
  const payeeList = treasury?.payees ?? treasury?.teachers ?? []
  const teacherPayees = payeeList.filter((p) => p.kind === "teacher")
  const staffPayees = payeeList.filter((p) => p.kind === "staff")

  const filteredSalaryPayments = treasury?.teacherPayments.filter((tp) => {
    if (periodBounds.monthValues.length > 0 && !periodBounds.monthValues.includes(tp.mois)) return false
    if (trFilterPayee && tp.payeeKey !== trFilterPayee) return false
    if (trFilterType && tp.type !== trFilterType) return false
    return true
  }) ?? []

  const filteredExpenses = treasury?.expenses.filter((e) => {
    if (periodBounds.monthValues.length > 0) {
      const expenseMonth = e.dateDepense.slice(0, 7)
      if (!periodBounds.monthValues.includes(expenseMonth)) return false
    }
    if (trFilterCategorie && e.categorie !== trFilterCategorie) return false
    return true
  }) ?? []

  const outflowSalaryTotal = useMemo(
    () => filteredSalaryPayments.reduce((s, p) => s + p.montant, 0),
    [filteredSalaryPayments]
  )
  const outflowExpensesUsd = useMemo(
    () => filteredExpenses.filter((e) => e.devise === "USD").reduce((s, e) => s + e.montant, 0),
    [filteredExpenses]
  )
  const outflowExpensesCdf = useMemo(
    () => filteredExpenses.filter((e) => e.devise === "CDF").reduce((s, e) => s + e.montant, 0),
    [filteredExpenses]
  )

  const hasOutflowClientFilters = !!(trFilterPayee || trFilterType || trFilterCategorie)

  // Couleurs thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
  const hoverRow = theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
  const headerBg = theme === "dark" ? "bg-gray-700" : "bg-gray-50"

  const formatCurrency = (amount: number) => {
    if (currency === "CDF") {
      const converted = amount * exchangeRate
      return new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0 }).format(converted) + " FC"
    }
    return new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " $"
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getModePaiementLabel = (mode: string) => {
    return MODES_PAIEMENT.find(m => m.value === mode)?.label || mode
  }

  const isCompactTables = treasurySubTab === "overview"
  const isInitialLoad = treasuryLoading && !treasury
  const isRefreshing = treasuryLoading && !!treasury
  const mainTabBtnClass = (active: boolean) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
      active
        ? theme === "dark"
          ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
          : "bg-indigo-600 border-indigo-600 text-white shadow-md"
        : theme === "dark"
          ? "border-gray-600 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300"
          : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white"
    }`

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textColor} flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              Trésorerie
            </h1>
            <p className={`${textSecondary} mt-1`}>Gestion des salaires, dépenses et budget de l&apos;école</p>
            {treasury?.selectedYearName && (
              <span className={`inline-flex items-center mt-2 rounded-full px-3 py-1 text-xs font-semibold ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                {yearLabel} · {periodSubtitle}
              </span>
            )}
          </div>

          {/* Onglets principaux */}
          <div className="flex gap-2 shrink-0 self-start">
            <button
              type="button"
              onClick={() => handleMainTabChange("overview")}
              className={mainTabBtnClass(treasuryMainTab === "overview")}
            >
              Vue d&apos;ensemble
            </button>
            <button
              type="button"
              onClick={() => handleMainTabChange("outflows")}
              className={mainTabBtnClass(treasuryMainTab === "outflows")}
            >
              Dépenses & salaires
            </button>
          </div>
        </div>

        {/* Contenu */}
        {isInitialLoad ? (
          <TreasuryPageSkeleton theme={theme} variant={treasuryMainTab} />
        ) : (
          <div className="space-y-6">
            {/* Filtres : année scolaire + période */}
            <Card theme={theme} className="rounded-2xl shadow-sm">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <TreasuryPeriodShortcuts
                    active={periodShortcut}
                    onChange={handleShortcutChange}
                    theme={theme}
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <SelecteurAnneeScolaire
                      years={academicYears}
                      value={trFilterYearId}
                      onChange={handleYearChange}
                      theme={theme}
                    />
                    <SelecteurMois
                      months={schoolYearMonths}
                      value={trFilterMonth}
                      onChange={handleMonthChange}
                      theme={theme}
                      disabled={periodShortcut !== "custom"}
                    />
                  </div>
                </div>

                {treasuryMainTab === "outflows" && (
                <div className="flex flex-wrap gap-3 items-center pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                  {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
                    <select
                      value={trFilterPayee}
                      onChange={(e) => setTrFilterPayee(e.target.value)}
                      className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[180px]`}
                    >
                      <option value="">Tout le personnel</option>
                      {teacherPayees.length > 0 && (
                        <optgroup label="Professeurs">
                          {teacherPayees.map((t) => (
                            <option key={t.key} value={t.key}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {staffPayees.length > 0 && (
                        <optgroup label="Personnel administratif">
                          {staffPayees.map((t) => (
                            <option key={t.key} value={t.key}>{t.name} ({t.roleLabel})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}

                  {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
                    <select
                      value={trFilterType}
                      onChange={(e) => setTrFilterType(e.target.value)}
                      className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[130px]`}
                    >
                      <option value="">Tous les types</option>
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  )}

                  {(treasurySubTab === "overview" || treasurySubTab === "depenses") && (
                    <select
                      value={trFilterCategorie}
                      onChange={(e) => setTrFilterCategorie(e.target.value)}
                      className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[140px]`}
                    >
                      <option value="">Toutes catégories</option>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  )}

                  {(periodShortcut !== "this_month" || trFilterMonth || trFilterPayee || trFilterType || trFilterCategorie) && (
                    <button
                      onClick={() => {
                        handleShortcutChange("this_month")
                        setTrFilterPayee("")
                        setTrFilterType("")
                        setTrFilterCategorie("")
                      }}
                      className={`px-3 py-2 text-xs rounded-xl border ${borderColor} ${textSecondary} hover:text-red-500 hover:border-red-400 transition-colors`}
                    >
                      Réinitialiser filtres
                    </button>
                  )}
                </div>
                )}
              </CardContent>
            </Card>

            {isRefreshing ? (
              treasuryMainTab === "overview" ? (
                <TreasuryOverviewContentSkeleton theme={theme} />
              ) : (
                <TreasuryOutflowsContentSkeleton theme={theme} compactTables={isCompactTables} />
              )
            ) : treasury ? (
            <>
            {treasuryMainTab === "overview" ? (
              <>
                <TreasurySummaryCards
                  theme={theme}
                  yearLabel={yearLabel}
                  incomePeriodLabel={periodSubtitle}
                  flowsPeriodLabel={periodSubtitle}
                  scolaireUsd={treasury.scolaireIncomeUsd}
                  scolaireCdf={treasury.scolaireIncomeCdf}
                  otherUsd={treasury.otherIncomeUsd}
                  otherCdf={treasury.otherIncomeCdf}
                  teacherPayments={treasury.totalTeacherPayments}
                  expensesUsd={treasury.totalExpensesUsd}
                  expensesCdf={treasury.totalExpensesCdf}
                  balanceUsd={treasury.balanceUsd}
                  balanceCdf={treasury.balanceCdf}
                  sections="all"
                />

                {treasury.incomeByType.length > 0 && (
                  <TreasuryIncomeBreakdown
                    theme={theme}
                    rows={treasury.incomeByType}
                    exchangeRate={exchangeRate}
                    periodLabel={periodSubtitle}
                  />
                )}
              </>
            ) : (
              <>
                <TreasurySummaryCards
                  theme={theme}
                  yearLabel={yearLabel}
                  incomePeriodLabel={periodSubtitle}
                  flowsPeriodLabel={periodSubtitle}
                  scolaireUsd={treasury.scolaireIncomeUsd}
                  scolaireCdf={treasury.scolaireIncomeCdf}
                  otherUsd={treasury.otherIncomeUsd}
                  otherCdf={treasury.otherIncomeCdf}
                  teacherPayments={hasOutflowClientFilters ? outflowSalaryTotal : treasury.totalTeacherPayments}
                  expensesUsd={hasOutflowClientFilters ? outflowExpensesUsd : treasury.totalExpensesUsd}
                  expensesCdf={hasOutflowClientFilters ? outflowExpensesCdf : treasury.totalExpensesCdf}
                  balanceUsd={treasury.balanceUsd}
                  balanceCdf={treasury.balanceCdf}
                  sections="outflows"
                />

            {/* Onglets flux + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className={`flex gap-1 p-1 rounded-xl w-fit ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                {[
                  { key: "overview" as const, label: "Tout flux" },
                  { key: "salaires" as const, label: "Salaires" },
                  { key: "depenses" as const, label: "Dépenses" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setTreasurySubTab(st.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      treasurySubTab === st.key
                        ? theme === "dark"
                          ? "bg-slate-700 shadow text-white"
                          : "bg-indigo-600 shadow text-white"
                        : `${textSecondary} hover:text-indigo-500`
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={exportTreasury} disabled={!treasury} title="Télécharger en Excel" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Excel
                </button>
                {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
                  <button onClick={() => setShowSalaryPaymentForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Payer un salarié
                  </button>
                )}
                {(treasurySubTab === "overview" || treasurySubTab === "depenses") && (
                  <button onClick={() => setShowExpenseForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Ajouter une dépense
                  </button>
                )}
              </div>
            </div>

            {/* Formulaire paiement prof */}
            {showSalaryPaymentForm && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Payer un salarié</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Personnel *</label>
                      <select value={tpPayeeKey} onChange={(e) => setTpPayeeKey(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        <option value="">Sélectionner...</option>
                        {teacherPayees.length > 0 && (
                          <optgroup label="Professeurs">
                            {teacherPayees.map((t) => (
                              <option key={t.key} value={t.key}>
                                {t.name}{t.specialty ? ` (${t.specialty})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {staffPayees.length > 0 && (
                          <optgroup label="Personnel administratif">
                            {staffPayees.map((t) => (
                              <option key={t.key} value={t.key}>
                                {t.name} ({t.roleLabel})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Montant ($) *</label>
                      <input type="number" value={tpMontant} onChange={(e) => setTpMontant(e.target.value)} placeholder="0" className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Type *</label>
                      <select value={tpType} onChange={(e) => setTpType(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Mois *</label>
                      <input type="month" value={tpMois} onChange={(e) => setTpMois(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Mode de paiement</label>
                      <select value={tpModePaiement} onChange={(e) => setTpModePaiement(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        {MODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Référence</label>
                      <input type="text" value={tpReference} onChange={(e) => setTpReference(e.target.value)} placeholder="N° reçu, etc." className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                    <div className="md:col-span-3">
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Description</label>
                      <input type="text" value={tpDescription} onChange={(e) => setTpDescription(e.target.value)} placeholder="Détails du paiement..." className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button onClick={() => setShowSalaryPaymentForm(false)} className={`px-4 py-2 rounded-xl border ${borderColor} ${textColor} text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700`}>Annuler</button>
                    <button onClick={handleSubmitSalaryPayment} disabled={!tpPayeeKey || !tpMontant || !tpMois || tpSubmitting} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors inline-flex items-center gap-2">
                      {tpSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulaire dépense */}
            {showExpenseForm && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Ajouter une dépense</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Catégorie</label>
                      <select value={expCategorie} onChange={(e) => setExpCategorie(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Montant *</label>
                      <div className="flex gap-2">
                        <input type="number" value={expMontant} onChange={(e) => setExpMontant(e.target.value)} placeholder="0" className={`flex-1 px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                        <div className="flex rounded-xl border overflow-hidden">
                          <button type="button" onClick={() => setExpDevise("USD")} className={`px-3 py-2 text-sm font-semibold transition-colors ${expDevise === "USD" ? "bg-green-600 text-white" : `${inputBg} ${textSecondary}`}`}>$</button>
                          <button type="button" onClick={() => setExpDevise("CDF")} className={`px-3 py-2 text-sm font-semibold transition-colors ${expDevise === "CDF" ? "bg-blue-600 text-white" : `${inputBg} ${textSecondary}`}`}>FC</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Bénéficiaire</label>
                      <input type="text" value={expBeneficiaire} onChange={(e) => setExpBeneficiaire(e.target.value)} placeholder="Nom du bénéficiaire" className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Mode de paiement</label>
                      <select value={expModePaiement} onChange={(e) => setExpModePaiement(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        {MODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Référence</label>
                      <input type="text" value={expReference} onChange={(e) => setExpReference(e.target.value)} placeholder="N° facture, etc." className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                    <div className="md:col-span-3">
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Motif *</label>
                      <input type="text" value={expMotif} onChange={(e) => setExpMotif(e.target.value)} placeholder="Décrivez la raison de la dépense..." className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button onClick={() => setShowExpenseForm(false)} className={`px-4 py-2 rounded-xl border ${borderColor} ${textColor} text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700`}>Annuler</button>
                    <button onClick={handleSubmitExpense} disabled={!expMotif || !expMontant || expSubmitting} className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium transition-colors inline-flex items-center gap-2">
                      {expSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tableaux */}
            <div className={isCompactTables ? "grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0" : "space-y-4"}>
            {/* Tableau salaires profs */}
            {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
              <Card theme={theme} className="rounded-2xl shadow-sm min-w-0 overflow-hidden">
                <CardContent className="pt-5">
                  <h3 className={`text-base font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <Users className="w-5 h-5 text-blue-500 shrink-0" /> Paiements salaires
                  </h3>
                  {filteredSalaryPayments.length === 0 ? (
                    <p className={`text-center py-8 ${textSecondary}`}>{treasury.teacherPayments.length === 0 ? "Aucun paiement enregistré" : "Aucun résultat pour ces filtres"}</p>
                  ) : isCompactTables ? (
                    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
                      <table className="w-full table-fixed text-xs">
                        <thead>
                          <tr className={headerBg}>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase`}>Personnel</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[18%]`}>Mois</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[22%]`}>Montant</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[20%]`}>Date</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                          {filteredSalaryPayments.map((tp) => (
                            <tr key={`${tp.kind}-${tp.id}`} className={`${hoverRow} transition-colors`}>
                              <td className={`px-2 py-2 ${textColor} min-w-0`}>
                                <div className="font-medium truncate">{tp.payeeName}</div>
                                <div className={`text-[10px] ${textSecondary} truncate`}>{tp.roleLabel}</div>
                                <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  tp.type === "SALAIRE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : tp.type === "PRIME" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {PAYMENT_TYPES.find(t => t.value === tp.type)?.label || tp.type}
                                </span>
                              </td>
                              <td className={`px-2 py-2 ${textSecondary} truncate`}>{formatMoisLabel(tp.mois, schoolYearMonths)}</td>
                              <td className={`px-2 py-2 ${textColor}`}>
                                <div className="font-semibold">{new Intl.NumberFormat("fr-FR").format(tp.montant)} $</div>
                                <div className={`text-[10px] ${textSecondary}`}>{getModePaiementLabel(tp.modePaiement)}</div>
                              </td>
                              <td className={`px-2 py-2 ${textSecondary}`}>{formatDate(tp.datePaiement)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={`overflow-x-auto rounded-xl border ${borderColor}`}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={headerBg}>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Personnel</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Type</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mois</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Montant</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mode</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Date</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Description</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                          {filteredSalaryPayments.map((tp) => (
                            <tr key={`${tp.kind}-${tp.id}`} className={`${hoverRow} transition-colors`}>
                              <td className={`px-4 py-3 ${textColor}`}>
                                <div className="font-medium">{tp.payeeName}</div>
                                <div className={`text-xs ${textSecondary}`}>{tp.roleLabel}</div>
                                {tp.specialty && <div className={`text-xs ${textSecondary}`}>{tp.specialty}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tp.type === "SALAIRE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : tp.type === "PRIME" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : tp.type === "BONUS" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {PAYMENT_TYPES.find(t => t.value === tp.type)?.label || tp.type}
                                </span>
                              </td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{tp.mois}</td>
                              <td className={`px-4 py-3 font-medium ${textColor}`}>{formatCurrency(tp.montant)}</td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{getModePaiementLabel(tp.modePaiement)}</td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{formatDate(tp.datePaiement)}</td>
                              <td className={`px-4 py-3 ${textSecondary} max-w-[200px] truncate`}>{tp.description || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tableau dépenses */}
            {(treasurySubTab === "overview" || treasurySubTab === "depenses") && (
              <Card theme={theme} className="rounded-2xl shadow-sm min-w-0 overflow-hidden">
                <CardContent className="pt-5">
                  <h3 className={`text-base font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <ArrowUpCircle className="w-5 h-5 text-orange-500 shrink-0" /> Dépenses diverses
                  </h3>
                  {filteredExpenses.length === 0 ? (
                    <p className={`text-center py-8 ${textSecondary}`}>{treasury.expenses.length === 0 ? "Aucune dépense enregistrée" : "Aucun résultat pour ces filtres"}</p>
                  ) : isCompactTables ? (
                    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
                      <table className="w-full table-fixed text-xs">
                        <thead>
                          <tr className={headerBg}>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase`}>Motif</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[22%]`}>Montant</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[18%]`}>Mode</th>
                            <th className={`px-2 py-2 text-left font-semibold ${textSecondary} uppercase w-[20%]`}>Date</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                          {filteredExpenses.map((e) => (
                            <tr key={e.id} className={`${hoverRow} transition-colors`}>
                              <td className={`px-2 py-2 ${textColor} min-w-0`}>
                                <div className="truncate font-medium">{e.motif}</div>
                                <span className={`text-[10px] ${textSecondary} uppercase`}>
                                  {EXPENSE_CATEGORIES.find(c => c.value === e.categorie)?.label || e.categorie}
                                </span>
                              </td>
                              <td className="px-2 py-2 font-semibold text-orange-600">
                                {new Intl.NumberFormat("fr-FR").format(e.montant)} {e.devise === "CDF" ? "FC" : "$"}
                              </td>
                              <td className={`px-2 py-2 ${textSecondary} truncate`}>{getModePaiementLabel(e.modePaiement)}</td>
                              <td className={`px-2 py-2 ${textSecondary}`}>{formatDate(e.dateDepense)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={`overflow-x-auto rounded-xl border ${borderColor}`}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={headerBg}>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Catégorie</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Motif</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Montant</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Bénéficiaire</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mode</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Date</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                          {filteredExpenses.map((e) => (
                            <tr key={e.id} className={`${hoverRow} transition-colors`}>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  e.categorie === "FOURNITURES" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                                  : e.categorie === "EQUIPEMENT" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                  : e.categorie === "MAINTENANCE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : e.categorie === "TRANSPORT" ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {EXPENSE_CATEGORIES.find(c => c.value === e.categorie)?.label || e.categorie}
                                </span>
                              </td>
                              <td className={`px-4 py-3 ${textColor} max-w-[250px]`}>{e.motif}</td>
                              <td className={`px-4 py-3 font-medium text-red-500`}>{new Intl.NumberFormat("fr-FR").format(e.montant)} {e.devise === "CDF" ? "FC" : "$"}</td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{e.beneficiaire || "—"}</td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{getModePaiementLabel(e.modePaiement)}</td>
                              <td className={`px-4 py-3 ${textSecondary}`}>{formatDate(e.dateDepense)}</td>
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
              </>
            )}
            </>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  )
}
