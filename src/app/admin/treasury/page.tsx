"use client"

import { useEffect, useState, useCallback } from "react"
import Layout from "@/components/layout"
import { Card, CardContent } from "@/components/ui/cards"
import {
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Download,
  Plus,
  Loader2,
  Calendar,
  Banknote,
  Smartphone,
  Building,
  FileText,
  CreditCard,
} from "lucide-react"

// ============================================================
// TYPES
// ============================================================

interface TeacherPaymentRow {
  id: number
  teacherId: number
  teacherName: string
  specialty: string | null
  montant: number
  type: string
  mois: string
  description: string | null
  modePaiement: string
  reference: string | null
  datePaiement: string
}

interface ExpenseRow {
  id: number
  categorie: string
  motif: string
  montant: number
  beneficiaire: string | null
  modePaiement: string
  reference: string | null
  dateDepense: string
}

interface TeacherOption {
  id: number
  name: string
  specialty: string | null
}

interface TreasuryData {
  totalIncome: number
  totalTeacherPayments: number
  totalExpenses: number
  balance: number
  teacherPayments: TeacherPaymentRow[]
  expenses: ExpenseRow[]
  teachers: TeacherOption[]
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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminTreasuryPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
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
  const [treasurySubTab, setTreasurySubTab] = useState<"overview" | "salaires" | "depenses">("overview")
  const [trFilterMois, setTrFilterMois] = useState("")
  const [trFilterTeacher, setTrFilterTeacher] = useState("")
  const [trFilterType, setTrFilterType] = useState("")
  const [trFilterCategorie, setTrFilterCategorie] = useState("")
  const [showTeacherPaymentForm, setShowTeacherPaymentForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [tpTeacherId, setTpTeacherId] = useState("")
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

  // Charger la trésorerie au montage
  const fetchTreasury = useCallback(async () => {
    setTreasuryLoading(true)
    try {
      const res = await fetch("/api/admin/fees/treasury")
      if (res.ok) {
        const { data } = await res.json()
        setTreasury(data)
      }
    } catch (error) {
      console.error("Erreur chargement trésorerie:", error)
    } finally {
      setTreasuryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTreasury()
  }, [fetchTreasury])

  const handleSubmitTeacherPayment = async () => {
    if (!tpTeacherId || !tpMontant || !tpMois) return
    setTpSubmitting(true)
    try {
      const res = await fetch("/api/admin/fees/treasury/teacher-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: parseInt(tpTeacherId),
          montant: parseFloat(tpMontant),
          type: tpType,
          mois: tpMois,
          description: tpDescription || null,
          modePaiement: tpModePaiement,
          reference: tpReference || null,
        }),
      })
      if (res.ok) {
        setShowTeacherPaymentForm(false)
        setTpTeacherId(""); setTpMontant(""); setTpType("SALAIRE"); setTpDescription(""); setTpReference("")
        setTreasury(null)
        fetchTreasury()
      } else {
        const err = await res.json()
        alert(err.error || "Erreur lors de l'enregistrement")
      }
    } catch { alert("Erreur réseau") } finally { setTpSubmitting(false) }
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
        }),
      })
      if (res.ok) {
        setShowExpenseForm(false)
        setExpMotif(""); setExpMontant(""); setExpCategorie("AUTRE"); setExpBeneficiaire(""); setExpReference("")
        setTreasury(null)
        fetchTreasury()
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
      csvRows.push(["Professeur", "Type", "Mois", "Montant ($)", "Mode", "Référence", "Description", "Date"].join(";"))
      for (const tp of filteredTeacherPayments) {
        csvRows.push([
          tp.teacherName,
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
    a.download = `tresorerie-${treasurySubTab}${trFilterMois ? "-" + trFilterMois : ""}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtered treasury lists
  const filteredTeacherPayments = treasury?.teacherPayments.filter((tp) => {
    if (trFilterMois && tp.mois !== trFilterMois) return false
    if (trFilterTeacher && tp.teacherId !== parseInt(trFilterTeacher)) return false
    if (trFilterType && tp.type !== trFilterType) return false
    return true
  }) ?? []

  const filteredExpenses = treasury?.expenses.filter((e) => {
    if (trFilterMois && !e.dateDepense.startsWith(trFilterMois)) return false
    if (trFilterCategorie && e.categorie !== trFilterCategorie) return false
    return true
  }) ?? []

  const filteredTotalPayments = filteredTeacherPayments.reduce((s, tp) => s + tp.montant, 0)
  const filteredTotalExpenses = filteredExpenses.reduce((s, e) => s + e.montant, 0)

  const availableMois = treasury ? Array.from(
    new Set([
      ...treasury.teacherPayments.map(tp => tp.mois),
      ...treasury.expenses.map(e => e.dateDepense.slice(0, 7)),
    ])
  ).sort().reverse() : []

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

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textColor} flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              Trésorerie
            </h1>
            <p className={`${textSecondary} mt-1`}>Gestion des salaires, dépenses et budget de l&apos;école</p>
          </div>
        </div>

        {/* Contenu */}
        {treasuryLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : treasury ? (
          <div className="space-y-4">
            {/* Cartes résumé budget */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <ArrowDownCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} uppercase font-semibold`}>Recettes (frais élèves)</p>
                      <p className={`text-xl font-bold text-green-600`}>{formatCurrency(treasury.totalIncome)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} uppercase font-semibold`}>Salaires versés</p>
                      <p className={`text-xl font-bold text-blue-600`}>{formatCurrency(treasury.totalTeacherPayments)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} uppercase font-semibold`}>Dépenses</p>
                      <p className={`text-xl font-bold text-orange-600`}>{formatCurrency(treasury.totalExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${treasury.balance >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      <Landmark className={`w-5 h-5 ${treasury.balance >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${textSecondary} uppercase font-semibold`}>Solde budget</p>
                      <p className={`text-xl font-bold ${treasury.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(treasury.balance)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Par mois */}
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${textSecondary}`} />
                <select
                  value={trFilterMois}
                  onChange={(e) => setTrFilterMois(e.target.value)}
                  className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[150px]`}
                >
                  <option value="">Tous les mois</option>
                  {availableMois.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Par prof (salaires seulement) */}
              {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
                <select
                  value={trFilterTeacher}
                  onChange={(e) => setTrFilterTeacher(e.target.value)}
                  className={`px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm min-w-[160px]`}
                >
                  <option value="">Tous les professeurs</option>
                  {treasury?.teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              {/* Par type de paiement */}
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

              {/* Par catégorie dépense */}
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

              {/* Réinitialiser */}
              {(trFilterMois || trFilterTeacher || trFilterType || trFilterCategorie) && (
                <button
                  onClick={() => { setTrFilterMois(""); setTrFilterTeacher(""); setTrFilterType(""); setTrFilterCategorie("") }}
                  className={`px-3 py-2 text-xs rounded-xl border ${borderColor} ${textSecondary} hover:text-red-500 hover:border-red-400 transition-colors`}
                >
                  Réinitialiser filtres
                </button>
              )}

              {/* Totaux filtrés */}
              {trFilterMois && (
                <div className="flex gap-3 ml-auto text-sm">
                  {(treasurySubTab !== "depenses") && (
                    <span className="text-blue-600 font-medium">Salaires : {formatCurrency(filteredTotalPayments)}</span>
                  )}
                  {(treasurySubTab !== "salaires") && (
                    <span className="text-orange-600 font-medium">Dépenses : {formatCurrency(filteredTotalExpenses)}</span>
                  )}
                </div>
              )}
            </div>

            {/* Sous-onglets + boutons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
                {[
                  { key: "overview" as const, label: "Tout" },
                  { key: "salaires" as const, label: "Salaires profs" },
                  { key: "depenses" as const, label: "Dépenses" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setTreasurySubTab(st.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${treasurySubTab === st.key ? "bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400" : `${textSecondary} hover:text-indigo-500`}`}
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
                  <button onClick={() => setShowTeacherPaymentForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Payer un professeur
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
            {showTeacherPaymentForm && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Payer un professeur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Professeur *</label>
                      <select value={tpTeacherId} onChange={(e) => setTpTeacherId(e.target.value)} className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`}>
                        <option value="">Sélectionner...</option>
                        {treasury.teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` (${t.specialty})` : ""}</option>
                        ))}
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
                    <button onClick={() => setShowTeacherPaymentForm(false)} className={`px-4 py-2 rounded-xl border ${borderColor} ${textColor} text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700`}>Annuler</button>
                    <button onClick={handleSubmitTeacherPayment} disabled={!tpTeacherId || !tpMontant || !tpMois || tpSubmitting} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors inline-flex items-center gap-2">
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
                      <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Montant ($) *</label>
                      <input type="number" value={expMontant} onChange={(e) => setExpMontant(e.target.value)} placeholder="0" className={`w-full px-3 py-2 rounded-xl border ${inputBg} ${textColor} text-sm`} />
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

            {/* Tableau salaires profs */}
            {(treasurySubTab === "overview" || treasurySubTab === "salaires") && (
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <h3 className={`text-base font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <Users className="w-5 h-5 text-blue-500" /> Paiements professeurs
                  </h3>
                  {filteredTeacherPayments.length === 0 ? (
                    <p className={`text-center py-8 ${textSecondary}`}>{treasury.teacherPayments.length === 0 ? "Aucun paiement enregistré" : "Aucun résultat pour ces filtres"}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border ${borderColor}">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={headerBg}>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Professeur</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Type</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mois</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Montant</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Mode</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Date</th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase`}>Description</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderColor}`}>
                          {filteredTeacherPayments.map((tp) => (
                            <tr key={tp.id} className={`${hoverRow} transition-colors`}>
                              <td className={`px-4 py-3 ${textColor}`}>
                                <div className="font-medium">{tp.teacherName}</div>
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
              <Card theme={theme}>
                <CardContent className="pt-5">
                  <h3 className={`text-base font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <ArrowUpCircle className="w-5 h-5 text-orange-500" /> Dépenses
                  </h3>
                  {filteredExpenses.length === 0 ? (
                    <p className={`text-center py-8 ${textSecondary}`}>{treasury.expenses.length === 0 ? "Aucune dépense enregistrée" : "Aucun résultat pour ces filtres"}</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border ${borderColor}">
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
                              <td className={`px-4 py-3 font-medium text-red-500`}>{formatCurrency(e.montant)}</td>
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
        ) : null}
      </div>
    </Layout>
  )
}
