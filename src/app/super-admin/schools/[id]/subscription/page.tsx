"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import SuperAdminLayout from "@/components/super-admin-layout"
import {
  ArrowLeft, Building2, CreditCard, Calendar, Clock, DollarSign,
  CheckCircle, AlertTriangle, CalendarX, Save, RefreshCw, XCircle,
  FileText, Receipt, ChevronLeft, ChevronRight, Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type School = {
  id: number
  nomEtablissement: string
  codeEtablissement?: string | null
  etatCompte: string
  dateDebutAbonnement?: string | null
  dateFinAbonnement?: string | null
  periodeAbonnement?: string | null
  planAbonnement?: string | null
  typePaiement?: string | null
  montantPaye?: number | null
}

type SubscriptionPayment = {
  id: number
  numeroFacture: string
  montant: number
  devise: string
  typePaiement: string
  reference?: string | null
  dateDebut: string
  dateFin: string
  periode: string
  plan: string
  statut: string
  notes?: string | null
  createdAt: string
}

export default function SubscriptionManagement() {
  const router = useRouter()
  const params = useParams()
  const schoolId = params.id as string

  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [activeTab, setActiveTab] = useState<"form" | "history">("form")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelMotif, setCancelMotif] = useState("")

  // Payments history
  const [payments, setPayments] = useState<SubscriptionPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)

  const [form, setForm] = useState({
    dateDebutAbonnement: "",
    dateFinAbonnement: "",
    periodeAbonnement: "MENSUEL",
    planAbonnement: "BASIC",
    typePaiement: "MOBILE_MONEY",
    montantPaye: "",
    reference: "",
    notes: "",
  })

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])

  useEffect(() => { fetchSchool() }, [schoolId])

  useEffect(() => {
    if (activeTab === "history") fetchPayments(page)
  }, [activeTab, page])

  const fetchSchool = async () => {
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}`)
      if (!res.ok) throw new Error("École non trouvée")
      const data = await res.json()
      setSchool(data.school)
      setForm({
        dateDebutAbonnement: data.school.dateDebutAbonnement
          ? new Date(data.school.dateDebutAbonnement).toISOString().split("T")[0]
          : "",
        dateFinAbonnement: data.school.dateFinAbonnement
          ? new Date(data.school.dateFinAbonnement).toISOString().split("T")[0]
          : "",
        periodeAbonnement: data.school.periodeAbonnement || "MENSUEL",
        planAbonnement: data.school.planAbonnement || "BASIC",
        typePaiement: data.school.typePaiement || "MOBILE_MONEY",
        montantPaye: data.school.montantPaye?.toString() || "",
        reference: "",
        notes: "",
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async (p: number) => {
    setPaymentsLoading(true)
    try {
      const res = await fetch(`/api/super-admin/subscription-payments?schoolId=${schoolId}&page=${p}&limit=10`)
      if (!res.ok) throw new Error("Erreur chargement")
      const data = await res.json()
      setPayments(data.payments)
      setTotalPages(data.pagination.pages)
      setTotalPayments(data.pagination.total)
    } catch (e: any) {
      console.error(e)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)
    setSuccessMsg("")

    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateDebutAbonnement: form.dateDebutAbonnement || null,
          dateFinAbonnement: form.dateFinAbonnement || null,
          periodeAbonnement: form.periodeAbonnement,
          planAbonnement: form.planAbonnement,
          typePaiement: form.typePaiement,
          montantPaye: form.montantPaye ? parseFloat(form.montantPaye) : null,
          reference: form.reference || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      const data = await res.json()
      setSuccess(true)
      setSuccessMsg(data.message || "Abonnement enregistré !")
      fetchSchool()
      setForm(prev => ({ ...prev, reference: "", notes: "" }))
      setTimeout(() => setSuccess(false), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    setError("")
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif: cancelMotif }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur résiliation")
      }
      setShowCancelConfirm(false)
      setCancelMotif("")
      setSuccess(true)
      setSuccessMsg("L'abonnement a été résilié avec succès.")
      fetchSchool()
      setTimeout(() => setSuccess(false), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCancelling(false)
    }
  }

  const getSubscriptionStatus = () => {
    if (!school?.dateFinAbonnement) return { status: "undefined", label: "Non défini", color: "gray" }
    const endDate = new Date(school.dateFinAbonnement)
    const today = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (school.etatCompte === "SUSPENDU") return { status: "suspended", label: "Résilié / Suspendu", color: "red", days: 0 }
    if (daysLeft < 0) return { status: "expired", label: "Expiré", color: "red", days: Math.abs(daysLeft) }
    if (daysLeft <= 7) return { status: "warning", label: `${daysLeft} jours restants`, color: "orange", days: daysLeft }
    if (daysLeft <= 30) return { status: "soon", label: `${daysLeft} jours restants`, color: "yellow", days: daysLeft }
    return { status: "active", label: `${daysLeft} jours restants`, color: "green", days: daysLeft }
  }

  const subscriptionStatus = getSubscriptionStatus()

  const bgMain = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-[#0d1117]" : "bg-white"
  const tableRowHover = theme === "dark" ? "hover:bg-gray-800/50" : "hover:bg-gray-50"

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

  const formatMoney = (m: number, devise = "USD") =>
    `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(m)} ${devise}`

  const periodeLabel: Record<string, string> = {
    MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
    SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
  }

  if (loading) {
    return (
      <SuperAdminLayout title="Gestion d'abonnement" description="Chargement des informations...">
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="text-gray-400">Chargement...</span>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  if (!school) {
    return (
      <SuperAdminLayout title="École non trouvée" description="L'école demandée n'existe pas.">
        <div className="flex items-center justify-center py-32">
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">École non trouvée</h2>
            <Button onClick={() => router.back()} className="mt-4">Retour</Button>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout
      title={`Abonnement - ${school.nomEtablissement}`}
      description="Gérez l'abonnement, enregistrez les paiements et consultez l'historique des factures."
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 ${textSecondary} hover:${textColor} transition-colors mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        {/* School Info Card */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-6 mb-6`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"} flex items-center justify-center`}>
                <Building2 className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textColor}`}>{school.nomEtablissement}</h1>
                <p className={textSecondary}>Code: {school.codeEtablissement || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                subscriptionStatus.color === "red" ? "bg-red-500/10 border border-red-500/30" :
                subscriptionStatus.color === "orange" ? "bg-orange-500/10 border border-orange-500/30" :
                subscriptionStatus.color === "yellow" ? "bg-yellow-500/10 border border-yellow-500/30" :
                subscriptionStatus.color === "green" ? "bg-green-500/10 border border-green-500/30" :
                "bg-gray-500/10 border border-gray-500/30"
              }`}>
                {subscriptionStatus.status === "expired" || subscriptionStatus.status === "suspended" ? (
                  <CalendarX className="w-5 h-5 text-red-500" />
                ) : subscriptionStatus.status === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                ) : subscriptionStatus.status === "active" || subscriptionStatus.status === "soon" ? (
                  <CheckCircle className={`w-5 h-5 ${subscriptionStatus.color === "yellow" ? "text-yellow-500" : "text-green-500"}`} />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
                <span className={`font-medium text-sm ${
                  subscriptionStatus.color === "red" ? "text-red-500" :
                  subscriptionStatus.color === "orange" ? "text-orange-500" :
                  subscriptionStatus.color === "yellow" ? "text-yellow-500" :
                  subscriptionStatus.color === "green" ? "text-green-500" :
                  "text-gray-500"
                }`}>
                  {subscriptionStatus.label}
                </span>
              </div>

              {/* Bouton résiliation */}
              {school.etatCompte !== "SUSPENDU" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Résilier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} mb-6`}>
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "form"
                ? `${cardBg} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Gestion abonnement
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "history"
                ? `${cardBg} ${textColor} shadow`
                : textSecondary
            }`}
          >
            <Receipt className="w-4 h-4" />
            Journal des paiements
            {totalPayments > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {totalPayments}
              </span>
            )}
          </button>
        </div>

        {/* Messages */}
        {success && successMsg && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 mb-4">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 mb-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* TAB: Formulaire */}
        {activeTab === "form" && (
          <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${borderColor} flex items-center gap-3`}>
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-lg font-semibold ${textColor}`}>Enregistrer un paiement</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={form.dateDebutAbonnement}
                    onChange={(e) => setForm(prev => ({ ...prev, dateDebutAbonnement: e.target.value }))}
                    className={`${inputBg} border ${borderColor} ${textColor}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={form.dateFinAbonnement}
                    onChange={(e) => setForm(prev => ({ ...prev, dateFinAbonnement: e.target.value }))}
                    className={`${inputBg} border ${borderColor} ${textColor}`}
                  />
                </div>
              </div>

              {/* Plan & Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Plan d'abonnement</label>
                  <select
                    value={form.planAbonnement}
                    onChange={(e) => setForm(prev => ({ ...prev, planAbonnement: e.target.value }))}
                    className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="BASIC">Basic</option>
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Période</label>
                  <select
                    value={form.periodeAbonnement}
                    onChange={(e) => setForm(prev => ({ ...prev, periodeAbonnement: e.target.value }))}
                    className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="MENSUEL">Mensuel</option>
                    <option value="TRIMESTRIEL">Trimestriel</option>
                    <option value="SEMESTRIEL">Semestriel</option>
                    <option value="ANNUEL">Annuel</option>
                  </select>
                </div>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Type de paiement</label>
                  <select
                    value={form.typePaiement}
                    onChange={(e) => setForm(prev => ({ ...prev, typePaiement: e.target.value }))}
                    className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="VIREMENT">Virement bancaire</option>
                    <option value="ESPECES">Espèces</option>
                    <option value="CARTE">Carte bancaire</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Montant payé (USD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.montantPaye}
                    onChange={(e) => setForm(prev => ({ ...prev, montantPaye: e.target.value }))}
                    placeholder="0.00"
                    className={`${inputBg} border ${borderColor} ${textColor}`}
                  />
                </div>
              </div>

              {/* Reference & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    <Hash className="w-4 h-4 inline mr-2" />
                    Référence de paiement
                  </label>
                  <Input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="N° transaction, reçu..."
                    className={`${inputBg} border ${borderColor} ${textColor}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Notes</label>
                  <Input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Remarques..."
                    className={`${inputBg} border ${borderColor} ${textColor}`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                >
                  {saving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Enregistrement...</>
                  ) : (
                    <><Save className="w-4 h-4" />Enregistrer le paiement</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: Historique paiements */}
        {activeTab === "history" && (
          <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-blue-500" />
                <h2 className={`text-lg font-semibold ${textColor}`}>Journal des paiements</h2>
              </div>
              <span className={`text-sm ${textSecondary}`}>{totalPayments} paiement(s)</span>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className={`w-6 h-6 ${textSecondary} animate-spin`} />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <FileText className={`w-12 h-12 ${textSecondary}`} />
                <p className={textSecondary}>Aucun paiement enregistré pour cette école.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${borderColor}`}>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Facture</th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Date</th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Période</th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Plan</th>
                        <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Montant</th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Type</th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Réf.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {payments.map((p) => (
                        <tr key={p.id} className={`${tableRowHover} transition-colors`}>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-blue-400 font-medium">{p.numeroFacture}</span>
                          </td>
                          <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                            {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td className={`px-6 py-4 text-sm ${textColor}`}>
                            <div>{formatDate(p.dateDebut)}</div>
                            <div className={`text-xs ${textSecondary}`}>→ {formatDate(p.dateFin)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                            }`}>
                              {p.plan} · {periodeLabel[p.periode] || p.periode}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-semibold ${textColor}`}>
                            {formatMoney(p.montant, p.devise)}
                          </td>
                          <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                            {p.typePaiement.replace("_", " ")}
                          </td>
                          <td className={`px-6 py-4 text-sm font-mono ${textSecondary}`}>
                            {p.reference || "—"}
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
                        className={`p-2 rounded-lg border ${borderColor} ${textSecondary} disabled:opacity-40 hover:${textColor} transition-colors`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`p-2 rounded-lg border ${borderColor} ${textSecondary} disabled:opacity-40 hover:${textColor} transition-colors`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmation résiliation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-2xl border border-red-500/30 p-6 max-w-md w-full shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textColor}`}>Résilier l'abonnement</h3>
                <p className={`text-sm ${textSecondary}`}>{school.nomEtablissement}</p>
              </div>
            </div>

            <p className={`${textSecondary} text-sm mb-4`}>
              Cette action va suspendre immédiatement l'accès de l'école à la plateforme.
              L'administrateur de l'école en sera notifié.
            </p>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Motif de résiliation (optionnel)
              </label>
              <textarea
                value={cancelMotif}
                onChange={(e) => setCancelMotif(e.target.value)}
                rows={3}
                placeholder="Ex : Facture impayée, fin de contrat..."
                className={`w-full px-3 py-2 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelMotif("") }}
                className={`flex-1 py-2.5 rounded-lg border ${borderColor} ${textSecondary} hover:${textColor} transition-colors text-sm font-medium`}
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {cancelling ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />Résiliation...</>
                ) : (
                  <><XCircle className="w-4 h-4" />Confirmer la résiliation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
