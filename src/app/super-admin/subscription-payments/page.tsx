"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import SuperAdminLayout from "@/components/super-admin-layout"
import {
  ArrowLeft, CreditCard, Search, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Building2, Calendar,
  Download, TrendingUp, Receipt, XCircle, FileText, X, User
} from "lucide-react"
import InvoiceDownloadButton from "@/components/invoice-download-button"
import Portal from "@/components/portal"

type School = {
  id: number
  nomEtablissement: string
  codeEtablissement: string | null
  etatCompte: string
}

type Payment = {
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
  school: School
  createdBy: { id: number; prenom: string; nom: string } | null
}

type Totaux = {
  montantTotal: number
  nombrePaiements: number
}

export default function SuperAdminSubscriptionPayments() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totaux, setTotaux] = useState<Totaux>({ montantTotal: 0, nombrePaiements: 0 })

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" })
      if (search) params.set("search", search)
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const res = await fetch(`/api/super-admin/subscription-payments?${params}`)
      if (!res.ok) throw new Error("Erreur chargement")
      const data = await res.json()
      setPayments(data.payments)
      setTotalPages(data.pagination.pages)
      setTotaux(data.totaux)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, from, to])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch("")
    setSearchInput("")
    setFrom("")
    setTo("")
    setPage(1)
  }

  const bgMain = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-[#0d1117] border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
  const tableRowHover = theme === "dark" ? "hover:bg-gray-800/50" : "hover:bg-gray-50"

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })

  const periodeLabel: Record<string, string> = {
    MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
    SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
  }

  const typePaiementLabel: Record<string, string> = {
    MOBILE_MONEY: "Mobile Money", VIREMENT: "Virement",
    ESPECES: "Espèces", CARTE: "Carte",
  }

  const hasFilters = search || from || to

  return (
    <SuperAdminLayout
      title="Journal des paiements d'abonnements"
      description="Tous les paiements d'abonnements des écoles avec factures et statistiques."
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${cardBg} rounded-xl border ${borderColor} p-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Total encaissé</p>
                <p className={`text-2xl font-bold ${textColor}`}>
                  {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(totaux.montantTotal)}
                  <span className={`text-sm font-normal ml-1 ${textSecondary}`}>USD</span>
                </p>
              </div>
            </div>
          </div>
          <div className={`${cardBg} rounded-xl border ${borderColor} p-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Nombre de paiements</p>
                <p className={`text-2xl font-bold ${textColor}`}>{totaux.nombrePaiements}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-4`}>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher école, facture..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${textSecondary}`} />
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1) }}
                className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
              <span className={textSecondary}>→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1) }}
                className={`px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg border ${borderColor} ${textSecondary} hover:${textColor} text-sm flex items-center gap-2 transition-colors`}
              >
                <XCircle className="w-4 h-4" />
                Effacer
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <h2 className={`font-semibold ${textColor}`}>Paiements</h2>
            </div>
            {loading && <RefreshCw className={`w-4 h-4 ${textSecondary} animate-spin`} />}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16">
              <RefreshCw className={`w-8 h-8 ${textSecondary} animate-spin`} />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <FileText className={`w-12 h-12 ${textSecondary}`} />
              <p className={textSecondary}>Aucun paiement trouvé.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Facture</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>École</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Date</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Plan / Période</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Couverture</th>
                      <th className={`px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Montant</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Mode</th>
                      <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Détails</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderColor}`}>
                    {payments.map((p) => (
                      <tr key={p.id} className={`${tableRowHover} transition-colors`}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-blue-400 font-semibold">{p.numeroFacture}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} flex items-center justify-center flex-shrink-0`}>
                              <Building2 className={`w-4 h-4 ${textSecondary}`} />
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${textColor}`}>{p.school.nomEtablissement}</p>
                              <p className={`text-xs ${textSecondary}`}>{p.school.codeEtablissement || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                          }`}>
                            {p.plan} · {periodeLabel[p.periode] || p.periode}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs ${textSecondary}`}>
                          {formatDate(p.dateDebut)} → {formatDate(p.dateFin)}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${textColor}`}>
                          {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(p.montant)} {p.devise}
                        </td>
                        <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                          {typePaiementLabel[p.typePaiement] || p.typePaiement}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Facture
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
        </div>
      </div>

      {/* Modal facture */}
      {selectedPayment && (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay flou */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          />

          {/* Carte du modal */}
          <div className={`relative ${cardBg} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-md flex flex-col animate-scale-up`}
            style={{ maxHeight: "88vh" }}>

            {/* Header */}
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Receipt className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${textColor}`}>Facture</h3>
                  <p className="text-xs text-blue-500 font-mono">{selectedPayment.numeroFacture}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold">
                  Payé
                </span>
                <button
                  onClick={() => setSelectedPayment(null)}
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

              <div className={`flex items-center justify-between text-sm border-b ${borderColor} pb-3`}>
                <span className={textSecondary}>Date d'émission</span>
                <span className={`font-semibold ${textColor}`}>{formatDate(selectedPayment.createdAt)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} rounded-xl p-3`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>Émetteur</p>
                  <p className={`font-bold ${textColor} text-sm`}>Kelasi 360</p>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>support@kelasi360.com</p>
                  {selectedPayment.createdBy && (
                    <p className={`text-xs ${textSecondary} mt-1`}>
                      Par : {selectedPayment.createdBy.prenom} {selectedPayment.createdBy.nom}
                    </p>
                  )}
                </div>
                <div className={`${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} rounded-xl p-3`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>Destinataire</p>
                  <p className={`font-bold ${textColor} text-sm`}>{selectedPayment.school.nomEtablissement}</p>
                  {selectedPayment.school.codeEtablissement && (
                    <p className={`text-xs ${textSecondary} mt-0.5`}>Code : {selectedPayment.school.codeEtablissement}</p>
                  )}
                </div>
              </div>

              <div className={`border ${borderColor} rounded-xl overflow-hidden`}>
                <div className={`${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} px-4 py-2 flex justify-between border-b ${borderColor}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Description</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Montant</span>
                </div>
                <div className={`px-4 py-3 flex justify-between items-start border-b ${borderColor}`}>
                  <div>
                    <p className={`font-semibold ${textColor} text-sm`}>
                      Abonnement {selectedPayment.plan} — {periodeLabel[selectedPayment.periode] || selectedPayment.periode}
                    </p>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>
                      {formatDate(selectedPayment.dateDebut)} → {formatDate(selectedPayment.dateFin)}
                    </p>
                  </div>
                  <p className={`font-bold ${textColor} text-sm whitespace-nowrap ml-3`}>
                    {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(selectedPayment.montant)} {selectedPayment.devise}
                  </p>
                </div>
                <div className={`${theme === "dark" ? "bg-teal-900/30" : "bg-teal-50"} px-4 py-2.5 flex justify-between items-center`}>
                  <span className={`font-bold ${textColor} text-sm`}>TOTAL</span>
                  <span className="font-bold text-teal-500 text-base">
                    {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(selectedPayment.montant)} {selectedPayment.devise}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} mb-1`}>Mode de paiement</p>
                  <p className={`font-semibold ${textColor}`}>{typePaiementLabel[selectedPayment.typePaiement] || selectedPayment.typePaiement}</p>
                </div>
                {selectedPayment.reference && (
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} mb-1`}>Référence</p>
                    <p className={`font-semibold font-mono ${textColor}`}>{selectedPayment.reference}</p>
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Notes</p>
                  <p className="text-sm text-amber-400">{selectedPayment.notes}</p>
                </div>
              )}

              <p className={`text-center text-[11px] ${textSecondary} pt-1`}>
                Kelasi 360 — Ce document tient lieu de facture officielle
              </p>
            </div>

            {/* Boutons */}
            <div className={`flex-shrink-0 flex gap-3 p-4 border-t ${borderColor}`}>
              <InvoiceDownloadButton
                data={{
                  numeroFacture: selectedPayment.numeroFacture,
                  createdAt: selectedPayment.createdAt,
                  plan: selectedPayment.plan,
                  periode: selectedPayment.periode,
                  dateDebut: selectedPayment.dateDebut,
                  dateFin: selectedPayment.dateFin,
                  montant: selectedPayment.montant,
                  devise: selectedPayment.devise,
                  typePaiement: selectedPayment.typePaiement,
                  reference: selectedPayment.reference,
                  notes: selectedPayment.notes,
                  schoolName: selectedPayment.school.nomEtablissement,
                  schoolCode: selectedPayment.school.codeEtablissement,
                  createdByName: selectedPayment.createdBy
                    ? `${selectedPayment.createdBy.prenom} ${selectedPayment.createdBy.nom}`
                    : null,
                }}
              />
              <button
                onClick={() => setSelectedPayment(null)}
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
      )}
    </SuperAdminLayout>
  )
}
